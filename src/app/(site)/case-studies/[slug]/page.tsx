import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCaseStudies, getCaseStudy } from "@/lib/case-studies";
import { caseDisciplines } from "@/lib/case-study-schema";
import { openGraphFor } from "@/lib/seo";
import { absoluteUrl } from "@/lib/env";
import { ProjectStory } from "@/sections/case-studies/project-story";
import { publishedCard } from "@/sections/case-studies/portfolio-content";

export const revalidate = 0;
export async function generateStaticParams() { return (await getCaseStudies()).map(s => ({ slug: s.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const study = await getCaseStudy((await params).slug);
  if (!study) return { robots: { index: false, follow: false } };
  const name = publishedCard(study).name;
  const description = study.summary || `${name}: a Savo Technologies case study.`;
  return { title: `${name} · Case Study`, description, alternates: { canonical: `/case-studies/${study.slug}` }, openGraph: openGraphFor({ title: `${name} | Savo Technologies`, description, url: `/case-studies/${study.slug}` }) };
}
export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const study = await getCaseStudy((await params).slug);
  if (!study) notFound();
  const all = await getCaseStudies();
  const mine = caseDisciplines(study);
  const related = all.filter(s => s.slug !== study.slug).sort((a, b) => Number(caseDisciplines(b).some(d => mine.includes(d))) - Number(caseDisciplines(a).some(d => mine.includes(d)))).slice(0, 2).map(publishedCard);
  const graph = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", name: publishedCard(study).name, url: absoluteUrl(`/case-studies/${study.slug}`), description: study.summary },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Case Studies", item: absoluteUrl("/case-studies") }, { "@type": "ListItem", position: 3, name: publishedCard(study).name, item: absoluteUrl(`/case-studies/${study.slug}`) }] },
  ] };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} /><ProjectStory study={study} related={related} /></>;
}
