/** Local-only PDF/portal integration checks. Creates labelled synthetic data
 * and removes it in finally. Never sends mail or automates a real login.
 * BASE_URL=http://localhost:3000 node --env-file=.env --env-file=.env.local scripts/verify-invoice-downloads.mjs
 */
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PDFDocument } from "pdf-lib";
import { chromium } from "playwright-core";
const base = process.env.BASE_URL || "http://localhost:3000";
const local = new Set(["localhost", "127.0.0.1", "[::1]"]);
assert(local.has(new URL(base).hostname), "Only a local server may be tested");
assert(local.has(new URL(process.env.DATABASE_URL).hostname), "Only a local DB may receive fixtures");
const p = new PrismaClient();
const browser = await chromium.launch();
const owners = [];
const checks = [];
const dir = "tmp/invoice-pdf";
const key = `pdf-review-${randomBytes(4).toString("hex")}`;
const ok = (value, label) => { assert(value, label); checks.push(label); };
await mkdir(dir, { recursive: true });
async function session(clientId, expiresAt = new Date(Date.now() + 300_000)) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const token = randomBytes(32).toString("hex");
  await p.clientSession.create({ data: { clientId, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt } });
  await context.addCookies([{ name: "savo_client", value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
  await context.route("**/api/analytics/collect", r => r.fulfill({ status: 204 }));
  return context;
}
try {
  for (const name of ["Synthetic Invoice Client", "Synthetic Other Client"]) {
    const owner = await p.clientUser.create({ data: { name, email: `${key}-${owners.length}@example.invalid`, company: "Synthetic review company — not a real customer", passwordHash: "local-pdf-review-no-password-login" } });
    owners.push(owner.id);
  }
  const foreignProject = await p.clientProject.create({ data: { clientId: owners[1], title: "FOREIGN-PROJECT-MUST-NOT-LEAK", code: `${key}-FOREIGN` } });
  const rows = [];
  for (const status of ["sent", "paid", "overdue", "cancelled", "draft"]) {
    rows.push(await p.invoice.create({ data: { clientId: owners[0], projectId: status === "cancelled" ? foreignProject.id : null,
      number: `${key}-${status.toUpperCase()}`, status, amount: 250050, currency: "INR",
      notes: "Synthetic invoice for local verification only. Not payable.", issuedAt: new Date("2026-10-01"), dueDate: new Date("2026-10-15"), paidAt: status === "paid" ? new Date("2026-10-10") : null } }));
  }
  const foreignInvoice = await p.invoice.create({ data: { clientId: owners[1], number: `${key}-OTHER`, status: "sent", amount: 999999, currency: "USD" } });
  const anonymous = await browser.newContext();
  const route = invoice => `${base}/portal/invoices/${invoice.id}/pdf`;
  ok((await anonymous.request.get(route(rows[0]))).status() === 401, "anonymous PDF access blocked");
  const context = await session(owners[0]);
  for (const row of rows.filter(r => r.status !== "draft")) {
    const response = await context.request.get(route(row));
    ok(response.status() === 200, `${row.status}: authorized download succeeds`);
    ok(response.headers()["content-type"] === "application/pdf", `${row.status}: real PDF media type`);
    ok(response.headers()["content-disposition"].startsWith("attachment;"), `${row.status}: attachment download`);
    ok(response.headers()["cache-control"].includes("private, no-store"), `${row.status}: private uncached response`);
    const bytes = await response.body();
    const doc = await PDFDocument.load(bytes);
    ok(doc.getTitle() === `Invoice ${row.number}`, `${row.status}: correct stored invoice number`);
    await writeFile(`${dir}/live-${row.status}.pdf`, bytes);
    const view = await context.request.get(`${route(row)}?view=1`);
    ok(view.status() === 200 && view.headers()["content-disposition"].startsWith("inline;"), `${row.status}: native viewing/printing supported`);
  }
  const hidden = await context.request.get(route(rows.find(r => r.status === "draft")));
  const foreign = await context.request.get(route(foreignInvoice));
  ok(hidden.status() === 404 && foreign.status() === 404, "draft/foreign invoices blocked by ownership/status query");
  ok(await hidden.text() === await foreign.text(), "draft/foreign responses do not disclose existence");
  const expired = await session(owners[0], new Date(Date.now() - 60_000));
  ok((await expired.request.get(route(rows[0]))).status() === 401, "expired client session rejected");
  const inactive = await session(owners[1]);
  await p.clientUser.update({ where: { id: owners[1] }, data: { active: false } });
  ok((await inactive.request.get(route(foreignInvoice))).status() === 401, "inactive client rejected");
  const errors = [];
  const page = await context.newPage();
  page.on("pageerror", e => errors.push(e.message));
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(`${base}/portal/invoices`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    ok(await page.getByRole("link", { name: /^Download PDF for invoice/ }).count() === 4, `${width}: downloads present for every visible invoice`);
    ok(!await page.locator("main").innerText().then(t => t.includes("-DRAFT") || t.includes("FOREIGN-PROJECT-MUST-NOT-LEAK")), `${width}: drafts and foreign project stay private`);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}: no document overflow`);
    ok(await page.getByRole("link", { name: /^Download PDF for invoice/ }).evaluateAll(links => links.every(link => link.getBoundingClientRect().height >= 44)), `${width}: usable download targets`);
    await page.screenshot({ path: `${dir}/invoices-${width}.png`, fullPage: true, style: "[inert], [inert] * { visibility:hidden !important; }" });
  }
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: /^Download PDF for invoice/ }).first().click()]);
  ok(download.suggestedFilename().startsWith("Savo-Invoice-") && download.suggestedFilename().endsWith(".pdf"), "actual browser download uses named PDF attachment");
  ok(errors.length === 0, `no portal runtime errors: ${errors.join("; ")}`);
  await writeFile(`${dir}/browser-report.json`, JSON.stringify({ localOnly: true, synthetic: true, checks, errors }, null, 2));
  console.log(`PASS: ${checks.length} checks; real PDFs, download, print/view, ownership, drafts, expired/inactive sessions and responsive invoice controls. No emails sent.`);
} finally {
  await browser.close();
  await p.clientUser.deleteMany({ where: { id: { in: owners } } });
  await p.$disconnect();
}
