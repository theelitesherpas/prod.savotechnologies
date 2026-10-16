/** LOCAL ONLY: both this script and the local server must use MAIL_DELIVERY_MODE=off.
 * MAIL_DELIVERY_MODE=off node --env-file=.env --env-file=.env.local scripts/verify-payment-links.mjs
 * Run tests/payment-links.test.tsx first to generate optional email preview fixtures.
 * All synthetic sessions/records are deleted in finally. No provider network requests.
 */
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright-core";
import { PDFDict, PDFDocument, PDFName, PDFString } from "pdf-lib";
const base = process.env.BASE_URL || "http://localhost:3000";
const local = new Set(["localhost", "127.0.0.1", "[::1]"]);
assert(local.has(new URL(base).hostname) && local.has(new URL(process.env.DATABASE_URL).hostname), "Refusing non-local fixtures");
assert.equal(process.env.MAIL_DELIVERY_MODE, "off", "Disable mail in this script AND the server");
const p = new PrismaClient(), browser = await chromium.launch();
const dir = "tmp/payment-links", key = `PAY-QA-${randomBytes(4).toString("hex")}`, owners = [], checks = [], errors = [];
const paypal = `https://www.paypal.com/invoice/p/#LOCAL-${key}`, razorpay = `https://rzp.io/i/LOCAL-${key}?source=invoice&language=en`;
let operator;
const ok = (condition, label) => { assert(condition, label); checks.push(label); };
await mkdir(dir, { recursive: true });
async function context(cookie, owner) {
  const c = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const token = randomBytes(32).toString("hex"), tokenHash = createHash("sha256").update(token).digest("hex"), expiresAt = new Date(Date.now() + 3600000);
  if (cookie === "savo_admin") await p.adminSession.create({ data: { userId: owner, tokenHash, expiresAt } });
  else await p.clientSession.create({ data: { clientId: owner, tokenHash, expiresAt } });
  await c.addCookies([{ name: cookie, value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
  await c.route("**/*", async r => {
    const u = new URL(r.request().url());
    if (u.origin === new URL(base).origin) return u.pathname === "/api/analytics/collect" ? r.fulfill({ status: 204 }) : r.continue();
    if (u.hostname === "savotechnologies.com" && u.pathname === "/images/email/logo-lockup-v2.png") return r.fulfill({ contentType: "image/png", body: await readFile("public/images/email/logo-lockup-v2.png") });
    if (["www.paypal.com", "rzp.io"].includes(u.hostname)) return r.fulfill({ contentType: "text/html", body: "Synthetic provider navigation only. No payment was made." });
    return r.abort();
  });
  c.on("page", page => page.on("pageerror", e => errors.push(e.message)));
  return c;
}
async function visit(page, path) {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("main h1").waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll("main form")].every(f => Object.keys(f).some(k => k.startsWith("__reactProps"))));
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}
async function submit(page, label, url) {
  const path = new URL(page.url()).pathname;
  const response = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname === path);
  await page.getByRole("button", { name: label, exact: true }).click();
  await (await response).finished(); await page.waitForURL(url);
}
async function snapshot(page, name) {
  await page.evaluate(() => document.fonts.ready);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: no horizontal overflow`);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true, style: "[inert],[inert] *{visibility:hidden!important}" });
}
async function pdfLinks(context, id) {
  const response = await context.request.get(`${base}/portal/invoices/${id}/pdf`);
  assert.equal(response.status(), 200);
  const bytes = await response.body(), pdf = await PDFDocument.load(bytes), links = [];
  for (const page of pdf.getPages()) {
    const a = page.node.Annots();
    for (let i = 0; i < (a?.size() ?? 0); i++) links.push(a.lookup(i, PDFDict).lookup(PDFName.of("A"), PDFDict).lookup(PDFName.of("URI"), PDFString).decodeText());
  }
  await writeFile(`${dir}/live-${links.length ? "payable" : "no-payment"}.pdf`, bytes);
  return links;
}
try {
  operator = await p.adminUser.create({ data: { email: `${key}-admin@example.invalid`, name: "Synthetic Payment Review Admin", role: "admin", passwordHash: "local-session-fixture-no-password" } });
  for (const name of ["Synthetic Payment Client", "Synthetic Other Client"]) owners.push((await p.clientUser.create({ data: { name, email: `${key}-${owners.length}@example.invalid`, passwordHash: "local-session-fixture-no-password" } })).id);
  const admin = await context("savo_admin", operator.id), client = await context("savo_client", owners[0]), other = await context("savo_client", owners[1]);
  const a = await admin.newPage(), c = await client.newPage();
  const project = await p.clientProject.create({ data: { clientId: owners[0], title: "Synthetic payment-link project", code: key, summary: "Synthetic local review only, not a real invoice or payment.", status: "in_progress", budget: 100000, currency: "USD", milestones: { create: { title: "Agreed delivery", amount: 100000, scope: "base", status: "pending" } } } });
  await visit(a, `/admin/invoices?client=${owners[0]}`);
  await a.locator('select[name="clientId"]').selectOption(owners[0]); await a.locator('select[name="projectId"]').selectOption(project.id);
  await a.locator('input[name="number"]').fill(key); await a.locator('input[name="amountMajor"]').fill("1000.00"); await a.locator('select[name="status"]').selectOption("sent");
  await a.getByLabel("Payment link (optional)").fill(paypal);
  await submit(a, "Create invoice", /\/admin\/invoices\?saved=created/);
  let invoice = await p.invoice.findUniqueOrThrow({ where: { number: key } }); const id = invoice.id;
  ok(invoice.paymentLink === paypal, "admin create persists a canonical hosted link");
  await p.invoice.createMany({ data: [{ clientId: owners[0], number: `${key}-BLANK`, amount: 100, currency: "USD", status: "sent" }, { clientId: owners[0], number: `${key}-CANCELLED`, amount: 100, currency: "USD", status: "cancelled", paymentLink: paypal }] });
  await visit(a, `/admin/invoices/${id}`); ok(await a.getByLabel("Payment link (optional)").inputValue() === paypal, "admin edit restores the optional link");
  await a.getByLabel("Payment link (optional)").fill("https://paypal.com.evil.invalid/pay");
  await submit(a, "Save invoice", /\?e=/);
  ok((await p.invoice.findUniqueOrThrow({ where: { id } })).paymentLink === paypal, "forged provider hostname is rejected without mutating the invoice");
  await visit(a, `/admin/invoices/${id}`); await a.locator('input[name="amountMajor"]').fill("900.00");
  await submit(a, "Save invoice", /\?e=/);
  ok((await p.invoice.findUniqueOrThrow({ where: { id } })).amount === 100000, "changed invoice terms cannot silently reuse an unconfirmed old checkout link");
  await visit(c, "/portal/invoices");
  const pay = c.getByRole("link", { name: `Pay now for invoice ${key} via PayPal (opens in a new tab)`, exact: true });
  ok(await pay.getAttribute("href") === paypal, "client invoice list shows the exact PayPal link");
  ok(await c.getByRole("row").filter({ hasText: `${key}-BLANK` }).getByRole("link", { name: /Pay now/ }).count() === 0, "blank-link invoices keep only existing document actions");
  ok(await c.getByRole("row").filter({ hasText: `${key}-CANCELLED` }).getByRole("link", { name: /Pay now/ }).count() === 0, "cancelled invoices never offer payment despite a stored link");
  const popupEvent = c.waitForEvent("popup"); await pay.click(); const popup = await popupEvent; await popup.waitForLoadState("domcontentloaded"); await popup.close();
  ok((await p.invoice.findUniqueOrThrow({ where: { id } })).status === "sent" && (await p.clientProject.findUniqueOrThrow({ where: { id: project.id } })).status === "in_progress", "opening the hosted link never records payment or completes the project");
  ok((await pdfLinks(client, id))[0] === paypal, "actual authorized PDF contains a clickable HTTPS payment annotation");
  await visit(c, "/portal/dashboard"); ok(await c.getByRole("link", { name: /Pay now for invoice/ }).count() === 1, "dashboard next payments uses the same safe action");
  for (const width of [1440, 320]) {
    await a.setViewportSize({ width, height: 1000 }); await c.setViewportSize({ width, height: 1000 });
    await visit(a, `/admin/invoices/${id}`); await snapshot(a, `admin-${width}`);
    await visit(c, "/portal/invoices"); await snapshot(c, `invoices-${width}`);
    await visit(c, `/portal/projects/${project.id}`); ok(await c.getByRole("link", { name: /Pay now for invoice/ }).count() === 1, `project invoices offer payment at ${width}px`); await snapshot(c, `project-${width}`);
  }
  await visit(a, `/admin/invoices/${id}`); await a.getByLabel("Payment link (optional)").fill(razorpay); await a.locator('select[name="status"]').selectOption("overdue");
  await submit(a, "Save invoice", /\/admin\/invoices\?saved=1/);
  await visit(c, "/portal/invoices"); ok(await c.getByRole("link", { name: /via Razorpay/ }).getAttribute("href") === razorpay, "editing the link updates overdue client payment actions");
  await visit(a, `/admin/invoices/${id}`); await a.getByLabel("Payment link (optional)").fill(""); await submit(a, "Save invoice", /\/admin\/invoices\?saved=1/);
  await visit(c, "/portal/invoices"); ok(await c.getByRole("link", { name: /Pay now for invoice/ }).count() === 0, "clearing the link removes Pay now without removing PDF actions");
  ok((await pdfLinks(client, id)).length === 0, "cleared link is removed from freshly generated PDFs");
  await visit(a, `/admin/invoices/${id}`); await a.getByLabel("Payment link (optional)").fill(paypal); await a.locator('select[name="status"]').selectOption("paid"); await submit(a, "Save invoice", /\/admin\/invoices\?saved=1/);
  invoice = await p.invoice.findUniqueOrThrow({ where: { id } }); const completed = await p.clientProject.findUniqueOrThrow({ where: { id: project.id } });
  ok(invoice.paymentLink === paypal && invoice.status === "paid" && completed.status === "delivered" && completed.completedByPayment, "confirmed full payment retains admin history and triggers existing project completion");
  await visit(c, `/portal/projects/${project.id}`); ok(await c.getByRole("link", { name: /Pay now for invoice/ }).count() === 0, "paid project invoices hide payment actions");
  ok((await pdfLinks(client, id)).length === 0, "paid PDF no longer has a payment annotation");
  const forbidden = await other.request.get(`${base}/portal/invoices/${id}/pdf`); ok(forbidden.status() === 404, "a different client cannot retrieve an invoice or payment link through its PDF");
  const otherPage = await other.newPage(); await visit(otherPage, "/portal/invoices"); ok(!(await otherPage.content()).includes(`LOCAL-${key}`), "foreign provider URLs are not serialized into another client's page");
  const audits = await p.auditLog.findMany({ where: { userId: operator.id, entity: "Invoice" } });
  ok(audits.some(row => row.meta?.paymentLinkChanged) && !JSON.stringify(audits).includes(`LOCAL-${key}`), "link changes are audited without recording opaque provider URL tokens");
  const mailPage = await client.newPage();
  for (const [width, scheme] of [[600, "light"], [320, "dark"]]) {
    await mailPage.setViewportSize({ width, height: 1000 }); await mailPage.emulateMedia({ colorScheme: scheme });
    await mailPage.setContent(await readFile(`${dir}/issued.html`, "utf8"), { waitUntil: "networkidle" });
    ok(await mailPage.locator("img").evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), `email branding loads at ${width}px`);
    await snapshot(mailPage, `email-${width}-${scheme}`);
  }
  ok(await p.sentEmail.count({ where: { toEmail: { contains: key } } }) === 0, "no real emails sent");
  ok(errors.length === 0, `no browser errors: ${errors.join("; ")}`);
  await writeFile(`${dir}/report.json`, JSON.stringify({ localOnly: true, synthetic: true, checks, errors }, null, 2));
  console.log(`PASS: ${checks.length} payment-link assertions. No provider requests, real payments or emails.`);
} finally {
  await browser.close(); await p.clientUser.deleteMany({ where: { id: { in: owners } } });
  if (operator) { await p.auditLog.deleteMany({ where: { userId: operator.id } }); await p.adminUser.delete({ where: { id: operator.id } }); }
  await p.$disconnect();
}
