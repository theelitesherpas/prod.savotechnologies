import { chromium } from "playwright-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("https://www.savotechnologies.com/", { waitUntil: "load" });
await page.waitForTimeout(2500);

const breakdown = await page.evaluate(() => {
  const total = document.querySelectorAll("*").length;
  // count by top-level section
  const bySection = [];
  for (const sec of document.querySelectorAll("body > *")) {
    bySection.push({ el: `${sec.tagName}${sec.id ? "#" + sec.id : ""}.${(sec.className || "").toString().split(" ")[0] || ""}`, count: sec.querySelectorAll("*").length + 1 });
  }
  // hidden-but-in-DOM elements
  let hiddenCount = 0;
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") hiddenCount++;
  }
  // nav panels
  const nav = document.querySelector("header")?.querySelectorAll("*").length ?? 0;
  const footer = document.querySelector("footer")?.querySelectorAll("*").length ?? 0;
  const svgs = document.querySelectorAll("svg").length;
  const svgPaths = document.querySelectorAll("svg *").length;
  return { total, bySection, hiddenCount, nav, footer, svgs, svgPaths };
});
console.log(JSON.stringify(breakdown, null, 1));
await browser.close();
