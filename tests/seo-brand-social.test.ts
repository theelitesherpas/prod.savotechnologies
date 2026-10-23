import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SITE } from "@/constants/site";
import { openGraphFor, socialImageFor } from "@/lib/seo";

describe("brand identity and page-specific share metadata", () => {
  it("describes the brand and service clearly without a rankings guarantee", () => {
    const root = readFileSync("src/app/layout.tsx", "utf8");
    expect(root).toContain('const HOME_TITLE = "Savo Technologies | Web, Mobile & AI Development Company"');
    expect(root).toContain("const HOME_DESCRIPTION = SITE.description;");
    expect(SITE.description).toBe("Savo Technologies builds websites, mobile apps, AI solutions and agents, business automation, custom software and SaaS products for ambitious businesses.");
    expect(root).toContain('alternates: { canonical: absoluteUrl("/") }');
    expect(root).toContain("url: absoluteUrl(\"/\")");
    expect(root).not.toContain("Savo Technologies (Savo) | Web, Mobile & AI Development Company");
    expect(root).not.toMatch(/best company|number one|top-ranked/i);
    expect(root).not.toContain("Savo Technologies | Web, Mobile, AI & Software Development Company");
  });

  it("associates Savo with Savo Technologies once in natural homepage copy", () => {
    const brandStatement = readFileSync("src/sections/home/brand-statement.tsx", "utf8");
    expect(brandStatement).toContain("Savo Technologies—Savo for short—believes a better product");
    expect(brandStatement).not.toMatch(/\bSAVO\b/);
  });

  it("uses one explicit organization entity with the Savo alias and first-party identity", () => {
    const layout = readFileSync("src/app/(site)/layout.tsx", "utf8");
    expect(layout).toContain('name: SITE.name');
    expect(layout).toContain("alternateName: [SITE.shortName, SITE.legalName, SITE.legalNameShort]");
    expect(layout).toContain("disambiguatingDescription:");
    expect(layout).toContain("sameAs: SOCIAL_LINKS.map((s) => s.href)");
    expect(layout).toContain('"@type": "WebSite"');
    expect(layout).toContain("alternateName: SITE.shortName");
    expect(SITE.shortName).toBe("Savo");
  });

  it("uses supplied homepage artwork and keeps generated cards for unmatched pages", () => {
    const home = socialImageFor("Savo Technologies | Web, App & AI", "Digital products from Indore.", "/");
    const indore = socialImageFor("Web Development in Indore | Savo Technologies", "Website and app engineering.", "/locations/indore");
    const homeUrl = new URL(home.url, "https://savotechnologies.com");
    const localUrl = new URL(indore.url, "https://savotechnologies.com");
    expect(homeUrl.pathname).toBe("/images/og/savo-og-home.png");
    expect(localUrl.pathname).toBe("/share-image");
    expect(homeUrl.searchParams.get("v")).toMatch(/^[a-f0-9]{12}$/);
    expect(localUrl.searchParams.get("page")).toBe("/locations/indore");
    expect(localUrl.searchParams.get("title")).toContain("Indore");
    expect(localUrl.searchParams.get("v")).toBe("2");
    expect(home.width).toBe(1734);
    expect(home.height).toBe(907);
    expect(indore.alt).toContain("Indore");
    expect(openGraphFor({ title: "Services | Savo Technologies", description: "Web and app services.", url: "/services" }).images[0].url).toContain("/images/og/savo-og-services.png?v=");
  });

  it("preserves authored page artwork and meaningful alt text when supplied", () => {
    const og = openGraphFor({ title: "Insights", description: "An article.", url: "/insights/example", images: [{ url: "/images/article.webp", alt: "Article cover" }] });
    expect(og.images).toEqual([{ url: "/images/article.webp", alt: "Article cover" }]);
  });

  it("uses honest Indore and India comparison guidance rather than saying Savo is objectively best", () => {
    const indore = readFileSync("src/sections/indore/indore-content.ts", "utf8");
    expect(indore).toContain("How do I compare website development companies in Indore or across India?");
    expect(indore).toContain("best website development company or best website developers in Indore or India");
    expect(indore).toContain("What should I look for in a mobile app development company in Indore or India?");
    expect(indore).toContain("best mobile app development company");
    expect(indore).toContain("universal ranking");
  });

  it("defines Savo for answer engines and keeps location-market distinctions factual", () => {
    const llms = readFileSync("src/app/llms.txt/route.ts", "utf8");
    expect(llms).toContain("Savo is the short brand name for ${SITE.name}");
    expect(llms).toContain("Verified service markets include India, Switzerland, Dubai and the wider GCC, and the United States");
    expect(llms).not.toContain("best IT company");
  });
});
