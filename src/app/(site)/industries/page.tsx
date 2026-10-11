import type { Metadata } from "next";
import { openGraphFor } from "@/lib/seo";
import { getManagedIndustryDossiers, getIndustryArticles, getIndustryCaseStudies } from "@/lib/industry-dossiers";
import { getManagedServices } from "@/lib/collections";
import { INDUSTRIES_DESCRIPTION, industryJsonLd, industryServiceLinks, industryStructuredData } from "@/lib/industry-seo";
import { IndustriesDossierHub } from "@/sections/industries/industry-dossier-pages";

export const revalidate = 0;
export const metadata: Metadata = {
  title: "Industries", description: INDUSTRIES_DESCRIPTION,
  alternates: { canonical: "/industries" },
  openGraph: openGraphFor({ title: "Industries | Savo Technologies", description: INDUSTRIES_DESCRIPTION, url: "/industries" }),
};
export default async function IndustriesPage() {
  const [dossiers, managedServices, articles, studies] = await Promise.all([
    getManagedIndustryDossiers(), getManagedServices(), getIndustryArticles(), getIndustryCaseStudies(),
  ]);
  const services = industryServiceLinks(managedServices);
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: industryJsonLd(industryStructuredData(dossiers)) }} />
    <IndustriesDossierHub dossiers={dossiers} services={services} articles={articles} studies={studies} />
  </>;
}
