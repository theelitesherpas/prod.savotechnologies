import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { StartProjectButton } from "@/components/shared/start-project-button";
import { ClosingCta } from "@/components/shared/closing-cta";
import { TECHNOLOGY_FAQS } from "@/sections/technology/technology-content";
import { TechnologyArchitecture, TechnologyHero, TechnologyQuestions, TechnologyStack } from "@/sections/technology/technology-sections";
import s from "@/sections/technology/technology.module.css";

/** THESIS: Technology choices explained, not another logo wall or legacy dossier.
 * OWN-WORLD: User-pinned Savo homepage identity: Outfit/Inter, white/grey/black/red.
 * STORY: See the layers → explore six stack families → understand six decisions → ask.
 * FIRST VIEWPORT: Grey canvas, headline/actions left, aligned product-layer art right.
 * FORM: User delegated the homepage/Enterprise layout after surface seed 4dda468d;
 * no further choice gate or replacement identity. Native radios and disclosures.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. */
export const metadata: Metadata = {
  title: "Technology & Architecture",
  description: "How Savo Technologies chooses technology and architecture: what each stack is for, why we use it, where it fits, and when simpler is better. Judgment over buzzwords.",
  alternates: { canonical: "/technology" },
  openGraph: openGraphFor({ title: "Technology & Architecture | Savo Technologies", description: "How technology and architecture decisions are made at Savo Technologies.", url: "/technology" }),
};

export default function TechnologyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": absoluteUrl("/technology/#webpage"), url: absoluteUrl("/technology"), name: "Technology & Architecture | Savo Technologies", description: metadata.description, isPartOf: { "@id": absoluteUrl("/#website") } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Technology", item: absoluteUrl("/technology") }] },
      { "@type": "FAQPage", mainEntity: TECHNOLOGY_FAQS.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) },
    ],
  };
  return <div className={s.page} data-technology-page="stack-and-judgment" data-design-contract="4dda468d: User-pinned homepage identity; grey offer and aligned layer illustration; six complete native stack briefs; six visible architecture decisions on black; native FAQs; shared grey close. Code-led, no new visual world.">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <TechnologyHero />
    <TechnologyStack />
    <TechnologyArchitecture />
    <TechnologyQuestions />
    <ClosingCta headingId="tech-cta-heading" title="Have a stack decision you are unsure about?" description="Bring the problem, your current stack or the decision you are weighing up. Let's look at the trade-offs before you commit."><StartProjectButton source="technology-cta" label="Ask an engineer" /></ClosingCta>
  </div>;
}
