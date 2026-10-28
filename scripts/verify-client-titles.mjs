/** LOCAL ONLY. Synthetic accounts/sessions; no email sent, no live fixtures.
 * Start local Next with MAIL_DELIVERY_MODE=off, apply client-titles.sql, then:
 * node --env-file=.env --env-file=.env.local scripts/verify-client-titles.mjs
 */
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { chromium } from "playwright-core";
const base = process.env.BASE_URL || "http://localhost:3000";
const local = new Set(["localhost", "127.0.0.1", "[::1]"]);
assert(local.has(new URL(base).hostname) && local.has(new URL(process.env.DATABASE_URL).hostname), "Loopback origin/database only");
assert(process.env.MAIL_DELIVERY_MODE !== "live", "No live mail in local verification");
const prisma = new PrismaClient();
const browser = await chromium.launch();
const dir = ".impeccable/review/client-titles";
await mkdir(dir, { recursive: true });
const tag = `client-title-${randomBytes(6).toString("hex")}`;
const adminToken = randomBytes(32).toString("hex"), clientToken = randomBytes(32).toString("hex"), meetingToken = randomBytes(32).toString("base64url");
const sha = value => createHash("sha256").update(value).digest("hex");
const expiresAt = new Date(Date.now() + 3600_000);
const checks = [], errors = [], ids = {};
const ok = (condition, label) => { assert(condition, label); checks.push(label); };
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const page = await context.newPage();
page.on("pageerror", error => errors.push(error.message));
async function visit(path) { await page.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: 60000 }); await page.evaluate(() => document.fonts.ready); }
async function inspect(name) {
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: no horizontal overflow`);
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  const violations = await page.evaluate(async () => (await window.axe.run(document.querySelector("#cl-title").parentElement, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })));
  ok(!violations.length, `${name}: new title-field accessibility ${JSON.stringify(violations)}`);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
}
try {
  const passwordHash = await hash(randomBytes(18).toString("base64url"), 10);
  const admin = await prisma.adminUser.create({ data: { name: "Synthetic title review", email: `${tag}-admin@example.invalid`, passwordHash, role: "admin", permissions: [] } }); ids.admin = admin.id;
  const client = await prisma.clientUser.create({ data: { name: "James Miller", title: "Mr.", email: `${tag}@example.invalid`, passwordHash, company: "Synthetic review only" } }); ids.client = client.id;
  await prisma.adminSession.create({ data: { userId: admin.id, tokenHash: sha(adminToken), expiresAt } });
  await prisma.clientSession.create({ data: { clientId: client.id, tokenHash: sha(clientToken), expiresAt } });
  const meeting = await prisma.meeting.create({ data: { reference: tag, tokenHash: sha(meetingToken), tokenPlain: meetingToken, clientId: client.id, clientName: "James Miller", clientCompany: "Synthetic review only", title: "Synthetic title-formatting review", createdBy: admin.id, status: "awaiting_client" } }); ids.meeting = meeting.id;
  const invoice = await prisma.invoice.create({ data: { clientId: client.id, number: tag, amount: 10000, currency: "INR", status: "sent" } });
  await context.addCookies([{ name: "savo_admin", value: adminToken, url: base, httpOnly: true, sameSite: "Lax" }]);
  await visit("/admin/clients");
  const row = page.locator("li").filter({ hasText: client.email });
  ok((await row.textContent()).includes("Mr. James Miller"), "client directory shows titled full name");
  ok(await page.locator('#cl-title').inputValue() === "", "new-client title is optional and unset");
  for (const title of ["Mr.", "Mrs.", "Ms.", "Dr.", ""]) {
    await visit(`/admin/clients/${client.id}`);
    ok(await page.locator('#cl-name').inputValue() === "James Miller", `${title || "untitled"}: editor keeps stored name separate`);
    await page.locator('#cl-title').selectOption(title);
    await page.getByRole('button', { name: "Save client", exact: true }).click();
    await page.waitForURL("**/admin/clients?saved=1");
    const saved = await prisma.clientUser.findUnique({ where: { id: client.id } });
    ok(saved.name === "James Miller" && saved.title === (title || null), `${title || "untitled"}: native admin save persisted correctly`);
    const display = [title, "James Miller"].filter(Boolean).join(" ");
    ok((await page.locator('li').filter({ hasText: client.email }).textContent()).includes(display), `${display}: directory display`);
  }
  await prisma.clientUser.update({ where: { id: client.id }, data: { title: "Mr." } });
  for (const [width, height] of [[1440, 1000], [390, 844]]) {
    await page.setViewportSize({ width, height }); await visit(`/admin/clients/${client.id}`);
    ok(await page.locator('#cl-title').inputValue() === "Mr.", `${width}: saved title selected`);
    await inspect(`edit-${width}`);
  }
  const detail = await context.request.get(`${base}/api/admin/meetings/${meeting.id}`);
  const detailData = await detail.json();
  ok(detailData.meeting.clientName === "James Miller" && detailData.meeting.clientTitle === "Mr.", "meeting admin DTO keeps raw name and explicit title separate");
  const listData = await (await context.request.get(`${base}/api/admin/meetings?clients=1&q=${tag}`)).json();
  ok(listData.meetings.some(m => m.id === meeting.id && m.clientTitle === "Mr."), "existing linked meeting picks up title without rewriting its name");
  ok(listData.clients.some(c => c.id === client.id && c.name === "James Miller" && c.title === "Mr."), "meeting client picker preserves raw name/title metadata");
  await visit(`/meeting/${meetingToken}`);
  ok((await page.locator('main').textContent()).includes("Hi Mr. James,"), "public invitation uses title plus first name");
  await page.getByText("View meeting details", { exact: true }).click();
  await page.locator('summary:visible').filter({ hasText: "View contact details" }).first().click();
  ok((await page.locator('main').textContent()).includes("Mr. James Miller"), "invitation contact record uses titled full name");
  const clientContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await clientContext.addCookies([{ name: "savo_client", value: clientToken, url: base, httpOnly: true, sameSite: "Lax" }]);
  const portal = await clientContext.newPage(); portal.on("pageerror", e => errors.push(e.message));
  await portal.goto(`${base}/portal/dashboard`, { waitUntil: "networkidle" });
  ok(await portal.getByRole('heading', { name: "Welcome back, Mr. James." }).isVisible(), "portal welcome preserves title plus first name");
  ok(await portal.getByText("Mr. James Miller", { exact: true }).first().isVisible(), "portal identity shows titled full name");
  const pdfResponse = await clientContext.request.get(`${base}/portal/invoices/${invoice.id}/pdf`);
  ok(pdfResponse.status() === 200 && pdfResponse.headers()['content-type'].includes('application/pdf'), "owned titled invoice PDF renders successfully");
  const pdfPath = resolve(`${dir}/invoice.pdf`); await writeFile(pdfPath, await pdfResponse.body());
  if (process.platform === "darwin" && existsSync("/usr/bin/swift")) {
    const swift = 'import Foundation; import PDFKit; let url = URL(fileURLWithPath: CommandLine.arguments[1]); if let doc = PDFDocument(url: url) { print(doc.string ?? "") } else { exit(1) }';
    const text = execFileSync('/usr/bin/swift', ['-e', swift, pdfPath], { encoding: 'utf8', timeout: 60000 });
    ok(text.includes("Mr. James Miller"), "actual invoice PDF text contains titled full name");
    ok(!text.includes("Mr. Mr."), "actual invoice PDF does not duplicate title");
  }
  await clientContext.close();
  ok(!errors.length, `no browser runtime errors: ${errors.join('; ')}`);
  ok(await prisma.sentEmail.count({ where: { toEmail: client.email } }) === 0, "no real/synthetic mail archived by account edits");
  await writeFile(`${dir}/report.json`, JSON.stringify({ checks, errors, note: "Local synthetic client/admin/session/meeting/invoice. No mail sent. Reserved local business numbers are never reset or reused." }, null, 2));
  console.log(`Passed ${checks.length} client-title checks. Evidence: ${dir}`);
} finally {
  await browser.close();
  if (ids.meeting) await prisma.meeting.deleteMany({ where: { id: ids.meeting } });
  if (ids.client) await prisma.clientUser.deleteMany({ where: { id: ids.client } });
  if (ids.admin) {
    await prisma.auditLog.deleteMany({ where: { userId: ids.admin } });
    // Reservation ledger rows are deliberately immutable and never recycled.
    await prisma.adminUser.deleteMany({ where: { id: ids.admin } });
  }
  await prisma.$disconnect();
}
