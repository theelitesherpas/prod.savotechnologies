/**
 * Visual inspection for /case-studies/ — batched round:
 * overflow scan at key widths, settled full-page captures (desktop+mobile),
 * anchor navigation, dialog open, and console errors.
 */
import { chromium } from "playwright-core";

const BASE = "http://localhost:4311";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = ".impeccable/review";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const errors = [];

async function settle(page) {
  // Trigger every reveal by scrolling through the page, then force-settle
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.75;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-inview"));
    await new Promise((r) => setTimeout(r, 400));
  });
}

/* 1. Overflow + console at key widths */
for (const width of [320, 375, 430, 768, 1024, 1280, 1440, 1920]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  page.on("pageerror", (e) => errors.push(`${width}: ${e}`));
  await page.goto(`${BASE}/case-studies`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  const o = await page.evaluate(() => {
    const doc = document.documentElement;
    const wide = [];
    for (const el of document.querySelectorAll("main *")) {
      const r = el.getBoundingClientRect();
      if (r.width > doc.clientWidth + 1 && r.right > doc.clientWidth + 8) {
        wide.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().slice(0, 36)}`);
        if (wide.length >= 3) break;
      }
    }
    return { sw: Math.max(doc.scrollWidth, document.body.scrollWidth), cw: doc.clientWidth, wide };
  });
  console.log(o.sw > o.cw + 1 ? `✗ overflow@${width}: ${o.wide.join(" | ")}` : `✓ overflow@${width}px`);
  await page.close();
}
console.log(errors.length ? `✗ pageerror: ${errors.slice(0, 3).join(" ;; ")}` : "✓ no page errors");

/* 2. Full-page captures (settled) */
for (const [name, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto(`${BASE}/case-studies`, { waitUntil: "load" });
  await settle(page);
  await page.screenshot({ path: `${OUT}/case-studies-${name}.png`, fullPage: true });
  // h1 + section order sanity
  const order = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main section")).map((s) => s.getAttribute("aria-labelledby")),
  );
  console.log(`✓ captured ${name} (${order.length} sections: ${order.join(",")})`);
  await page.close();
}

/* 3. Anchor + dialog behavior at desktop */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/case-studies`, { waitUntil: "load" });
  await page.click('nav[aria-label="Case studies contents"] a[href="#ai"]');
  await page.waitForTimeout(1600);
  const y = await page.evaluate(() => window.scrollY);
  const headingVisible = await page.evaluate(() => {
    const el = document.getElementById("cs-ai-heading");
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top > -40 && r.top < 500;
  });
  console.log(headingVisible ? `✓ contents anchor jumps to AI chapter (scrollY ${Math.round(y)})` : `✗ anchor failed (scrollY ${Math.round(y)})`);
  // dialog
  await page.click("text=Start a Project");
  await page.waitForTimeout(700);
  const dialog = await page.evaluate(() => !!document.querySelector('[role="dialog"], [aria-modal="true"]'));
  console.log(dialog ? "✓ enquiry dialog opens from CTA" : "✗ enquiry dialog did not open");
  // nav link on homepage
  await page.goto(BASE, { waitUntil: "load" });
  const href = await page.evaluate(() => document.querySelector('header nav a[href^="/case-studies"]')?.getAttribute("href"));
  console.log(href && href.startsWith("/case-studies") ? "✓ header nav links to /case-studies" : `✗ header nav: ${href}`);
  await page.close();
}

await browser.close();
console.log("done");
