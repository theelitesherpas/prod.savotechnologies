import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { getCaseStudies } from "@/lib/case-studies";
import { openGraphFor } from "@/lib/seo";
import { CaseStudiesCta } from "@/sections/case-studies/closing-cta";
import { PortfolioIntroduction, PortfolioLibrary, PortfolioPublicationNote } from "@/sections/case-studies/portfolio-sections";
import { casePreviewEnabled, filterPortfolio, portfolioCategory, publishedCard } from "@/sections/case-studies/portfolio-content";
import { PREVIEW_PROJECTS, previewProjectCard } from "@/sections/case-studies/preview-projects";
import styles from "@/sections/case-studies/portfolio.module.css";

// User-pinned, image-led showcase. Contract: tmp/case-showcase/brief.md.
// White gallery → product context → distinct interfaces → decisions → enquiry.
// Original conceptual screens are isolated, development-only, and labelled.
export const revalidate = 0;
const DESCRIPTION = "Explore Savo Technologies case studies: product experiences, interfaces, design decisions and engineering, with approved project stories and outcomes.";
export const metadata: Metadata = { title: "Case Studies", description: DESCRIPTION, alternates: { canonical: "/case-studies" }, openGraph: openGraphFor({ title: "Case Studies | Savo Technologies", description: DESCRIPTION, url: "/case-studies" }) };
export default async function CaseStudiesPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const studies = await getCaseStudies();
  const params = await searchParams;
  const category = portfolioCategory(params.category);
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 160) : "";
  const preview = casePreviewEnabled(process.env.NODE_ENV, studies.length);
  const all = preview ? PREVIEW_PROJECTS.map(previewProjectCard) : studies.map(publishedCard);
  const entries = filterPortfolio(all, category, query);
  const graph = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", "@id": absoluteUrl("/case-studies/#webpage"), url: absoluteUrl("/case-studies"), name: "Case Studies | Savo Technologies", description: DESCRIPTION, isPartOf: { "@id": absoluteUrl("/#website") } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Case Studies", item: absoluteUrl("/case-studies") }] },
    ...(studies.length ? [{ "@type": "ItemList", itemListElement: studies.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: publishedCard(s).name, url: absoluteUrl(`/case-studies/${s.slug}`) })) }] : []),
  ] };
  return <div className={styles.page} data-case-studies-page="showcase"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} /><PortfolioIntroduction /><PortfolioLibrary entries={entries} category={category} query={query} preview={preview} /><PortfolioPublicationNote /><CaseStudiesCta /></div>;
}
