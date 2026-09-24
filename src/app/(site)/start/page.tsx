import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { StartHero, StartBriefSection, WhatHappensNext } from "@/sections/start/start-hero";
import { openGraphFor } from "@/lib/seo";

/**
 * Start a Project — the detailed brief page. The drawer stays for quick
 * starts; this page is the full format: three steps, review, and the
 * defined reply path. Posts through the standard enquiry pipeline
 * (Zod, honeypot, rate limit, admin inbox).
 */

const DESCRIPTION = `Start a project with Savo Technologies. Send a detailed brief in two minutes. A senior engineer replies within one business day with scope, timeline and transparent pricing. Nothing binding.`;

export const metadata: Metadata = {
  title: "Start a Project",
  description: DESCRIPTION,
  alternates: { canonical: "/start" },
  openGraph: openGraphFor({ title: "Start a Project | Savo Technologies", description: DESCRIPTION, url: "/start" }),
};

export default function StartPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/start/#webpage"),
        url: absoluteUrl("/start"),
        name: "Start a Project | Savo Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Start a Project", item: absoluteUrl("/start") },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <StartHero />
      <StartBriefSection />
      <WhatHappensNext />
    </>
  );
}
