import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { cachePublicData } from "@/lib/public-cache";
import { logger } from "@/lib/logger";
import { INDUSTRY_DOSSIERS } from "@/content/industries/dossiers";
import { publicIndustryRows } from "@/content/industries/schema";
import type { CaseStudy } from "@/lib/case-study-schema";
import type { Article } from "@/constants/insights";

/** Any managed row establishes authority, even when every row is unpublished. */
const readIndustryAuthority = cachePublicData("industry-dossier-authority", async () => {
  if (!prisma) return { managed: false, items: INDUSTRY_DOSSIERS };
  try {
    const rows = await prisma.contentItem.findMany({
      where: { collection: "industry-dossiers" },
      orderBy: [{ order: "asc" }, { title: "asc" }],
      select: { slug: true, title: true, active: true, contentStatus: true, data: true },
    });
    if (!rows.length) return { managed: false, items: INDUSTRY_DOSSIERS };
    const items = publicIndustryRows(rows);
    if (rows.some(r => r.active && r.contentStatus === "published") && !items.length) logger.warn("industries.invalid_published_rows");
    return { managed: true, items };
  } catch (err) {
    logger.warn("industries.db_unavailable", { message: err instanceof Error ? err.message : "unknown" });
    // A failed read must not republish dossiers an editor may have hidden.
    return { managed: true, items: [] };
  }
}, ["content:industry-dossiers"]);

export const getIndustryAuthority = cache(() =>
  prisma ? readIndustryAuthority() : Promise.resolve({ managed: false, items: INDUSTRY_DOSSIERS }),
);
export const getManagedIndustryDossiers = cache(async () => (await getIndustryAuthority()).items);

/** Stricter than the staging case gallery: no demo, review or coded proof fallback. */
export const getIndustryCaseStudies = cache(async (): Promise<CaseStudy[]> => {
  const { getVerifiedIndustryCaseStudies } = await import("@/lib/case-studies");
  return getVerifiedIndustryCaseStudies();
});

/** Use the existing article mapper, but explicitly exclude its coded fallback. */
export const getIndustryArticles = cache(async (): Promise<Article[]> => {
  const { getManagedArticles } = await import("@/lib/content-items");
  return getManagedArticles();
});
