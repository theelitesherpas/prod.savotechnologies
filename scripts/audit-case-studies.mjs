/**
 * DOM-level visual audit for /case-studies/ — covers what the eye would
 * check: chapter backgrounds, image decode, art overlays, type voices,
 * spacing rhythm, focus/hover states, and content integrity.
 */
import { chromium } from "playwright-core";

const BASE = "http://localhost:4311";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/case-studies`, { waitUntil: "load" });
await page.evaluate(async () => {
  const step = window.innerHeight * 0.6;
  for (let y = 0; y <= document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 350));
  }
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise((r) => setTimeout(r, 900));
});

const audit = await page.evaluate(() => {
  const out = [];
  const ok = (name, cond, detail = "") =>
    out.push(`${cond ? "✓" : "✗"} ${name}${cond ? "" : ` — ${detail}`}`);

  // Chapters: hero ink, disciplines paper, policy sand, cta vermilion
  const bg = (el) => getComputedStyle(el).backgroundColor;
  const hero = document.querySelector('[aria-labelledby="case-studies-heading"]');
  ok("hero is paper chapter (no chapter-ink scope)", !hero.className.includes("chapter-ink"), hero.className.toString().slice(0, 40));
  const h1col = getComputedStyle(document.getElementById("case-studies-heading")).color;
  ok("hero h1 is dark ink on paper", h1col === "rgb(23, 23, 26)", h1col);
  const cta = document.querySelector('[aria-labelledby="cs-cta-heading"]');
  ok("cta is vermilion chapter", bg(cta) === "rgb(232, 73, 15)", bg(cta));
  const policy = document.querySelector('[aria-labelledby="policy-heading"]');
  ok("policy band is ink chapter", bg(policy) === "rgb(16, 19, 25)", bg(policy));

  // Cards: 13 entries (3+3+3+2+2+2), all with art + tag + loaded photo
  const cards = document.querySelectorAll("main article");
  ok("15 specimen cards (3+3+3+2+2+2)", cards.length === 15, String(cards.length));
  let artOk = 0, tagOk = 0, imgOk = 0, duotoneOk = 0;
  cards.forEach((c) => {
    if (c.querySelector("svg[viewBox='0 0 800 500'] rect.fill-accent")) artOk++;
    if (c.textContent.includes("In preparation")) tagOk++;
    const img = c.querySelector("img");
    if (img && img.complete && img.naturalWidth > 0) imgOk++;
    if (img && (img.className || "").toString().includes("duotone")) duotoneOk++;
  });
  ok("all cards carry wireframe art", artOk === cards.length, `${artOk}/${cards.length}`);
  ok("all cards tagged In preparation", tagOk === cards.length, `${tagOk}/${cards.length}`);
  ok("all photos loaded", imgOk === cards.length, `${imgOk}/${cards.length}`);
  ok("all photos duotone", duotoneOk === cards.length, `${duotoneOk}/${cards.length}`);

  // Featured rhythm: web/mobile/ai have a wide 16/7 card first
  ["web", "mobile", "ai"].forEach((id) => {
    const sec = document.getElementById(id);
    const first = sec.querySelector("article .aspect-\\[16\\/7\\], article [class*='16/7']");
    ok(`${id} featured card is wide`, !!first);
  });

  // Type voices: h1 serif, t-label mono, body sans
  const h1 = document.getElementById("case-studies-heading");
  const h1Font = getComputedStyle(h1).fontFamily;
  ok("h1 uses serif voice", /Source Serif/i.test(h1Font), h1Font);
  const label = document.querySelector("main .t-label");
  ok("labels use mono voice", /Fragment Mono/i.test(getComputedStyle(label).fontFamily));
  ok("no code specimen on case studies", !document.querySelector("main pre code"));

  // Index board: 6 anchor cells with hover-invert wiring
  const board = document.querySelector('nav[aria-label="Case studies contents"]');
  const cells = board ? board.querySelectorAll("a") : [];
  ok("index board lists 6 discipline cells", cells.length === 6, String(cells.length));
  ok("index cells invert on hover", Array.from(cells).every((a) => a.className.includes("hover:bg-foreground")));
  const standards = document.querySelector('[aria-labelledby="case-studies-heading"]').textContent;
  ok("standard card present", standards.includes("The standard") && standards.includes("Outcomes verified before release"));

  // Single h1, sections labelled
  ok("single h1", document.querySelectorAll("main h1").length === 1);
  const h2s = document.querySelectorAll("main h2");
  ok("8 section headings (6 disciplines + policy + cta)", h2s.length === 8, String(h2s.length));

  // Placeholder honesty: no invented client names leaked from v1
  const text = document.body.textContent;
  ["MediBridge", "GulfPay", "Sahm", "RideLink", "ClearLedger", "InsightIQ"].forEach((n) => {
    ok(`no fabricated client "${n}"`, !text.includes(n));
  });
  ok("outcome placeholders present", Array.from(document.querySelectorAll("main article .t-caption")).filter((p) => p.textContent.includes("Verified project result required")).length === 15);

  // Focus visible on a contents link
  const link = cells[0];
  link.focus();
  ok("index cell keyboard-focusable", document.activeElement === link);

  // JSON-LD present
  ok("JSON-LD WebPage + Breadcrumb", !!Array.from(document.querySelectorAll('script[type="application/ld+json"]')).find((s) => s.textContent.includes("BreadcrumbList")));

  return out;
});

for (const line of audit) console.log(line);

/* Homepage integration */
await page.goto(BASE, { waitUntil: "load" });
const link = await page.evaluate(() => {
  const a = document.querySelector('main a[href^="/case-studies"]');
  return a ? { text: a.textContent.trim().slice(0, 60), href: a.getAttribute("href") } : null;
});
console.log(link ? `✓ homepage links to dossier: "${link.text}"` : "✗ homepage dossier link missing");

/* llms-full + sitemap */
const llms = await (await fetch(`${BASE}/llms-full.txt`)).text();
console.log(llms.includes("Case studies page") && llms.includes("Editorial policy") ? "✓ llms-full.txt carries case-studies facts" : "✗ llms-full.txt missing section");
const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
console.log(sm.includes("/case-studies") ? "✓ sitemap lists /case-studies" : "✗ sitemap missing entry");

await browser.close();
