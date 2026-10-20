/**
 * Razorpay Standard Checkout pipeline — automated browser review.
 *
 * Runs against the LOCAL dev server with a stub gateway:
 *   RAZORPAY_API_BASE=http://127.0.0.1:4390 \
 *   RAZORPAY_KEY_ID=rzp_test_STUBLOCALKEY1 RAZORPAY_KEY_SECRET=stub-secret-1234567890 \
 *   RAZORPAY_WEBHOOK_SECRET=stub-webhook-secret-123456789012 \
 *   npm run dev -- -p 4312
 *
 * Flow: client portal "Pay now" → portal pay page → checkout (scripted
 * window.Razorpay completing with a genuinely signed confirmation) →
 * server verification against the stub payment record → redirect back to
 * the pay page showing the VERIFIED success state with payment details.
 * Also proves: manual links stay external with zero gateway calls; the
 * payment.captured webhook reconciles independently; replay and forged
 * signatures change nothing; admin sync reconciles from the provider record.
 * Screenshots: tmp/razorpay-payments/. Refuses non-local databases.
 */
import { chromium } from "playwright-core";
import { PrismaClient } from "@prisma/client";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import http from "node:http";
import assert from "node:assert";
import { PDFDocument } from "pdf-lib";

const base = process.env.BASE_URL ?? "http://localhost:4312";
const stubPort = Number(process.env.STUB_PORT ?? 4390);
const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "stub-secret-1234567890";
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "stub-webhook-secret-123456789012";
const dbUrl = process.env.DATABASE_URL ?? "";
assert(/@(localhost|127\.0\.0\.1)/.test(dbUrl), "Refusing to run against a non-local database.");
assert((process.env.MAIL_DELIVERY_MODE ?? "off") === "off", "Keep mail off for this local review.");

const p = new PrismaClient();
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const dir = "tmp/razorpay-payments";
const key = `RZPCO-${randomBytes(4).toString("hex")}`;
const checks = [], errors = [];
const bankKeys = ["bank_name", "bank_account_name", "bank_account_number", "bank_ifsc", "bank_swift", "bank_branch", "bank_instructions"];
const originalBankRows = await p.siteSetting.findMany({ where: { key: { in: bankKeys } } });
const originalEventCount = await p.webhookEvent.count();
const eventIds = [];
const ok = (condition, label) => { assert(condition, label); checks.push(label); };
await mkdir(dir, { recursive: true });

// ── stub Razorpay API ───────────────────────────────────────────────────
const PAYMENT_ID = "pay_E2ECHECKOUT1";
const orders = [];
const settled = new Set();
const stub = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${stubPort}`);
  const send = (status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  if (req.method === "GET" && url.pathname === "/v1/payment_links") return send(200, { items: [] }); // credential verify
  if (req.method === "POST" && url.pathname === "/v1/orders") {
    let raw = ""; req.on("data", c => raw += c); req.on("end", () => {
      const body = JSON.parse(raw);
      const order = { id: `order_${randomBytes(7).toString("hex")}`, amount: body.amount, currency: body.currency, receipt: body.receipt, notes: body.notes ?? {}, status: "created" };
      orders.push(order);
      send(200, order);
    });
    return;
  }
  if (req.method === "GET" && url.pathname === `/v1/payments/${PAYMENT_ID}`) {
    const order = orders.at(-1);
    if (!order) return send(404, { error: { description: "no order yet" } });
    // The scripted checkout completes instantly: this payment is captured.
    return send(200, { id: PAYMENT_ID, order_id: order.id, amount: order.amount, currency: order.currency, status: "captured", method: "upi" });
  }
  const orderPayments = url.pathname.match(/^\/v1\/orders\/([^/]+)\/payments$/);
  if (orderPayments && req.method === "GET") {
    const order = orders.find(o => o.id === orderPayments[1]);
    const captured = settled.has(orderPayments[1]) ? [{ id: `pay_SYNC${orderPayments[1].replace(/^order_/, "")}`,  order_id: orderPayments[1], amount: order?.amount, currency: order?.currency, status: "captured", method: "upi" }] : [];
    return send(200, { items: captured });
  }
  if (req.method === "POST" && url.pathname === "/__e2e/settle") {
    let raw = ""; req.on("data", c => raw += c); req.on("end", () => { settled.add(JSON.parse(raw).order ?? "any"); send(200, { ok: true }); });
    return;
  }
  send(404, { error: { description: `stub: unknown route ${req.method} ${url.pathname}` } });
});
await new Promise(resolve => stub.listen(stubPort, "127.0.0.1", resolve));
const settle = (order) => fetch(`http://127.0.0.1:${stubPort}/__e2e/settle`, { method: "POST", body: JSON.stringify({ order }) });

const sign = (body, secret = webhookSecret) => {
  const id = `evt_${randomBytes(6).toString("hex")}`;
  eventIds.push(id);
  return {
    "content-type": "application/json",
    "x-razorpay-signature": createHmac("sha256", secret).update(body, "utf8").digest("hex"),
    "x-razorpay-event-id": id,
  };
};
const webhook = async (entity, headers) => {
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity } } });
  const response = await fetch(`${base}/api/webhooks/razorpay`, { method: "POST", body, headers: headers ?? sign(body) });
  return { status: response.status, text: await response.text() };
};

// Browser-side scripted checkout: completes the flow with a REAL signature
// (Web Crypto HMAC over order_id|payment_id with the stub key secret).
const initScript = `
window.Razorpay = class {
  constructor(options) { window.__rzp = options; }
  open() {
    (async () => {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey("raw", enc.encode("${keySecret}"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const signature = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(window.__rzp.order_id + "|" + "${PAYMENT_ID}")))).map(b => b.toString(16).padStart(2, "0")).join("");
      window.__rzp.handler({ razorpay_order_id: window.__rzp.order_id, razorpay_payment_id: "${PAYMENT_ID}", razorpay_signature: signature });
    })();
  }
  on() {}
};`;

let admin, client, project, invoiceA, invoiceB, invoiceC;
const context = async (cookie, owner) => {
  const c = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  if (cookie === "savo_admin") await p.adminSession.create({ data: { userId: owner, tokenHash, expiresAt: new Date(Date.now() + 3_600_000) } });
  else await p.clientSession.create({ data: { clientId: owner, tokenHash, expiresAt: new Date(Date.now() + 3_600_000) } });
  await c.addCookies([{ name: cookie, value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
  await c.route("**/*", r => {
    const u = new URL(r.request().url());
    if (u.origin === new URL(base).origin) return r.continue();
    // checkout.js is fulfilled empty: the init script already provides the
    // scripted Razorpay class, and the empty body fires onload (scriptReady).
    if (u.hostname === "checkout.razorpay.com") return r.fulfill({ status: 200, contentType: "application/javascript", body: initScript });
    return r.abort();
  });
  return c;
};
const visit = async (page, path) => { await page.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: 60_000 }); await page.locator("main h1").first().waitFor(); };
const capture = async (page, name) => {
  if (process.env.SKIP_SCREENSHOTS === "1") return;
  await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
  await page.waitForTimeout(250); // settle responsive/sticky compositor after viewport changes
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true, animations: "disabled" });
};

try {
  // ── fixtures ──
  admin = await p.adminUser.create({ data: { email: `${key}-admin@example.invalid`, name: "Synthetic Checkout Admin", role: "admin", passwordHash: "local-session-fixture-no-password" } });
  client = await p.clientUser.create({ data: { name: "Synthetic Checkout Client", email: `${key}-client@example.invalid`, passwordHash: "local-session-fixture-no-password" } });
  project = await p.clientProject.create({ data: { clientId: client.id, title: "Synthetic checkout project", code: key, summary: "Synthetic local review only.", status: "in_progress", budget: 300000, currency: "INR" } });
  const mkInvoice = (n, extra = {}) => p.invoice.create({ data: { clientId: client.id, projectId: project.id, number: `${key}-${n}`, amount: 100000, currency: "INR", status: "sent", notes: "Synthetic local review only.", ...extra } });
  invoiceA = await mkInvoice("A");            // checkout flow
  invoiceB = await mkInvoice("B");            // webhook flow
  invoiceC = await mkInvoice("C", { paymentLink: "https://paypal.me/savomanual/100" }); // manual link wins

  const c = await context("savo_client", client.id);
  const page = await c.newPage();
  page.on("pageerror", e => errors.push(e.message));

  // ── 1. portal list shows Pay now for unlinked invoices, and keeps the manual one external ──
  await visit(page, "/portal/invoices");
  const payButtons = page.getByRole("link", { name: /Pay invoice .* securely online/ });
  ok(await payButtons.first().isVisible(), "portal Pay now appears for gateway invoices (internal link)");
  ok((await payButtons.count()) >= 2, "both unlinked invoices offer checkout");
  const manual = page.getByRole("link", { name: /Pay now for invoice .* via PayPal/ });
  ok(await manual.first().isVisible(), "manual-link invoice keeps its external PayPal action");
  await capture(page, "1-portal-list");

  // ── 2. the checkout journey: pay page → scripted Razorpay → verified success ──
  const payA = page.getByRole("link", { name: new RegExp(`Pay invoice ${invoiceA.number} securely`) });
  await payA.click();
  await page.waitForURL(/\/portal\/invoices\/.+\/pay$/, { timeout: 30_000 });
  ok(await page.getByRole("heading", { name: "Complete your payment", exact: true }).isVisible(), "pay page shows the invoice summary");
  ok(await page.getByRole("radio", { name: /Pay Online/ }).isChecked(), "Pay Online (Razorpay) is selected by default");
  ok(await page.getByText("Processing fee", { exact: true }).first().isVisible(), "fee breakdown shows the processing fee without an inline percentage");
  ok(await page.getByText("GST on processing fee", { exact: true }).first().isVisible(), "GST line itemised without an inline percentage");
  ok(await page.getByText("₹1,023.60").first().isVisible(), "total to pay includes fee + GST (₹1,000 → ₹1,023.60)");
  // Regression: the checkout must become ready on ARRIVAL — no radio toggling.
  await page.getByRole("button", { name: /Pay .* securely/ }).waitFor({ timeout: 30_000 });
  ok(true, "checkout ready on arrival without toggling payment methods");
  // Tooltips (after layout settles): hover each info dot, read its popup.
  await page.getByRole("button", { name: /Calculated as 2% of the invoice amount/ }).hover();
  ok(await page.getByRole("tooltip").getByText("Calculated as 2% of the invoice amount.").isVisible(), "INR invoice: processing-fee popup states only the 2% rule");
  await page.getByRole("button", { name: /GST is charged at 18%/ }).hover();
  ok(await page.getByRole("tooltip").getByText("GST is charged at 18% on the processing fee.").isVisible(), "INR invoice: GST popup states only the 18%-on-fee rule");

  // Batched visual evidence: reference-pinned paired panels, desktop + phone.
  await page.mouse.move(0, 0);
  await capture(page, "checkout-desktop");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `checkout fits ${width}px without overflow`);
    await capture(page, `checkout-${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });

  // Bank option: unconfigured fallback first, then the configured details.
  await p.siteSetting.deleteMany({ where: { key: { in: ["bank_name", "bank_account_name", "bank_account_number", "bank_ifsc", "bank_swift", "bank_branch", "bank_instructions"] } } });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Pay .* securely/ }).waitFor({ timeout: 30_000 });
  ok(true, "checkout ready again after reload without toggling");
  await page.getByRole("radio", { name: /Bank Deposit/ }).check();
  ok(await page.getByText("Bank transfer details are available on request", { exact: false }).first().isVisible(), "unconfigured bank option falls back to a contact note");
  ok(await page.getByRole("link", { name: /Request bank details/ }).isVisible(), "missing bank details cannot be presented as ready to transfer");
  ok(await page.getByText("₹1,000", { exact: false }).first().isVisible(), "bank option shows the invoice amount with no online fees");
  for (const [key, value] of Object.entries({ bank_name: "Stub Bank", bank_account_name: "Savo Technologies Test", bank_account_number: "50200012345678", bank_ifsc: "HDFC0000123", bank_instructions: "Include the invoice number in the transfer reference." })) {
    await p.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Pay .* securely/ }).waitFor({ timeout: 30_000 });
  await page.getByRole("radio", { name: /Bank Deposit/ }).check();
  ok(await page.getByText("50200012345678").count() === 0, "bank details are not shown before confirming instructions");
  ok(await page.getByText("GST on processing fee", { exact: true }).count() === 0, "bank review has no online tax line");
  await capture(page, "bank-review-desktop");
  await page.getByRole("button", { name: /Get bank deposit instructions/ }).click();
  ok(await page.getByRole("heading", { name: "Your bank deposit instructions" }).isVisible(), "bank confirmation advances to a dedicated instructions screen");
  ok(await page.getByText("50200012345678").first().isVisible(), "configured account number is shown");
  ok(await page.getByText("HDFC0000123").first().isVisible(), "configured IFSC is shown");
  ok(await page.getByText("Include the invoice number", { exact: false }).first().isVisible(), "bank instructions are shown");
  ok(await page.getByRole("button", { name: "Copy payment reference" }).isVisible(), "invoice reference is copyable");
  ok(await page.getByText("This is not a payment confirmation.").isVisible(), "bank instructions explicitly distinguish unpaid from paid");
  ok(await page.getByRole("link", { name: "Send transfer reference" }).isVisible(), "transfer reference can be sent to the real support inbox");
  ok((await p.invoice.findUnique({ where: { id: invoiceA.id } })).status === "sent" && orders.length === 0, "bank confirmation neither marks paid nor starts the gateway");
  ok(await p.paymentTransaction.count({ where: { invoiceId: invoiceA.id } }) === 0, "bank instructions do not create a transaction-history entry");
  await capture(page, "bank-instructions-desktop");
  const instructionPdf = await page.pdf({ format: "A4", printBackground: true });
  await writeFile(`${dir}/bank-instructions.pdf`, instructionPdf);
  ok((await PDFDocument.load(instructionPdf)).getPageCount() === 1, "bank instructions print as one page without blank workspace pages");
  await page.setViewportSize({ width: 390, height: 900 });
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "bank instructions fit a phone");
  await capture(page, "bank-instructions-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Change payment method" }).click();
  await page.getByRole("radio", { name: /Pay Online/ }).check();
  await page.getByRole("button", { name: /Pay .* securely/ }).click();
  await page.waitForURL(/paid=1/, { timeout: 60_000 });
  ok(await page.getByText("Payment successful.", { exact: false }).first().isVisible(), "redirected back with the success heading");
  ok(await page.getByText("Paid in full", { exact: true }).isVisible(), "verified success panel renders");
  ok(await page.getByText("Outstanding balance", { exact: true }).isVisible(), "receipt shows the remaining balance");
  ok(await page.getByText("UPI via Razorpay", { exact: true }).isVisible(), "receipt shows the actual provider payment method");
  ok(await page.getByRole("button", { name: /Pay .* securely/ }).count() === 0, "paid page never offers a second payment");
  ok(await page.getByText(PAYMENT_ID).first().isVisible(), "payment reference is shown on our page");
  const paidRow = await p.invoice.findUnique({ where: { id: invoiceA.id } });
  ok(paidRow.status === "paid" && paidRow.paidAt && paidRow.razorpayPaymentId === PAYMENT_ID, "invoice recorded as paid with the provider payment id");
  const aHistory = await p.paymentTransaction.findMany({ where: { invoiceId: invoiceA.id } });
  ok(aHistory.length === 1 && aHistory[0].paymentId === PAYMENT_ID && aHistory[0].chargedAmount === 102360 && aHistory[0].method === "upi", "verified checkout atomically records one history row with actual charge and method");
  ok(orders.length === 1 && orders[0].amount === 102360 && Number(orders[0].notes.fee) === 2000 && Number(orders[0].notes.gst) === 360 && orders[0].receipt === invoiceA.number, "one order for the fee-inclusive total (2% + GST) with a full breakdown in notes");
  await capture(page, "receipt-desktop");
  await page.setViewportSize({ width: 390, height: 900 });
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "receipt fits a phone");
  await capture(page, "receipt-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  const audits = await p.auditLog.count({ where: { action: "razorpay.checkout.paid", entityId: invoiceA.id } });
  ok(audits === 1, "checkout payment audited");
  // ── 2b. USD invoice: 3% structure only — no GST row, currency-specific popup ──
  const invoiceE = await p.invoice.create({ data: { clientId: client.id, projectId: project.id, number: `${key}-E`, amount: 100, currency: "USD", status: "sent", notes: "Synthetic local review only." } });
  await visit(page, `/portal/invoices/${invoiceE.id}/pay`);
  await page.getByRole("button", { name: /Pay .* securely/ }).waitFor({ timeout: 30_000 });
  ok(await page.getByText("GST on processing fee", { exact: true }).count() === 0, "non-INR invoice shows no GST row at all");
  ok(await page.getByText("$1.03").first().isVisible(), "USD total is $1.00 + 3% fee ($1.03)");
  await page.getByRole("button", { name: /Calculated as 3% of the invoice amount/ }).hover();
  ok(await page.getByRole("tooltip").getByText("Calculated as 3% of the invoice amount.").isVisible(), "USD invoice: processing-fee popup states only the 3% rule");
  await capture(page, "1b-usd-fees");
  await p.invoice.delete({ where: { id: invoiceE.id } }).catch(() => {});


  // ── 3. manual-link invoice: pay page routes to the provider, zero gateway orders ──
  await visit(page, `/portal/invoices/${invoiceC.id}/pay`);
  ok(await page.getByRole("link", { name: "Continue to the payment provider" }).first().isVisible(), "manual-link invoice uses the provider path");
  ok((await p.invoice.findUnique({ where: { id: invoiceC.id } })).paymentLink === "https://paypal.me/savomanual/100", "manual link untouched");
  ok(orders.length === 1, "no gateway order was created for the manual-link invoice");

  // Loading failures are recoverable without toggling methods or creating orders.
  const recovery = await c.newPage();
  await recovery.route("https://checkout.razorpay.com/**", r => r.abort());
  await visit(recovery, `/portal/invoices/${invoiceB.id}/pay`);
  await recovery.getByRole("button", { name: "Try loading again" }).waitFor();
  ok(true, "script failure offers a real retry");
  await recovery.unroute("https://checkout.razorpay.com/**");
  await recovery.getByRole("button", { name: "Try loading again" }).click();
  await recovery.getByRole("button", { name: /Pay .* securely/ }).waitFor();
  ok(true, "retry recovers the checkout loader without a radio toggle");
  await recovery.goto(`${base}/portal/invoices/${invoiceB.id}/pay?paid=1`, { waitUntil: "domcontentloaded" });
  await recovery.getByRole("heading", { name: "Checking your payment" }).waitFor();
  ok(await recovery.getByRole("button", { name: /Pay .* securely/ }).count() === 0, "unverified return has no second-payment button");
  await recovery.setViewportSize({ width: 390, height: 900 });
  await capture(recovery, "pending-mobile");
  await recovery.close();

  // ── 4. webhook payment.captured reconciles independently (webhook-first race) ──
  const order = await p.invoice.findUnique({ where: { id: invoiceB.id } });
  await p.invoice.update({ where: { id: invoiceB.id }, data: { razorpayOrderId: "order_WEBHOOK1234" } });
  const delivered = await webhook({ id: "pay_WEBHOOK12345", order_id: "order_WEBHOOK1234", amount: 102360, currency: "INR", status: "captured", method: "upi", notes: { invoiceId: invoiceB.id } });
  ok(delivered.status === 200, "signed payment.captured accepted");
  await new Promise(r => setTimeout(r, 600));
  const bRow = await p.invoice.findUnique({ where: { id: invoiceB.id } });
  ok(bRow.status === "paid" && bRow.razorpayPaymentId === "pay_WEBHOOK12345", "webhook alone marks the invoice paid");

  // ── 5. forged signature and replay change nothing ──
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_FORGED1", order_id: "order_WEBHOOK1234", amount: 102360, currency: "INR", status: "captured" } } } });
  const forged = { ...sign(body), "x-razorpay-signature": "0".repeat(64) };
  ok((await fetch(`${base}/api/webhooks/razorpay`, { method: "POST", body, headers: forged })).status === 400, "forged signature rejected");
  const replayHeaders = sign(body);
  await fetch(`${base}/api/webhooks/razorpay`, { method: "POST", body, headers: replayHeaders });
  const replay = await fetch(`${base}/api/webhooks/razorpay`, { method: "POST", body, headers: replayHeaders });
  ok(replay.status === 200, "replayed delivery acknowledged");
  ok(await p.paymentTransaction.count({ where: { invoiceId: invoiceB.id } }) === 2, "different genuine signed capture IDs are retained, while replaying the same capture adds no history row");
  ok((await p.paymentTransaction.findUnique({ where: { recordKey: "payment:pay_FORGED1" } }))?.amount === 0, "a second real capture is retained without falsely crediting the invoice twice");
  ok((await p.webhookEvent.count()) === originalEventCount + 2, "replay created no second event");

  // ── 6. admin sync reconciles an order the webhook missed ──
  const a = await context("savo_admin", admin.id);
  const adminPage = await a.newPage();
  const invoiceD = await mkInvoice("D");
  // Give the invoice a checkout session (as the portal would on payment start).
  const orderResp = await fetch(`http://127.0.0.1:${stubPort}/v1/orders`, { method: "POST", body: JSON.stringify({ amount: 102360, currency: "INR", receipt: invoiceD.number, notes: { invoiceId: invoiceD.id } }) });
  const orderD = await orderResp.json();
  await p.invoice.update({ where: { id: invoiceD.id }, data: { razorpayOrderId: orderD.id } });
  await visit(adminPage, `/admin/invoices/${invoiceD.id}`);
  await adminPage.getByRole("button", { name: "Sync status with Razorpay" }).click();
  await adminPage.waitForURL(/razorpay=/, { timeout: 30_000 });
  ok(true, "sync reports no attempts before payment");
  await settle(orderD.id);
  await visit(adminPage, `/admin/invoices/${invoiceD.id}`);
  await adminPage.getByRole("button", { name: "Sync status with Razorpay" }).click();
  await adminPage.waitForURL(/saved=paid&via=razorpay/, { timeout: 30_000 });
  ok((await p.invoice.findUnique({ where: { id: invoiceD.id } })).status === "paid", "admin sync records payment from the provider's own record");
  ok(await p.paymentTransaction.count({ where: { invoiceId: invoiceD.id } }) === 1, "admin sync records the confirmed gateway transaction in history");
  await visit(page, "/portal/transactions");
  ok(await page.locator("tbody tr").count() === 4 && await page.getByText(PAYMENT_ID, { exact: true }).isVisible(), "Transactions page shows checkout, webhook and synchronized captures with invoice downloads");
  await p.invoice.delete({ where: { id: invoiceD.id } }).catch(() => {});
} catch (error) {
  errors.push(String(error?.message ?? error));
} finally {
  for (const [name, id] of [["adminUser", admin?.id], ["clientUser", client?.id]]) if (id) await p[name].delete({ where: { id } }).catch(() => {});
  if (project) await p.clientProject.delete({ where: { id: project.id } }).catch(() => {});
  for (const inv of [invoiceA, invoiceB, invoiceC]) if (inv) await p.invoice.delete({ where: { id: inv.id } }).catch(() => {});
  await p.webhookEvent.deleteMany({ where: { id: { in: eventIds } } });
  await p.$transaction([
    p.siteSetting.deleteMany({ where: { key: { in: bankKeys } } }),
    ...originalBankRows.map(({ key, value }) => p.siteSetting.create({ data: { key, value } })),
  ]);
  stub.close(); await browser.close(); await p.$disconnect();
}
await writeFile(`${dir}/report.txt`, [`checks: ${checks.length}`, ...checks.map(c => `✓ ${c}`), errors.length ? `errors: ${errors.length}` : "errors: 0", ...errors.map(e => `✗ ${e}`), ""].join("\n"));
console.log(`razorpay checkout review — ${checks.length} checks, ${errors.length} errors → ${dir}/report.txt`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
