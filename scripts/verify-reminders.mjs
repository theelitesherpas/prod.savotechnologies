/** Isolated LOCAL database + loopback SMTP only. No real records or email.
 * npm run build, then:
 * node --env-file=.env --env-file=.env.local scripts/verify-reminders.mjs
 * Set REMINDER_TEST_ADMIN_DATABASE_URL to a loopback CREATEDB connection when
 * the ordinary app role correctly lacks that privilege. Never changes roles.
 * Drops only its own generated test database.
 */
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { chromium } from "playwright-core";
import { localReminderSmtp } from "./local-reminder-smtp.mjs";

const rootUrl = new URL(process.env.DATABASE_URL);
assert(["localhost", "127.0.0.1", "[::1]"].includes(rootUrl.hostname), "Local database only");
const name = `savo_reminders_verify_${randomBytes(6).toString("hex")}`;
assert(/^savo_reminders_verify_[a-f0-9]{12}$/.test(name));
const url = new URL(rootUrl); url.pathname = `/${name}`;
const adminUrl = new URL(process.env.REMINDER_TEST_ADMIN_DATABASE_URL || rootUrl);
assert(["localhost", "127.0.0.1", "[::1]"].includes(adminUrl.hostname), "Loopback test database administration only");
const owner = decodeURIComponent(rootUrl.username);
assert(/^[A-Za-z0-9_]{1,63}$/.test(owner), "Explicit safe local application role required");
const adminDb = new PrismaClient({ datasources: { db: { url: adminUrl.toString() } } });
const p = new PrismaClient({ datasources: { db: { url: url.toString() } } });
const port = Number(process.env.REMINDER_TEST_PORT || 4331), base = `http://127.0.0.1:${port}`;
const dir = ".impeccable/review/reminders"; await mkdir(dir, { recursive: true });
const secret = randomBytes(32).toString("hex"), token = randomBytes(32).toString("hex");
const sha = value => createHash("sha256").update(value).digest("hex");
const smtp = await localReminderSmtp();
let created = false, server, browser, serverLog = "";
const checks = [], errors = [], layoutFailures = [];
const ok = (condition, label) => { assert(condition, label); checks.push(label); };
const todayParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
const part = type => todayParts.find(p => p.type === type).value;
const today = `${part("year")}-${part("month")}-${part("day")}`;
const day = offset => new Date(Date.parse(`${today}T00:00:00Z`) + offset * 86400000);
const env = { ...process.env, DATABASE_URL: url.toString(), MAIL_DELIVERY_MODE: "off" };
function command(args, extraEnv = {}) { const result = spawnSync(process.execPath, args, { env: { ...env, ...extraEnv }, encoding: "utf8" }); if (result.status !== 0) throw new Error(`Isolated verification step failed: ${args[0]}`); }
try {
  await adminDb.$executeRawUnsafe(`CREATE DATABASE "${name}" OWNER "${owner}"`); created = true;
  command(["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"]);
  command(["node_modules/prisma/build/index.js", "db", "execute", "--file", "prisma/reminders.sql", "--schema", "prisma/schema.prisma"]);
  command(["scripts/setup-business-ids.mjs", "--apply"]);
  command(["node_modules/vitest/vitest.mjs", "run", "tests/reminders-db.test.ts"], { REMINDER_DB_TESTS: "1" });
  const passwordHash = await hash(randomBytes(18).toString("hex"), 10);
  const admin = await p.adminUser.create({ data: { name: "Synthetic Reminder Admin", email: "reminder-admin@example.invalid", passwordHash, role: "admin", permissions: [] } });
  await p.adminSession.create({ data: { userId: admin.id, tokenHash: sha(token), expiresAt: new Date(Date.now() + 3600000) } });
  const client = await p.clientUser.create({ data: { name: "James Miller", title: "Mr.", email: "reminder-client@example.invalid", passwordHash, active: true } });
  const invoices = {};
  for (const [key, offset, status] of [["before", 1, "sent"], ["today", 0, "sent"], ["after", -1, "sent"], ["manual", 10, "sent"], ["paid", 0, "paid"], ["draft", 0, "draft"], ["cancelled", 0, "cancelled"]]) {
    invoices[key] = await p.invoice.create({ data: { clientId: client.id, number: `SYNTHETIC-${key.toUpperCase()}`, amount: 250000, currency: "INR", status, issuedAt: day(-10), dueDate: day(offset), ...(status === "paid" ? { paidAt: new Date() } : {}) } });
  }
  const meetingToken = randomBytes(32).toString("base64url");
  const meeting = await p.meeting.create({ data: { reference: "SYNTHETIC-MEETING", title: "Synthetic reminder discussion", clientId: client.id, clientName: client.name, clientEmail: client.email, tokenPlain: meetingToken, tokenHash: sha(meetingToken), expiresAt: day(7), createdBy: admin.id, status: "awaiting_client" } });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], { env: { ...env, NODE_ENV: "production", NEXT_PUBLIC_CONTENT_MODE: "production", MAIL_DELIVERY_MODE: "live", INVOICE_REMINDERS_ENABLED: "true", INVOICE_REMINDER_SECRET: secret,
    MAIL_HOST: "127.0.0.1", MAIL_PORT: String(smtp.port), MAIL_SECURE: "false", MAIL_USER: "", MAIL_PASS: "", MAIL_HR_USER: "", MAIL_HR_PASS: "", MAIL_FROM: "Synthetic Savo Test <savo@example.invalid>" }, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", d => { serverLog += d; }); server.stderr.on("data", d => { serverLog += d; });
  for (let n = 0; n < 60; n++) { if (server.exitCode !== null) throw new Error("Isolated server exited"); try { if ((await fetch(`${base}/portal`)).ok) break; } catch {} if (n === 59) throw new Error("Isolated server unavailable"); await new Promise(r => setTimeout(r, 500)); }
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await context.addCookies([{ name: "savo_admin", value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
  const page = await context.newPage(); page.on("pageerror", e => errors.push(e.message));
  const visit = async path => { await page.goto(`${base}${path}`, { waitUntil: "networkidle" }); await page.evaluate(() => document.fonts.ready); };
  async function capture(label) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const layout = await page.evaluate(() => ({ width: innerWidth, docWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll('main *')].filter(e => e.getClientRects().length && e.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(e => ({ tag: e.tagName, className: e.className, width: e.getBoundingClientRect().width })) }));
    if (layout.docWidth > layout.width + 1) layoutFailures.push({ label, ...layout });
    checks.push(`${label}: captured responsive state`);
    if (process.env.REMINDER_TEST_CAPTURE !== "false") await page.screenshot({ path: `${dir}/${label}.png`, fullPage: !label.includes("dialog") });
  }
  const auth = { Authorization: `Bearer ${secret}` };
  ok((await context.request.post(`${base}/api/internal/invoice-reminders`, { data: { apply: true } })).status() === 401, "scheduler rejects a missing private secret");
  const dry = await context.request.post(`${base}/api/internal/invoice-reminders`, { headers: auth, data: { apply: false } });
  const plan = await dry.json(); ok(plan.ok && plan.eligible === 3 && plan.status === "dry_run", "private dry-run finds exactly the three calendar stages");
  ok(await p.reminderDelivery.count() === 0 && smtp.messages.length === 0, "dry-run performs no ledger writes or SMTP sends");
  const applied = await (await context.request.post(`${base}/api/internal/invoice-reminders`, { headers: auth, data: { apply: true } })).json();
  if (Number(part("hour")) >= 9) {
    ok(applied.sent === 3 && smtp.messages.length === 3, "actual scheduled endpoint delivers three messages through loopback SMTP");
    const twice = await (await context.request.post(`${base}/api/internal/invoice-reminders`, { headers: auth, data: { apply: true } })).json();
    ok(twice.sent === 0 && smtp.messages.length === 3, "repeated job request does not resend any stage");
  } else ok(applied.status === "before_send_hour" && smtp.messages.length === 0, "job correctly waits for 9 AM IST; positive stage delivery is covered by deterministic DB tests");
  await visit("/admin/invoices");
  const manualRow = page.locator('li').filter({ hasText: invoices.manual.number });
  const trigger = manualRow.getByRole("button", { name: "Send payment reminder", exact: true });
  ok(await trigger.isVisible(), "issued unpaid invoice exposes the manual reminder button");
  for (const key of ["paid", "draft", "cancelled"]) ok(await page.locator('li').filter({ hasText: invoices[key].number }).getByRole("button", { name: "Send payment reminder", exact: true }).count() === 0, `${key} invoice has no reminder button`);
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Send a reminder email?" });
  await dialog.waitFor();
  ok(await page.evaluate(() => !!document.activeElement?.closest("dialog")), "native confirmation contains keyboard focus");
  await page.keyboard.press("Escape");
  ok(!await dialog.isVisible(), "Escape cancels the unsent reminder");
  ok(await trigger.evaluate(e => e === document.activeElement), "cancellation restores focus to the reminder button");
  for (const [width, height] of [[1440, 1000], [390, 844]]) {
    await page.setViewportSize({ width, height }); await trigger.click(); await capture(`invoice-dialog-${width}`); await page.keyboard.press("Escape");
  }
  const beforeManual = smtp.messages.length;
  await trigger.click(); await dialog.getByRole("button", { name: "Send reminder email", exact: true }).click();
  await manualRow.getByRole("status").filter({ hasText: "accepted by the mail server" }).waitFor();
  ok(smtp.messages.length === beforeManual + 1, "invoice button sends one real loopback SMTP message after confirmation");
  ok((await p.invoice.findUnique({ where: { id: invoices.manual.id } })).status === "sent", "manual invoice send does not change payment status");
  await trigger.click(); await dialog.getByRole("button", { name: "Send reminder email", exact: true }).click();
  await manualRow.getByRole("alert").filter({ hasText: "15 minutes" }).waitFor();
  ok(smtp.messages.length === beforeManual + 1, "manual invoice repeat is blocked by persisted cooldown");
  await visit(`/admin/invoices/${invoices.manual.id}`); ok(await page.getByRole("button", { name: "Send payment reminder", exact: true }).isVisible(), "invoice detail also exposes the reminder action");
  for (const [width, height] of [[1440, 1000], [390, 844]]) { await page.setViewportSize({ width, height }); await capture(`invoice-detail-${width}`); }
  await page.setViewportSize({ width: 1440, height: 1000 }); await visit("/admin/meetings");
  await page.getByText(meeting.title, { exact: true }).click();
  const meetingButton = page.getByRole("button", { name: "Send meeting reminder", exact: true }); await meetingButton.waitFor();
  for (const [width, height] of [[1440, 1000], [390, 844]]) { await page.setViewportSize({ width, height }); await meetingButton.click(); await capture(`meeting-dialog-${width}`); await page.keyboard.press("Escape"); }
  const beforeMeeting = smtp.messages.length;
  await meetingButton.click(); await page.getByRole("dialog").getByRole("button", { name: "Send reminder email", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "accepted by the mail server" }).waitFor();
  ok(smtp.messages.length === beforeMeeting + 1, "meeting button delivers one real loopback message and shows recorded acceptance");
  const saved = await p.meeting.findUnique({ where: { id: meeting.id } });
  ok(saved.status === meeting.status && saved.tokenHash === meeting.tokenHash, "meeting reminder preserves invitation status and bearer link");
  ok(await p.meetingActivity.count({ where: { meetingId: meeting.id, type: "reminder_email_sent" } }) === 1, "meeting reminder has a real activity record");
  await meetingButton.click(); await page.getByRole("dialog").getByRole("button", { name: "Send reminder email", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "15 minutes" }).waitFor();
  ok(smtp.messages.length === beforeMeeting + 1, "meeting repeat is blocked by persisted cooldown");
  ok(smtp.messages.every(message => message.recipient.endsWith(".invalid") && message.body.includes("Hello Mr. James,")), "every test email uses the saved client and honorific-aware greeting");
  ok(await p.sentEmail.count() === smtp.messages.length, "accepted messages are archived, not optimistic requests");
  ok(errors.length === 0, `no runtime errors: ${errors.join('; ')}`);
  await writeFile(`${dir}/report.json`, JSON.stringify({ checks, errors, layoutFailures, databaseSuite: "passed in this disposable loopback database with mail mocked", note: "Generated isolated loopback database and SMTP sink only; no real recipients/records. Database dropped in finally. Test tokens and email bodies omitted." }, null, 2));
  assert(!layoutFailures.length, `Layout findings: ${JSON.stringify(layoutFailures)}`);
  console.log(`Passed ${checks.length} isolated reminder browser/SMTP checks. Evidence: ${dir}`);
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) { server.kill("SIGTERM"); await new Promise(resolve => { const timer = setTimeout(() => { server.kill("SIGKILL"); resolve(); }, 5000); server.once("exit", () => { clearTimeout(timer); resolve(); }); }); }
  await smtp.close(); await p.$disconnect();
  if (created) { assert(/^savo_reminders_verify_[a-f0-9]{12}$/.test(name)); await adminDb.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`); }
  await adminDb.$disconnect();
  if (errors.length) await writeFile(`${dir}/server-errors.log`, serverLog);
}
