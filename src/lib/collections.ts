import "server-only";
import { prisma } from "@/lib/prisma";
import { cachePublicData, PUBLIC_SITE_CHROME_CACHE_TAG } from "@/lib/public-cache";
import { logger } from "@/lib/logger";
import { getIndustryAuthority } from "@/lib/industry-dossiers";
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
 * Public reads use a bounded tagged Next Data Cache; admin mutations call
 * revalidateManagedContent() to expire affected public data immediately.
 */

export type ManagedLink = {
  label: string;
  href: string;
  summary: string | null;
};

/** services/industries href roots, matching the version-1 URL architecture. */
const SERVICE_ROOT = "/services";
const INDUSTRY_ROOT = "/industries";

/** Legacy short service slugs still stored by the managed `services` table.
 * Public routes use the full descriptive slugs (see next.config redirects);
 * navigation hrefs are canonicalized at read time so no menu click ever
 * bounces through a redirect, without mutating managed content. */
const CANONICAL_SERVICE_SLUG: Record<string, string> = {
  "mobile-apps": "mobile-app-development",
  "ui-ux": "ui-ux-design",
  "custom-software": "custom-software-development",
};

/** Canonical, redirect-free internal href for a managed row. */
export function managedHref(root: string, slug: string, model: "service" | "industry" = "service"): string {
  const canonical = model === "service" ? (CANONICAL_SERVICE_SLUG[slug] ?? slug) : slug;
  return `${root}/${canonical}`;
}

const readCachedServices = cachePublicData(
  "navigation-services",
  () => readCollection("service", SERVICE_ROOT, SERVICE_LINKS),
  [PUBLIC_SITE_CHROME_CACHE_TAG],
);

const readCachedIndustries = cachePublicData("navigation-industries", async () => {
  const authority = await getIndustryAuthority();
  if (authority.managed) return authority.items.map(d => ({ label: d.title, href: managedHref(INDUSTRY_ROOT, d.slug, "industry"), summary: d.summary }));
  return readCollection("industry", INDUSTRY_ROOT, INDUSTRY_LINKS);
}, [PUBLIC_SITE_CHROME_CACHE_TAG, "content:industry-dossiers"]);

export async function getManagedServices(): Promise<ManagedLink[]> {
  return prisma ? readCachedServices() : toFallback(SERVICE_LINKS);
}

export async function getManagedIndustries(): Promise<ManagedLink[]> {
  return prisma ? readCachedIndustries() : toFallback(INDUSTRY_LINKS);
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
      href: managedHref(root, r.slug, model),
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
  return links.map((l) => ({ label: l.label, href: l.href, summary: l.desc ?? null }));
}

/** Coded descriptors by label: the guaranteed fallback line under each
 *  drawer link (labels are stable; managed slugs may differ from the
 *  coded hrefs). Admin-managed summaries override them once filled. */
const DESC_BY_LABEL = new Map<string, string>();
for (const l of [...SERVICE_LINKS, ...INDUSTRY_LINKS]) {
  if (l.desc) DESC_BY_LABEL.set(l.label, l.desc);
}

/** Managed links as nav children; the managed summary (or the coded
 *  descriptor, as fallback) becomes the drawer's contextual line. */
export function toNavChildren(links: ManagedLink[]): NavLink[] {
  return links.map(({ label, href, summary }) => ({
    label,
    href,
    desc: summary?.trim() ? summary : (DESC_BY_LABEL.get(label) ?? undefined),
  }));
}

/** Invalidate every public page that renders managed content. */
export async function revalidateManagedContent(): Promise<void> {
  const { revalidatePath, revalidateTag } = await import("next/cache");
  revalidateTag("public-managed-content", { expire: 0 });
  revalidateTag("public-site-chrome", { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
}
