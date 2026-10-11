import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { buildSwissFaqs, buildSwissModel, swissDescription } from "@/sections/switzerland/swiss-content";
import { SwissSurface } from "@/sections/switzerland/swiss-sections";

const DESCRIPTION = swissDescription(buildSwissModel());
export const metadata: Metadata = {
  title: "Software & AI Development Company in Switzerland",
  description: DESCRIPTION,
  alternates: { canonical: "/locations/switzerland" },
  openGraph: openGraphFor({
    title: "Software & AI Development Company in Switzerland | Savo Technologies",
    description: DESCRIPTION,
    url: "/locations/switzerland",
  }),
};

/** Preserve the original SEO graph and native conversion destinations. */
export default function SwitzerlandPage() {
  const model = buildSwissModel();
  const faqs = buildSwissFaqs(model);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/locations/switzerland/#webpage"),
        url: absoluteUrl("/locations/switzerland"),
        name: "Software & AI Development Company in Switzerland",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
        about: { "@id": absoluteUrl("/#organization") },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Switzerland", item: absoluteUrl("/locations/switzerland") },
          ],
        },
      },
      {
        "@type": "FAQPage",
        "@id": absoluteUrl("/locations/switzerland/#faq"),
        mainEntity: faqs.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
      },
    ],
  };
  return <SwissSurface model={model} faqs={faqs}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /></SwissSurface>;
}
