import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { SERVICE_DETAILS } from "@/constants/services-detail";
import { ServicesDirectory } from "@/sections/services/services-directory";
import { DetailCta } from "@/components/shared/detail-cta";
import { openGraphFor } from "@/lib/seo";

/**
 * Services - the catalogue. Ten services, one standard; each row opens
 * its service chapter. Capability copy only (PRODUCT.md hard rule).
 */

const DESCRIPTION = `Services from Savo Technologies: web development, mobile apps, UI/UX design, cloud and DevOps, data and analytics, AI agent development, custom software, digital marketing and SEO, QA and product engineering. One team, end to end.`;

export const metadata: Metadata = {
  title: "Services",
  description: DESCRIPTION,
  alternates: { canonical: "/services" },
  openGraph: openGraphFor({ title: "Services | Savo Technologies", description: DESCRIPTION, url: "/services" }),
};

export default function ServicesPage() {
  // Mirrors visible content: the page and its ten services.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/services/#webpage"),
        url: absoluteUrl("/services"),
        name: "Services | Savo Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Services", item: absoluteUrl("/services") },
        ],
      },
      {
        "@type": "ItemList",
        name: "Services",
        itemListElement: SERVICE_DETAILS.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: s.title,
          url: absoluteUrl(`/services/${s.slug}`),
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

      <ServicesDirectory />

      <DetailCta
        headingId="services-cta-heading"
        heading="Not sure which service you need?"
        lead="Describe the problem in plain words, we'll tell you which chapter it belongs in, and what the first slice looks like. No charge for the map."
        location="services-cta"
        secondaryLabel="Explore Industries"
        secondaryHref="/industries"
      />
    </>
  );
}
