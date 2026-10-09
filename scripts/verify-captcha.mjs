/**
 * Captcha e2e verification — drives the installed Chrome via playwright-core.
 *
 * With Google TEST keys configured (default local .env) this exercises the
 * full loop against Google's real servers: the v2 widget renders on every
 * protected form, submissions are blocked until solved, and solving lets
 * the submission through.
 *
 * Usage: node scripts/verify-captcha.mjs   (server must be running)
 */
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const results = [];
const fail = (name, detail) => {
  results.push(`✗ ${name}: ${detail}`);
  process.exitCode = 1;
};
const pass = (name) => results.push(`✓ ${name}`);

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

/* ---- helpers ---- */
async function widgetFrame(page) {
  const frames = page.frames().filter((f) => f.url().includes("google.com/recaptcha"));
  return frames.length ? frames[0] : null;
}
async function solveWidget(page, scopeSelector) {
  // The checkbox lives inside Google's iframe; click it (test key auto-verifies).
  // Several widgets may be mounted (dialog + footer form) - when a scope is
  // given, only solve the widget whose iframe lives inside that scope.
  for (const frame of page.frames()) {
    const anchor = frame.locator("#recaptcha-anchor");
    if ((await anchor.count()) === 0) continue;
    if (!(await anchor.first().isVisible().catch(() => false))) continue;
    if (scopeSelector) {
      const fe = await frame.frameElement().catch(() => null);
      if (!fe) continue;
      const inScope = await fe.evaluate((node, sel) => Boolean(node.closest && node.closest(sel)), scopeSelector);
      if (!inScope) continue;
    }
    await anchor.first().scrollIntoViewIfNeeded().catch(() => undefined);
    // Sandboxed cross-origin iframe - bypass actionability with a DOM click.
    await anchor.first().evaluate((el) => el.click());
    await page.waitForTimeout(1800); // verification round-trip
    return;
  }
  throw new Error("no matching visible reCAPTCHA anchor found");
}

/* ---- 1. Gate config exposed to the client ---- */
{
  const page = await browser.newPage();
  const res = await page.request.get(`${BASE}/api/captcha/required`);
  const json = await res.json();
  if (json.required === true && json.configured === true) pass("gate reports configured");
  else fail("gate reports configured", JSON.stringify(json));
  await page.close();
}

/* ---- 2. Enquiry dialog: widget renders, blocked submit, solved submit ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(1500);

  // Open the "Start a project" enquiry dialog
  const opener = page.locator('a:has-text("Start a Project"), button:has-text("Start a Project")').first();
  await opener.click();
  await page.waitForTimeout(1200);

  // Scope every later action to the open dialog
  const dialog = page.locator('[role="dialog"][aria-modal="true"]');
  await dialog.waitFor({ state: "visible", timeout: 5000 });

  // Widget iframe renders
  if (await widgetFrame(page)) pass("enquiry dialog renders reCAPTCHA widget");
  else fail("enquiry dialog renders reCAPTCHA widget", "no google recaptcha iframe");

  // Fill the form (without solving) and submit → blocked
  await dialog.locator('[name="name"]').fill("E2E Test");
  await dialog.locator('[name="email"]').fill("e2e@test.dev");
  await dialog.locator('[name="projectType"]').selectOption("Website");
  await dialog.locator('[name="message"]').fill("Automated captcha e2e verification message.");
  await dialog.locator('button[type="submit"]').click();
  await page.waitForTimeout(800);
  const blocked = await page.locator("text=/human verification/i").count();
  if (blocked > 0) pass("submission blocked until captcha is solved");
  else fail("submission blocked until captcha is solved", "no verification message shown");

  // Solve and submit → success
  try {
    await solveWidget(page, '[role="dialog"][aria-modal="true"]');
    await dialog.locator('button[type="submit"]').click();
    await page.waitForTimeout(2500);
    const success = await page.locator("text=/thank you|received|we.{0,3}ll be in touch/i").count();
    if (success > 0) pass("solved captcha lets the enquiry through");
    else fail("solved captcha lets the enquiry through", "no success state");
  } catch (err) {
    fail("solved captcha lets the enquiry through", String(err).slice(0, 120));
  }
  await page.close();
}

/* ---- 3. Contact page: widget renders on the form ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/contact`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  if (await widgetFrame(page)) pass("contact form renders reCAPTCHA widget");
  else fail("contact form renders reCAPTCHA widget", "no google recaptcha iframe");
  await page.close();
}

/* ---- 4. Admin login: widget renders on the login card ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/admin/login`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  if (await widgetFrame(page)) pass("admin login renders reCAPTCHA widget");
  else fail("admin login renders reCAPTCHA widget", "no google recaptcha iframe");
  await page.close();
}

/* ---- 5. Client portal login: widget renders ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/portal`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  if (await widgetFrame(page)) pass("client portal login renders reCAPTCHA widget");
  else fail("client portal login renders reCAPTCHA widget", "no google recaptcha iframe");
  await page.close();
}

/* ---- 6. Employee portal login: widget renders ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/employee-portal`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  if (await widgetFrame(page)) pass("employee portal login renders reCAPTCHA widget");
  else fail("employee portal login renders reCAPTCHA widget", "no google recaptcha iframe");
  await page.close();
}

/* ---- 7. Careers page: widget renders on the application form ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/careers`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  // Applications may live behind an "Apply" flow — accept either the form
  // or an apply button; the widget renders once the form is visible.
  const applyBtn = page.locator('a:has-text("Apply"), button:has-text("Apply")').first();
  if (await applyBtn.count()) {
    await applyBtn.click().catch(() => undefined);
    await page.waitForTimeout(1200);
  }
  if (await widgetFrame(page)) pass("careers application renders reCAPTCHA widget");
  else fail("careers application renders reCAPTCHA widget", "no google recaptcha iframe");
  await page.close();
}

/* ---- 8. Start page brief: widget renders ---- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/start`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  if (await widgetFrame(page)) pass("start brief renders reCAPTCHA widget");
  else fail("start brief renders reCAPTCHA widget", "no google recaptcha iframe");
  await page.close();
}

await browser.close();
console.log(`\nCaptcha e2e — ${BASE}`);
console.log(results.join("\n"));
if (process.exitCode) console.log("\nSome checks failed.");
else console.log("\nAll captcha e2e checks passed.");
