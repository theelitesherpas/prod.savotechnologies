/** LOCAL ONLY. Run against a local server with MAIL_DELIVERY_MODE=off.
 * MAIL_DELIVERY_MODE=off BASE_URL=http://localhost:4340 node --env-file=.env --env-file=.env.local scripts/verify-admin-portals.mjs
 * Synthetic sessions bypass login only; all forms use real page/action authorization.
 */
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright-core";
const base = process.env.BASE_URL ?? "http://localhost:4340";
const local = new Set(["localhost", "127.0.0.1", "[::1]"]);
assert(local.has(new URL(base).hostname) && local.has(new URL(process.env.DATABASE_URL).hostname), "Local application and database required");
assert(process.env.MAIL_DELIVERY_MODE === "off", "Disable mail in BOTH the script and server");
const db = new PrismaClient();
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const key = `QA-PORTALS-${randomBytes(4).toString("hex")}`;
const checks = [], errors = [], operators = [];
const output = ".impeccable/review/admin-portals";
await mkdir(output, { recursive: true });
let employee, client, candidate, sales;
const check = (value, label) => { assert(value, label); checks.push(label); };
async function context(user) {
  const token = randomBytes(32).toString("hex");
  await db.adminSession.create({ data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600000) } });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await ctx.addCookies([{ name: "savo_admin", value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
  await ctx.addInitScript(() => {
    if (window.top === window) {
      try { localStorage.setItem("savo_livechat_banner_dismissed", "1"); } catch { /* Opaque-origin documents cannot use storage. */ }
    }
  });
  ctx.on("page", p => p.on("pageerror", e => errors.push(e.message)));
  return ctx;
}
async function visit(page, path) {
  const response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => [...document.querySelectorAll("main form")].every(form => Object.keys(form).some(k => k.startsWith("__reactProps"))));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return response;
}
async function capture(page, name) {
  await page.evaluate(() => document.fonts.ready);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: no viewport overflow`);
  if (process.env.REUSE_CAPTURES !== "1") await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
}
const registers = [
  ["hr-portal", "requisitions"], ["hr-portal", "offers"], ["hr-portal", "candidate-documents"],
  ["client-portal", "contacts"], ["client-portal", "proposals"], ["client-portal", "contracts"], ["client-portal", "documents"], ["client-portal", "support"],
  ["employees", "onboarding"], ["employees", "documents"], ["employees", "attendance"], ["employees", "payroll"], ["employees", "reviews"], ["employees", "assets"], ["employees", "expenses"], ["employees", "offboarding"],
];
try {
  for (const [role, permissions] of [["admin", []], ["editor", ["hr-portal"]], ["editor", ["employees"]]]) operators.push(await db.adminUser.create({ data: { name: "Synthetic portal review", email: `${key}-${operators.length}@example.invalid`, role, permissions, passwordHash: "synthetic-session-only" } }));
  employee = await db.employee.create({ data: { employeeCode: key, name: `${key} employee`, email: `${key}-employee@example.invalid`, position: "Synthetic role", department: "Synthetic QA", status: "active", joiningDate: new Date("2026-01-01") } });
  client = await db.clientUser.create({ data: { name: `${key} client`, email: `${key}-client@example.invalid`, passwordHash: "synthetic-session-only" } });
  candidate = await db.projectEnquiry.create({ data: { name: `${key} candidate`, email: `${key}-candidate@example.invalid`, projectType: "General application", source: "careers:synthetic", message: "Synthetic application", data: { form: "careers", role: "Synthetic QA", skills: ["Testing"] } } });
  sales = await db.projectEnquiry.create({ data: { name: `${key} sales`, email: `${key}-sales@example.invalid`, projectType: "Website", source: "contact", message: "Synthetic sales enquiry" } });
  for (const dept of ["hr", "hello"]) await db.emailReply.create({ data: { fromEmail: `${key}@example.invalid`, toEmail: `${dept}@example.invalid`, dept, subject: `${key} ${dept} correspondence`, bodyText: "Synthetic mail; never delivered." } });
  const admin = await context(operators[0]), page = await admin.newPage();
  const hr = await context(operators[1]), hrPage = await hr.newPage();
  const staff = await context(operators[2]), staffPage = await staff.newPage();
  for (const root of ["hr-portal", "client-portal", "employees"]) {
    await visit(page, `/admin/${root}`); check(await page.locator("main h1").count() === 1, `${root}: real portal landing`);
    await capture(page, `${root}-desktop`);
  }
  await visit(page, `/admin/enquiries?type=Client&q=${key}`);
  check((await page.locator("main").innerText()).includes(`${key} sales`) && !(await page.locator("main").innerText()).includes(`${key} candidate`), "sales inbox excludes recruitment");
  await visit(hrPage, `/admin/hr-portal/applications?type=Client&q=${key}`);
  check((await hrPage.locator("main").innerText()).includes(`${key} candidate`) && !(await hrPage.locator("main").innerText()).includes(`${key} sales`), "HR application inbox ignores forged sales category");
  await capture(hrPage, "applications-desktop");
  check((await visit(hrPage, `/admin/hr-portal/applications/${sales.id}`)).status() === 404, "HR candidate detail rejects a sales lead ID");
  await visit(hrPage, `/admin/hr-portal/applications/${candidate.id}`);
  check(await hrPage.getByRole("heading", { name: /Recruitment pipeline/ }).count() === 1, "HR-only operator can open full candidate information");
  await hrPage.getByRole("button", { name: "Edit internal notes", exact: true }).click();
  await hrPage.locator('textarea[name="notes"]').fill("Synthetic candidate note");
  await hrPage.getByRole("button", { name: "Save notes", exact: true }).click();
  await hrPage.waitForURL(/saved=1/);
  check((await db.projectEnquiry.findUnique({ where: { id: candidate.id } })).adminNotes === "Synthetic candidate note", "HR-only candidate notes persist without sales access");
  for (const path of ["/admin/client-portal", "/admin/employees/records/payroll", "/admin/enquiries"]) {
    await visit(hrPage, path); check(hrPage.url().includes("denied="), `HR-only denies ${path}`);
  }
  await visit(staffPage, "/admin/hr-portal/records/offers"); check(staffPage.url().includes("denied="), "employee-only cannot open candidate offers");

  for (const [root, module] of registers) {
    const path = `/admin/${root}/records/${module}`;
    await visit(page, `${path}?new=1`);
    const form = page.locator("form").filter({ has: page.locator('input[name="title"]') });
    await form.locator('[name="title"]').fill(`${key} ${root} ${module}`);
    await form.locator('[name="subjectId"]').selectOption(root === "hr-portal" ? candidate.id : root === "employees" ? employee.id : client.id);
    await form.locator('[name="owner"]').fill("Synthetic reviewer");
    await form.locator('[name="startDate"]').fill("2026-01-01"); await form.locator('[name="dueDate"]').fill("2027-12-31");
    for (const input of await form.locator('[name^="data."]').all()) {
      const tag = await input.evaluate(el => el.tagName);
      const type = await input.getAttribute("type");
      if (tag === "SELECT") { const option = await input.locator("option").nth(1).getAttribute("value"); await input.selectOption(option); }
      else await input.fill(type === "date" ? "2027-01-20" : type === "number" ? "12.50" : type === "url" ? "https://documents.example.invalid/private" : type === "email" ? "synthetic@example.invalid" : "Synthetic review record");
    }
    if (module === "contracts") await capture(page, "contract-form-desktop");
    await form.getByRole("button", { name: "Create record", exact: true }).click();
    await page.waitForURL(/saved=1/);
    const portal = root === "hr-portal" ? "hr" : root === "employees" ? "employee" : "client";
    const stored = await db.adminOperationalRecord.findFirst({ where: { portal, module, createdBy: operators[0].id } });
    check(stored?.title === `${key} ${root} ${module}`, `${portal}/${module}: real form saved in correct register`);
  }
  const contact = await db.adminOperationalRecord.findFirst({ where: { portal: "client", module: "contacts", createdBy: operators[0].id } });
  const path = "/admin/client-portal/records/contacts";
  await visit(page, `${path}?edit=${contact.id}`);
  await page.locator('[name="owner"]').fill("Updated reviewer"); await page.getByRole("button", { name: "Save changes", exact: true }).click(); await page.waitForURL(/saved=1/);
  check((await db.adminOperationalRecord.findUnique({ where: { id: contact.id } })).version === 2, "edit increments version and persists");
  await visit(page, `/admin/employees/records/expenses?edit=${contact.id}`); check((await page.locator("body").innerText()).includes("404"), "foreign register cannot load another module record");
  await visit(page, `${path}?edit=${contact.id}`);
  await page.locator('[name="confirm"]').fill("DELETE"); await page.getByRole("button", { name: "Delete record", exact: true }).click(); await page.getByRole("button", { name: "Confirm deletion", exact: true }).click(); await page.waitForURL(/deleted=1/);
  check(await db.adminOperationalRecord.count({ where: { id: contact.id } }) === 0, "confirmed deletion removes only the operational record");
  for (const dept of ["hr", "hello"]) {
    await visit(page, `/admin/emails?dept=${dept}`); const body = await page.locator("main").innerText();
    check(body.includes(`${key} ${dept} correspondence`) && !body.includes(`${key} ${dept === "hr" ? "hello" : "hr"} correspondence`), `${dept} mailbox is department-filtered on server`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [name, url] of [["hr-portal", "/admin/hr-portal"], ["client-portal", "/admin/client-portal"], ["employees", "/admin/employees"], ["contract-form", "/admin/client-portal/records/contracts?new=1"]]) {
    await visit(page, url); await capture(page, `${name}-mobile`);
  }
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Admin navigation" });
  await drawer.getByRole("button", { name: "HR Portal", exact: true }).click();
  check(await drawer.getByRole("link", { name: "Applications & candidates", exact: true }).isVisible(), "mobile drawer expands HR portal");
  await capture(page, "navigation-mobile");
  await page.keyboard.press("Escape"); await drawer.waitFor({ state: "detached" }); check(await drawer.count() === 0, "Escape closes navigation");
  await page.setViewportSize({ width: 320, height: 740 });
  await visit(page, "/admin/client-portal/records/contracts?new=1"); await capture(page, "contract-form-320");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit(page, "/admin/client-portal");
  await page.getByRole("button", { name: "Toggle sidebar", exact: true }).click();
  await page.getByRole("button", { name: "HR Portal - expand menu", exact: true }).click();
  check(await page.locator('aside').getByRole("link", { name: "Applications & candidates", exact: true }).isVisible(), "icon rail expands and opens the requested portal");
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByLabel("Search query", { exact: true }).fill("payroll");
  await page.getByRole("dialog", { name: "Search the console" }).getByRole("link", { name: /Compensation & payroll/ }).waitFor();
  check(true, "global search discovers new register menus");
  await page.keyboard.press("Escape");
  check(errors.length === 0, `no browser page errors: ${errors.join("; ")}`);
} finally {
  const ids = operators.map(o => o.id);
  await db.adminOperationalRecord.deleteMany({ where: { createdBy: { in: ids } } });
  await db.auditLog.deleteMany({ where: { userId: { in: ids } } });
  await db.emailReply.deleteMany({ where: { fromEmail: `${key}@example.invalid` } });
  if (candidate || sales) await db.projectEnquiry.deleteMany({ where: { id: { in: [candidate?.id, sales?.id].filter(Boolean) } } });
  if (employee) await db.employee.delete({ where: { id: employee.id } });
  if (client) await db.clientUser.delete({ where: { id: client.id } });
  await db.adminUser.deleteMany({ where: { id: { in: ids } } });
  await writeFile(`${output}/report.json`, JSON.stringify({ checks, errors, fixturesCleaned: true }, null, 2));
  await browser.close(); await db.$disconnect();
}
console.log(`Admin portal verification: ${checks.length} checks passed; fixtures cleaned.`);
