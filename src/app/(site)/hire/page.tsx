import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { getManagedHireRoles } from "@/lib/content-items";
import { HireHero, HireDirectory, HireModels, HireSteps, CrewBand } from "@/sections/hire/hire-index";
import { DetailCta } from "@/components/shared/detail-cta";
import { openGraphFor } from "@/lib/seo";

/**
 * Hire Resources - the roles catalogue. The v1 dedicated-hiring model
 * (48h matching, two week paid trial, transparent monthly rates) in the
 * v6 document language. Process facts and rates only - no invented
 * performance figures or clients.
 */

const DESCRIPTION = `Hire vetted AI, frontend, backend, full stack, mobile and DevOps engineers from Savo Technologies. Matched in 48 hours, two week paid trial, transparent monthly rates, dedicated seniors only.`;

export const metadata: Metadata = {
  title: "Hire Developers",
  description: DESCRIPTION,
  alternates: { canonical: "/hire" },
  openGraph: openGraphFor({ title: "Hire Developers | Savo Technologies", description: DESCRIPTION, url: "/hire" }),
};

export default async function HirePage() {
  const HIRE_ROLES = await getManagedHireRoles();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/hire/#webpage"),
        url: absoluteUrl("/hire"),
        name: "Hire Developers | Savo Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Hire Resources", item: absoluteUrl("/hire") },
        ],
      },
      {
        "@type": "ItemList",
        name: "Hireable roles",
        itemListElement: HIRE_ROLES.map((r, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `Hire ${r.title}`,
          url: absoluteUrl(`/hire/${r.slug}`),
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

      <HireHero />
      <HireDirectory roles={HIRE_ROLES} />
      <HireModels />
      <HireSteps roles={HIRE_ROLES} />
      <CrewBand variant="index" />

      <DetailCta
        headingId="hire-cta-heading"
        heading="A senior in your standup within two weeks."
        lead="Tell us the role, the stack and the mission. Profiles land within 48 hours, and the first two weeks stay reversible."
        location="hire-cta"
        secondaryLabel="Explore Services"
        secondaryHref="/services"
      />
    </>
  );
}
