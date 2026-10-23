/** LOCAL ONLY: run the server AND this script with MAIL_DELIVERY_MODE=off. All records are disposable. */
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright-core";
const base = process.env.BASE_URL ?? "http://localhost:4340", local = new Set(["localhost", "127.0.0.1", "[::1]"]);
assert(local.has(new URL(base).hostname) && local.has(new URL(process.env.DATABASE_URL).hostname) && process.env.MAIL_DELIVERY_MODE === "off", "Local application/database and disabled mail required");
const db = new PrismaClient(), browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const key = `QA-WF-${randomBytes(4).toString("hex")}`, out = ".impeccable/review/application-detail", users = [], candidates = [], checks = [], errors = [];
await mkdir(out, { recursive: true });
const check = (condition, label) => { assert(condition, label); checks.push(label); };
const source = { form: "careers", role: "Backend Engineer", city: "Indore", hometown: "Jaipur", experience: "3 to 5 years", currentCtc: "Prefer not to disclose", expectedCtc: "Open to discussion", notice: "30 days", skills: ["TypeScript", "Node.js"], resume: "https://example.invalid/synthetic-resume", hrProfile: { city: "Indore", totalExperienceMonths: 32 } };
const inputDate = days => new Date(Date.now() + days * 86400000 + 330 * 60000).toISOString().slice(0, 10);
async function context(user) {
  const token = randomBytes(32).toString("hex"); await db.adminSession.create({ data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600000) } });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await ctx.addCookies([{ name: "savo_admin", value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
  await ctx.addInitScript(() => { if (window.top === window) try { localStorage.setItem("savo_livechat_banner_dismissed", "1"); } catch { /* Opaque frame origins cannot use storage. */ } });
  ctx.on("page", page => page.on("pageerror", error => errors.push(error.message))); return ctx;
}
async function visit(page, path) {
  const response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  if (response.status() === 200) await page.waitForFunction(() => [...document.querySelectorAll("main form")].every(form => Object.keys(form).some(key => key.startsWith("__reactProps"))));
  if (await page.locator("[data-candidate-read]").count()) await page.locator('[data-candidate-read="ready"]').waitFor();
  return response;
}
async function shot(page, name, viewportOnly = false) {
  if (!viewportOnly) await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
  const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  check(size.scroll <= size.width + 1, `${name}: no horizontal document overflow`);
  if (process.env.REUSE_CAPTURES !== "1" || !existsSync(`${out}/${name}.png`)) await page.screenshot({ path: `${out}/${name}.png`, fullPage: !viewportOnly });
}
async function submit(dialog, label) {
  await dialog.getByRole("button", { name: label, exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
}
async function outcome(page, value, note = "Synthetic contact update") {
  await page.getByRole("button", { name: "Update contact outcome", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Update contact outcome", exact: true });
  await dialog.locator('[name="outcome"]').selectOption(value); await dialog.locator('[name="channel"]').selectOption("phone"); await dialog.locator('[name="note"]').fill(note);
  if (value === "callback_requested") await dialog.locator('[name="callbackAt"]').fill(`${inputDate(2)}T10:30`);
  await submit(dialog, "Save contact outcome");
}
try {
  users.push(await db.adminUser.create({ data: { name: "Synthetic HR reviewer", email: `${key}-hr@example.invalid`, passwordHash: "local-session-fixture", role: "editor", permissions: ["hr-portal"] } }));
  users.push(await db.adminUser.create({ data: { name: "Synthetic administrator", email: `${key}-admin@example.invalid`, passwordHash: "local-session-fixture", role: "admin", permissions: [] } }));
  for (const suffix of ["candidate", "delete-fixture"]) candidates.push(await db.projectEnquiry.create({ data: { name: `${key} ${suffix}`, email: `${key}@example.invalid`, phone: "+919876543210", projectType: "General application", message: "Synthetic application for local workflow verification, not a real applicant.", source: "careers:synthetic-workflow", data: source } }));
  candidates.push(await db.projectEnquiry.create({ data: { name: `${key} sales sentinel`, projectType: "Website", message: "Not a candidate", source: "contact" } }));
  const ctx = await context(users[0]), adminCtx = await context(users[1]), page = await ctx.newPage();
  const path = `/admin/hr-portal/applications/${candidates[0].id}?returnTo=${encodeURIComponent(`/admin/hr-portal/applications?q=${key}&pageSize=10`)}`;
  const current = () => db.projectEnquiry.findUnique({ where: { id: candidates[0].id } });
  const panel = page.locator('section[aria-labelledby="candidate-actions"]');
  await visit(page, path);
  const positions = await page.evaluate(() => { const summary = document.querySelector('[aria-labelledby="candidate-summary"]').getBoundingClientRect(), actions = document.querySelector('[aria-labelledby="candidate-actions"]').getBoundingClientRect(); return { summaryRight: summary.right, summaryTop: summary.top, actionsLeft: actions.left, actionsTop: actions.top }; });
  check(positions.actionsLeft > positions.summaryRight && Math.abs(positions.actionsTop - positions.summaryTop) < 2, "all management controls begin at the top-right alongside candidate facts");
  check(await panel.getByRole("button", { name: "Schedule interview", exact: true }).isDisabled() && await panel.getByRole("button", { name: "Mark hired", exact: true }).isDisabled(), "unavailable recruitment steps stay visible with stage guidance");
  check(await panel.getByRole("button", { name: "Delete application", exact: true }).count() === 0, "HR-only reviewers cannot see administrator deletion controls");
  await shot(page, "desktop-initial", true);
  await panel.getByRole("button", { name: "Update contact outcome", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Update contact outcome", exact: true });
  check(await dialog.locator('[name="outcome"]').evaluate(el => document.activeElement === el), "contact dialog focuses the first editable control");
  for (let i = 0; i < 14; i++) { await page.keyboard.press("Tab"); check(await dialog.evaluate(el => el.contains(document.activeElement)), `native modal contains keyboard focus ${i + 1}`); }
  await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" });
  check(await panel.getByRole("button", { name: "Update contact outcome", exact: true }).evaluate(el => document.activeElement === el), "Escape closes the modal and restores trigger focus");
  await panel.getByRole("button", { name: "Update contact outcome", exact: true }).click(); dialog = page.getByRole("dialog", { name: "Update contact outcome", exact: true });
  await dialog.locator('[name="outcome"]').selectOption("callback_requested"); await dialog.getByRole("button", { name: "Save contact outcome" }).click();
  check(await dialog.getByRole("alert").count() === 1, "callback requires a date and time with an inline validation summary");
  await dialog.locator('[name="callbackAt"]').fill("2000-01-01T10:30"); await dialog.getByRole("button", { name: "Save contact outcome" }).click();
  check((await dialog.innerText()).includes("Choose a future callback"), "past callbacks are rejected before submission");
  await dialog.locator('[name="callbackAt"]').fill(`${inputDate(2)}T10:30`); await dialog.locator('[name="channel"]').selectOption("phone"); await dialog.locator('[name="note"]').fill("Synthetic: candidate requested a call after 10:30 IST.");
  await page.setViewportSize({ width: 390, height: 844 }); await shot(page, "contact-modal-mobile", true);
  await page.setViewportSize({ width: 320, height: 740 }); await shot(page, "contact-modal-320", true);
  check(await dialog.evaluate(el => el.getBoundingClientRect().width <= innerWidth && el.scrollHeight >= el.clientHeight), "callback form remains usable with bounded internal scrolling at 320px");
  await page.setViewportSize({ width: 1440, height: 1000 }); await submit(dialog, "Save contact outcome");
  check((await current()).data.hrContact.callbackAt === new Date(`${inputDate(2)}T10:30:00+05:30`).toISOString(), "callback persists as the correct UTC instant for the displayed IST time");
  for (const value of ["not_contacted", "contacted", "not_responded"]) {
    await outcome(page, value); const record = await current();
    check(record.data.hrContact.outcome === value && record.careerStatus === null && record.status === "in_progress", `${value}: contact change does not change hiring or inbox state`);
  }
  await visit(page, `/admin/hr-portal/applications?q=${key}&contact=not_responded`);
  check((await page.locator("main").innerText()).includes("1 matching application"), "contact-outcome list filtering counts the complete matching queue");
  const link = await page.locator('main a[href*="/applications/"]').first().getAttribute("href"); await visit(page, link);
  await outcome(page, "not_interested");
  check((await page.locator("main").innerText()).includes("Confirm their interest before progressing") && (await current()).careerStatus === null, "Not interested is explicit applicant intent, not a hiring rejection");
  check(new URL(page.url()).searchParams.get("returnTo").includes("contact=not_responded"), "contact saves retain filtered-list return context");
  await outcome(page, "contacted", "Synthetic: candidate confirmed interest after discussion.");
  await page.getByRole("button", { name: "Shortlist candidate", exact: true }).click(); dialog = page.getByRole("dialog", { name: "Shortlist candidate?", exact: true });
  await dialog.locator('[name="notifyCandidate"]').uncheck(); await submit(dialog, "Confirm shortlist");
  check((await current()).careerStatus === "shortlisted", "shortlist uses a confirmed decision, with a no-email option");
  await outcome(page, "callback_requested", "Synthetic: follow up about the interview slot.");
  await page.getByRole("button", { name: "Schedule interview", exact: true }).click(); dialog = page.getByRole("dialog", { name: "Schedule interview", exact: true });
  await dialog.locator('[name="interviewDate"]').fill(inputDate(3)); await dialog.locator('[name="interviewTime"]').selectOption("10:00 AM"); await dialog.locator('[name="meetingLink"]').fill("https://example.invalid/synthetic-interview"); await dialog.locator('[name="interviewer"]').fill("Synthetic interviewer"); await dialog.locator('[name="notifyCandidate"]').uncheck();
  await shot(page, "interview-modal-desktop", true); await submit(dialog, "Save interview");
  check((await current()).careerStatus === "interview_scheduled", "scheduled interview advances the standard pipeline");
  await shot(page, "desktop", true); await page.setViewportSize({ width: 390, height: 844 }); await shot(page, "mobile"); await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Reschedule interview", exact: true }).click(); dialog = page.getByRole("dialog", { name: "Reschedule interview", exact: true });
  await dialog.locator('[name="interviewDate"]').fill(inputDate(4)); await dialog.locator('[name="interviewTime"]').selectOption("11:00 AM"); await dialog.locator('[name="notifyCandidate"]').uncheck(); await submit(dialog, "Save interview");
  check((await current()).interviewDate.toISOString() === new Date(`${inputDate(4)}T11:00:00+05:30`).toISOString(), "rescheduling replaces the existing slot in IST without resetting the pipeline");
  await page.getByRole("button", { name: "Request documents", exact: true }).click(); dialog = page.getByRole("dialog", { name: "Request documents?", exact: true }); await submit(dialog, "Send document request");
  check((await current()).careerStatus === "interview_scheduled", "document request records history without inventing a new hiring stage");
  await page.getByRole("button", { name: "Mark hired", exact: true }).click(); dialog = page.getByRole("dialog", { name: "Mark hired?", exact: true }); await dialog.locator('[name="notifyCandidate"]').uncheck(); await submit(dialog, "Confirm hired");
  check((await current()).careerStatus === "hired" && (await current()).status === "closed", "hiring closes the inbox item without pretending to create an employee");
  await panel.locator("summary").click(); await page.getByRole("button", { name: "Reset pipeline", exact: true }).click(); dialog = page.getByRole("dialog", { name: "Reset pipeline?", exact: true }); await submit(dialog, "Reset recruitment pipeline");
  const reset = await current(); check(reset.careerStatus === null && reset.interviewDate === null && reset.data.hrContact.outcome === "callback_requested", "confirmed reset clears interview fields but retains contact and original data");
  await page.getByRole("button", { name: "Reject candidate", exact: true }).click(); dialog = page.getByRole("dialog", { name: "Reject candidate?", exact: true }); await dialog.locator('[name="notifyCandidate"]').uncheck(); await submit(dialog, "Confirm rejection");
  check((await current()).careerStatus === "rejected" && (await current()).data.hrContact.outcome === "callback_requested", "hiring rejection remains separate from contact outcome");
  async function inbox(status) {
    await panel.locator("summary").click(); await panel.getByRole("button", { name: /manage inbox|Manage inbox/, exact: false }).click();
    const modal = page.getByRole("dialog", { name: "Manage application inbox", exact: true }); await modal.locator('[name="status"]').selectOption(status); await submit(modal, "Save inbox state");
  }
  await inbox("archived"); check(await page.getByRole("button", { name: "Shortlist again", exact: true }).isDisabled(), "archived applications cannot advance until restored");
  await inbox("in_progress"); check((await current()).careerStatus === "rejected" && await page.getByRole("button", { name: "Shortlist again", exact: true }).isEnabled(), "restore retains the actual hiring decision and re-enables valid actions");
  await page.getByRole("button", { name: "Edit internal notes", exact: true }).click(); dialog = page.getByRole("dialog", { name: "Edit internal notes", exact: true }); await dialog.locator('[name="notes"]').fill("Synthetic internal interview assessment."); await submit(dialog, "Save notes");
  check((await current()).adminNotes === "Synthetic internal interview assessment.", "internal notes are editable from the same action area");
  const stale = await ctx.newPage(); await visit(stale, new URL(page.url()).pathname + new URL(page.url()).search);
  await stale.getByRole("button", { name: "Update contact outcome", exact: true }).click(); const staleDialog = stale.getByRole("dialog", { name: "Update contact outcome", exact: true }); await staleDialog.locator('[name="outcome"]').selectOption("not_responded"); await staleDialog.locator('[name="note"]').fill("Stale edit must not be saved");
  await outcome(page, "contacted", "Newer confirmed contact note"); await submit(staleDialog, "Save contact outcome");
  check((await stale.locator("main").innerText()).includes("changed while you were editing") && (await current()).data.hrContact.note === "Newer confirmed contact note", "two-reviewer stale saves cannot replace newer confirmed contact data");
  const record = await current(); assert.deepEqual(Object.fromEntries(Object.entries(record.data).filter(([key]) => key !== "hrContact")), source); check(true, "all original answers and HR-confirmed profile fields survive the complete workflow");
  const trail = await db.auditLog.findMany({ where: { entityId: record.id }, orderBy: { createdAt: "asc" } });
  check(trail.filter(log => log.action === "enquiry.contactUpdated").length === 8, "each successful contact change has a dated, attributed audit entry; stale saves do not");
  check(trail.filter(log => ["enquiry.shortlisted", "enquiry.interviewScheduled", "enquiry.hired", "enquiry.rejected"].includes(log.action)).every(log => log.meta.emailRequested === false), "decision history accurately records opt-out instead of claiming email delivery");
  check(trail.some(log => log.action === "enquiry.docsRequested" && log.meta.emailRequested === true), "explicit document email requests are differentiated from internal-only updates");
  check((await visit(page, `/admin/hr-portal/applications/${candidates[2].id}`)).status() === 404, "recruitment ownership still rejects sales enquiry IDs");
  const admin = await adminCtx.newPage(); await visit(admin, `/admin/hr-portal/applications/${candidates[1].id}?returnTo=${encodeURIComponent(`/admin/hr-portal/applications?q=${key}`)}`);
  await admin.locator('section[aria-labelledby="candidate-actions"] summary').click(); await admin.getByRole("button", { name: "Delete application", exact: true }).click(); dialog = admin.getByRole("dialog", { name: "Permanently delete application?", exact: true }); await submit(dialog, "Delete permanently");
  check(new URL(admin.url()).pathname === "/admin/hr-portal/applications" && new URL(admin.url()).searchParams.get("q") === key && !await db.projectEnquiry.findUnique({ where: { id: candidates[1].id } }), "admin-only confirmed deletion returns to the preserved HR list");
  check(errors.length === 0, `no browser page errors: ${errors.join("; ")}`);
} finally {
  const ids = users.map(user => user.id);
  await db.auditLog.deleteMany({ where: { userId: { in: ids } } }); await db.projectEnquiry.deleteMany({ where: { id: { in: candidates.map(record => record.id) } } });
  await db.agentPresence.deleteMany({ where: { userId: { in: ids } } }); await db.adminUser.deleteMany({ where: { id: { in: ids } } });
  await writeFile(`${out}/report.json`, JSON.stringify({ checks, errors, fixturesCleaned: true, mailDelivery: "off" }, null, 2)); await browser.close(); await db.$disconnect();
}
console.log(`Application detail verification: ${checks.length} checks passed; fixtures cleaned.`);
