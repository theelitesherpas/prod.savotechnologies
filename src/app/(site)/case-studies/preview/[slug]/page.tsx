import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findPreviewProject, previewProjectCard } from "@/sections/case-studies/preview-projects";
import { casePreviewHref } from "@/sections/case-studies/portfolio-content";
import { ProjectStory } from "@/sections/case-studies/project-story";

export const revalidate = 0;
export function generateStaticParams() { return []; }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const concept = findPreviewProject((await params).slug);
  if (!concept) return { robots: { index: false, follow: false } };
  return { title: `${concept.name} · Design Preview`, description: `Unpublished fictional design study. Not client work. ${concept.summary}`, robots: { index: false, follow: false }, alternates: { canonical: casePreviewHref(concept.slug) } };
}
export default async function ProjectPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const concept = findPreviewProject((await params).slug);
  if (!concept) notFound();
  const related = concept.related.map(slug => findPreviewProject(slug)).filter(p => p !== null).map(previewProjectCard);
  return <ProjectStory concept={concept} related={related} />;
}
