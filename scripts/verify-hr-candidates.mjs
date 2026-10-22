/** LOCAL ONLY. Start the application with MAIL_DELIVERY_MODE=off as well.
 * MAIL_DELIVERY_MODE=off node --env-file=.env --env-file=.env.local scripts/verify-hr-candidates.mjs
 * Real admin queries/actions use disposable records; public submissions/CAPTCHA status are mocked.
 */
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright-core";
const base = process.env.BASE_URL ?? "http://localhost:4340";
const local = new Set(["localhost", "127.0.0.1", "[::1]"]);
assert(local.has(new URL(base).hostname) && local.has(new URL(process.env.DATABASE_URL).hostname), "Local application and database required");
assert(process.env.MAIL_DELIVERY_MODE === "off", "Disable mail in both the script and server");
const db = new PrismaClient(), browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const key = `QA-HR-${randomBytes(4).toString("hex")}`, operators = [], candidates = [], checks = [], errors = [], submitted = [];
const out = ".impeccable/review/hr-candidates";
let visitor;
const clientIds = [];
await mkdir(out, { recursive: true });
const check = (condition, name) => { assert(condition, name); checks.push(name); };
async function session(user) {
  const token = randomBytes(32).toString("hex"); await db.adminSession.create({ data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600000) } });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await context.addCookies([{ name: "savo_admin", value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
  await context.addInitScript(() => { if (window.top === window) try { localStorage.setItem("savo_livechat_banner_dismissed", "1"); } catch { /* opaque origins */ } });
  context.on("page", page => page.on("pageerror", error => errors.push(error.message)));
  return context;
}
async function visit(page, path) {
  const response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => [...document.querySelectorAll("main form")].every(form => Object.keys(form).some(key => key.startsWith("__reactProps"))));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return response;
}
async function shot(page, name, viewportOnly = false) {
  if (!viewportOnly) await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflow: [...document.querySelectorAll("main *, header *")].filter(el => el.getClientRects().length && el.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map(el => ({ tag: el.tagName, className: el.className, right: el.getBoundingClientRect().right })) }));
  if (process.env.REUSE_CAPTURES !== "1" || !existsSync(`${out}/${name}.png`)) await page.screenshot({ path: `${out}/${name}.png`, fullPage: !viewportOnly, style: '[inert], [inert] * { visibility: hidden !important; }' });
  check(layout.scrollWidth <= layout.width + 1, `${name}: no horizontal viewport overflow ${JSON.stringify(layout)}`);
}
async function city(page, name, term) {
  const input = page.locator(`#cr-${name}`); await input.fill(term);
  const list = page.getByRole("listbox", { name: `${name === "city" ? "Current city" : "Hometown"} suggestions` });
  await list.getByRole("option").first().waitFor();
  await input.press("ArrowDown"); await input.press("Enter");
  check((await input.inputValue()).includes(term), `${name}: keyboard city selection`);
}
try {
  for (const [role, permissions] of [["admin", []], ["editor", ["hr-portal"]]]) operators.push(await db.adminUser.create({ data: { name: "Synthetic HR reviewer", email: `${key}-${operators.length}@example.invalid`, role, permissions, passwordHash: "session-only-local-fixture" } }));
  for (let i = 0; i < 32; i++) {
    const stage = [null, "shortlisted", "interview_scheduled", "hired", "rejected"][i % 5];
    candidates.push(await db.projectEnquiry.create({ data: { name: `${key} candidate ${String(i).padStart(2, "0")}`, email: `${key}-${i}@example.invalid`, phone: "+919876543210", projectType: "General application", source: "careers:synthetic-review", message: "Synthetic review application, not a genuine candidate.", careerStatus: stage, status: i === 31 ? "archived" : ["hired", "rejected"].includes(stage) ? "closed" : "new", createdAt: new Date(Date.UTC(2026, 9, 20, 0, i)), interviewDate: stage === "interview_scheduled" ? new Date(Date.UTC(2026, 10, 5, 5, i)) : null, interviewer: stage === "interview_scheduled" ? "Synthetic interviewer" : null, meetingLink: stage === "interview_scheduled" ? "https://example.invalid/synthetic-meeting" : null, data: { form: "careers", role: i % 2 === 0 ? "Backend Engineer" : "UI/UX Designer", city: i % 2 === 0 ? "Indore" : "Pune", ...(i % 3 === 0 ? { hometown: "Jaipur" } : {}), experience: i % 4 === 0 ? "Fresher" : "3 to 5 years", notice: "30 days", skills: ["TypeScript", "Node.js"], resume: "https://example.invalid/synthetic-resume", currentCtc: "Prefer not to disclose", expectedCtc: "Open to discussion" } } }));
  }
  candidates.push(await db.projectEnquiry.create({ data: { name: `${key} SALES SENTINEL`, projectType: "Website", source: "contact", message: "Synthetic sales lead must never appear in recruitment", data: { form: "careers", city: "Indore" } } }));
  await db.emailReply.createMany({ data: Array.from({ length: 205 }, (_, i) => ({ fromEmail: `${key}@example.invalid`, toEmail: "hr@example.invalid", dept: "hr", subject: `${key} message ${String(i).padStart(3, "0")}`, bodyText: "Synthetic mail; never delivered", createdAt: new Date(Date.UTC(2026, 9, 20, 0, i)) })) });
  for (let i = 0; i < 30; i++) await db.meeting.create({ data: { reference: `${key}-${i}`, tokenHash: createHash("sha256").update(`${key}-meeting-${i}`).digest("hex"), clientName: `${key} synthetic client`, title: `${key} synthetic meeting ${i}`, status: "draft", confirmedDate: "2026-11-05", createdBy: operators[0].id } });
  visitor = await db.chatVisitor.create({ data: { tokenHash: createHash("sha256").update(`${key}-visitor`).digest("hex") } });
  await db.chatConversation.createMany({ data: Array.from({ length: 30 }, (_, i) => ({ publicToken: randomBytes(24).toString("hex"), visitorId: visitor.id, status: "closed", leadName: `${key} synthetic conversation ${i}` })) });
  const context = await session(operators[0]), hrContext = await session(operators[1]);
  const page = await context.newPage(), hr = await hrContext.newPage();
  await visit(page, `/admin/hr-portal/applications?q=${key}&stage=all&pageSize=10`);
  check((await page.locator("main").innerText()).includes("31 matching applications"), "candidate totals use full filtered dataset, excluding archived");
  check(!(await page.locator("main").innerText()).includes("SALES SENTINEL"), "career ownership excludes forged sales form marker");
  check(await page.getByRole("navigation", { name: "candidates pagination" }).getByRole("link", { name: "Page 4", exact: true }).count() === 1, "numbered page choices are visible");
  await shot(page, "applications-desktop");
  await page.getByRole("link", { name: "Last page", exact: true }).click(); await page.waitForURL(/page=4/);
  check((await page.locator("main").innerText()).includes("31–31 of 31 candidates"), "last-page arrow reaches remaining candidate without gaps");
  await page.getByRole("link", { name: "First page", exact: true }).click(); await page.waitForURL(url => !url.searchParams.has("page"));
  await page.locator('input[name="city"]').fill("indore"); await page.locator('input[name="hometown"]').fill("jaipur"); await page.locator('input[name="role"]').fill("Backend"); await page.locator('select[name="experience"]').selectOption("3-5"); await page.locator('select[name="stage"]').selectOption("shortlisted");
  await page.getByRole("button", { name: "Apply filters", exact: true }).click(); await page.waitForURL(/hometown=jaipur/);
  check((await page.locator("main").innerText()).includes("1 matching application"), "experience + current city + hometown + role + stage combine on server");
  const profileHref = await page.locator('main a[href*="/applications/"]').first().getAttribute("href");
  check(profileHref.includes(candidates[6].id), "combined filters return the correct candidate");
  await shot(page, "filtered-desktop"); await visit(hr, profileHref);
  check(await hr.getByRole("heading", { name: "Candidate at a glance", exact: true }).count() === 1, "HR-only reviewer has a clear candidate summary");
  await hr.getByRole("button", { name: "Edit HR profile", exact: true }).click();
  const editor = hr.locator("#hr-profile form"); await editor.locator('[name="hometown"]').fill("Udaipur"); await editor.locator('[name="years"]').fill("2"); await editor.locator('[name="months"]').fill("8");
  await editor.getByRole("button", { name: "Save HR profile", exact: true }).click(); await hr.waitForURL(/saved=profile/);
  const changed = await db.projectEnquiry.findUnique({ where: { id: candidates[6].id } });
  check(changed.data.hometown === "Jaipur" && changed.data.hrProfile.hometown === "Udaipur" && changed.data.hrProfile.totalExperienceMonths === 32, "HR profile updates preserve submitted data and exact total");
  check(new URL(hr.url()).searchParams.get("returnTo").includes("hometown=jaipur"), "profile save retains filtered-list return state");
  await shot(hr, "candidate-desktop");
  await visit(page, `/admin/hr-portal/applications?q=${key}&city=Indore&hometown=Udaipur&role=Backend&experience=1-3&stage=shortlisted`);
  check((await page.locator("main").innerText()).includes("1 matching application") && (await page.locator("main").innerText()).includes("2 years 8 months"), "reviewed experience and hometown are immediately filterable");
  await visit(page, `/admin/hr-portal/applications?q=${key}&hometown=Not%20provided&stage=all`);
  check(!(await page.locator("main").innerText()).includes("candidate 00"), "missing-hometown filter does not substitute current city");
  await visit(page, `/admin/hr-portal?tab=scheduled&q=${key}`);
  check(await page.locator('select[name="stage"]').inputValue() === "interview_scheduled", "interview menu retains expected status selection");
  check((await page.locator("main").innerText()).includes("Synthetic interviewer"), "interview list exposes scheduling context");
  await shot(page, "interviews-desktop");
  await visit(page, `/admin/hr-portal/applications?q=${key}&stage=all&pageSize=10`);
  await page.setViewportSize({ width: 390, height: 844 }); await shot(page, "applications-mobile");
  await visit(hr, profileHref); await hr.setViewportSize({ width: 390, height: 844 }); await shot(hr, "candidate-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit(page, `/admin/emails?dept=hr&q=${key}&pageSize=25`);
  check((await page.locator("main").innerText()).includes("1–25 of 205 messages"), "mail count and page controls include records beyond the old 200 limit");
  await page.getByRole("link", { name: "Last page", exact: true }).click(); await page.waitForURL(/page=9/);
  check((await page.locator("main").innerText()).includes(`${key} message 000`), "mail last page reaches the oldest matching message");
  await shot(page, "mail-pagination-desktop");
  const meeting = await (await context.request.get(`${base}/api/admin/meetings?q=${key}&page=3&pageSize=10`)).json();
  check(meeting.paging.total === 30 && meeting.meetings.length === 10 && meeting.paging.page === 3, "meeting API filters and paginates before serialization");
  const calendar = await (await context.request.get(`${base}/api/admin/meetings?q=${key}&calendar=1&month=2026-11`)).json();
  check(calendar.meetings.length === 30, "calendar month remains complete rather than showing only one list page");
  const chat = await (await context.request.get(`${base}/api/admin/live-chat/bootstrap?view=closed&q=${key}&page=3&pageSize=10`)).json();
  check(chat.paging.total === 30 && chat.conversations.length === 10 && chat.paging.page === 3, "live-chat inbox exposes conversations beyond the first page");
  for (let i = 0; i < 31; i++) clientIds.push((await db.clientUser.create({ data: { name: `${key} pagination client ${i}`, email: `${key}-client-${i}@example.invalid`, passwordHash: "local-fixture-no-password", active: false } })).id);
  const clientTotal = await db.clientUser.count();
  const clientList = await context.request.get(`${base}/admin/clients?page=2&pageSize=10`);
  check(clientList.status() === 200 && (await clientList.text()).includes(`11–20 of ${clientTotal}`), "client directory paginates the full database with accurate totals");
  await db.invoice.createMany({ data: Array.from({ length: 31 }, (_, i) => ({ clientId: clientIds[0], number: `${key}-invoice-${i}`, amount: 1000, currency: "INR", status: "draft" })) });
  const invoiceList = await context.request.get(`${base}/admin/invoices?client=${clientIds[0]}&page=2&pageSize=25`);
  check(invoiceList.status() === 200 && (await invoiceList.text()).includes("26–31 of 31"), "invoice pagination preserves the selected client filter");
  for (let i = 0; i < 30; i++) operators.push(await db.adminUser.create({ data: { name: `${key} pagination operator ${i}`, email: `${key}-operator-${i}@example.invalid`, role: "editor", permissions: [], passwordHash: "local-fixture-no-password" } }));
  await visit(page, "/admin/users");
  const userPager = page.getByRole("navigation", { name: "panel users pagination" });
  await userPager.getByRole("button", { name: "Page 2", exact: true }).click();
  check(await userPager.getByRole("button", { name: "Page 2", exact: true }).getAttribute("aria-current") === "page", "complete client-side lists support direct numbered page switching");
  await shot(page, "users-pagination-desktop");
  await visit(page, "/admin/audit?pageSize=10");
  const navigation = page.locator('aside nav[aria-label="Admin sections"]');
  const items = await navigation.locator(':scope > ul > li').evaluateAll(elements => elements.map(el => el.textContent));
  check(items[0].includes("Dashboard") && items[1].includes("Website analytics"), "Website analytics sits immediately after Dashboard");
  await shot(page, "pagination-desktop");

  // Public application controls are tested without creating real submissions or solving third-party CAPTCHA.
  const publicContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  publicContext.on("page", page => page.on("pageerror", error => errors.push(error.message)));
  await publicContext.route("**/api/captcha/required*", route => route.fulfill({ json: { required: false, configured: false } }));
  await publicContext.route("**/api/enquiries", async route => { submitted.push(route.request().postDataJSON()); await route.fulfill({ json: { ok: true } }); });
  const application = await publicContext.newPage(); await visit(application, "/careers/apply?role=general-application");
  check(await application.locator("#cr-phone").getAttribute("aria-required") === "true", "application mobile field is visibly and semantically mandatory");
  check((await application.locator("main").innerText()).includes("Anyone with the link can view"), "resume instructions explicitly require a public viewing link");
  await application.getByRole("button", { name: "Submit application", exact: true }).click();
  await application.getByText("Enter your mobile number.", { exact: true }).waitFor();
  check(submitted.length === 0, "empty mobile number prevents submission");
  await application.locator("#cr-name").fill("Synthetic Test Applicant"); await application.locator("#cr-email").fill("synthetic@example.invalid");
  await application.getByRole("button", { name: "Select country code", exact: true }).click(); await application.getByRole("searchbox", { name: "Search countries" }).fill("India"); await application.getByRole("listbox", { name: "Country", exact: true }).getByRole("button", { name: /India/ }).click(); await application.locator("#cr-phone").fill("9876543210");
  await city(application, "city", "Indore"); await city(application, "hometown", "Jaipur");
  await application.locator("#cr-experience").selectOption("3 to 5 years"); await application.locator("#cr-notice").selectOption("30 days");
  await application.getByRole("button", { name: "React", exact: true }).click();
  await application.locator("#cr-currentCtc").selectOption("Prefer not to disclose"); await application.locator("#cr-company").fill("Synthetic employer"); await application.locator("#cr-currentDesignation").fill("Synthetic engineer"); await application.locator("#cr-workPreference").selectOption("Hybrid"); await application.locator("#cr-linkedin").fill("https://www.linkedin.com/in/synthetic"); await application.locator("#cr-resume").fill("https://drive.google.com/file/d/synthetic/view"); await application.locator("#cr-consent").check();
  await shot(application, "application-form-desktop");
  await application.locator("#cr-city").focus(); await application.locator("#cr-city").fill("Bengaluru"); await application.getByRole("listbox", { name: "Current city suggestions" }).getByRole("option").first().waitFor(); check((await application.getByRole("listbox", { name: "Current city suggestions" }).innerText()).includes("Karnataka"), "city directory supports common renamed-city search");
  await application.locator("#cr-city").press("Escape"); await city(application, "city", "Indore");
  await application.setViewportSize({ width: 390, height: 844 }); await application.locator("#cr-hometown").fill("Jaipur"); await application.getByRole("listbox", { name: "Hometown suggestions" }).getByRole("option").first().waitFor();
  await shot(application, "city-picker-mobile", true); await application.locator("#cr-hometown").press("ArrowDown"); await application.locator("#cr-hometown").press("Enter");
  await shot(application, "application-form-mobile");
  await application.getByRole("button", { name: "Submit application", exact: true }).click(); await application.getByRole("dialog", { name: "Application received.", exact: true }).waitFor();
  check(submitted.length === 1 && submitted[0].phone === "+919876543210" && submitted[0].details.hometown.includes("Jaipur") && submitted[0].details.currentCtc === "Prefer not to disclose", "public submission includes mandatory mobile and new employment/location fields");
  await application.setViewportSize({ width: 320, height: 740 }); await visit(application, "/careers/apply?role=general-application"); await shot(application, "application-form-320");
  check(errors.length === 0, `no browser page errors: ${errors.join("; ")}`);
} finally {
  const ids = operators.map(user => user.id);
  await db.auditLog.deleteMany({ where: { userId: { in: ids } } });
  await db.emailReply.deleteMany({ where: { fromEmail: `${key}@example.invalid` } });
  await db.projectEnquiry.deleteMany({ where: { id: { in: candidates.map(candidate => candidate.id) } } });
  await db.meeting.deleteMany({ where: { reference: { startsWith: key } } });
  await db.invoice.deleteMany({ where: { number: { startsWith: `${key}-invoice-` } } });
  await db.clientUser.deleteMany({ where: { id: { in: clientIds } } });
  if (visitor) await db.chatVisitor.delete({ where: { id: visitor.id } });
  await db.agentPresence.deleteMany({ where: { userId: { in: ids } } });
  await db.adminUser.deleteMany({ where: { id: { in: ids } } });
  await writeFile(`${out}/report.json`, JSON.stringify({ checks, errors, mockedPublicSubmissions: submitted.length, fixturesCleaned: true }, null, 2));
  await browser.close(); await db.$disconnect();
}
console.log(`HR and application verification: ${checks.length} checks passed; fixtures cleaned.`);
