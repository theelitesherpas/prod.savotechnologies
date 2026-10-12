import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const base = process.env.BASE_URL || "http://localhost:4312";
const output = process.env.SEO_REVIEW_DIR || "tmp/seo-share";
const routes = [
  { path: "/", section: "OFFICIAL WEBSITE" },
  { path: "/about", section: "WHO WE ARE" },
  { path: "/services", section: "SERVICES" },
  { path: "/services/web-development", section: "WEB DEVELOPMENT" },
  { path: "/locations/indore", section: "INDORE, INDIA" },
  { path: "/locations/switzerland", section: "SWITZERLAND" },
  { path: "/enterprise", section: "ENTERPRISE" },
  { path: "/industries/fintech", section: "INDUSTRIES" },
];
const browser = await chromium.launch();
const report = [];
await mkdir(`${output}/screenshots`, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  for (const target of routes) {
    const response = await page.goto(new URL(target.path, base).href, { waitUntil: "networkidle" });
    assert(response && response.status() === 200, `${target.path} route`);
    const metadata = await page.evaluate(() => ({
      title: document.querySelector('meta[property="og:title"]')?.getAttribute("content"),
      description: document.querySelector('meta[property="og:description"]')?.getAttribute("content"),
      metaDescription: document.querySelector('meta[name="description"]')?.getAttribute("content"),
      image: document.querySelector('meta[property="og:image"]')?.getAttribute("content"),
      imageAlt: document.querySelector('meta[property="og:image:alt"]')?.getAttribute("content"),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute("content"),
      siteName: document.querySelector('meta[property="og:site_name"]')?.getAttribute("content"),
      twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute("content"),
      twitterTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute("content"),
      twitterDescription: document.querySelector('meta[name="twitter:description"]')?.getAttribute("content"),
      twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute("content"),
    }));
    assert(metadata.title && metadata.description, `${target.path} page-specific Open Graph text`);
    assert(metadata.image, `${target.path} has a page-relevant share image`);
    assert(metadata.imageAlt && metadata.imageAlt.trim().length > 8, `${target.path} has accessible share-image alt`);
    assert.equal(new URL(metadata.canonical).pathname, target.path, `${target.path} canonical`);
    assert.equal(metadata.ogUrl, metadata.canonical, `${target.path} Open Graph URL matches canonical`);
    assert.equal(metadata.siteName, "Savo Technologies");
    assert.equal(metadata.twitterCard, "summary_large_image");
    assert.equal(metadata.twitterTitle, metadata.title, "X/Twitter should match this page's title");
    assert.equal(metadata.twitterDescription, metadata.description, "X/Twitter should match this page's description");
    assert.equal(metadata.twitterImage, metadata.image, "X/Twitter should match this page's relevant share image");

    if (target.path === "/") {
      assert.equal(metadata.title, "Savo Technologies | Web, Mobile & AI Development Company");
      assert.equal(metadata.metaDescription, "Savo Technologies builds websites, mobile apps, AI solutions and agents, business automation, custom software and SaaS products for ambitious businesses.");
      assert.equal(new URL(metadata.canonical).origin, "https://savotechnologies.com");
      assert.equal(new URL(metadata.canonical).pathname, "/");
      const audit = await page.evaluate(() => {
        const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')].map(script => JSON.parse(script.textContent || "null"));
        const entities = [];
        const visit = value => {
          if (!value || typeof value !== "object") return;
          if (Array.isArray(value)) return value.forEach(visit);
          if (value["@type"]) entities.push(value);
          Object.values(value).forEach(visit);
        };
        blocks.forEach(visit);
        return {
          titleCount: document.querySelectorAll("title").length,
          descriptionCount: document.querySelectorAll('meta[name="description"]').length,
          canonicalCount: document.querySelectorAll('link[rel="canonical"]').length,
          h1: [...document.querySelectorAll("main h1")].map(node => node.textContent?.trim()),
          brandAssociation: document.querySelector("main")?.innerText.includes("Savo Technologies—Savo for short—believes a better product"),
          landmarks: { header: document.querySelectorAll("header").length, main: document.querySelectorAll("main").length, footer: document.querySelectorAll("footer").length },
          organizations: entities.filter(entity => entity["@type"] === "Organization"),
          websites: entities.filter(entity => entity["@type"] === "WebSite"),
        };
      });
      assert.equal(audit.titleCount, 1, "one homepage document title");
      assert.equal(audit.descriptionCount, 1, "one homepage meta description");
      assert.equal(audit.canonicalCount, 1, "one homepage canonical");
      assert.equal(audit.h1.length, 1, "one primary homepage H1");
      assert.equal(audit.h1[0], "We turn bold ideas into digital products built to grow.");
      assert.equal(audit.brandAssociation, true, "homepage text naturally explains the short brand name");
      assert.equal(audit.organizations.length, 1, "one Organization schema entity");
      assert.equal(audit.websites.length, 1, "one WebSite schema entity");
      assert.equal(audit.organizations[0].name, "Savo Technologies");
      assert.deepEqual(audit.organizations[0].alternateName, ["Savo", "Savo Technologies Private Limited", "Savo Technologies Pvt Ltd"]);
      assert.equal(audit.organizations[0].legalName, "Savo Technologies Private Limited");
      assert.equal(audit.websites[0].name, "Savo Technologies");
      assert.equal(audit.websites[0].alternateName, "Savo");
      assert.equal(audit.websites[0].publisher["@id"], audit.organizations[0]["@id"]);
      assert.deepEqual(audit.landmarks, { header: 1, main: 1, footer: 1 });
    }

    const imageUrl = new URL(metadata.image);
    const localImage = new URL(`${imageUrl.pathname}${imageUrl.search}`, base).href;
    const imageResponse = await page.request.get(localImage);
    assert.equal(imageResponse.status(), 200, `${target.path} image response`);
    assert.match(imageResponse.headers()["content-type"], /^image\//);
    const image = await imageResponse.body();
    assert(image.length > 8_000, `${target.path} non-empty image`);
    if (imageUrl.pathname === "/share-image") {
      assert.match(imageResponse.headers()["content-type"], /image\/png/);
      assert.equal(image.readUInt32BE(16), 1200, "OG card width");
      assert.equal(image.readUInt32BE(20), 630, "OG card height");
      assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "PNG signature");
    } else {
      assert.match(imageUrl.pathname, /^\/images\//, "a page-specific photo asset, not another page's fallback");
      const dimensions = await page.evaluate(src => new Promise(resolve => { const img = new Image(); img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight }); img.onerror = () => resolve(null); img.src = src; }), localImage);
      assert(dimensions && dimensions.width > 600 && dimensions.height > 300, `${target.path} page artwork dimensions`);
    }

    if (imageUrl.pathname === "/share-image" && ["/", "/services/web-development", "/locations/indore", "/locations/switzerland"].includes(target.path)) {
      await page.setViewportSize({ width: 1200, height: 630 });
      await page.goto(localImage, { waitUntil: "networkidle" });
      const screenshotName = target.path === "/" ? "home" : target.path.replace(/^\//, "").replaceAll("/", "_");
      await page.screenshot({ path: `${output}/screenshots/${screenshotName}.png` });
      await page.setViewportSize({ width: 1440, height: 960 });
    }
    report.push({ path: target.path, ...metadata, imageBytes: image.length });
  }

  const uniqueImages = new Set(report.map(row => row.image));
  assert.equal(uniqueImages.size, routes.length, "each route has its own page/title/path-aware image URL");
  const llms = await page.request.get(new URL("/llms.txt", base).href);
  assert.equal(llms.status(), 200);
  const llmsText = await llms.text();
  assert(llmsText.includes("Savo is the short brand name for Savo Technologies"));
  assert(llmsText.includes("Verified service markets include India, Switzerland, Dubai and the wider GCC, and the United States"));
  const fullLlms = await page.request.get(new URL("/llms-full.txt", base).href);
  assert.equal(fullLlms.status(), 200);
  assert((await fullLlms.text()).includes('"Savo" is the short brand name for Savo Technologies'));
  const locationHtml = await (await page.request.get(new URL("/locations/indore", base).href)).text();
  for (const phrase of ["best website development company", "best website developers in Indore or India", "best mobile app development company", "best IT company in Indore"]) assert(locationHtml.includes(phrase), `Indore/India comparison content includes ${phrase}`);

  await writeFile(`${output}/report.json`, JSON.stringify({ base, routes: report, uniquePageImages: uniqueImages.size }, null, 2));
  console.log(`PASS: ${routes.length} route-specific social cards (1200×630 PNG), unique metadata/image URLs, brand/entity identity and Indore/India service queries.`);
} finally {
  await browser.close();
}
