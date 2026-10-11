import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { StartProjectButton } from "@/components/shared/start-project-button";
import { ClosingCta } from "@/components/shared/closing-cta";
import { TRUST_FAQS } from "@/sections/trust/trust-content";
import { TrustConfidentiality, TrustHandover, TrustHero, TrustOwnership, TrustQuestions, TrustRatings, TrustSecurity } from "@/sections/trust/trust-sections";
import s from "@/sections/trust/trust.module.css";

/** THESIS: Clear ownership and inspectable working practices, not decorative credentials.
 * OWN-WORLD: User-pinned homepage/Technology Outfit/Inter, grey/white/black/red identity.
 * STORY: Ownership → confidentiality → security/boundaries → handover → questions.
 * FIRST VIEWPORT: Original ownership headline/actions left; labelled asset packet right.
 * FORM: Direct user-pinned continuation of the approved page family; no new world or
 * layout-choice gate. All policy records visible; native FAQ, existing project modal.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. */
export const metadata: Metadata = {
  title: "Trust & Security",
  description: "How Savo Technologies handles confidentiality, NDAs, source code ownership, intellectual property, access control, environments, security and handover. Your product remains yours.",
  alternates: { canonical: "/trust" },
  openGraph: openGraphFor({ title: "Trust & Security | Savo Technologies", description: "Confidentiality, source code ownership, IP, access control and security practices at Savo Technologies. Your product remains yours.", url: "/trust" }),
};

export default function TrustPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": absoluteUrl("/trust/#webpage"), url: absoluteUrl("/trust"), name: "Trust & Security | Savo Technologies", description: metadata.description, isPartOf: { "@id": absoluteUrl("/#website") } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Trust & Security", item: absoluteUrl("/trust") }] },
      { "@type": "FAQPage", mainEntity: TRUST_FAQS.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) },
    ],
  };
  return <div className={s.page} data-trust-page="ownership-and-working-practices" data-design-contract="trust-v7: Direct user-pinned Savo page family. Grey ownership offer and illustrative asset packet; complete ownership, confidentiality and security records; conspicuous certification boundary; handover; native FAQ; original shared grey close.">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <TrustHero />
    <TrustOwnership />
    <TrustConfidentiality />
    <TrustSecurity />
    <TrustRatings />
    <TrustHandover />
    <TrustQuestions />
    <ClosingCta headingId="trust-cta-heading" title="Have a security questionnaire?" description={<>Send it over. We answer precisely: what we do, what we do not do, and what your engagement contract specifies. Enterprise and procurement teams can read more on the <Link href="/enterprise" className="underline underline-offset-4">enterprise page</Link> or in <Link href="/insights" className="underline underline-offset-4">our published insights</Link>.</>}><StartProjectButton source="trust-cta" label="Talk to a senior consultant" /></ClosingCta>
  </div>;
}
