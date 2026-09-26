import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { HIRE_ROLES } from "@/constants/hire";
import { getManagedHireRoles } from "@/lib/content-items";
import { serviceDetail } from "@/constants/services-detail";
import {
  HireRoleHero,
  HireRoleIntro,
  HireRoleEngagements,
  HireRoleWhy,
  HireRoleFaqs,
  HireRoleCrossLinks,
} from "@/sections/hire/hire-detail";
import { HireRoleProcess } from "@/sections/hire/hire-role-process";
import { CrewBand } from "@/sections/hire/crew-band";
import { DetailCta } from "@/components/shared/detail-cta";

/**
 * Hire role chapters - one route per role. The published model (rates,
 * trial, replacement) with v6 content rules: no invented clients,
 * testimonials or unverified performance figures.
 */

export function generateStaticParams() {
  return HIRE_ROLES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const role = (await getManagedHireRoles()).find((r) => r.slug === slug);
  if (!role) return {};
  return {
    title: `Hire ${role.title}`,
    description: role.metaDescription,
    alternates: { canonical: `/hire/${role.slug}` },
    openGraph: openGraphFor({
      title: `Hire ${role.title} | Savo Technologies`,
      description: role.metaDescription,
      url: `/hire/${role.slug}`,
    }),
  };
}

export default async function HireRolePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const allRoles = await getManagedHireRoles();
  const role = allRoles.find((r) => r.slug === slug);
  if (!role) notFound();
  const resolveRole = (slug: string) => allRoles.find((r) => r.slug === slug);

  const relatedRoles = role.related
    .map(resolveRole)
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({ label: r.title, hint: `${r.tagline}.`, href: `/hire/${r.slug}` }));
  const svc = serviceDetail(role.iconSlug);
  const serviceLink = svc
    ? { label: svc.title, hint: svc.tagline.replace(/\.$/, ""), href: `/services/${svc.slug}` }
    : { label: "All services", hint: "The project route", href: "/services" };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": absoluteUrl(`/hire/${role.slug}/#service`),
        name: `Hire ${role.title}`,
        description: role.metaDescription,
        provider: { "@id": absoluteUrl("/#organization") },
        url: absoluteUrl(`/hire/${role.slug}`),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Hire Resources", item: absoluteUrl("/hire") },
          { "@type": "ListItem", position: 3, name: role.title, item: absoluteUrl(`/hire/${role.slug}`) },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: role.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
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

      <HireRoleHero role={role} />
      <HireRoleIntro role={role} />
      <HireRoleEngagements role={role} />
      <HireRoleProcess role={role} />
      <HireRoleWhy role={role} />
      <HireRoleFaqs role={role} />
      <HireRoleCrossLinks roles={relatedRoles} service={serviceLink} />
      <CrewBand variant={role.slug} />

      <DetailCta
        headingId={`hire-role-cta-${role.slug}`}
        heading={`Ready to hire ${role.short.toLowerCase()}?`}
        lead="One 30 minute call, stack, mission, start date. Matched profiles in 48 hours, and the two week trial keeps it reversible."
        location={`hire-${role.slug}-cta`}
      />
    </>
  );
}
