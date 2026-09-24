import "server-only";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  SERVICE_LINKS,
  INDUSTRY_LINKS,
  type NavLink,
} from "@/constants/navigation";

/**
 * Content data-access layer.
 *
 * The admin panel manages `services` and `industries` tables; the constants
 * files act as (a) the import source (admin "Import defaults" action) and
 * (b) the guaranteed fallback, so the public site renders correctly even
 * when the database is empty or briefly unreachable.
 *
 * Public pages call these functions at build time; admin mutations call
 * revalidateManagedContent() which regenerates them on demand.
 */

export type ManagedLink = {
  label: string;
  href: string;
  summary: string | null;
};

/** services/industries href roots, matching the version-1 URL architecture. */
const SERVICE_ROOT = "/services";
const INDUSTRY_ROOT = "/industries";

export async function getManagedServices(): Promise<ManagedLink[]> {
  return readCollection("service", SERVICE_ROOT, SERVICE_LINKS);
}

export async function getManagedIndustries(): Promise<ManagedLink[]> {
  return readCollection("industry", INDUSTRY_ROOT, INDUSTRY_LINKS);
}

async function readCollection(
  model: "service" | "industry",
  root: string,
  fallback: NavLink[],
): Promise<ManagedLink[]> {
  if (!prisma) return toFallback(fallback);
  try {
    const rows =
      model === "service"
        ? await prisma.service.findMany({
            where: { active: true },
            orderBy: [{ order: "asc" }, { title: "asc" }],
            select: { slug: true, title: true, summary: true },
          })
        : await prisma.industry.findMany({
            where: { active: true },
            orderBy: [{ order: "asc" }, { title: "asc" }],
            select: { slug: true, title: true, summary: true },
          });
    if (rows.length === 0) return toFallback(fallback);
    return rows.map((r) => ({
      label: r.title,
      href: `${root}/${r.slug}/`,
      summary: r.summary ?? null,
    }));
  } catch (err) {
    logger.warn("collections.db_unavailable", {
      model,
      message: err instanceof Error ? err.message : "unknown",
    });
    return toFallback(fallback);
  }
}

function toFallback(links: NavLink[]): ManagedLink[] {
  return links.map((l) => ({ label: l.label, href: l.href, summary: null }));
}

/** Managed links as nav children (drops summaries for panel rendering). */
export function toNavChildren(links: ManagedLink[]): NavLink[] {
  return links.map(({ label, href }) => ({ label, href }));
}

/** Invalidate every public page that renders managed content. */
export async function revalidateManagedContent(): Promise<void> {
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");
}
