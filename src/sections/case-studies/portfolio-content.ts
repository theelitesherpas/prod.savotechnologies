import type { CaseStudy } from "@/lib/case-study-schema";
import { caseDisciplines, resolveCaseImages } from "@/lib/case-study-schema";
import { caseImageSrc } from "@/lib/case-img";

export const PORTFOLIO_CATEGORIES = [
  { id: "all", label: "All work" }, { id: "web", label: "Web" },
  { id: "mobile", label: "Mobile" }, { id: "ai", label: "AI & automation" },
  { id: "software", label: "Software" }, { id: "design", label: "Design" },
  { id: "growth", label: "Growth" },
] as const;
export type PortfolioVisual = { src: string; alt: string; width: number; height: number; title: string; description: string };
export type PortfolioCard = { slug: string; name: string; summary: string; discipline: string; disciplines: string[]; industry: string; href: string; preview: boolean; visual: PortfolioVisual | null };
export function casePreviewEnabled(environment: string | undefined, count: number) { return environment === "development" && count === 0; }
export function casePreviewHref(slug: string) { return `/case-studies/preview/${slug}`; }
export function portfolioCategory(value: unknown) { return typeof value === "string" && PORTFOLIO_CATEGORIES.some(c => c.id === value) ? value : "all"; }
export function filterPortfolio(entries: PortfolioCard[], category: string, query: string) {
  const needle = query.trim().slice(0, 160).toLocaleLowerCase();
  return entries.filter(e => (category === "all" || e.disciplines.includes(category)) && (!needle || `${e.name} ${e.summary} ${e.industry}`.toLocaleLowerCase().includes(needle)));
}
export function portfolioHref(category = "all", query = "") {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (query.trim()) params.set("q", query.trim().slice(0, 160));
  return `/case-studies${params.size ? `?${params}` : ""}#work`;
}
export function publishedCard(study: CaseStudy): PortfolioCard {
  const image = resolveCaseImages(study).cardWide;
  return { slug: study.slug, name: study.nda ? (study.displayClientName || "Confidential project") : (study.displayClientName || study.title), summary: study.summary, discipline: study.discipline, disciplines: caseDisciplines(study), industry: study.industry, href: `/case-studies/${study.slug}`, preview: false,
    visual: image ? { src: caseImageSrc(study.slug, "cardWide", image.dataUrl), alt: image.alt || `${study.displayClientName || study.title} interface`, width: image.width, height: image.height, title: "Project overview", description: image.alt } : null };
}
export function safeProjectLiveHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function projectGalleryVisuals(study: CaseStudy): PortfolioVisual[] {
  return study.gallery.slice(0, 8).map((image, index) => ({ src: caseImageSrc(study.slug, `gallery-${index}`, image.dataUrl), alt: image.alt || `Project image ${index + 1}`, width: image.width, height: image.height, title: image.alt || `Interface view ${index + 1}`, description: "" }));
}
export function publishedVisuals(study: CaseStudy): PortfolioVisual[] {
  const showcase = resolveCaseImages(study).showcase;
  const views: PortfolioVisual[] = [];
  if (showcase) views.push({ src: caseImageSrc(study.slug, "showcase", showcase.dataUrl), alt: showcase.alt || "Project overview", width: showcase.width, height: showcase.height, title: "Project overview", description: showcase.alt });
  for (const [index, g] of study.gallery.entries()) {
    // Do not repeat an overview image as another supposedly distinct interface.
    if (g.dataUrl === showcase?.dataUrl || study.gallery.slice(0, index).some(prior => prior.dataUrl === g.dataUrl)) continue;
    views.push({ src: caseImageSrc(study.slug, `gallery-${index}`, g.dataUrl), alt: g.alt || `Project view ${index + 1}`, width: g.width, height: g.height, title: g.alt || `Interface view ${index + 1}`, description: "" });
  }
  return views;
}
