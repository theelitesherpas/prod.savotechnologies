/** LOCAL synthetic browser/security review. Never run against production.
 * node --env-file=.env --env-file=.env.local scripts/verify-portal-transactions.mjs
 */
import { chromium } from "playwright-core";
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
assert(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname), "LOCAL database only");
const base = process.env.BASE_URL ?? "http://localhost:4312";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "LOCAL app only");
assert((process.env.MAIL_DELIVERY_MODE ?? "off") === "off", "Mail must be off");
const prisma = new PrismaClient();
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const dir = ".impeccable/review/transactions";
await mkdir(dir, { recursive: true });
const key = `TXH${randomBytes(5).toString("hex")}`;
const clients = [], checks = [], errors = [];
const ok = (condition, label) => { assert(condition, label); checks.push(label); };
const context = async clientId => {
  const c = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 } });
  if (clientId) {
    const token = randomBytes(32).toString("hex");
    await prisma.clientSession.create({ data: { clientId, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600000) } });
    await c.addCookies([{ name: "savo_client", value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
  }
  await c.route("**/*", route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
  return c;
};
const visit = async (page, query = "") => {
  await page.goto(`${base}/portal/transactions${query}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("heading", { name: "Transactions.", exact: true }).waitFor();
};
const capture = async (page, name) => {
  if (process.env.SKIP_SCREENSHOTS === "1" && name !== process.env.CAPTURE_ONLY) return;
  await page.evaluate(async () => { await document.fonts.ready; scrollTo(0, 0); });
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true, animations: "disabled" });
  await page.screenshot({ path: `${dir}/${name}-viewport.png`, fullPage: false, animations: "disabled" });
};
try {
  for (const suffix of ["owner", "other", "empty"]) clients.push(await prisma.clientUser.create({ data: { name: `Synthetic ${suffix} Client`, company: "Local QA only", email: `${key}-${suffix}@example.invalid`, passwordHash: "local-session-fixture-no-password" } }));
  const [owner, other, empty] = clients;
  const invoices = [];
  for (let i = 0; i < 27; i++) {
    const currency = ["INR", "USD", "EUR"][i % 3];
    const paidAt = new Date(Date.UTC(2026, 9, 20 - i, 10, 30));
    const amount = i === 0 ? 123456789 : 100000;
    const invoice = await prisma.invoice.create({ data: { clientId: owner.id, number: `${key}-${String(i).padStart(2, "0")}`, amount, currency, status: "paid", paidAt, notes: "Synthetic local transaction fixture, not a real payment." } });
    invoices.push(invoice);
    await prisma.paymentTransaction.create({ data: {
      recordKey: `invoice:${invoice.id}`, clientId: owner.id, invoiceId: invoice.id, invoiceNumber: invoice.number,
      projectTitle: i === 0 ? "Synthetic client website · design, engineering and long reference alignment check" : "Synthetic delivery project",
      amount, currency, occurredAt: paidAt, source: i < 14 ? "razorpay" : "manual", method: i < 14 ? ["upi", "card", "netbanking"][i % 3] : null,
      paymentId: i < 14 ? `pay_${key}${i === 0 ? "LongReferenceAlignmentCheck1234567890" : i}` : null,
      chargedAmount: i < 14 ? amount + Math.round(amount * (currency === "INR" ? .0236 : .03)) : null,
    } });
  }
  const historical = await prisma.invoice.create({ data: { clientId: owner.id, number: `${key}-HISTORICAL`, amount: 5000, currency: "INR", status: "paid", paidAt: null } });
  const foreign = await prisma.invoice.create({ data: { clientId: other.id, number: `${key}-PRIVATE`, amount: 10000, currency: "USD", status: "paid", paidAt: new Date() } });
  const runImport = () => {
    const result = spawnSync(process.execPath, ["scripts/backfill-payment-transactions.mjs", "--apply"], { encoding: "utf8", env: process.env });
    assert.equal(result.status, 0, result.stderr); return result.stdout;
  };
  runImport();
  const imported = await prisma.paymentTransaction.findUnique({ where: { recordKey: `invoice:${historical.id}` } });
  ok(imported && imported.chargedAmount === null && imported.occurredAt === null && imported.source === "legacy", "historical import preserves unknown total/date and does not manufacture a bank method");
  const before = await prisma.paymentTransaction.count(); runImport();
  ok(await prisma.paymentTransaction.count() === before, "history import is idempotent");
  const c = await context(owner.id), page = await c.newPage();
  page.on("pageerror", error => errors.push(error.message));
  await visit(page);
  const nav = page.getByRole("navigation", { name: "Client workspace" });
  ok((await nav.getByRole("link").allTextContents()).join("|") === "Overview|Projects|Invoices|Transactions", "Transactions follows Invoices in workspace navigation");
  ok(await nav.getByRole("link", { name: "Transactions", exact: true }).getAttribute("aria-current") === "page", "only the Transactions destination is active");
  ok(await page.getByRole("status").textContent() === "Showing 1–25 of 28 transactions", "25-row pagination includes only this client's confirmed payments");
  ok(await page.locator("tbody tr").count() === 25, "first page is bounded to 25 records");
  ok(await page.getByText(foreign.number).count() === 0, "another client's payment reference is absent");
  const download = page.getByRole("link", { name: `Download invoice ${invoices[0].number} as PDF` });
  const response = await c.request.get(await download.getAttribute("href"));
  ok(response.status() === 200 && response.headers()["content-type"].includes("application/pdf") && (await response.body()).subarray(0, 4).toString() === "%PDF", "PDF icon downloads a real owner-scoped invoice PDF");
  ok((await c.request.get(`/portal/invoices/${foreign.id}/pdf`)).status() === 404, "direct foreign invoice PDF request is denied");
  await capture(page, "desktop");
  for (const width of [1024, 900, 760, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `history fits ${width}px without page overflow`);
    const overlap = await page.locator("tbody tr").first().evaluate(row => {
      const cells = [...row.cells].map(cell => cell.getBoundingClientRect());
      return cells.some((a, i) => cells.slice(i + 1).some(b => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1));
    });
    ok(!overlap, `history cells do not overlap at ${width}px`);
    if ([1024, 390, 320].includes(width)) await capture(page, width === 390 ? "mobile" : `width-${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("link", { name: "Next", exact: true }).click();
  await page.waitForURL(/page=2/);
  ok(await page.locator("tbody tr").count() === 3 && (await page.getByRole("status").textContent()).includes("26–28"), "next page renders remaining records, including historical payment");
  await page.getByLabel("Search transactions").fill("HISTORICAL");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.waitForURL(/q=HISTORICAL/);
  await page.getByText("Historical payment record", { exact: true }).waitFor();
  ok(await page.locator("tbody tr").count() === 1 && await page.getByText("Historical payment record").isVisible(), "search finds historical invoice records");
  ok(await page.getByText("Not recorded", { exact: true }).count() === 2, "missing historical date and charge are explicit, not recalculated");
  await visit(page, "?source=razorpay&currency=USD");
  ok(await page.locator("tbody tr").count() === 5 && await page.getByText("Razorpay · Card", { exact: true }).count() === 5, "source and currency filters combine on the server");
  await visit(page, `?q=${foreign.number}&clientId=${other.id}`);
  ok(await page.getByRole("heading", { name: "No matching transactions." }).isVisible(), "forged owner query cannot expose another client's payment");
  await capture(page, "filtered-empty");
  await page.getByRole("link", { name: "Clear filters", exact: true }).last().click();
  await page.waitForURL(/\/portal\/transactions$/);
  await page.getByRole("status").filter({ hasText: "Showing 1–25" }).waitFor();
  ok(await page.locator("tbody tr").count() === 25, "clear filters restores full payment history");
  // History survives invoice changes/deletion, but the old owner cannot download
  // a reassigned invoice or follow a stale link into another client's record.
  await prisma.invoice.update({ where: { id: invoices[0].id }, data: { clientId: other.id, amount: 200 } });
  await visit(page, `?q=${key}-00`);
  ok(await page.getByText(invoices[0].number, { exact: true }).isVisible() && await page.getByText("Unavailable", { exact: true }).isVisible(), "immutable history remains while a reassigned invoice's PDF is suppressed");
  ok((await c.request.get(`/portal/invoices/${invoices[0].id}/pdf`)).status() === 404, "PDF endpoint independently enforces updated ownership");
  await prisma.invoice.delete({ where: { id: invoices[1].id } });
  await visit(page, `?q=${key}-01`);
  ok(await page.getByText(invoices[1].number, { exact: true }).isVisible() && await page.getByText("Unavailable", { exact: true }).isVisible(), "deleting the linked invoice does not erase the payment snapshot");
  const emptyContext = await context(empty.id), emptyPage = await emptyContext.newPage();
  await visit(emptyPage);
  ok(await emptyPage.getByRole("heading", { name: "No transactions yet." }).isVisible(), "new client sees a useful empty state, not invented transactions");
  await capture(emptyPage, "empty");
  const anonymous = await context();
  const denied = await anonymous.request.get("/portal/transactions", { maxRedirects: 0 });
  ok(denied.status() === 307 && denied.headers().location.endsWith("/portal"), "anonymous transaction-history requests redirect to sign-in");
} catch (error) { errors.push(error.message); }
finally {
  await prisma.clientUser.deleteMany({ where: { id: { in: clients.map(client => client.id) } } });
  await browser.close(); await prisma.$disconnect();
}
await writeFile(`${dir}/report.txt`, [`checks: ${checks.length}`, ...checks.map(check => `✓ ${check}`), `errors: ${errors.length}`, ...errors.map(error => `✗ ${error}`), ""].join("\n"));
console.log(`Transaction history review: ${checks.length} checks, ${errors.length} errors. Evidence: ${dir}`);
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
