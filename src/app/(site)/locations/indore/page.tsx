import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { buildIndoreFaqs, buildIndoreModel } from "@/sections/indore/indore-content";
import { IndoreSurface } from "@/sections/indore/indore-sections";

const DESCRIPTION = buildIndoreModel().address
  ? "Savo Technologies is a software development company headquartered in Indore, Madhya Pradesh. Web development, mobile apps, custom software and AI systems, delivered from our Indore engineering headquarters to clients across India."
  : "Explore web development, mobile apps, custom software and AI systems with Savo Technologies. Contact the team to confirm current office and delivery arrangements.";

export const metadata: Metadata = {
  title: "Software, Web & Mobile App Development Company in Indore",
  description: DESCRIPTION,
  alternates: { canonical: "/locations/indore" },
  openGraph: openGraphFor({
    title: "Software, Web & Mobile App Development Company in Indore | Savo Technologies",
    description: DESCRIPTION,
    url: "/locations/indore",
  }),
};

/** Original canonical/SEO graph and conversion destinations; new scoped server composition. */
export default function IndorePage() {
  const model = buildIndoreModel();
  const faqs = buildIndoreFaqs(model);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/locations/indore/#webpage"),
        url: absoluteUrl("/locations/indore"),
        name: "Software, Web & Mobile App Development Company in Indore",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
        about: { "@id": absoluteUrl("/#organization") },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Indore", item: absoluteUrl("/locations/indore") },
          ],
        },
      },
      {
        "@type": "FAQPage",
        "@id": absoluteUrl("/locations/indore/#faq"),
        mainEntity: faqs.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
      },
    ],
  };
  return <IndoreSurface model={model} faqs={faqs}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /></IndoreSurface>;
}
