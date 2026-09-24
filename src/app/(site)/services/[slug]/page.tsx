import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { SERVICE_DETAILS, serviceDetail } from "@/constants/services-detail";
import { INDUSTRIES_ATLAS } from "@/constants/industries";
import {
  ServiceDetailHero,
  ServiceOverview,
  ServiceFaqs,
  ServiceCrossLinks,
} from "@/sections/services/service-detail";
import { ServiceDeliverables } from "@/sections/services/service-workbench";
import { ServiceProcess } from "@/sections/services/service-process";
import { DetailCta } from "@/components/shared/detail-cta";
import { CrewBand } from "@/sections/hire/crew-band";

/**
 * Service chapters — one route per service from the catalogue. Rich,
 * honest capability content structured for discovery: service keyword
 * metadata, FAQPage JSON-LD for AEO, and cross-links into the industries
 * the work lands in.
 */

export function generateStaticParams() {
  return SERVICE_DETAILS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = serviceDetail(slug);
  if (!detail) return {};
  return {
    title: detail.title,
    description: detail.metaDescription,
    alternates: { canonical: `/services/${detail.slug}` },
    openGraph: openGraphFor({
      title: `${detail.title} | SAVO Technologies`,
      description: detail.metaDescription,
      url: `/services/${detail.slug}`,
    }),
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = serviceDetail(slug);
  if (!detail) notFound();

  const industries = detail.industries
    .map((id) => INDUSTRIES_ATLAS.find((i) => i.id === id))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
    .map((i) => ({ label: i.title, hint: i.hint, href: i.href }));
  const services = detail.related
    .map(serviceDetail)
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({ label: s.title, hint: s.tagline.replace(/\.$/, ""), href: `/services/${s.slug}` }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": absoluteUrl(`/services/${detail.slug}/#service`),
        name: detail.title,
        description: detail.metaDescription,
        provider: { "@id": absoluteUrl("/#organization") },
        url: absoluteUrl(`/services/${detail.slug}`),
        areaServed: INDUSTRIES_ATLAS.map((i) => i.title).slice(0, 3),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Services", item: absoluteUrl("/services") },
          { "@type": "ListItem", position: 3, name: detail.title, item: absoluteUrl(`/services/${detail.slug}`) },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: detail.faqs.map((f) => ({
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

      <ServiceDetailHero detail={detail} />
      <ServiceOverview detail={detail} />
      <ServiceDeliverables detail={detail} />
      <ServiceProcess detail={detail} />
      <ServiceFaqs detail={detail} />
      <ServiceCrossLinks industries={industries} services={services} />
      <CrewBand variant={detail.slug} />

      <DetailCta
        headingId="service-cta-heading"
        heading={`Need ${detail.title.toLowerCase()} that ships?`}
        lead="Tell us the problem and the constraints. We'll come back with an approach, a staged plan and an honest number — within days."
        location={`service-${detail.slug}-cta`}
      />
    </>
  );
}
