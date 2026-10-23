import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

// Public GET-only journeys. No database access, applications, messages or emails.
const base = process.env.BASE_URL ?? 'http://localhost:4340';
const url = new URL(base);
assert(['localhost', '127.0.0.1'].includes(url.hostname) || (process.env.PUBLIC_LIVE_SMOKE === '1' && url.origin === 'https://savotechnologies.com'), 'Use localhost, or explicitly opt into the canonical public GET-only smoke.');
const output = process.env.CAPTURE_DIR ?? '.impeccable/review/careers-flow';
mkdirSync(output, { recursive: true });
const checks = [], errors = [], blockedWrites = [];
const check = (ok, label) => { assert(ok, label); checks.push(label); };
const capture = async (page, name) => { const path = `${output}/${name}.png`; if (process.env.REUSE_CAPTURES !== '1' || !existsSync(path)) await page.screenshot({ path, fullPage: false }); };
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  for (const width of [1440, 768, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.route('**/*', route => {
      if (!['GET', 'HEAD'].includes(route.request().method())) { blockedWrites.push(route.request().url()); return route.fulfill({ status: 204, body: '' }); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/careers#openings`, { waitUntil: 'networkidle' });
    const jobs = page.locator('#openings article');
    const count = await jobs.count();
    check(count > 1, `${width}: multiple published roles available`);
    check(await page.locator('[data-careers-page="workspace"] form').count() === 0, `${width}: no application form on the jobs directory`);
    check(await page.locator('#openings input[type="radio"]').count() === 0, `${width}: no select-and-scroll role picker`);
    const names = await jobs.locator('h3').allTextContents();
    const hrefs = await jobs.getByRole('link', { name: /^Apply now for / }).evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    check(hrefs.length === count && new Set(hrefs).size === count, `${width}: every job has a distinct Apply now destination`);
    const first = jobs.first();
    if (await first.locator('details').count()) {
      await first.locator('summary').click();
      check(await first.getByRole('heading', { name: /What you (will do|bring)/ }).first().isVisible(), `${width}: role details expand beside the same job`);
    }
    await capture(page, `jobs-${width}`);
    for (const index of [0, count - 1]) {
      await page.getByRole('link', { name: `Apply now for ${names[index]}`, exact: true }).click();
      await page.waitForURL(`${base}${hrefs[index]}`);
      await page.locator('#cr-role').waitFor();
      check(await page.locator('#cr-role').inputValue() === names[index], `${width}: ${names[index]} opens its correctly selected application`);
      check(await page.getByRole('heading', { name: 'Your application.', exact: true }).isVisible(), `${width}: dedicated application heading`);
      if (index === 0) {
        check(await page.locator('#cr-name').isVisible(), `${width}: full-name field available`);
        check(await page.locator('#cr-role').evaluate(element => element.getBoundingClientRect().right <= innerWidth - 20), `${width}: long role names do not clip the form`);
        check(await page.locator('#cr-name').evaluate(element => element.getBoundingClientRect().right <= innerWidth - 20), `${width}: personal-detail inputs fit the form`);
        if (width < 640) {
          const bounds = await page.locator('#cr-name').boundingBox();
          check(bounds.y + bounds.height < 900, `${width}: first personal-details field is above the fold`);
        }
        await capture(page, `apply-${width}`);
        await page.locator('#cr-city').click();
        await page.getByRole('listbox').getByRole('option').first().waitFor();
        check(await page.getByText('Popular cities', { exact: true }).isVisible(), `${width}: concise popular cities heading`);
        check(!await page.getByText(/Indore first/).count(), `${width}: no Indore-first annotation`);
        const choices = await page.getByRole('listbox').getByRole('option').allTextContents();
        check(['Indore', 'Delhi', 'Pune', 'Bengaluru'].every((city, i) => choices[i].includes(city)), `${width}: preferred city ordering retained`);
        check(await page.locator('#cr-city-help').evaluate(element => getComputedStyle(element).fontSize) === '11px', `${width}: city helper stays small`);
        await capture(page, `cities-${width}`);
        await page.locator('#cr-city').press('Escape');
        check(await page.getByText('Use “Anyone with the link can view” access.', { exact: true }).count() === 1, `${width}: short resume sharing guidance`);
      }
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: application has no horizontal overflow`);
      await page.getByRole('link', { name: 'Back to jobs' }).click();
      await page.waitForURL(`${base}/careers#openings`);
    }
    await page.getByRole('button', { name: 'Design', exact: true }).click();
    check(await page.getByRole('button', { name: 'Design', exact: true }).getAttribute('aria-pressed') === 'true', `${width}: team filter works`);
    await page.getByRole('button', { name: 'All roles', exact: true }).click();
    check(await page.locator('#openings article').count() === count, `${width}: clearing team filter restores all jobs`);
    await context.close();
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 900 } });
  const page = await noJs.newPage();
  await page.goto(`${base}/careers#openings`);
  check(await page.locator('#openings article').count() > 1, 'No-JS: complete published directory is visible');
  await page.locator('#openings article').first().locator('summary').click({ force: true });
  check(await page.locator('#openings article').first().getByRole('heading', { name: /What you (will do|bring)/ }).first().isVisible(), 'No-JS: native job details work');
  await page.locator('#openings article').first().getByRole('link', { name: /^Apply now for / }).click({ force: true });
  check(await page.locator('#cr-role').inputValue() !== 'General application', 'No-JS: direct application preselects the chosen role');
  check(await page.getByRole('button', { name: /Submit application/ }).isDisabled(), 'No-JS: application is not falsely submittable');
  await page.goto(`${base}/careers/apply?role=unavailable-smoke-opening`);
  check(await page.getByRole('heading', { name: 'This opening is unavailable.' }).isVisible() && await page.locator('[data-careers-page="apply"] form').count() === 0, 'Unavailable job never silently selects a different vacancy');
  check(errors.length === 0, `No JavaScript errors: ${errors.join('; ')}`);
  check(blockedWrites.every(value => ['/api/analytics/collect', '/g/collect'].includes(new URL(value).pathname)), 'Only automatic analytics writes intercepted; no application or message actions attempted');
} finally {
  await browser.close();
  writeFileSync(`${output}/report.json`, JSON.stringify({ base, checks, errors, blockedWrites, createdAt: new Date().toISOString() }, null, 2));
}
console.log(`${checks.length} public GET-only careers checks passed.`);
