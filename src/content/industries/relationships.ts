import type { IndustryDossier } from "./schema";
import type { Article } from "@/constants/insights";
import type { CaseStudy } from "@/lib/case-study-schema";

/** Explicit associations only. Callers must supply public, lifecycle-filtered records. */
export function sectorCaseStudies(studies: CaseStudy[], slugs: string[], limit = 3): CaseStudy[] {
  return studies.filter(s => s.status === "verified" && s.industrySlugs?.some(slug => slugs.includes(slug)))
    .filter((study, index, matches) => matches.findIndex(s => s.slug === study.slug) === index).slice(0, limit);
}

type CaseSector = Pick<IndustryDossier, "slug" | "title" | "layout" | "solutions" | "image" | "imageAlt">;
type CaseConcept = Pick<IndustryDossier["solutions"][number], "title" | "text" | "audience" | "workflow" | "objective"> & { sector: string; layout: IndustryDossier["layout"]; image?: string; imageAlt?: string };
export type IndustryCaseSlot = { kind: "published"; study: CaseStudy } | { kind: "placeholder"; concept: CaseConcept };

/** Only callers' public records can become links; concepts never receive slugs. */
export function industryCaseSlots(studies: CaseStudy[], sectors: CaseSector[]): IndustryCaseSlot[] {
  const matches = sectorCaseStudies(studies, sectors.map(s => s.slug), 5);
  const generic: CaseConcept[] = [
    { title: "Digital service portal", text: "Help people submit requests, find supporting information and understand the next step.", audience: "Service users and support teams", workflow: "Request → Review → Respond → Follow up", objective: "Make the next action understandable.", sector: "Business operations", layout: "civic" },
    { title: "Operations workspace", text: "Give operations teams a shared place to assign work and review handoffs.", audience: "Operations teams and reviewers", workflow: "Receive → Assign → Review → Close", objective: "Keep responsibility and work context connected.", sector: "Business operations", layout: "ledger" },
    { title: "Mobile field workflow", text: "Help field teams prepare visits, record work and synchronise updates.", audience: "Field teams and coordinators", workflow: "Prepare → Visit → Record → Synchronise", objective: "Keep field observations linked to their task.", sector: "Business operations", layout: "route" },
    { title: "Reviewed service assistant", text: "Give service teams source-backed guidance with a clear route to human review.", audience: "Service users and authorised reviewers", workflow: "Ask → Retrieve → Review → Respond", objective: "Keep consequential decisions with authorised people.", sector: "Business operations", layout: "care" },
    { title: "Information exchange", text: "Connect approved records across systems with clear ownership and validation.", audience: "System owners and operations teams", workflow: "Map → Exchange → Validate → Acknowledge", objective: "Make source ownership and exceptions clear.", sector: "Business operations", layout: "grid" },
  ];
  const count = Math.min(5, Math.max(3, matches.length, sectors.length === 1 ? sectors[0].solutions.length : sectors.length || 5));
  return Array.from({ length: count }, (_, index): IndustryCaseSlot => {
    if (matches[index]) return { kind: "published", study: matches[index] };
    const sector = sectors.length ? sectors[index % sectors.length] : undefined;
    const solution = sector?.solutions[sectors.length === 1 ? index : Math.floor(index / sectors.length)];
    return { kind: "placeholder", concept: sector && solution ? { ...solution, sector: sector.title, layout: sector.layout, image: sector.image, imageAlt: sector.imageAlt } : generic[index] };
  });
}
export function sectorArticles(articles: Article[], dossiers: Pick<IndustryDossier, "slug" | "insightSlugs">[]): Article[] {
  const slugs = dossiers.map(d => d.slug);
  const selected: Article[] = [];
  for (const slug of dossiers.flatMap(d => d.insightSlugs)) {
    const found = articles.find(a => a.slug === slug);
    if (found && !selected.some(a => a.slug === found.slug)) selected.push(found);
  }
  for (const article of articles) {
    if (article.industrySlugs?.some(slug => slugs.includes(slug)) && !selected.some(a => a.slug === article.slug)) selected.push(article);
  }
  return selected.slice(0, 3);
}
