import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { INDUSTRY_DETAILS, industryDetail } from "@/constants/industry-details";
import { INDUSTRIES_ATLAS } from "@/constants/industries";
import { SERVICE_DETAILS, serviceDetail } from "@/constants/services-detail";
import {
  IndustryDetailHero,
  IndustryLandscape,
  IndustrySolutions,
  IndustryFlow,
  IndustryFaqs,
  IndustryCrossLinks,
} from "@/sections/industries/industry-detail";
import { DetailCta } from "@/components/shared/detail-cta";

/**
 * Industry chapters — one route per sector from the atlas. Rich, honest
 * capability content (PRODUCT.md hard rule) structured for discovery:
 * sector keyword-led metadata, FAQPage JSON-LD for AEO, and cross-links
 * into the services that carry the work.
 */

export function generateStaticParams() {
  return INDUSTRY_DETAILS.map((d) => ({ slug: d.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = industryDetail(slug);
  if (!detail) return {};
  return {
    title: `${detail.title} Software Development`,
    description: detail.metaDescription,
    alternates: { canonical: `/industries/${detail.id}` },
    openGraph: openGraphFor({
      title: `${detail.title} Software Development | SAVO Technologies`,
      description: detail.metaDescription,
      url: `/industries/${detail.id}`,
      images: [{ url: `/images/sectors/${detail.id}-hero.webp`, width: 1800, height: 1013 }],
    }),
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = industryDetail(slug);
  if (!detail) notFound();

  const atlas = INDUSTRIES_ATLAS.find((i) => i.id === detail.id);
  const chips = atlas?.capabilities ?? [];
  const industries = detail.relatedIndustries
    .map((id) => INDUSTRIES_ATLAS.find((i) => i.id === id))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
    .map((i) => ({ label: i.title, hint: i.hint, href: i.href }));
  const services = detail.relatedServices
    .map(serviceDetail)
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({ label: s.title, hint: s.tagline.replace(/\.$/, ""), href: `/services/${s.slug}` }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl(`/industries/${detail.id}/#webpage`),
        url: absoluteUrl(`/industries/${detail.id}`),
        name: `${detail.title} Software Development | SAVO Technologies`,
        description: detail.metaDescription,
        isPartOf: { "@id": absoluteUrl("/#website") },
        about: detail.title,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Industries", item: absoluteUrl("/industries") },
          { "@type": "ListItem", position: 3, name: detail.title, item: absoluteUrl(`/industries/${detail.id}`) },
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
      {
        "@type": "ItemList",
        name: `${detail.title} services`,
        itemListElement: detail.relatedServices.map((s, i) => {
          const svc = SERVICE_DETAILS.find((x) => x.slug === s);
          return {
            "@type": "ListItem",
            position: i + 1,
            name: svc?.title ?? s,
            url: absoluteUrl(`/services/${s}`),
          };
        }),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <IndustryDetailHero detail={detail} chips={chips} />
      <IndustryLandscape detail={detail} />
      <IndustrySolutions detail={detail} />
      <IndustryFlow detail={detail} />
      <IndustryFaqs detail={detail} />
      <IndustryCrossLinks industries={industries} services={services} />

      <DetailCta
        headingId="industry-cta-heading"
        heading={`Building for ${detail.title.toLowerCase()}?`}
        lead="Bring the brief — the regulation, the legacy system, the scale problem. We'll map the build in one conversation and quote in days, not weeks."
        location={`industry-${detail.id}-cta`}
      />
    </>
  );
}
