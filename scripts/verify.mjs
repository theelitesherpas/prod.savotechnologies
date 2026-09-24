/**
 * SAVO homepage — automated visual/behavioral verification.
 * Drives the installed Chrome via playwright-core (no browser download).
 * Checks: overflow at every required width, fonts, section order,
 * console errors, mobile menu, enquiry dialog, SEO endpoints.
 */
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:4311";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WIDTHS = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1728, 1920];

const results = [];
const fail = (name, detail) => {
  results.push(`✗ ${name}: ${detail}`);
  process.exitCode = 1;
};
const pass = (name) => results.push(`✓ ${name}`);

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

/* ---- 1. Overflow + console at every width ---- */
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const sw = Math.max(doc.scrollWidth, document.body.scrollWidth);
    // Find any element wider than viewport
    const wide = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > doc.clientWidth + 1 && r.right > doc.clientWidth + 8) {
        wide.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().slice(0, 40)}`);
        if (wide.length >= 3) break;
      }
    }
    return { sw, cw: doc.clientWidth, wide };
  });
  if (overflow.sw > overflow.cw + 1) {
    fail(`overflow@${width}`, `scrollWidth ${overflow.sw} > viewport ${overflow.cw}; offenders: ${overflow.wide.join(" | ")}`);
  } else {
    pass(`overflow@${width}px`);
  }
  if (errors.length) fail(`console@${width}`, errors.slice(0, 3).join(" ;; "));
  await page.close();
}
if (!process.exitCode) pass("no console errors");

/* ---- 2. Structure, fonts, sections ---- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: "load" });
  // Scroll through the page so lazy images request + decode, then wait for them
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
  });
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll("img")).every((i) => i.complete && i.naturalWidth > 0),
    { timeout: 8000 },
  ).catch(() => {});

  const structure = await page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll("main > *")).map((s) => s.id || s.tagName);
    const h1 = document.querySelector("h1")?.textContent?.trim();
    const bodyFont = getComputedStyle(document.body).fontFamily;
    const h1Font = getComputedStyle(document.querySelector("h1")).fontFamily;
    const canvas = document.querySelector("canvas");
    const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => {
      try { return JSON.parse(s.textContent); } catch { return null; }
    });
    const imgs = Array.from(document.querySelectorAll("img"));
    const imgsLoaded = imgs.every((i) => i.complete && i.naturalWidth > 0);
    const title = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.content ?? "";
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    const contract = document.body.innerHTML.includes("HOMEPAGE DESIGN CONTRACT");
    return { ids, h1, bodyFont, h1Font, imgs: { total: imgs.length, loaded: imgsLoaded }, canvasSize: canvas ? [canvas.width, canvas.height] : null, jsonLdOk: jsonLd.every(Boolean) && jsonLd.length > 0, title, metaDesc, canonical, contract };
  });

  structure.ids.includes("top") && structure.ids.includes("ai") && structure.ids.includes("growth")
    ? pass("section order present") : fail("sections", structure.ids.join(","));
  structure.h1?.includes("We design and engineer")
    ? pass("hero headline") : fail("hero headline", String(structure.h1));
  structure.bodyFont.toLowerCase().includes("manrope") ? pass("Manrope body font") : fail("body font", structure.bodyFont);
  structure.h1Font.toLowerCase().includes("source serif") ? pass("Source Serif display") : fail("display font", structure.h1Font);
  structure.imgs.total >= 4 && structure.imgs.loaded ? pass(`images loaded (${structure.imgs.total})`) : fail("images", JSON.stringify(structure.imgs));
  structure.canvasSize && structure.canvasSize[0] > 100 ? pass(`hero canvas ${structure.canvasSize.join("×")}`) : fail("canvas", JSON.stringify(structure.canvasSize));
  structure.jsonLdOk ? pass("JSON-LD parses") : fail("json-ld", "invalid");
  structure.title.length > 20 && structure.title.length < 70 ? pass(`title (${structure.title.length} chars)`) : fail("title", structure.title);
  structure.metaDesc.length >= 120 && structure.metaDesc.length <= 175 ? pass(`meta description (${structure.metaDesc.length})`) : fail("meta desc", String(structure.metaDesc.length));
  structure.canonical ? pass(`canonical ${structure.canonical}`) : fail("canonical", "missing");
  structure.contract ? pass("design contract in DOM") : fail("contract", "missing");

  /* Mobile menu behavior */
  const mm = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mm.goto(BASE, { waitUntil: "load" });
  const burger = mm.getByRole("button", { name: "Open menu" });
  await burger.click();
  await mm.waitForTimeout(700);
  const menuVisible = await mm.evaluate(() => {
    const el = document.getElementById("mobile-menu");
    return el && getComputedStyle(el).opacity === "1" && !el.hasAttribute("inert");
  });
  menuVisible ? pass("mobile menu opens") : fail("mobile menu", "not visible after click");
  const scrollLocked = await mm.evaluate(() => document.documentElement.style.overflow === "hidden");
  scrollLocked ? pass("mobile menu scroll lock") : fail("scroll lock", "not locked");
  await mm.keyboard.press("Escape");
  await mm.waitForTimeout(600);
  const menuClosed = await mm.evaluate(() => {
    const el = document.getElementById("mobile-menu");
    return !!el?.hasAttribute("inert");
  });
  menuClosed ? pass("mobile menu Esc closes") : fail("mobile menu esc", "still open");

  /* Enquiry dialog */
  const dp = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await dp.goto(BASE, { waitUntil: "load" });
  await dp.getByRole("button", { name: "Start a Project" }).first().click();
  await dp.waitForTimeout(700);
  const dlg = dp.getByRole("dialog");
  (await dlg.isVisible()) ? pass("enquiry dialog opens") : fail("dialog", "not visible");
  const focusInDialog = await dp.evaluate(() => !!document.querySelector('[role="dialog"]').contains(document.activeElement));
  focusInDialog ? pass("dialog initial focus") : fail("dialog focus", "focus not trapped initially");
  await dp.keyboard.press("Escape");
  await dp.waitForTimeout(600);
  const stillOpen = await dp.evaluate(() => {
    const el = document.querySelector('[role="dialog"]');
    const r = el.getBoundingClientRect();
    return r.left < window.innerWidth; // panel still on-screen
  });
  !stillOpen ? pass("dialog Esc closes") : fail("dialog esc", "still open");

  /* Keyboard: services accordion */
  const sv = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await sv.goto(BASE, { waitUntil: "load" });
  await sv.locator("#services button[aria-controls]").nth(1).focus();
  await sv.keyboard.press("Enter");
  await sv.waitForTimeout(400);
  const expanded = await sv.locator("#services button[aria-controls]").nth(1).getAttribute("aria-expanded");
  expanded === "true" ? pass("services accordion keyboard") : fail("accordion", `expanded=${expanded}`);

  await Promise.all([page, mm, dp, sv].map((p) => p.close()));
}

/* ---- 3. SEO / AEO endpoints ---- */
for (const path of ["/robots.txt", "/sitemap.xml", "/icon.svg", "/llms.txt", "/llms-full.txt"]) {
  const res = await fetch(BASE + path);
  res.ok ? pass(`${path} → ${res.status}`) : fail(path, String(res.status));
}

// robots.txt declares AI crawler policy
const robotsBody = await (await fetch(BASE + "/robots.txt")).text();
robotsBody.includes("GPTBot") && robotsBody.includes("Disallow: /admin")
  ? pass("robots: AI crawlers allowed, admin excluded")
  : fail("robots", "missing AI crawler policy");

// llms.txt carries the org identity
const llms = await (await fetch(BASE + "/llms.txt")).text();
llms.includes("SAVO") && llms.includes("savotechnologies.com")
  ? pass("llms.txt has org facts")
  : fail("llms.txt", "missing org facts");

// llms-full.txt mirrors visible services
const llmsFull = await (await fetch(BASE + "/llms-full.txt")).text();
llmsFull.includes("Web Experiences") && llmsFull.includes("## Process")
  ? pass("llms-full.txt mirrors site content")
  : fail("llms-full.txt", "content mismatch");

/* ---- 4. Platform endpoints ---- */
const health = await (await fetch(BASE + "/api/health")).json();
health.ok === true && health.status === "up"
  ? pass("health check: db up")
  : fail("health", JSON.stringify(health));

// Admin gate: unauthenticated /admin redirects to login
const adminRes = await fetch(BASE + "/admin", { redirect: "manual" });
adminRes.status === 307 || adminRes.status === 302
  ? pass("admin gate redirects unauthenticated")
  : fail("admin gate", String(adminRes.status));
const loginRes = await fetch(BASE + "/admin/login");
loginRes.ok && (await loginRes.text()).includes("Operations Panel")
  ? pass("admin login page renders")
  : fail("admin login", String(loginRes.status));

// API CSRF: cross-origin POST rejected
const csrfRes = await fetch(BASE + "/api/enquiries", {
  method: "POST",
  headers: { "content-type": "application/json", origin: "https://evil.example" },
  body: "{}",
});
csrfRes.status === 403
  ? pass("API rejects cross-origin POST")
  : fail("csrf guard", String(csrfRes.status));

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("✓")).length} passed, ${results.filter((r) => r.startsWith("✗")).length} failed`);
