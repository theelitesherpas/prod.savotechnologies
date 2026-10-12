/** Run `npx vitest run tests/mail-design.test.ts` first to refresh sample fixtures.
 *  Local/browser verification only: no SMTP, writes or submissions. */
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";

const base = process.env.BASE_URL || "http://localhost:4312";
const output = "tmp/mail-redesign";
const samples = JSON.parse(await readFile(`${output}/templates.json`, "utf8"));
const browser = await chromium.launch();
const results = [];
const failures = [];
await mkdir(`${output}/screenshots`, { recursive: true });
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  let pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  const keys = [...samples.map(sample => sample.key), "long-values", "custom-hr"];
  for (const key of keys) {
    const html = await readFile(`${output}/fixtures/${key}.html`, "utf8");
    for (const width of [320, 390, 600, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(html, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => {
        const canvas = document.querySelector(".mail-canvas");
        const bounds = canvas.getBoundingClientRect();
        const buttons = [...document.querySelectorAll(".mail-button")].map(el => {
          const r = el.getBoundingClientRect(); return { label: el.textContent.trim(), height: r.height, left: r.left, right: r.right };
        });
        const images = [...document.images].map(img => ({ loaded: img.complete && img.naturalWidth > 0, alt: img.alt }));
        const failures = [];
        const rgba = color => color.match(/[\d.]+/g)?.map(Number) || [];
        const luminance = color => {
          const [r,g,b] = rgba(color).slice(0,3).map(value => { const v = value / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
          return .2126*r + .7152*g + .0722*b;
        };
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (!node.textContent.trim()) continue;
          const el = node.parentElement;
          const style = getComputedStyle(el);
          if (el.closest("script,style") || !el.getClientRects().length || style.visibility === "hidden" || el.closest('[style*="display:none"]')) continue;
          let ancestor = el;
          while (ancestor && (rgba(getComputedStyle(ancestor).backgroundColor)[3] ?? 1) === 0) ancestor = ancestor.parentElement;
          const bg = ancestor ? getComputedStyle(ancestor).backgroundColor : "rgb(255,255,255)";
          const a = luminance(style.color), b = luminance(bg);
          const ratio = (Math.max(a,b) + .05) / (Math.min(a,b) + .05);
          const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
          if (ratio < (large ? 3 : 4.5) - .01) failures.push({ text: node.textContent.trim().slice(0,80), ratio, foreground: style.color, bg });
        }
        return { overflow: document.documentElement.scrollWidth > innerWidth, canvas: { width: bounds.width, left: bounds.left, right: bounds.right }, buttons, images, contrastFailures: failures, fontsLoaded: document.fonts.check('500 32px Outfit') && document.fonts.check('400 16px Inter') };
      });
      const issue = [];
      if (metrics.overflow) issue.push("horizontal overflow");
      if (metrics.canvas.width > 600.5 || metrics.canvas.left < -.5 || metrics.canvas.right > width + .5) issue.push("canvas does not fit");
      if (metrics.buttons.some(b => b.height < 44 || b.left < -.5 || b.right > width + .5)) issue.push("CTA target/clipping");
      if (metrics.images.some(img => !img.loaded || !img.alt)) issue.push("logo unavailable");
      if (!metrics.fontsLoaded) issue.push("brand fonts unavailable");
      if (metrics.contrastFailures.length) issue.push("contrast");
      results.push({ key, width, issue, metrics });
      if (issue.length) failures.push({ key, width, issue, detail: metrics });
      if (!process.env.SKIP_SCREENSHOTS && !process.env.CAPTURE_GALLERY_ONLY && ["enquiryAck", "offerLetter", "invoiceIssued", "buildWhatsNext", "meetingConfirmed"].includes(key) && [320, 600].includes(width)) {
        await page.screenshot({ path: `${output}/screenshots/${key}-${width}.png`, fullPage: true });
      }
    }
    // Inline fallback: strip the head CSS/webfonts, as restrictive clients do.
    await page.setViewportSize({ width: 320, height: 900 });
    await page.setContent(html.replace(/<style>[\s\S]*?<\/style>/g, ""), { waitUntil: "networkidle" });
    const fallbackOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    results.push({ key, width: 320, mode: "inline-only fallback", issue: fallbackOverflow ? ["horizontal overflow"] : [] });
    if (fallbackOverflow) failures.push({ key, width: 320, mode: "inline-only fallback" });
  }
  assert.deepEqual(pageErrors, [], "fixture runtime errors");
  await page.close();

  const gallery = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  pageErrors = [];
  gallery.on("pageerror", error => pageErrors.push(error.message));
  const mutations = [];
  await gallery.route("**/*", route => {
    // Root analytics is inherited; block external requests separately from
    // site mutations so a GA beacon is not mistaken for an email submission.
    if (new URL(route.request().url()).origin !== new URL(base).origin) return route.abort();
    if (!["GET", "HEAD"].includes(route.request().method())) { mutations.push(route.request().url()); return route.abort(); }
    return route.continue();
  });
  const response = await gallery.goto(`${base}/email-preview`, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200, "local gallery loads");
  assert.equal(await gallery.locator('#review-template option').count(), samples.length);
  assert.equal(await gallery.locator("iframe").getAttribute("sandbox"), "");
  for (const sample of samples) {
    await gallery.locator("#review-template").selectOption(sample.key);
    await gallery.getByRole("heading", { name: sample.label, exact: true }).waitFor();
    const doc = await gallery.locator("iframe").getAttribute("srcdoc");
    assert(doc.includes("Savo v7 correspondence"));
    assert(doc.includes(`mailto:${sample.dept === "hr" ? "hr" : "hello"}@savotechnologies.com`));
  }
  const settleFrame = async () => {
    const body = gallery.frameLocator("iframe").locator(".mail-body");
    await body.waitFor({ state: "visible" });
    await body.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode())); });
    assert((await body.innerText()).length > 50, "frame body is rendered, not a font-loading blank");
  };
  await gallery.locator("#review-template").selectOption("offerLetter");
  await gallery.getByRole("button", { name: "Phone · 320px" }).click();
  assert.equal(Math.round((await gallery.locator("iframe").boundingBox()).width), 320);
  await gallery.getByRole("button", { name: "Plain text", exact: true }).click();
  assert((await gallery.locator("pre").innerText()).includes("Compensation:"));
  await gallery.getByRole("button", { name: "Design", exact: true }).click();
  await gallery.getByRole("button", { name: "Desktop", exact: true }).click();
  await settleFrame();
  if (!process.env.SKIP_SCREENSHOTS) await gallery.screenshot({ path: `${output}/screenshots/gallery-desktop.png`, fullPage: true });
  await gallery.setViewportSize({ width: 390, height: 844 });
  await gallery.getByRole("button", { name: "Phone · 320px" }).click();
  assert.equal(await gallery.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await settleFrame();
  // Chromium can omit offscreen iframe painting in a full-page capture.
  // Capture the actual scrolled phone viewport, with the preview in view.
  await gallery.locator("iframe").scrollIntoViewIfNeeded();
  // Font readiness doesn't flush the separate sandbox-frame compositor.
  // Bounded paint settling prevents a false blank capture after scrolling.
  await gallery.waitForTimeout(300);
  if (!process.env.SKIP_SCREENSHOTS) await gallery.screenshot({ path: `${output}/screenshots/gallery-mobile.png` });
  await gallery.locator("#review-dept").selectOption("hr");
  assert.equal(await gallery.locator('#review-template option').count(), samples.filter(s => s.dept === "hr").length);
  assert.equal(await gallery.locator("button[type=submit],form").count(), 0);
  assert.deepEqual(mutations, [], "review must not mutate/send");
  assert.deepEqual(pageErrors, [], "gallery runtime errors");

  await writeFile(`${output}/browser-report.json`, JSON.stringify({ samples: samples.length, results, failures, mutations }, null, 2));
  assert.deepEqual(failures, [], "email layout/contrast checks failed; see browser-report.json");
  console.log(`PASS: ${results.length} email layout checks; ${samples.length} gallery templates; responsive, inline fallback, contrast, fonts, logo, departments and no-send review.`);
} finally {
  await browser.close();
}
