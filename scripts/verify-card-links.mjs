/**
 * Click-through check: clicking anywhere on a case-study card (thumbnail,
 * title, footer) opens the detail page — homepage + dossier index, both
 * featured (full-width 16:7) and standard (half 16:10) cards.
 * locator.click({ position }) scrolls into view and clicks at the offset.
 */
import { chromium } from "playwright-core";

const BASE = "http://localhost:4311";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function clickAt(url, selector, position, label) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const el = page.locator(selector).first();
  try {
    await el.click({ position, timeout: 5000 });
  } catch (e) {
    console.log(`${label}: ❌ click failed — ${String(e).slice(0, 100)}`);
    return false;
  }
  await page.waitForTimeout(1200);
  const ok = /\/case-studies\/[a-z0-9-]+$/.test(page.url());
  console.log(`${label}: ${ok ? "✅ → " + page.url().split("/").pop() : "❌ stayed at " + page.url()}`);
  return ok;
}

const featured = 'a[href*="/case-studies/"]';
const results = [
  await clickAt(`${BASE}/`, featured, { x: 600, y: 150 }, "home · featured thumbnail (center)"),
  await clickAt(`${BASE}/`, `${featured} >> nth=1`, { x: 40, y: 40 }, "home · standard thumbnail (corner)"),
  await clickAt(`${BASE}/`, `${featured} h3`, { x: 30, y: 10 }, "home · card title"),
  await clickAt(`${BASE}/case-studies`, featured, { x: 600, y: 150 }, "index · featured thumbnail"),
  await clickAt(`${BASE}/case-studies`, `${featured} >> nth=1`, { x: 500, y: 380 }, "index · half-card footer"),
];

await browser.close();
console.log(results.every(Boolean) ? "ALL CARDS CLICKABLE ✅" : "SOME FAILED ❌");
process.exit(results.every(Boolean) ? 0 : 1);
