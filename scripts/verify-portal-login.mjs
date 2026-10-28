/** Local-only sign-in verification. Uses Google's official CAPTCHA testing pair,
 * synthetic DB records and an in-memory, loopback SMTP sink (.invalid ONLY).
 * No external SMTP, live account, OTP archive, or production mutation.
 * Run after npm run build:
 * node --env-file=.env --env-file=.env.local scripts/verify-portal-login.mjs
 */
import assert from "node:assert/strict";
import net from "node:net";
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { chromium } from "playwright-core";

assert(["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL).hostname), "Local database only");
assert.equal(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI", "Official CAPTCHA testing pair only");
assert.equal(process.env.RECAPTCHA_SECRET_KEY, "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe");
const dir = ".impeccable/review/portal-login-compact";
await mkdir(dir, { recursive: true });
const tag = `login-review-${randomBytes(6).toString("hex")}`;
const password = randomBytes(20).toString("base64url");
const prisma = new PrismaClient();
const messages = [];
const sockets = new Set();
const smtp = net.createServer((socket) => {
  sockets.add(socket); socket.on("close", () => sockets.delete(socket));
  socket.setEncoding("utf8"); socket.write("220 localhost ESMTP local-only-test\r\n");
  let buffer = "", data = false, recipient = "", body = "";
  socket.on("data", (chunk) => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf("\r\n")) >= 0) {
      const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
      if (data) {
        if (line === ".") {
          messages.push({ recipient, code: body.match(/sign-in code: (\d{6})/)?.[1] });
          body = ""; data = false; socket.write("250 queued locally\r\n");
        } else body += `${line}\n`;
      } else if (/^EHLO|^HELO/.test(line)) socket.write("250-localhost\r\n250 SIZE 1000000\r\n");
      else if (/^MAIL FROM:/.test(line)) socket.write("250 OK\r\n");
      else if (/^RCPT TO:/.test(line)) {
        recipient = line.match(/<([^>]+)>/)?.[1] || "";
        socket.write(recipient.endsWith(".invalid") ? "250 OK\r\n" : "550 Only synthetic .invalid recipients allowed\r\n");
      } else if (line === "DATA") { data = true; socket.write("354 End with a dot\r\n"); }
      else if (line === "QUIT") { socket.end("221 Bye\r\n"); }
      else socket.write("250 OK\r\n");
    }
  });
});
await new Promise((resolve) => smtp.listen(0, "127.0.0.1", resolve));
const port = Number(process.env.PORTAL_LOGIN_TEST_PORT || 4327);
const base = `http://localhost:${port}`;
let serverLog = "";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  env: { ...process.env, NODE_ENV: "production", NEXT_PUBLIC_CONTENT_MODE: "production", MAIL_DELIVERY_MODE: "live",
    MAIL_HOST: "127.0.0.1", MAIL_PORT: String(smtp.address().port), MAIL_SECURE: "false", MAIL_USER: "", MAIL_PASS: "", MAIL_HR_PASS: "", MAIL_HR_USER: "", MAIL_FROM: "Local Savo Test <savo@example.invalid>" },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (d) => { serverLog += d; }); server.stderr.on("data", (d) => { serverLog += d; });
const browser = await chromium.launch();
const checks = [], errors = [], visualFailures = [], layouts = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
await context.route("**/api/analytics/collect", (route) => route.fulfill({ status: 204 }));
const page = await context.newPage(); page.on("pageerror", (e) => errors.push(e.message));
const ok = (condition, label) => { assert(condition, label); checks.push(label); };
const fixtureIds = {};
const sha = (s) => createHash("sha256").update(s).digest("hex");
const emails = { client: `${tag}-client@example.invalid`, employee: `${tag}-employee@example.invalid` };
async function visit(path) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
}
async function solve(kind) {
  const prefix = kind === "client" ? "pt" : "emp";
  await page.locator(`#${prefix}-captcha`).frameLocator('iframe[title="reCAPTCHA"]').getByRole("checkbox").click();
  await page.waitForFunction(() => Boolean(document.querySelector('input[name="captchaToken"]')?.value));
}
async function inspect(name, capture = true) {
  // Viewport/CAPTCHA reflow is asynchronous; measure the settled layout, not
  // the previous desktop frame immediately after a mobile resize.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const layout = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight }));
  layouts.push({ name, ...layout });
  for (const [condition, label] of [
    [layout.documentWidth <= layout.width + 1, `${name}: no horizontal overflow`],
    [layout.documentHeight <= layout.height + 1, `${name}: fits viewport without scrolling`],
    [await page.locator('[role="img"]').evaluateAll((elements) => elements.every((element) => getComputedStyle(element).transform === "none")), `${name}: straight workspace preview`],
  ]) {
    checks.push(label);
    if (!condition) visualFailures.push(label);
  }
  ok(await page.locator("main").count() === 1, `${name}: one main landmark`);
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  const violations = await page.evaluate(async () => (await window.axe.run(document.body, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })));
  ok(!violations.length, `${name}: accessibility ${JSON.stringify(violations)}`);
  if (capture && !process.env.REUSE_PORTAL_LOGIN_CAPTURES) await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
}
try {
  for (let n = 0; n < 50; n++) {
    try { if ((await fetch(`${base}/portal`)).ok) break; } catch {}
    if (n === 49) throw new Error("Local server failed to start");
    await new Promise((r) => setTimeout(r, 300));
  }
  const passwordHash = await hash(password, 10);
  fixtureIds.client = (await prisma.clientUser.create({ data: { name: "Synthetic login review client", email: emails.client, passwordHash, company: "Local verification only" } })).id;
  fixtureIds.employee = (await prisma.employee.create({ data: {
    employeeCode: tag, name: "Synthetic login review employee", email: emails.employee, position: "Test", department: "Local verification only", status: "active", joiningDate: new Date(),
    panelUsers: { create: { email: emails.employee, name: "Synthetic login review employee", role: "editor", permissions: [], passwordHash } },
  } })).id;
  for (const kind of ["client", "employee"]) {
    const entrance = kind === "client" ? "/portal" : "/employee-portal";
    const prefix = kind === "client" ? "pt" : "emp";
    const viewports = [[1440, 900], [1366, 768], [1280, 720], [768, 1000], [390, 844], [375, 812], [320, 900]];
    for (const [width, height] of process.env.REUSE_PORTAL_LOGIN_CAPTURES ? [] : viewports) {
      await page.setViewportSize({ width, height });
      await visit(entrance);
      await inspect(`${kind}-${width}`);
      ok(await page.getByRole("button", { name: "Sign in with email OTP" }).count() === 1, `${kind}/${width}: OTP findable`);
      ok(await page.getByRole("checkbox", { name: /Remember me/ }).count() === 1, `${kind}/${width}: remember available`);
    }
    await page.setViewportSize({ width: 1440, height: 1000 }); await visit(entrance);
    await page.locator(`#${prefix}-email`).fill(emails[kind]);
    await page.locator(`#${prefix}-password`).fill(password);
    await page.getByRole("button", { name: "Show password" }).click();
    ok(await page.locator(`#${prefix}-password`).getAttribute("type") === "text", `${kind}: password visibility`);
    await page.getByRole("button", { name: "Forgot password?" }).click();
    ok(await page.locator(`#${prefix}-email`).inputValue() === emails[kind], `${kind}: method switch retains email`);
    ok(await page.locator(`#${prefix}-password`).count() === 0, `${kind}: OTP requires no password`);
    // Unknown account: CAPTCHA must succeed before explicit registration guidance.
    const unknown = `${tag}-${kind}-unregistered@example.invalid`;
    await page.locator(`#${prefix}-email`).fill(unknown); await solve(kind);
    await page.getByRole("button", { name: "Send sign-in code", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "not registered" }).waitFor();
    ok(!messages.some((m) => m.recipient === unknown), `${kind}: unknown address receives no mail`);
    await page.locator(`#${prefix}-email`).fill(emails[kind]); await solve(kind);
    await page.getByRole("checkbox", { name: /Remember me/ }).check();
    await page.getByRole("button", { name: "Send sign-in code", exact: true }).click();
    await page.getByRole("heading", { name: "Check your email." }).waitFor();
    const delivered = messages.findLast((m) => m.recipient === emails[kind]);
    ok(/^\d{6}$/.test(delivered?.code || ""), `${kind}: receives actual SMTP code in loopback sink`);
    const challenge = await prisma.portalLoginChallenge.findFirst({ where: { accountId: fixtureIds[kind], kind }, orderBy: { createdAt: "desc" } });
    ok(challenge.emailHash === sha(emails[kind]) && challenge.codeHash !== delivered.code, `${kind}: keyed code storage`);
    ok(await prisma.sentEmail.count({ where: { toEmail: emails[kind] } }) === 0, `${kind}: code excluded from sent archive`);
    await inspect(`${kind}-otp-desktop`);
    await page.setViewportSize({ width: 390, height: 900 }); await inspect(`${kind}-otp-mobile`);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const binding = (await context.cookies()).find((c) => c.name === `savo_${kind}_login`);
    // Bypass the client cooldown to verify that the SERVER refuses a resend.
    await page.evaluate(() => {
      const button = document.querySelector('button[value="resend-code"]');
      button.disabled = false;
      button.form.requestSubmit(button);
    });
    await page.getByRole("alert").filter({ hasText: "wait a minute" }).waitFor();
    ok(messages.filter((m) => m.recipient === emails[kind]).length === 1, `${kind}: server cooldown blocks forced resend`);
    const wrong = delivered.code === "000000" ? "111111" : "000000";
    await page.locator(`#${prefix}-code`).fill(wrong);
    await page.getByRole("button", { name: "Verify & sign in" }).click();
    await page.getByRole("alert").filter({ hasText: "incorrect" }).waitFor();
    ok((await prisma.portalLoginChallenge.findUnique({ where: { id: challenge.id } })).attempts === 1, `${kind}: failed attempt persisted`);
    await page.locator(`#${prefix}-code`).fill(delivered.code);
    // Two genuine action requests race with identical code/browser credentials.
    // Only one may consume the code and issue a session (atomic DB CAS).
    await page.route(`**${entrance}`, async (route) => {
      try {
        if (route.request().method() !== "POST") return route.continue();
        const responses = await Promise.all([context.request.fetch(route.request()), context.request.fetch(route.request())]);
        const winner = responses.find((response) => response.headers()["x-action-redirect"]);
        ok(!!winner, `${kind}: concurrent code redemption has one winner`);
        ok(responses.filter((response) => response.headers()["x-action-redirect"]).length === 1, `${kind}: concurrent replay rejected`);
        await route.fulfill({ response: winner });
        await page.unroute(`**${entrance}`);
      } catch (error) {
        errors.push(error.message);
        await route.abort().catch(() => {});
      }
    });
    await page.getByRole("button", { name: "Verify & sign in" }).click();
    await page.waitForURL(`**${entrance}/dashboard`, { timeout: 60000 });
    ok(new URL(page.url()).pathname === `${entrance}/dashboard`, `${kind}: OTP opens correct owned workspace`);
    const authCookie = (await context.cookies()).find((c) => c.name === `savo_${kind}`);
    ok(authCookie.httpOnly && authCookie.expires > Date.now() / 1000 + 29 * 86400, `${kind}: remembered HttpOnly session`);
    ok(!(await context.cookies()).some((c) => c.name === "savo_admin"), `${kind}: no admin session granted`);
    const consumed = await prisma.portalLoginChallenge.findUnique({ where: { id: challenge.id } });
    ok(!!consumed.consumedAt && consumed.attempts === 2, `${kind}: code consumed exactly once after one failed guess`);
    const sessionCount = kind === "client" ? await prisma.clientSession.count({ where: { clientId: fixtureIds[kind] } }) : await prisma.employeeSession.count({ where: { employeeId: fixtureIds[kind] } });
    ok(sessionCount === 1, `${kind}: racing OTP requests create exactly one session`);
    await context.clearCookies(); await visit(entrance);
    // Actual password sign-in, without remember.
    await page.locator(`#${prefix}-email`).fill(emails[kind]); await page.locator(`#${prefix}-password`).fill(password); await solve(kind);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL(`**${entrance}/dashboard`, { timeout: 60000 });
    const temporary = (await context.cookies()).find((c) => c.name === `savo_${kind}`);
    ok(temporary.expires === -1, `${kind}: unchecked remember uses browser-session cookie`);
    await context.clearCookies();
    // Keep no challenge binding/OTP in evidence output.
    assert(binding);
  }
  // Exercise the actual distributed PostgreSQL limit concurrently, not a mock.
  const throttleKey = `portal:test:${tag}`;
  const hits = await Promise.all(Array.from({ length: 12 }, () => prisma.$queryRaw`
    INSERT INTO portal_auth_throttles (key, hits, expires_at) VALUES (${throttleKey}, 1, NOW() + INTERVAL '1 minute')
    ON CONFLICT (key) DO UPDATE SET hits = portal_auth_throttles.hits + 1 WHERE portal_auth_throttles.hits < 3 RETURNING hits
  `));
  ok(hits.filter((rows) => rows.length).length === 3, "shared database throttle admits exactly three concurrent requests");
  await prisma.portalAuthThrottle.delete({ where: { key: throttleKey } });
  ok(errors.length === 0, `no browser runtime errors: ${errors.join("; ")}`);
  await writeFile(`${dir}/report.json`, JSON.stringify({ checks, errors, visualFailures, layouts, note: "Local synthetic data; official CAPTCHA test keys; loopback SMTP only. OTP values and bindings intentionally omitted." }, null, 2));
  assert(!visualFailures.length, `Layout failures: ${visualFailures.join("; ")}`);
  console.log(`Passed ${checks.length} browser/database checks. Evidence: ${dir}`);
} finally {
  await browser.close(); server.kill("SIGTERM");
  for (const socket of sockets) socket.destroy();
  await new Promise((resolve) => smtp.close(resolve));
  if (fixtureIds.client) await prisma.clientUser.deleteMany({ where: { id: fixtureIds.client } });
  if (fixtureIds.employee) {
    await prisma.adminUser.deleteMany({ where: { employeeId: fixtureIds.employee } });
    await prisma.employee.deleteMany({ where: { id: fixtureIds.employee } });
  }
  await prisma.portalLoginChallenge.deleteMany({ where: { accountId: { in: Object.values(fixtureIds) } } });
  const hashes = [...Object.values(emails), `${tag}-client-unregistered@example.invalid`, `${tag}-employee-unregistered@example.invalid`].map(sha);
  await prisma.portalAuthThrottle.deleteMany({ where: { OR: hashes.map((hash) => ({ key: { endsWith: hash } })) } });
  await prisma.$disconnect();
  // Server logs contain event names, not codes; store only on failure.
  if (errors.length) await writeFile(`${dir}/server-errors.txt`, serverLog);
}
