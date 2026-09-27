import { chromium } from "playwright-core";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.on("response", async (r) => {
  if (r.url().includes("/api/agents/salesbot/demo")) {
    let body = "";
    try { body = await r.text(); } catch {}
    console.log("API RESPONSE:", r.status(), body.slice(0, 300));
  }
});
await page.goto("https://www.savotechnologies.com/ai-agents/salesbot", { waitUntil: "load" });
await page.waitForTimeout(2500);
await page.fill('input[aria-label="Message SalesBot"]', "hello");
await page.click('button:has-text("Send")');
await page.waitForTimeout(4000);
const chat = await page.locator("div.h-\\[34rem\\]").innerText();
console.log("chat error shown:", chat.includes("Something slipped"));
await browser.close();
