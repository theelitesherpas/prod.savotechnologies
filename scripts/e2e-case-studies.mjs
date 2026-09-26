/**
 * Case studies — full end-to-end audit through the admin panel.
 *
 * Drives the real UI with Chrome (playwright-core):
 *   login → import demo dossiers → create a record with EVERY field
 *   (identity, dossier, capabilities, stack, metrics, palette, testimonial,
 *   all 3 image slots) → draft invisibility → publish → appear everywhere
 *   (homepage big/small banners, discipline section, detail page, sitemap)
 *   → edit propagation → delete cleanup.
 *
 * Usage:  node scripts/e2e-case-studies.mjs [baseURL]
 *         (default http://localhost:4311; needs the dev server + PostgreSQL)
 */
import { chromium } from "playwright-core";
import { config } from "dotenv";

config();

const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:4311";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TEST_IMAGE = new URL("../public/images/code.webp", import.meta.url).pathname;

let failures = 0;
const results = [];
const ok = (name, cond, detail = "") => {
  results.push(`${cond ? "✓" : "✗"} ${name}${cond ? "" : ` — ${detail}`}`);
  if (!cond) failures++;
};
const log = () => results.splice(0).forEach((r) => console.log(r));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(String(e)));

/* ───────────────────────── 1. Admin login ───────────────────────── */
await page.goto(`${BASE}/admin/login`, { waitUntil: "load" });
await page.fill("#email", process.env.ADMIN_EMAIL);
await page.fill("#password", process.env.ADMIN_PASSWORD);
await page.click("button[type=submit]");
await page.waitForURL((url) => !url.pathname.startsWith("/admin/login"), { timeout: 20000 });
ok("admin login", !page.url().includes("/admin/login"), page.url());

/* ─────────────── 2. Case studies admin: import demo dossiers ─────────────── */
await page.goto(`${BASE}/admin/case-studies`, { waitUntil: "load" });
const importBtn = page.getByRole("button", { name: /import demo dossiers/i });
if (await importBtn.count()) {
  await importBtn.click();
  await page.waitForURL(/saved=imported/, { timeout: 30000 });
}
await page.goto(`${BASE}/admin/case-studies`, { waitUntil: "load" });
const rowCount = await page.locator("main ul.adm-card > li").count();
ok("admin list shows imported demo dossiers (4)", rowCount === 4, String(rowCount));

/* ─────────────── 3. Create a record with every field ─────────────── */
await page.goto(`${BASE}/admin/case-studies/new`, { waitUntil: "load" });

await page.fill("#cs-title", "E2E Test Alpha");
await page.fill("#cs-client", "E2E Client Pvt Ltd");
await page.fill("#cs-display", "Alpha Digital");
await page.selectOption("#cs-discipline", "growth");
await page.fill("#cs-industry", "QA Testing · Automation · E2E");
await page.fill("#cs-summary", "An end-to-end audit record covering every surface of the case-study system.");
await page.fill("#cs-challenge", "Challenge text for the e2e audit — verifies the challenge section renders verbatim.");
await page.fill("#cs-solution", "Solution text for the e2e audit — verifies the solution section and stack rail.");
await page.fill("#cs-year", "2026");
await page.fill("#cs-duration", "6 weeks");
await page.fill("#cs-team", "3 specialists");

// Capabilities: toggle two chips
const chips = page.locator("button[aria-pressed]");
await chips.filter({ hasText: "SEO" }).first().click();
await chips.filter({ hasText: "Analytics" }).first().click();

// Tech stack: type + Enter ×3
for (const tech of ["Next.js", "Playwright", "PostgreSQL"]) {
  await page.fill('input[aria-label="Add technology"]', tech);
  await page.press('input[aria-label="Add technology"]', "Enter");
}

// Metrics ×2 (first verified)
await page.getByRole("button", { name: /add metric/i }).click();
await page.fill("#cs-metric-0-value", "+99%");
await page.fill("#cs-metric-0-label", "E2E Verified Metric");
await page.check('input[aria-label="Metric 1 verified"]');
await page.getByRole("button", { name: /add metric/i }).click();
await page.fill("#cs-metric-1-value", "-11%");
await page.fill("#cs-metric-1-label", "E2E Unverified Metric");

// Palette ×2
await page.getByRole("button", { name: /add color/i }).click();
await page.fill('input[aria-label="Color 1 name"]', "Alpha Blue");
await page.fill("#cs-palette-0", "#1f4ee8");
await page.getByRole("button", { name: /add color/i }).click();
await page.fill('input[aria-label="Color 2 name"]', "Alpha Sand");
await page.fill("#cs-palette-1", "#e8a00f");

// Testimonial
await page.check("text=Include a testimonial");
await page.fill("#cs-tq", "An approved-style quote used by the e2e audit.");
await page.fill("#cs-tn", "E2E Client");
await page.fill("#cs-tr", "CTO · E2E Client Pvt Ltd");

// Featured + lifecycle draft
await page.check("text=Featured on homepage");
await page.selectOption('select[aria-label="Content lifecycle"]', "draft");

// Images: all three slots via the crop studio
const slots = page.locator('input[type=file][accept="image/jpeg,image/png,image/webp"]');
ok("three image slots present", (await slots.count()) === 3, String(await slots.count()));
for (let i = 0; i < 3; i++) {
  await slots.nth(i).setInputFiles(TEST_IMAGE);
  await page.getByRole("button", { name: /crop & attach/i }).click();
  await page.fill('input[aria-label="Image alt text"]', `E2E slot ${i} visual`);
}
const attachedCount = await page.locator('img[alt="Attached visual"]').count();
ok("all 3 slots carry cropped images", attachedCount === 3, String(attachedCount));

await page.getByRole("button", { name: /create case study/i }).click();
await page.waitForURL(/saved=created/, { timeout: 30000 });
ok("case study created (draft)", true);

/* ─────────────── 4. Draft must be invisible on public surfaces ─────────────── */
const draftHome = await (await fetch(`${BASE}/`)).text();
const draftIndex = await (await fetch(`${BASE}/case-studies`)).text();
const draftDetail = await fetch(`${BASE}/case-studies/e2e-test-alpha`);
ok("draft hidden on homepage", !draftHome.includes("Alpha Digital"));
ok("draft hidden on dossier index", !draftIndex.includes("Alpha Digital"));
ok("draft detail page 404", draftDetail.status === 404, String(draftDetail.status));

/* ─────────────── 5. Publish via lifecycle ─────────────── */
await page.goto(`${BASE}/admin/case-studies`, { waitUntil: "load" });
await page.locator("a", { hasText: "E2E Test Alpha" }).first().click();
await page.waitForURL(/\/admin\/case-studies\/[a-z0-9]+/, { timeout: 15000 });
await page.selectOption('select[aria-label="Content lifecycle"]', "published");
await page.getByRole("button", { name: /save changes/i }).click();
await page.waitForURL(/saved=updated/, { timeout: 30000 });

/* ─────────────── 6. Published: present everywhere ─────────────── */
const home = await (await fetch(`${BASE}/`)).text();
ok("published on homepage", home.includes("Alpha Digital"));
ok("homepage card links to detail", home.includes('href="/case-studies/e2e-test-alpha"'));
const firstOther = ["Meridian Commerce", "NovaFlow", "Aster Health"].find((n) => home.includes(n));
ok(
  "homepage big banner is the e2e record (featured leads)",
  firstOther === undefined || home.indexOf("Alpha Digital") < home.indexOf(firstOther),
  firstOther ?? "",
);

const index = await (await fetch(`${BASE}/case-studies`)).text();
ok("published in growth discipline section", index.includes("Alpha Digital"));
ok("growth section link present", index.includes('href="/case-studies/e2e-test-alpha"'));

// Card surfaces apply the same verified-metrics policy as the detail page:
ok("homepage card shows verified metric only", home.includes("+99% E2E Verified Metric"));
ok("homepage card suppresses unverified metric", !home.includes("E2E Unverified Metric"));
ok("homepage card has no demo-figures marker on published record", !home.includes("+99% E2E Verified Metric - demo figures"));
ok("index card suppresses unverified metric", !index.includes("E2E Unverified Metric"));

const detail = await (await fetch(`${BASE}/case-studies/e2e-test-alpha`)).text();
ok("detail page 200 with title", detail.includes("Alpha Digital"));
for (const fragment of [
  "QA Testing · Automation · E2E",
  "An end-to-end audit record covering every surface",
  "Challenge text for the e2e audit",
  "Solution text for the e2e audit",
  "Next.js",
  "Playwright",
  "PostgreSQL",
  "+99%",
  "E2E Verified Metric",
  "Alpha Blue",
  "#1F4EE8",
  "E2E Client Pvt Ltd",
  "An approved-style quote used by the e2e audit",
  "2026",
  "6 weeks",
  "3 specialists",
  "data:image/jpeg;base64",
])
  ok(`detail renders: ${fragment.slice(0, 40)}`, detail.includes(fragment));
ok("detail omits unverified metric in production-policy text", detail.includes("E2E Unverified Metric") === false || process.env.E2E_ALLOW_UNVERIFIED === "1");

const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
ok("sitemap lists published study", sm.includes("/case-studies/e2e-test-alpha"));

/* ─────────────── 7. Edit propagation ─────────────── */
await page.goto(`${BASE}/admin/case-studies`, { waitUntil: "load" });
await page.locator("a", { hasText: "E2E Test Alpha" }).first().click();
await page.fill("#cs-display", "Alpha Digital Renamed");
await page.fill("#cs-metric-0-value", "+100%");
await page.getByRole("button", { name: /save changes/i }).click();
await page.waitForURL(/saved=updated/, { timeout: 30000 });

const home2 = await (await fetch(`${BASE}/`)).text();
const detail2 = await (await fetch(`${BASE}/case-studies/e2e-test-alpha`)).text();
ok("rename propagates to homepage", home2.includes("Alpha Digital Renamed"));
ok("edited metric propagates to detail", detail2.includes("+100%"));

/* ─────────────── 8. Delete + cleanup ─────────────── */
await page.goto(`${BASE}/admin/case-studies`, { waitUntil: "load" });
const row = page.locator("li", { hasText: "E2E Test Alpha" }).first();
await row.getByRole("button", { name: /^delete$/i }).click();
await row.getByRole("button", { name: /really delete/i }).click();
await page.waitForURL(/saved=deleted/, { timeout: 30000 });

const home3 = await (await fetch(`${BASE}/`)).text();
const index3 = await (await fetch(`${BASE}/case-studies`)).text();
const detail3 = await fetch(`${BASE}/case-studies/e2e-test-alpha`);
ok("deleted: gone from homepage", !home3.includes("Alpha Digital"));
ok("deleted: gone from index", !index3.includes("Alpha Digital"));
ok("deleted: detail 404", detail3.status === 404, String(detail3.status));

ok("no browser console/page errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" ;; "));

log();
await browser.close();
console.log(failures === 0 ? "\nE2E CASE-STUDY AUDIT: ALL PASS ✅" : `\nE2E CASE-STUDY AUDIT: ${failures} FAILURE(S) ❌`);
process.exit(failures === 0 ? 0 : 1);
