import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { CASE_DISCIPLINES } from "@/constants/case-studies";
import { CaseStudiesHero } from "@/sections/case-studies/case-studies-hero";
import { DisciplineSection } from "@/sections/case-studies/discipline-sections";
import { EditorialPolicy } from "@/sections/case-studies/editorial-policy";
import { CaseStudiesCta } from "@/sections/case-studies/closing-cta";
import { openGraphFor } from "@/lib/seo";

/**
 * Case studies — the dossier, filed by discipline. Web development, mobile
 * products, AI & intelligent systems, software & SaaS, product & experience
 * design and growth; each entry is an honest slot in preparation until a
 * verified engagement publishes (PRODUCT.md hard content rule).
 */

const DESCRIPTION = `Case studies from Savo Technologies, filed by discipline: web development, mobile products, AI and intelligent systems, software and SaaS, product design and growth. Published only with verified outcomes.`;

export const metadata: Metadata = {
  title: "Case Studies",
  description: DESCRIPTION,
  alternates: { canonical: "/case-studies" },
  openGraph: openGraphFor({ title: "Case Studies | Savo Technologies", description: DESCRIPTION, url: "/case-studies" }),
};

export default function CaseStudiesPage() {
  // Mirrors visible content: the page exists, its disciplines and its
  // editorial policy. No client entities are asserted while entries are
  // in preparation.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/case-studies/#webpage"),
        url: absoluteUrl("/case-studies"),
        name: "Case Studies | Savo Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
        about: CASE_DISCIPLINES.map((d) => d.title),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Case Studies", item: absoluteUrl("/case-studies") },
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

      {/* 01 — Ink hero: statement, honest facts, the dossier specimen, contents */}
      <CaseStudiesHero />

      {/* 02–07 — The six discipline chapters */}
      {CASE_DISCIPLINES.map((discipline) => (
        <DisciplineSection key={discipline.id} discipline={discipline} />
      ))}

      {/* 08 — Editorial policy (sand band) */}
      <EditorialPolicy />

      {/* Closing — the vermilion moment */}
      <CaseStudiesCta />
    </>
  );
}
