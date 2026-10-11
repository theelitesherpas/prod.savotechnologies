import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { SERVICE_DETAILS } from "@/constants/services-detail";
import { servicePageDetail as serviceDetail } from "@/sections/services/service-page-content";
import { INDUSTRIES_ATLAS } from "@/constants/industries";
import { ServiceDetailPage } from "@/sections/services/service-detail";
import { getIndustryArticles } from "@/lib/industry-dossiers";

/**
 * Service chapters - one route per service from the catalogue. Rich,
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
      title: `${detail.title} | Savo Technologies`,
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

  // Publication authority: "Reading:" links render only for articles that are
  // actually Published in the managed insights collection. Absent, invalid or
  // unpublished slugs are dropped rather than linked as if they existed.
  const publishedSlugs = new Set((await getIndustryArticles()).map((a) => a.slug));
  const verifiedWork = (detail.relatedWork ?? []).filter(
    (w) => !w.href.startsWith("/insights/") || publishedSlugs.has(w.href.slice("/insights/".length).replace(/\/+$/, "")),
  );

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

      <ServiceDetailPage detail={detail} industries={industries} services={services} work={verifiedWork} />
    </>
  );
}
