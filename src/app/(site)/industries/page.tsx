import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { INDUSTRIES_ATLAS } from "@/constants/industries";
import { IndustriesHero } from "@/sections/industries/industries-hero";
import { IndustryAtlas } from "@/sections/industries/industry-atlas";
import { CommonStandard } from "@/sections/industries/common-standard";
import { IndustriesCta } from "@/sections/industries/closing-cta";
import { openGraphFor } from "@/lib/seo";

/**
 * Industries — the atlas. Ten sectors under one engineering standard;
 * each entry opens its own chapter at /industries/[slug]/ (detail pages
 * arrive next). Capability copy only — no invented clients or figures.
 */

const DESCRIPTION = `Industries served by Savo Technologies: healthcare, fintech, ecommerce, logistics, real estate, education, travel, manufacturing, government and energy. Sector-fluent teams, one engineering playbook across all ten.`;

export const metadata: Metadata = {
  title: "Industries",
  description: DESCRIPTION,
  alternates: { canonical: "/industries" },
  openGraph: openGraphFor({ title: "Industries | Savo Technologies", description: DESCRIPTION, url: "/industries" }),
};

export default function IndustriesPage() {
  // Mirrors visible content: the page exists and lists the ten sectors.
  // No client entities or results are asserted (PRODUCT.md hard rule).
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/industries/#webpage"),
        url: absoluteUrl("/industries"),
        name: "Industries | Savo Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
        about: INDUSTRIES_ATLAS.map((i) => i.title),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Industries", item: absoluteUrl("/industries") },
        ],
      },
      {
        "@type": "ItemList",
        name: "Industries served",
        itemListElement: INDUSTRIES_ATLAS.map((industry, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: industry.title,
          url: absoluteUrl(industry.href),
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 01: Paper hero: statement, coverage card, sector contents board */}
      <IndustriesHero />

      {/* 02: The atlas: ten sector rows, each opening its chapter */}
      <IndustryAtlas />

      {/* 03: The common standard (ink chapter) */}
      <CommonStandard />

      {/* Closing, the vermilion moment */}
      <IndustriesCta />
    </>
  );
}
