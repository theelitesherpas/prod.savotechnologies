/**
 * Razorpay payment pipeline — automated browser + webhook review.
 *
 * Runs against the LOCAL dev server with a stub gateway:
 *   RAZORPAY_API_BASE=http://127.0.0.1:4390 \
 *   RAZORPAY_KEY_ID=rzp_test_STUBLOCALKEY1 RAZORPAY_KEY_SECRET=stub-secret-1234567890 \
 *   RAZORPAY_WEBHOOK_SECRET=stub-webhook-secret-123456789012 \
 *   npm run dev -- -p 4312
 *
 * Flow: synthetic client+invoice → admin creates the payment link through the
 * UI (stub API answers) → Pay now appears in the client portal → signed
 * webhook payment_link.paid marks the invoice paid automatically → replay is
 * idempotent → bad signature rejected → amount mismatch never pays → sync
 * action reconciles a second invoice from the provider's own record.
 * Screenshots: tmp/razorpay-payments/. Refuses non-local databases.
 */
import { chromium } from "playwright-core";
import { PrismaClient } from "@prisma/client";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import http from "node:http";
import assert from "node:assert";

const base = process.env.BASE_URL ?? "http://localhost:4312";
const stubPort = Number(process.env.STUB_PORT ?? 4390);
const stubSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "stub-webhook-secret-123456789012";
const dbUrl = process.env.DATABASE_URL ?? "";
assert(/@(localhost|127\.0\.0\.1)/.test(dbUrl), "Refusing to run against a non-local database.");
assert((process.env.MAIL_DELIVERY_MODE ?? "off") === "off", "Keep mail off for this local review.");

const p = new PrismaClient();
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const dir = "tmp/razorpay-payments";
const key = `RZPPAY-${randomBytes(4).toString("hex")}`;
const checks = [], errors = [];
const ok = (condition, label) => { assert(condition, label); checks.push(label); };
await mkdir(dir, { recursive: true });

// ── stub Razorpay API ───────────────────────────────────────────────────
const created = [];
const stub = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${stubPort}`);
  const send = (status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  if (req.method === "GET" && url.pathname === "/v1/payment_links") return send(200, { items: [] }); // credential verify
  const link = url.pathname.match(/^\/v1\/payment_links\/([^/]+)$/);
  const cancel = url.pathname.match(/^\/v1\/payment_links\/([^/]+)\/cancel$/);
  if (req.method === "POST" && url.pathname === "/v1/payment_links") {
    let raw = ""; req.on("data", c => raw += c); req.on("end", () => {
      const body = JSON.parse(raw);
      const record = { id: `plink_${randomBytes(6).toString("hex")}`, status: "issued", ...body };
      created.push(record);
      send(200, { id: record.id, short_url: `https://rzp.io/i/${randomBytes(4).toString("base64url")}`, status: record.status, amount: record.amount, currency: record.currency, reference_id: record.reference_id });
    });
    return;
  }
  if (link && req.method === "GET") {
    const record = created.find(c => c.id === link[1]);
    return record ? send(200, { id: record.id, status: record.status, amount: record.amount, currency: record.currency, reference_id: record.reference_id }) : send(404, { error: { description: "link not found" } });
  }
  if (cancel && req.method === "POST") {
    const record = created.find(c => c.id === cancel[1]);
    if (record) record.status = "cancelled";
    return record ? send(200, { id: record.id, status: "cancelled" }) : send(404, { error: {} });
  }
  send(404, { error: { description: "stub: unknown route" } });
});
await new Promise(resolve => stub.listen(stubPort, "127.0.0.1", resolve));

const sign = (body) => ({
  "content-type": "application/json",
  "x-razorpay-signature": createHmac("sha256", stubSecret).update(body, "utf8").digest("hex"),
  "x-razorpay-event-id": `evt_${randomBytes(6).toString("hex")}`,
});
const webhook = async (entity, headers) => {
  const body = JSON.stringify({ event: "payment_link.paid", payload: { payment_link: { entity }, payment: { entity: { id: `pay_${randomBytes(5).toString("hex")}` } } } });
  const response = await fetch(`${base}/api/webhooks/razorpay`, { method: "POST", body, headers: headers ?? sign(body) });
  return { status: response.status, text: await response.text() };
};

let admin, client, project, invoiceA, invoiceB;
const context = async (cookie, owner) => {
  const c = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  if (cookie === "savo_admin") await p.adminSession.create({ data: { userId: owner, tokenHash, expiresAt: new Date(Date.now() + 3_600_000) } });
  else await p.clientSession.create({ data: { clientId: owner, tokenHash, expiresAt: new Date(Date.now() + 3_600_000) } });
  await c.addCookies([{ name: cookie, value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
  await c.route("**/*", r => { const u = new URL(r.request().url()); return u.origin === new URL(base).origin ? r.continue() : r.abort(); });
  return c;
};
const visit = async (page, path) => { await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 60_000 }); await page.locator("main h1").first().waitFor(); };

try {
  // ── fixtures ──
  admin = await p.adminUser.create({ data: { email: `${key}-admin@example.invalid`, name: "Synthetic Razorpay Pipeline Admin", role: "admin", passwordHash: "local-session-fixture-no-password" } });
  client = await p.clientUser.create({ data: { name: "Synthetic Razorpay Client", email: `${key}-client@example.invalid`, passwordHash: "local-session-fixture-no-password" } });
  project = await p.clientProject.create({ data: { clientId: client.id, title: "Synthetic Razorpay pipeline project", code: key, summary: "Synthetic local review only.", status: "in_progress", budget: 200000, currency: "INR" } });
  const mkInvoice = n => p.invoice.create({ data: { clientId: client.id, projectId: project.id, number: `${key}-${n}`, amount: 100000, currency: "INR", status: "sent", notes: "Synthetic local review only." } });
  invoiceA = await mkInvoice("A"); invoiceB = await mkInvoice("B");

  const a = await context("savo_admin", admin.id);
  const page = await a.newPage();
  page.on("pageerror", e => errors.push(e.message));

  // ── 1. create the payment link through the admin UI ──
  await visit(page, `/admin/invoices/${invoiceA.id}`);
  ok(await page.getByText("Razorpay payment link").first().isVisible(), "gateway card renders on the invoice page");
  await page.getByRole("button", { name: "Create payment link" }).click();
  await page.getByRole("button", { name: "Create link", exact: true }).click();
  await page.waitForURL(/linked=1/, { timeout: 30_000 });
  ok(created.length === 1, "stub gateway received exactly one link creation");
  ok(created[0].amount === 100000 && created[0].currency === "INR" && created[0].reference_id === invoiceA.number, "link carries the exact minor-unit amount, currency and invoice reference");
  ok(created[0].notify && created[0].notify.sms === false && created[0].notify.email === false, "provider-side notifications stay off (Savo sends the branded email)");
  const stored = await p.invoice.findUnique({ where: { id: invoiceA.id } });
  ok(stored.razorpayLinkId === created[0].id && /^https:\/\/rzp\.io\/i\//.test(stored.paymentLink), "invoice stores the gateway link id and hosted URL");
  ok(await page.getByText("Link active").first().isVisible(), "admin UI shows the active link state");
  await page.screenshot({ path: `${dir}/1-link-created.png`, fullPage: true });

  // ── 2. the client sees Pay now in the portal ──
  const c = await context("savo_client", client.id);
  const cpage = await c.newPage();
  await visit(cpage, "/portal/invoices");
  const payNow = cpage.getByRole("link", { name: "Pay now" }).first();
  ok(await payNow.isVisible(), "Pay now action appears in the client portal");
  ok((await payNow.getAttribute("href")).startsWith("https://rzp.io/i/"), "Pay now points at the hosted Razorpay link");

  // ── 3. signed webhook marks the invoice paid automatically ──
  const events0 = await p.webhookEvent.count();
  const paid = await webhook({ id: created[0].id, reference_id: invoiceA.number, amount: 100000, currency: "INR", status: "paid" });
  ok(paid.status === 200, "signed payment_link.paid webhook is accepted");
  await new Promise(r => setTimeout(r, 800));
  const after = await p.invoice.findUnique({ where: { id: invoiceA.id } });
  ok(after.status === "paid" && after.paidAt && /^pay_/.test(after.razorpayPaymentId), "invoice automatically marked paid with the provider payment id");
  ok(await p.webhookEvent.count() === events0 + 1, "webhook delivery recorded exactly once");
  ok((await p.projectUpdate.count({ where: { projectId: project.id } })) === 0, "project completion untouched (one of two invoices still unpaid)");

  // ── 4. replay is idempotent ──
  const entity = { id: created[0].id, reference_id: invoiceA.number, amount: 100000, currency: "INR", status: "paid" };
  const body = JSON.stringify({ event: "payment_link.paid", payload: { payment_link: { entity }, payment: { entity: { id: "pay_REPLAY123" } } } });
  const headers = sign(body); // same event id per delivery pair? use fresh id below
  const replayHeaders = { ...headers, "x-razorpay-event-id": headers["x-razorpay-event-id"] };
  const first = await fetch(`${base}/api/webhooks/razorpay`, { method: "POST", body, headers: replayHeaders });
  const replay = await fetch(`${base}/api/webhooks/razorpay`, { method: "POST", body, headers: replayHeaders });
  ok(first.status === 200 && replay.status === 200, "delivery and its replay are both acknowledged");
  ok(await p.webhookEvent.count() === events0 + 2, "replay does not create a second processed event");

  // ── 5. bad signature rejected, mismatch never pays ──
  const bad = await webhook({ id: created[0].id, reference_id: invoiceB.number, amount: 100000, currency: "INR", status: "paid" }, { ...sign(JSON.stringify({})), "x-razorpay-signature": "0".repeat(64), "content-type": "application/json" });
  ok(bad.status === 400, "invalid signature is rejected with 400");
  const mismatch = await webhook({ id: created[0].id, reference_id: invoiceB.number, amount: 555, currency: "INR", status: "paid" });
  ok(mismatch.status === 200, "mismatched delivery is acknowledged (no retry storm)");
  const bRow = await p.invoice.findUnique({ where: { id: invoiceB.id } });
  ok(bRow.status === "sent", "amount mismatch never records payment");

  // ── 6. admin sync reconciles from the provider's own record ──
  await visit(page, `/admin/invoices/${invoiceB.id}`);
  await page.getByRole("button", { name: "Create payment link" }).click();
  await page.getByRole("button", { name: "Create link", exact: true }).click();
  await page.waitForURL(/linked=1/, { timeout: 30_000 });
  const bLink = created.at(-1);
  await visit(page, `/admin/invoices/${invoiceB.id}`);
  await page.getByRole("button", { name: "Sync status with Razorpay" }).click();
  await page.waitForURL(/razorpay=issued/, { timeout: 30_000 });
  ok(true, "sync reports the provider's unpaid status");
  bLink.status = "paid"; // the provider record changes (simulated settlement)
  await visit(page, `/admin/invoices/${invoiceB.id}`);
  await page.getByRole("button", { name: "Sync status with Razorpay" }).click();
  await page.waitForURL(/saved=paid&via=razorpay/, { timeout: 30_000 });
  ok((await p.invoice.findUnique({ where: { id: invoiceB.id } })).status === "paid", "sync records payment when the provider link is settled");
  ok((await p.projectUpdate.findFirst({ where: { projectId: project.id } })) !== null, "fully funded project completes through reconciliation");

  // ── 7. cancelling a payable invoice cancels the provider link ──
  const invoiceC = await mkInvoice("C");
  await visit(page, `/admin/invoices/${invoiceC.id}`);
  await page.getByRole("button", { name: "Create payment link" }).click();
  await page.getByRole("button", { name: "Create link", exact: true }).click();
  await page.waitForURL(/linked=1/, { timeout: 30_000 });
  const cLink = created.at(-1);
  ok(cLink.id !== created[0].id, "third invoice received its own link");
  await visit(page, `/admin/invoices/${invoiceC.id}`);
  await page.locator('select[name="status"]').selectOption("cancelled");
  await page.getByRole("button", { name: "Save invoice" }).click();
  await page.waitForURL(/saved=1/, { timeout: 30_000 });
  ok(cLink.status === "cancelled", "saving a cancelled invoice cancels the provider link");
  ok((await p.invoice.findUnique({ where: { id: invoiceC.id } })).status === "cancelled", "invoice C stored as cancelled");
  await page.screenshot({ path: `${dir}/7-final.png`, fullPage: true });
  await p.invoice.delete({ where: { id: invoiceC.id } }).catch(() => {});

  // ── 8. precedence: a manual link suppresses the gateway entirely ──
  await visit(page, "/admin/invoices");
  const stubCallsBeforeManual = created.length;
  await page.locator('select[name="clientId"]').selectOption(client.id);
  await page.locator('input[name="amountMajor"]').fill("500.00");
  await page.locator('input[name="paymentLink"]').fill("https://paypal.me/savomanual/500");
  await page.getByRole("button", { name: "Create invoice", exact: true }).click();
  await page.waitForURL(/saved=created/, { timeout: 30_000 });
  ok(created.length === stubCallsBeforeManual, "manual link: the gateway is never triggered");
  const manual = await p.invoice.findFirst({ where: { clientId: client.id, amount: 50000 }, orderBy: { createdAt: "desc" } });
  ok(manual?.paymentLink === "https://paypal.me/savomanual/500" && !manual.razorpayLinkId, "manual link stored verbatim, no gateway link id");
  await p.invoice.delete({ where: { id: manual.id } }).catch(() => {});

  // ── 9. precedence: no link + payable → automatic gateway link at creation ──
  await visit(page, "/admin/invoices");
  await page.locator('select[name="clientId"]').selectOption(client.id);
  await page.locator('input[name="amountMajor"]').fill("750.00");
  await page.getByRole("button", { name: "Create invoice", exact: true }).click();
  await page.waitForURL(/linked=auto/, { timeout: 30_000 });
  ok(created.length === stubCallsBeforeManual + 1, "no manual link: the gateway created exactly one link");
  const autoRow = await p.invoice.findFirst({ where: { clientId: client.id, amount: 75000 }, orderBy: { createdAt: "desc" } });
  ok(autoRow?.razorpayLinkId === created.at(-1).id && /^https:\/\/rzp\.io\/i\//.test(autoRow.paymentLink), "automatic link stored with its gateway id");
  ok(await page.getByText("created automatically", { exact: false }).first().isVisible(), "admin sees the automatic-link notice");
  await page.screenshot({ path: `${dir}/9-auto-link.png`, fullPage: true });
  await p.invoice.delete({ where: { id: autoRow.id } }).catch(() => {});
} catch (error) {
  errors.push(String(error?.message ?? error));
} finally {
  for (const [name, id] of [["adminUser", admin?.id], ["clientUser", client?.id]]) if (id) await p[name].delete({ where: { id } }).catch(() => {});
  if (project) await p.clientProject.delete({ where: { id: project.id } }).catch(() => {});
  for (const inv of [invoiceA, invoiceB]) if (inv) await p.invoice.delete({ where: { id: inv.id } }).catch(() => {});
  await p.webhookEvent.deleteMany({});
  await p.stepUpChallenge.deleteMany({ where: { userId: admin?.id ?? "none" } });
  stub.close(); await browser.close(); await p.$disconnect();
}
await writeFile(`${dir}/report.txt`, [`checks: ${checks.length}`, ...checks.map(c => `✓ ${c}`), errors.length ? `errors: ${errors.length}` : "errors: 0", ...errors.map(e => `✗ ${e}`), ""].join("\n"));
console.log(`razorpay payments review — ${checks.length} checks, ${errors.length} errors → ${dir}/report.txt`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
