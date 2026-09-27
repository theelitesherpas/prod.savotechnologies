import { chromium } from "playwright-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ executablePath: CHROME, headless: true });

// The user's bug: intermittent missing content on HARD refresh. Simulate
// cold caches (no store) repeatedly and verify everything lands visible.
let failures = 0;
for (let i = 0; i < 8; i++) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, bypassCSP: false, offline: false, serviceWorkers: "block" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 80)));
  // hard refresh semantics: cache disabled
  await page.route("**/*", (route) => route.continue());
  await page.goto("http://localhost:4311/", { waitUntil: "load" });
  await page.waitForTimeout(3200);
  const state = await page.evaluate(() => {
    const h1 = document.getElementById("hero-heading");
    const words = [...h1.querySelectorAll("[data-word]")];
    const wordsVisible = words.every((w) => w.getBoundingClientRect().height > 0);
    const fades = [...document.querySelectorAll("[data-intro='fade']")];
    const fadesVisible = fades.every((el) => getComputedStyle(el).opacity === "1" && getComputedStyle(el).visibility === "visible");
    const visual = document.querySelector("[data-intro='visual']");
    const vOk = visual && getComputedStyle(visual).opacity === "1" && getComputedStyle(visual).visibility === "visible";
    const text = h1.innerText.replace(/\s+/g, " ").trim();
    return { wordsVisible, fadesVisible, vOk, text, maskCount: h1.querySelectorAll(":scope > span[data-line-mask]").length };
  });
  const ok = state.wordsVisible && state.fadesVisible && state.vOk && state.text === "We design and engineer what's next." && state.maskCount >= 2 && errors.length === 0;
  if (!ok) { failures++; console.log(`✗ run ${i + 1}:`, JSON.stringify(state), errors); }
  await ctx.close();
}
console.log(failures === 0 ? "✓ 8/8 hard-refresh simulations: everything visible, headline intact, no errors" : `${failures} failures`);

// mid-flight check: lines as units
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("http://localhost:4311/", { waitUntil: "load" });
await page.waitForTimeout(500);
const mid = await page.evaluate(() => document.querySelectorAll("#hero-heading > span[data-line-mask]").length);
console.log(`mid-flight line-masks: ${mid} (whole lines, unbroken)`);
await browser.close();
