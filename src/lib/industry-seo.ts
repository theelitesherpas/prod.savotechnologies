import { absoluteUrl } from "@/lib/env";
import { INDUSTRY_HUB_FAQS } from "@/content/industries/dossiers";
import type { IndustryDossier } from "@/content/industries/schema";
import { SERVICE_DETAILS } from "@/constants/services-detail";
import type { ManagedLink } from "@/lib/collections";

export const INDUSTRIES_DESCRIPTION = "Explore healthcare, fintech, retail, logistics and other industry software: sector workflows, integration, AI oversight and engineering considerations from Savo Technologies.";
export function industryServiceLinks(links: ManagedLink[]) {
  const aliases: Record<string, string> = { "mobile-apps": "mobile-app-development", "ui-ux": "ui-ux-design", "custom-software": "custom-software-development" };
  return links.flatMap(l => {
    const original = l.href.split("/").filter(Boolean).at(-1) ?? "";
    const slug = aliases[original] ?? original;
    return SERVICE_DETAILS.some(s => s.slug === slug) ? [{ slug, title: l.label }] : [];
  });
}
export function industryStructuredData(dossiers: IndustryDossier[], dossier?: IndustryDossier, services: { slug: string; title: string }[] = []) {
  if (dossier && !dossier.schemaEnabled) return null;
  const path = dossier ? `/industries/${dossier.slug}` : "/industries";
  const title = dossier ? `${dossier.metaTitle} | Savo Technologies` : "Industries | Savo Technologies";
  const faqs = dossier?.faqs ?? INDUSTRY_HUB_FAQS;
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": absoluteUrl(`${path}/#webpage`), url: absoluteUrl(path), name: title, description: dossier?.metaDescription ?? INDUSTRIES_DESCRIPTION, isPartOf: { "@id": absoluteUrl("/#website") }, about: dossier?.title ?? dossiers.map(d => d.title) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Industries", item: absoluteUrl("/industries") },
      ...(dossier ? [{ "@type": "ListItem", position: 3, name: dossier.title, item: absoluteUrl(path) }] : []),
    ] },
    { "@type": "FAQPage", mainEntity: faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ...(dossier ? [{ "@type": "Service", "@id": absoluteUrl(`${path}/#service`), name: `${dossier.title} software development`, serviceType: "Software development", description: dossier.lead, url: absoluteUrl(path), provider: { "@id": absoluteUrl("/#organization") } }] : []),
    { "@type": "ItemList", name: dossier ? `${dossier.title} related capabilities` : "Industry dossiers", itemListElement: (dossier ? services.filter(s => dossier.relatedServices.includes(s.slug)).map(s => ({ name: s.title, url: `/services/${s.slug}` })) : dossiers.map(d => ({ name: d.title, url: `/industries/${d.slug}` }))).map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, url: absoluteUrl(item.url) })) },
  ] };
}
export function industryJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
