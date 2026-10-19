/**
 * Razorpay settings + step-up verification — automated browser review.
 *
 * Drives the installed Chrome via playwright-core against a LOCAL dev
 * server (NODE_ENV=development, MAIL_DELIVERY_MODE=off). In development the
 * OTP send action falls back to logging the code (stepup.dev_delivery_fallback)
 * so this script can complete the challenge without SMTP; production sends
 * real email and never logs codes.
 *
 * Preconditions:
 *   - Server: npm run dev -- -p 4312   (MAIL_DELIVERY_MODE unset/off)
 *   - env:    BASE_URL (default http://localhost:4312), SERVER_LOG (server stdout file)
 *   - Local database only; the script refuses other DATABASE_URL hosts.
 *
 * Flow: challenge UI → send code → wrong code (attempts left) → correct code
 * → full surface → save synthetic test keys (encrypted at rest) → status →
 * verify-connection failure path → clear (danger zone) → lock now → editor
 * lockout. Screenshots in tmp/razorpay-settings/.
 */
import { chromium } from "playwright-core";
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert";

const base = process.env.BASE_URL ?? "http://localhost:4312";
const serverLog = process.env.SERVER_LOG ?? "tmp/razorpay-settings/server.log";
const dbUrl = process.env.DATABASE_URL ?? "";
assert(/@(localhost|127\.0\.0\.1)/.test(dbUrl), "Refusing to run against a non-local database.");
assert.equal(process.env.MAIL_DELIVERY_MODE ?? "off", "off", "Keep mail off for this local review.");

const p = new PrismaClient();
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const dir = "tmp/razorpay-settings";
const key = `RZPQA-${randomBytes(4).toString("hex")}`;
const checks = [], errors = [];
const ok = (condition, label) => { assert(condition, label); checks.push(label); };
await mkdir(dir, { recursive: true });

let admin, editor;
const readCodes = async () => {
  try {
    const text = await readFile(serverLog, "utf8");
    return [...text.matchAll(/"event":"stepup\.dev_delivery_fallback","purpose":"payments-settings","code":"(\d{6})","to":"([^"]+)"/g)];
  } catch { return []; }
};
const waitNewCode = async (before, email) => {
  for (let i = 0; i < 40; i++) {
    const now = await readCodes();
    const fresh = now.filter(m => m[2] === email && !before.some(b => b[0] === m[0] && b.index === m.index));
    if (fresh.length) return fresh.at(-1)[1];
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error("Dev-fallback code never appeared in the server log.");
};
const visit = async (page, path) => {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.locator("main h1").waitFor();
};
const snapshot = async (page, name) => {
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: no horizontal overflow`);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
};

try {
  // ── synthetic identities (no login bypass in production code) ──
  admin = await p.adminUser.create({ data: { email: `${key}-admin@example.invalid`, name: "Synthetic Razorpay Admin", role: "admin", passwordHash: "local-session-fixture-no-password" } });
  editor = await p.adminUser.create({ data: { email: `${key}-editor@example.invalid`, name: "Synthetic Settings Editor", role: "editor", permissions: ["settings"], passwordHash: "local-session-fixture-no-password" } });
  const context = async (user) => {
    const c = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const token = randomBytes(32).toString("hex");
    await p.adminSession.create({ data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3_600_000) } });
    await c.addCookies([{ name: "savo_admin", value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
    return c;
  };
  const a = await context(admin);
  const page = await a.newPage();
  page.on("pageerror", e => errors.push(e.message));

  // ── 1. challenge UI first; nothing sensitive renders ──
  const inbox = (process.env.STEP_UP_EMAIL ?? "").trim().toLowerCase() || admin.email;
  const inboxMask = `${inbox.slice(0, 1)}•••${inbox.slice(inbox.lastIndexOf("@"))}`;
  await visit(page, "/admin/settings/payments");
  ok(page.url().endsWith("/admin/settings/payments"), "admin lands on the payments page");
  ok(await page.getByText("verification required").first().isVisible(), "challenge UI shown before verification");
  ok(await page.getByText(inboxMask).first().isVisible(), "masked code destination inbox is displayed");
  ok(!(await page.content()).includes("Current configuration"), "no gateway status before verification");
  ok(!(await page.content()).includes("rzp_"), "no key material before verification");
  await snapshot(page, "1-challenge");

  // ── 2. send the code (dev fallback logs it) ──
  const codesBefore = await readCodes();
  await page.getByRole("button", { name: "Send code to my email" }).click();
  await page.waitForURL(/otp=sent/, { timeout: 30_000 });
  ok(await page.locator('input[name="code"]').isVisible(), "code entry form appears after send");
  const code = await waitNewCode(codesBefore, admin.email);
  ok(/^\d{6}$/.test(code), "a 6-digit code was issued and logged (dev fallback)");

  // ── 3. wrong code → attempts remaining, still locked ──
  const wrong = String((Number(code) + 7) % 1_000_000).padStart(6, "0");
  await page.locator('input[name="code"]').fill(wrong);
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await page.getByText(/attempt[s]? remaining/).waitFor({ timeout: 30_000 });
  ok(!(await page.content()).includes("Current configuration"), "wrong code keeps the page locked");
  await snapshot(page, "3-wrong-code");

  // ── 4. correct code → full surface ──
  await page.locator('input[name="code"]').fill(code);
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await page.waitForURL(url => !url.searchParams.has("otp"), { timeout: 30_000 });
  ok(await page.getByText("Current configuration").first().isVisible(), "full surface after verification");
  ok(await page.getByText("Email-verified").first().isVisible(), "verified chip rendered");
  ok(await page.getByText("Not configured", { exact: false }).first().isVisible(), "clean status shown");
  ok((await page.content()).includes("/api/webhooks/razorpay"), "webhook endpoint documented on the page");
  const challenges = await p.stepUpChallenge.findMany({ where: { userId: admin.id, purpose: "payments-settings" } });
  ok(challenges.length >= 1 && challenges.every(c => c.consumedAt), "challenge consumed after success");
  ok(!challenges.some(c => Object.values(c).some(v => typeof v === "string" && v.includes(code))), "no plaintext code persisted in the database");
  await snapshot(page, "4-verified");

  // ── 5. save synthetic TEST credentials (encrypted at rest) ──
  await page.locator('input[name="keyId"]').fill("rzp_test_E2ESYNTHKEY12345");
  await page.locator('input[name="keySecret"]').fill("e2e-synthetic-secret-1234567890");
  await page.getByRole("button", { name: "Save credentials" }).click();
  await page.getByText("saved and encrypted").waitFor({ timeout: 30_000 });
  ok(await page.getByText("Test mode").first().isVisible(), "test mode detected from the key id");
  ok(await page.getByText("rzp_test_E2E…2345").first().isVisible(), "key id is masked in the status card");
  const row = await p.paymentGatewayConfig.findUnique({ where: { gateway: "razorpay" } });
  ok(row?.keyId === "rzp_test_E2ESYNTHKEY12345" && row.mode === "test", "row persisted with correct mode");
  ok(row.keySecretEnc.startsWith("v1."), "secret stored as secret-box ciphertext");
  ok(!row.keySecretEnc.includes("e2e-synthetic-secret"), "ciphertext does not contain the secret");
  await snapshot(page, "5-saved");

  // ── 6. connection test with synthetic creds → honest failure ──
  await page.getByRole("button", { name: "Verify connection" }).click();
  await page.waitForURL(url => url.searchParams.has("verified") || url.searchParams.has("e"), { timeout: 30_000 });
  const content = await page.content();
  ok(/accepted the credentials|rejected these credentials|Could not reach Razorpay/.test(await page.locator("main").innerText()), "connection test reports an honest outcome");
  ok(!content.includes("e2e-synthetic-secret"), "failure message never echoes the secret");

  // ── 7. danger zone: clear stored credentials ──
  await page.getByRole("button", { name: "Remove Razorpay credentials" }).click();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page.getByText("were removed").waitFor({ timeout: 30_000 });
  ok(await p.paymentGatewayConfig.findUnique({ where: { gateway: "razorpay" } }) === null, "credential row deleted");

  // ── 8. lock now → back to the challenge ──
  await page.getByRole("button", { name: "Lock now" }).click();
  await page.waitForURL(/otp=locked/, { timeout: 30_000 });
  ok(await page.getByText("verification required").first().isVisible(), "lock returns to the challenge UI");

  // ── 9. editor with the settings grant still cannot enter ──
  const e = await context(editor);
  const editorPage = await e.newPage();
  await visit(editorPage, "/admin/settings/payments");
  ok(/denied=/.test(editorPage.url()), "settings editor is redirected away by the admin-only gate");
  await e.close();
} catch (error) {
  errors.push(String(error?.message ?? error));
} finally {
  if (admin) {
    await p.adminSession.deleteMany({ where: { userId: admin.id } });
    await p.adminUser.delete({ where: { id: admin.id } }).catch(() => {});
  }
  if (editor) {
    await p.adminSession.deleteMany({ where: { userId: editor.id } });
    await p.adminUser.delete({ where: { id: editor.id } }).catch(() => {});
  }
  await p.stepUpChallenge.deleteMany({ where: { userId: { in: [admin?.id, editor?.id].filter(Boolean) } } });
  await p.paymentGatewayConfig.deleteMany({ where: { gateway: "razorpay" } });
  await browser.close();
  await p.$disconnect();
}
await writeFile(`${dir}/report.txt`, [
  `checks: ${checks.length}`, ...checks.map(c => `✓ ${c}`),
  errors.length ? `errors: ${errors.length}` : "errors: 0", ...errors.map(e => `✗ ${e}`), "",
].join("\n"));
console.log(`razorpay settings review — ${checks.length} checks, ${errors.length} errors → ${dir}/report.txt`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
