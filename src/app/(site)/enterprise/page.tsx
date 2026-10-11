import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { StartProjectButton } from "@/components/shared/start-project-button";
import { ClosingCta } from "@/components/shared/closing-cta";
import { EnterpriseDelivery, EnterpriseHero, EnterpriseModels, EnterpriseQuestions, EnterpriseVendorReview } from "@/sections/enterprise/enterprise-sections";
import { ENTERPRISE_FAQS } from "@/sections/enterprise/enterprise-content";
import s from "@/sections/enterprise/enterprise.module.css";

/** THESIS: A buyer's decision guide, not a second service catalogue.
 * OWN-WORLD: Approved Outfit/Inter, aligned black/white/red; grey offer and close.
 * STORY: Starting shape → review responsibilities → vendor questions → initiative.
 * FIRST VIEWPORT: Offer/action left; original priority/decision/delivery graphic right.
 * FORM: User-delegated engagement studio; surface seed 7fba3588. Manual native choices.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. */
export const metadata: Metadata = {
  title: "Enterprise",
  description: "Enterprise software with Savo Technologies: choose a working approach, clarify delivery responsibilities and prepare the information your vendor review needs.",
  alternates: { canonical: "/enterprise" },
  openGraph: openGraphFor({
    title: "Enterprise | Savo Technologies",
    description: "A practical starting point for enterprise software, engagement models, delivery review and procurement questions.",
    url: "/enterprise",
  }),
};

export default function EnterprisePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": absoluteUrl("/enterprise/#webpage"), url: absoluteUrl("/enterprise"), name: "Enterprise | Savo Technologies", description: metadata.description, isPartOf: { "@id": absoluteUrl("/#website") }, about: { "@id": absoluteUrl("/#organization") } },
      { "@type": "BreadcrumbList", itemListElement: [ { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Enterprise", item: absoluteUrl("/enterprise") } ] },
      { "@type": "FAQPage", mainEntity: ENTERPRISE_FAQS.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) },
    ],
  };
  return <div className={s.page} data-enterprise-page="decision-studio">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <EnterpriseHero/>
    <EnterpriseModels/>
    <EnterpriseDelivery/>
    <EnterpriseVendorReview/>
    <EnterpriseQuestions/>
    <ClosingCta headingId="enterprise-cta-heading" title="Have a complex technology challenge?" description="Bring the brief, the existing platform or simply the problem. We will help determine the most practical product and technical path - and tell you honestly if we are not the right partner for it.">
      <StartProjectButton source="enterprise-cta" label="Talk to a senior consultant" />
    </ClosingCta>
  </div>;
}
