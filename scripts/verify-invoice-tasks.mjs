/** Local-only real admin/client workflow. No live charges; start the server with
 * MAIL_DELIVERY_MODE=off, then run with the same flag and local .env files. */
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { PDFDocument } from "pdf-lib";
import { chromium } from "playwright-core";

const base = process.env.BASE_URL || "http://localhost:4312";
const local = new Set(["localhost", "127.0.0.1", "[::1]"]);
assert(local.has(new URL(base).hostname) && local.has(new URL(process.env.DATABASE_URL).hostname), "Refusing non-local fixtures");
assert(process.env.MAIL_DELIVERY_MODE === "off", "Mail must be disabled in the script AND server");
const p = new PrismaClient(), browser = await chromium.launch();
const key = `qa-tasks-${randomBytes(5).toString("hex")}`;
const dir = "tmp/invoice-tasks-browser", checks = [], errors = [], clients = [];
let operator;
const ok = (condition, label) => { assert(condition, label); checks.push(label); };
await mkdir(dir, { recursive: true });
async function session(cookie, owner) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const token = randomBytes(32).toString("hex"), tokenHash = createHash("sha256").update(token).digest("hex");
  if (cookie === "savo_admin") await p.adminSession.create({ data: { userId: owner, tokenHash, expiresAt: new Date(Date.now() + 3600000) } });
  else await p.clientSession.create({ data: { clientId: owner, tokenHash, expiresAt: new Date(Date.now() + 3600000) } });
  await context.addCookies([{ name: cookie, value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
  await context.route("**/api/analytics/collect", r => r.fulfill({ status: 204 }));
  context.on("page", page => page.on("pageerror", error => errors.push(error.message)));
  return context;
}
async function visit(page, path) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.locator("main h1").waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll("main form")].filter(f => f.querySelector("button")).every(f => Object.keys(f).some(k => k.startsWith("__reactProps"))));
  await page.waitForFunction(() => { const el = document.querySelector('input[name="reservedBusinessId"]'); return !el || /^STPL[A-Z]{2}\d{5}$/.test(el.value); });
}
async function submit(page, button, target) {
  const path = new URL(page.url()).pathname;
  const response = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname === path, { timeout: 30000 });
  await button.click(); await response; await page.waitForURL(target, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
}
async function capture(page, name) {
  await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: no horizontal overflow`);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
}
async function addTasks(container, rows) {
  for (let i = 0; i < rows.length; i++) {
    await container.getByRole("button", { name: "Add task", exact: true }).click();
    await container.getByLabel(`Task ${i + 1}`, { exact: true }).fill(rows[i][0]);
    await container.getByLabel("Price · INR", { exact: true }).nth(i).fill(rows[i][1]);
  }
}
try {
  operator = await p.adminUser.create({ data: { email: `${key}-admin@example.invalid`, name: "Synthetic Billing Review", role: "admin", passwordHash: "local-fixture-no-password" } });
  const admin = await session("savo_admin", operator.id), a = await admin.newPage();
  await visit(a, "/admin/clients");
  const createClient = a.locator("form").filter({ has: a.getByRole("button", { name: "Create client", exact: true }) });
  ok(await createClient.locator('fieldset[aria-label], fieldset').count() > 0, "new client form has optional billing address group");
  ok(await createClient.locator('[name="addressLine1"]').getAttribute("required") === null, "street address is optional");
  await createClient.getByLabel("Name *", { exact: true }).fill("Synthetic Task Client");
  await createClient.getByLabel("Email *", { exact: true }).fill(`${key}-client@example.invalid`);
  await createClient.getByLabel("Company", { exact: true }).fill("Example Client Ltd");
  await createClient.getByLabel("Street address", { exact: true }).fill("14 Example Road");
  await createClient.getByLabel("Apartment, suite or unit", { exact: true }).fill("Suite 2");
  await createClient.getByLabel("City", { exact: true }).fill("Indore");
  await createClient.getByLabel("State / region", { exact: true }).fill("Madhya Pradesh");
  await createClient.getByLabel("Postal / ZIP code", { exact: true }).fill("452001");
  await createClient.getByLabel("Country", { exact: true }).fill("India");
  for (const width of [1440, 390]) { await a.setViewportSize({ width, height: 1000 }); await capture(a, `client-create-${width}`); }
  await submit(a, createClient.getByRole("button", { name: "Create client", exact: true }), /\/admin\/clients\?created=1/);
  const client = await p.clientUser.findUnique({ where: { email: `${key}-client@example.invalid` } }); assert(client); clients.push(client.id);
  ok(client.addressLine1 === "14 Example Road" && client.postalCode === "452001", "real client create action stores optional billing address");
  const foreign = await p.clientUser.create({ data: { email: `${key}-other@example.invalid`, name: "Other synthetic client", passwordHash: "local-fixture" } }); clients.push(foreign.id);
  const clientContext = await session("savo_client", client.id), c = await clientContext.newPage();
  const otherContext = await session("savo_client", foreign.id);
  await visit(a, `/admin/clients/${client.id}`);
  ok(await a.getByLabel("Street address", { exact: true }).inputValue() === "14 Example Road", "edit client form loads saved address");
  await a.getByLabel("Apartment, suite or unit", { exact: true }).fill("Suite 3");
  await submit(a, a.getByRole("button", { name: "Save client", exact: true }), /\/admin\/clients\?saved=1/);
  ok((await p.clientUser.findUnique({ where: { id: client.id } })).addressLine2 === "Suite 3", "real client edit action updates address");

  await visit(a, "/admin/projects/new");
  await a.getByLabel("Client", { exact: true }).selectOption(client.id);
  await a.getByLabel("Project title", { exact: true }).fill("Synthetic website release");
  await a.getByLabel("Project description", { exact: true }).fill("Synthetic review of task-based milestone billing. Not a real engagement.");
  await a.getByLabel("Fixed base budget", { exact: true }).fill("2500.50");
  await a.getByLabel("Estimated delivery date", { exact: true }).fill("2027-02-01");
  const milestone = a.locator("fieldset").filter({ has: a.locator('[id^="ms-title-"]') });
  await milestone.locator('[id^="ms-title-"]').fill("Website implementation");
  await addTasks(milestone, [["Booking form development", "1000"], ["Payment gateway integration", "1000"], ["QA and release", "500.50"]]);
  ok(await milestone.getByRole("button", { name: "Add task", exact: true }).isDisabled(), "fourth task disabled in milestone editor");
  ok(await milestone.locator('[id^="ms-cost-"]').inputValue() === "2500.50", "milestone amount calculates exact task sum");
  await milestone.getByText("Milestone notes (shown on invoices)", { exact: true }).click();
  await milestone.getByLabel("Description for milestone 1", { exact: true }).fill("Completed booking, payments and release testing.");
  for (const width of [1440, 390, 320]) { await a.setViewportSize({ width, height: 1000 }); await capture(a, `project-plan-${width}`); }
  await submit(a, a.getByRole("button", { name: "Create project", exact: true }), /\/admin\/projects\/[^/?]+\?saved=1/);
  const project = await p.clientProject.findFirst({ where: { clientId: client.id }, include: { milestones: true } }); assert(project);
  const ms = project.milestones[0];
  ok(ms.tasks.length === 3 && ms.amount === 250050, "real project action saves task prices in minor units");
  await a.getByRole("link", { name: "Raise invoice for milestone", exact: true }).click();
  await a.locator("#raise-invoice[open]").waitFor();
  const raise = a.locator("#raise-invoice");
  await raise.getByLabel("Task 1", { exact: true }).waitFor();
  ok((await raise.locator('[name="description"]').inputValue()).includes("Completed booking"), "invoice copies milestone work notes");
  ok(await raise.locator('[name="amountMajor"]').inputValue() === "2500.50", "invoice copies milestone tasks and calculated total");
  ok(await raise.getByRole("button", { name: "Add task", exact: true }).isDisabled(), "invoice editor also caps tasks at three");
  for (const width of [1440, 390, 320]) { await a.setViewportSize({ width, height: 1000 }); await capture(a, `raise-invoice-${width}`); }
  await submit(a, raise.getByRole("button", { name: "Create invoice", exact: true }), /\/admin\/invoices\?saved=created/);
  let invoice = await p.invoice.findFirst({ where: { clientId: client.id, milestoneId: ms.id } }); assert(invoice);
  ok(invoice.amount === 250050 && invoice.items.length === 3 && invoice.description.includes("Completed booking"), "real invoice create action stores an independent work snapshot");
  const pdfResponse = await clientContext.request.get(`${base}/portal/invoices/${invoice.id}/pdf`);
  ok(pdfResponse.status() === 200, "owning client can download itemised invoice PDF");
  const bytes = await pdfResponse.body(); await writeFile(`${dir}/issued.pdf`, bytes);
  ok((await PDFDocument.load(bytes)).getPageCount() === 1, "real PDF with customer address and three tasks has exactly one page");
  ok((await otherContext.request.get(`${base}/portal/invoices/${invoice.id}/pdf`)).status() === 404, "foreign client cannot download invoice/address");
  await visit(c, `/portal/projects/${project.id}`);
  ok((await c.locator("main").innerText()).includes("Payment gateway integration"), "client project view shows task breakdown");
  await visit(c, `/portal/invoices/${invoice.id}/pay`);
  ok((await c.locator("main").innerText()).includes("Booking form development"), "client checkout shows billed work and prices");
  await c.setViewportSize({ width: 390, height: 1000 });
  await capture(c, "checkout-390");

  // Reprice the project through the real editor; the issued invoice stays fixed.
  await visit(a, `/admin/projects/${project.id}/edit`);
  await a.getByLabel("Task 1", { exact: true }).fill("Updated project task name");
  await a.getByLabel("Description for milestone 1", { exact: true }).fill("New plan notes, not the issued invoice notes.");
  await submit(a, a.getByRole("button", { name: "Save project and plan", exact: true }), /\?saved=1/);
  invoice = await p.invoice.findUnique({ where: { id: invoice.id } });
  ok(invoice.items[0].description === "Booking form development" && invoice.description.includes("Completed booking"), "project edits do not rewrite issued invoice tasks or notes");
  await visit(a, `/admin/invoices/${invoice.id}`);
  ok(await a.getByLabel("Task 1", { exact: true }).inputValue() === "Booking form development", "invoice editor opens issued snapshot, not changed milestone");
  await a.getByLabel("Price · INR", { exact: true }).nth(2).fill("400.50");
  ok(await a.locator('[name="amountMajor"]').inputValue() === "2400.50", "explicit invoice correction recalculates total");
  await submit(a, a.getByRole("button", { name: "Save invoice", exact: true }), /\?saved=1/);
  invoice = await p.invoice.findUnique({ where: { id: invoice.id } });
  ok(invoice.amount === 240050 && invoice.items[2].amount === 40050, "explicit invoice corrections save consistent tasks and total");
  const current = await clientContext.request.get(`${base}/portal/invoices/${invoice.id}/pdf`);
  ok(current.status() === 200 && (await PDFDocument.load(await current.body())).getPageCount() === 1, "corrected invoice remains downloadable and single-page");
  // Standalone invoice creation must seed fresh work, not an older invoice snapshot.
  await visit(a, `/admin/invoices?client=${client.id}`);
  await a.locator('select[name="projectId"]').selectOption(project.id);
  await a.locator('select[name="milestoneId"]').selectOption(ms.id);
  ok(await a.getByLabel("Task 1", { exact: true }).inputValue() === "Updated project task name", "standalone new invoice seeds current milestone tasks");
  ok(await a.locator('[name="amountMajor"]').inputValue() === "2500.50", "standalone invoice recomputes the milestone task total");
  for (const width of [1440, 390]) { await a.setViewportSize({ width, height: 1000 }); await capture(a, `standalone-invoice-${width}`); }
  await visit(a, `/admin/projects/${project.id}`);
  const additional = a.locator('section[aria-labelledby="additional-scope"]');
  await additional.getByLabel("Work title", { exact: true }).fill("Additional accessibility review");
  await additional.getByLabel("Scope description", { exact: true }).fill("Synthetic additional scope, not a real engagement.");
  await addTasks(additional, [["Accessibility audit", "100"], ["Remediation", "200"]]);
  ok(await additional.locator('[name="amountMajor"]').inputValue() === "300.00", "additional-work task prices calculate the added cost");
  await submit(a, additional.getByRole("button", { name: "Add additional work", exact: true }), /\?saved=additional/);
  const extra = await p.projectMilestone.findFirst({ where: { projectId: project.id, scope: "additional" } });
  ok(extra?.amount === 30000 && extra.tasks.length === 2, "real additional-work action saves optional tasks and exact prices");
  const beforeClear = await p.clientUser.findUnique({ where: { id: client.id } });
  await visit(a, `/admin/clients/${client.id}`);
  for (const name of ["addressLine1", "addressLine2", "city", "region", "postalCode", "country"]) await a.locator(`[name="${name}"]`).fill("");
  await submit(a, a.getByRole("button", { name: "Save client", exact: true }), /\/admin\/clients\?saved=1/);
  const noAddress = await clientContext.request.get(`${base}/portal/invoices/${invoice.id}/pdf`);
  ok(noAddress.status() === 200, "blank optional customer address does not prevent invoice download");
  await writeFile(`${dir}/without-address.pdf`, await noAddress.body());
  await p.clientUser.update({ where: { id: client.id }, data: { addressLine1: beforeClear.addressLine1, addressLine2: beforeClear.addressLine2, city: beforeClear.city, region: beforeClear.region, postalCode: beforeClear.postalCode, country: beforeClear.country } });
  ok(errors.length === 0, `no browser errors: ${errors.join("; ")}`);
  await writeFile(`${dir}/report.json`, JSON.stringify({ synthetic: true, localOnly: true, checks, errors }, null, 2));
  console.log(`PASS: ${checks.length} invoice-task/address assertions; synthetic fixtures only.`);
} finally {
  await browser.close();
  const created = await p.clientUser.findMany({ where: { email: { startsWith: key } }, select: { id: true } });
  const ids = [...new Set([...clients, ...created.map(c => c.id)])];
  await p.invoice.deleteMany({ where: { clientId: { in: ids } } });
  await p.clientUser.deleteMany({ where: { id: { in: ids } } });
  if (operator) { await p.auditLog.deleteMany({ where: { userId: operator.id } }); await p.adminUser.delete({ where: { id: operator.id } }); }
  await p.$disconnect();
}
