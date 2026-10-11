import type { CaseStudy } from "@/lib/case-study-schema";

export type ProjectLogo = { src: string; width: number; height: number };

// Explicit project assets, not inferred logos or arbitrary remote image URLs.
// Fresh Art Club's official mark is reused from its linked live project:
// https://freshartclub.com/logofarc.svg (provenance: tmp/case-detail-refinement/).
const PROJECT_LOGOS: Readonly<Record<string, ProjectLogo>> = {
  "the-fresh-art-club": { src: "/images/case-studies/the-fresh-art-club-logo.svg", width: 432, height: 80 },
};

export function projectLogoFor(study: Pick<CaseStudy, "slug" | "nda">): ProjectLogo | null {
  // Never reveal a client's brand on a confidential engagement.
  if (study.nda) return null;
  return Object.hasOwn(PROJECT_LOGOS, study.slug) ? PROJECT_LOGOS[study.slug] : null;
}
