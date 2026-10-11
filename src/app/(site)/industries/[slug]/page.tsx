import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { openGraphFor } from "@/lib/seo";
import { getManagedIndustryDossiers, getIndustryArticles, getIndustryCaseStudies } from "@/lib/industry-dossiers";
import { getManagedServices } from "@/lib/collections";
import { industryJsonLd, industryServiceLinks, industryStructuredData } from "@/lib/industry-seo";
import { IndustryDossierPage } from "@/sections/industries/industry-dossier-pages";

export const revalidate = 0;
export async function generateStaticParams() {
  return (await getManagedIndustryDossiers()).map(d => ({ slug: d.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = (await getManagedIndustryDossiers()).find(d => d.slug === slug);
  if (!d) return {};
  return {
    title: d.metaTitle, description: d.metaDescription,
    alternates: { canonical: `/industries/${d.slug}` },
    openGraph: {
      ...openGraphFor({ title: `${d.metaTitle} | Savo Technologies`, description: d.metaDescription, url: `/industries/${d.slug}` }),
      // Editorial assets and future CMS choices have different source ratios.
      // Let crawlers read the actual dimensions instead of asserting a fixed crop.
      ...(d.image ? { images: [{ url: d.image }] } : {}),
    },
  };
}
export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dossiers = await getManagedIndustryDossiers();
  const dossier = dossiers.find(d => d.slug === slug);
  if (!dossier) notFound();
  const [managedServices, articles, studies] = await Promise.all([getManagedServices(), getIndustryArticles(), getIndustryCaseStudies()]);
  const services = industryServiceLinks(managedServices);
  const jsonLd = industryStructuredData(dossiers, dossier, services);
  return <>
    {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: industryJsonLd(jsonLd) }} />}
    <IndustryDossierPage dossier={dossier} dossiers={dossiers} services={services} articles={articles} studies={studies} />
  </>;
}
