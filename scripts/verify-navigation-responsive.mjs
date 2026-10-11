import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.BASE_URL || "http://localhost:4312";
const output = process.env.NAV_REVIEW_DIR || "tmp/navigation-responsive";
const widths = [320, 360, 390, 640, 768, 820, 1024, 1180, 1279, 1280, 1366, 1439, 1440, 1536, 1920, 2560];
const browser = await chromium.launch();
const results = [];
await mkdir(output, { recursive: true });

try {
  for (const route of ["/about", "/"]) {
    const page = await browser.newPage({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const width of widths) {
      const height = width < 640 ? 740 : 900;
      await page.setViewportSize({ width, height });
      await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      const primary = page.getByRole("navigation", { name: "Primary", exact: true });
      const burger = page.getByRole("button", { name: "Open menu", exact: true });
      assert.equal(await primary.isVisible(), width >= 1280, `${route}/${width}: desktop visibility`);
      assert.equal(await burger.isVisible(), width < 1280, `${route}/${width}: drawer visibility`);

      const geometry = await page.locator("header").evaluate(header => {
        const nav = header.querySelector('nav[aria-label="Primary"]');
        const bar = nav.parentElement;
        const logo = bar.querySelector('a[aria-label="Savo Technologies, home"]');
        const project = bar.querySelector('a[href="/start-a-project"]');
        const bounds = el => { const { left, right, top, bottom, width, height } = el.getBoundingClientRect(); return { left, right, top, bottom, width, height }; };
        const controls = [...nav.querySelectorAll(':scope > ul > li > :is(a,button)')].map(el => {
          const range = document.createRange();
          range.selectNode(el.firstChild);
          return { name: el.textContent.trim(), lines: range.getClientRects().length, ...bounds(el) };
        });
        return { viewport: innerWidth, logo: bounds(logo), nav: bounds(nav), project: bounds(project), controls };
      });
      assert(geometry.logo.left >= 0 && geometry.project.right <= width, `${route}/${width}: visible brand and project CTA`);
      assert(geometry.project.height >= 44, `${route}/${width}: project target`);
      if (width >= 1280) {
        assert(geometry.logo.right < geometry.nav.left, `${route}/${width}: logo/nav gap`);
        assert(geometry.nav.right < geometry.project.left, `${route}/${width}: nav/action gap`);
        for (const item of geometry.controls) {
          assert.equal(item.lines, 1, `${route}/${width}: ${item.name} wraps`);
          assert(item.height >= 44, `${route}/${width}: ${item.name} target`);
          assert(item.top >= 0 && item.bottom <= 70, `${route}/${width}: ${item.name} stays inside header`);
        }
      }
      if ([1280, 1366, 1440].includes(width)) {
        const trigger = primary.getByRole("button", { name: "Who We Are", exact: true });
        await trigger.focus();
        await trigger.press("Enter");
        const links = page.locator(`#${await trigger.getAttribute("aria-controls")} ul a`);
        await links.first().waitFor({ state: "visible" });
        assert.deepEqual(await links.evaluateAll(els => els.map(el => el.getAttribute("href"))), ["/about", "/services", "/enterprise", "/trust", "/contact"]);
        await page.keyboard.press("Escape");
        await links.first().waitFor({ state: "hidden" });
        assert.equal(await trigger.evaluate(el => document.activeElement === el), true, "Escape restores trigger focus");
      }
      if (route === "/about" && [320, 1024, 1280, 1366, 1440].includes(width)) {
        await page.locator("header").screenshot({ path: `${output}/header-${width}.png` });
      }
      if (width < 1280 && [320, 768, 1024, 1279].includes(width)) {
        await burger.click();
        const mobile = page.getByRole("navigation", { name: "Mobile", exact: true });
        const who = mobile.getByRole("button", { name: "Who We Are", exact: true });
        await who.waitFor({ state: "visible" });
        const choices = await mobile.locator('ul > li > :is(a,button)').evaluateAll(els => els.map(el => {
          const range = document.createRange(); range.selectNode(el.firstChild);
          return { label: el.textContent.trim(), lines: range.getClientRects().length, width: el.clientWidth, height: el.clientHeight };
        }));
        assert.equal(choices.length, 9);
        for (const choice of choices) { assert.equal(choice.lines, 1, `${width}: ${choice.label} drawer label wraps`); assert(choice.height >= 44); }
        await who.click();
        await mobile.getByRole("heading", { name: "Who We Are" }).waitFor({ state: "visible" });
        assert.deepEqual(await mobile.locator("ul a").evaluateAll(els => els.map(el => el.getAttribute("href"))), ["/about", "/services", "/enterprise", "/trust", "/contact"]);
        const footer = page.locator('#mobile-menu > div:last-child a');
        const footerBox = await footer.boundingBox();
        assert(footerBox.height >= 48 && footerBox.x >= 0 && footerBox.x + footerBox.width <= width, `${width}: mobile project CTA fits`);
        if (route === "/about" && [320, 1024].includes(width)) await page.screenshot({ path: `${output}/drawer-${width}.png` });
        await page.getByRole("button", { name: "Back to navigation", exact: true }).click();
        await who.waitFor({ state: "visible" });
        await page.getByRole("button", { name: "Close menu", exact: true }).click();
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route}/${width}: horizontal overflow`);
      results.push({ route, width, mode: width >= 1280 ? "desktop" : "drawer", pass: true });
    }
    assert.deepEqual(errors, [], `${route}: runtime errors`);
    // Resizing an open tablet drawer must release scroll lock/inert on desktop.
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForFunction(() => document.querySelector("#mobile-menu")?.getAttribute("data-open") === "false");
    assert.equal(await page.locator("main").evaluate(el => el.inert), false);
    await page.close();
  }
  const landscape = await browser.newPage({ reducedMotion: "reduce" });
  for (const [width, height] of [[320, 568], [844, 390], [1024, 600]]) {
    await landscape.setViewportSize({ width, height });
    await landscape.goto(`${base}/about`, { waitUntil: "networkidle" });
    await landscape.getByRole("button", { name: "Open menu", exact: true }).click();
    await landscape.getByRole("button", { name: "Who We Are", exact: true }).click();
    const contact = landscape.getByRole("navigation", { name: "Mobile", exact: true }).getByRole("link", { name: /^Contact Us/ });
    await contact.scrollIntoViewIfNeeded();
    const contactBox = await contact.boundingBox();
    const footerBox = await landscape.locator('#mobile-menu > div:last-child').boundingBox();
    assert(contactBox.y >= 68 && contactBox.y + contactBox.height <= footerBox.y + 1, `${width}x${height}: last submenu link scrolls clear of fixed footer`);
    results.push({ route: "/about", width, height, mode: "short-screen drawer", pass: true });
  }
  await landscape.close();
  await writeFile(`${output}/report.json`, JSON.stringify({ base, results }, null, 2));
  console.log(`PASS: ${results.length} checks, ${widths.length} widths, home/inner-page themes and short/landscape screens; no wrapping, overlaps or overflow.`);
} finally {
  await browser.close();
}
