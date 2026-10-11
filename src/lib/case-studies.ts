/** Public portfolio authority: active, Published managed records only.
 * Development concepts live in a separate review namespace, never here.
 * Empty, unavailable and invalid libraries fail closed rather than resurrecting seeds.
 */

import { cache } from "react";
import { prisma } from "./prisma";
import { logger } from "./logger";
import { caseStudySchema, type CaseStudy } from "./case-study-schema";

type PublishedCaseStudyRow = { slug: string; data: unknown };

function parseCaseStudyRow(row: PublishedCaseStudyRow): CaseStudy | null {
  const res = caseStudySchema.safeParse(row.data ?? {});
  if (!res.success || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)) {
    logger.warn("case_studies.invalid_row", { slug: row.slug });
    return null;
  }
  return { ...res.data, status: "verified", slug: row.slug };
}

// Case-study JSON can contain several megabytes of embedded image data. React
// request memoization deduplicates reads during one render without attempting
// to persist oversized payloads in Next's 2 MiB Data Cache.
const readPublishedCaseStudyRows = cache(async (): Promise<PublishedCaseStudyRow[]> => {
  if (!prisma) return [];
  try {
    return await prisma.contentItem.findMany({
      where: { collection: "case-studies", active: true, contentStatus: "published" },
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      select: { slug: true, data: true },
    });
  } catch (err) {
    logger.warn("case_studies.db_unavailable", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return [];
  }
});

export async function getCaseStudies(): Promise<CaseStudy[]> {
  if (!prisma) return [];
  const rows = await readPublishedCaseStudyRows();
  return rows.flatMap((row) => {
    const study = parseCaseStudyRow(row);
    return study ? [study] : [];
  });
}

/** Industry pages apply their additional data-level verified marker. */
export async function getVerifiedIndustryCaseStudies(): Promise<CaseStudy[]> {
  if (!prisma) return [];
  const rows = await readPublishedCaseStudyRows();
  return rows.flatMap((row) => {
    const parsed = caseStudySchema.safeParse(row.data);
    return parsed.success && parsed.data.status === "verified" ? [{ ...parsed.data, slug: row.slug }] : [];
  });
}

const readPublishedCaseStudy = cache(async (slug: string): Promise<CaseStudy | null> => {
  if (!prisma) return null;
  try {
    const row = await prisma.contentItem.findFirst({
      where: { collection: "case-studies", slug, active: true, contentStatus: "published" },
      select: { slug: true, data: true },
    });
    return row ? parseCaseStudyRow(row) : null;
  } catch (err) {
    logger.warn("case_studies.detail_unavailable", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
});

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return readPublishedCaseStudy(slug);
}
