/**
 * Case-study data access - DB (published) first, constants fallback.
 *
 * Mirrors the site's content model: admin-managed rows in ContentItem
 * (collection "case-studies", validated by the shared zod schema, lifecycle
 * "published") win when present; otherwise the constants seed renders.
 * Demo records live only in the constants fallback and never survive into
 * a production build (see src/lib/content-mode.ts).
 */

import { prisma } from "./prisma";
import { logger } from "./logger";
import { IS_DEMO } from "./content-mode";
import { CASE_STUDY_DETAILS } from "@/constants/case-studies";
import { caseStudySchema, type CaseStudy } from "./case-study-schema";

/**
 * Staging renders everything that has passed draft (demo · review ·
 * verified · published) so admin edits are visible immediately while the
 * content is being worked. Production renders published records only.
 */
const VISIBLE_STATUSES = IS_DEMO
  ? (["demo", "review", "verified", "published"] as const)
  : (["published"] as const);

export async function getCaseStudies(): Promise<CaseStudy[]> {
  if (prisma) {
    try {
      const rows = await prisma.contentItem.findMany({
        where: { collection: "case-studies", active: true, contentStatus: { in: [...VISIBLE_STATUSES] } },
        orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
        select: { slug: true, data: true },
      });
      const parsed = rows.flatMap((row) => {
        const res = caseStudySchema.safeParse(row.data ?? {});
        if (!res.success) {
          logger.warn("case_studies.invalid_row", { slug: row.slug });
          return [];
        }
        return [{ ...res.data, slug: row.slug }];
      });
      if (parsed.length > 0) return parsed;
    } catch (err) {
      logger.warn("case_studies.db_unavailable", {
        message: err instanceof Error ? err.message : "unknown",
      });
    }
  }
  return CASE_STUDY_DETAILS;
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  const all = await getCaseStudies();
  return all.find((s) => s.slug === slug) ?? null;
}
