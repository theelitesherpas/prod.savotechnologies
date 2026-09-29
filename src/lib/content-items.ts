import "server-only";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { revalidateManagedContent } from "@/lib/collections";
import { CONTENT_COLLECTIONS, type CollectionKey, type SeedItem } from "@/lib/content-registry";
import type { Article } from "@/constants/insights";
import type { Role } from "@/constants/careers";
import { CASE_DISCIPLINES, CASE_DISCIPLINES_BASE, type CaseDiscipline } from "@/constants/case-studies";
import { getCaseStudies } from "@/lib/case-studies";
import { caseImageSrc } from "@/lib/case-img";
import { resolveCaseImages } from "@/lib/case-study-schema";
import type { HireRole } from "@/constants/hire";
import type { AiService } from "@/constants/ai-services";
import type { Agent } from "@/constants/agents";
import { ARTICLES } from "@/constants/insights";
import { ROLES } from "@/constants/careers";
import { HIRE_ROLES } from "@/constants/hire";
import { AI_SERVICES } from "@/constants/ai-services";
import { AGENTS } from "@/constants/agents";

/**
 * Managed content data-access layer (server).
 *
 * Every collection lives in the `content_items` table with a JSONB payload
 * validated against the registry schema. When a collection's table is empty
 * (or the DB is unreachable) the constants act as the guaranteed fallback,
 * so the public site always renders - the same contract as services and
 * industries. Admin mutations call revalidateManagedContent() to
 * regenerate public pages on demand.
 */

type ItemRow = {
  id: string;
  slug: string;
  title: string;
  data: unknown;
  order: number;
  active: boolean;
  updatedAt: Date;
};

/** Read a collection's rows; null means "DB unavailable or empty".
 *
 * Publication is explicit (demo content policy): public reads return only
 * rows whose content lifecycle reached "published". Rows still in
 * draft/demo/review - or seeded without a lifecycle - never render; the
 * constants fallback covers the public site instead. */
async function readItems(collection: CollectionKey, includeInactive = false): Promise<ItemRow[] | null> {
  if (!prisma) return null;
  try {
    return await prisma.contentItem.findMany({
      where: includeInactive
        ? { collection }
        : { collection, active: true, contentStatus: "published" },
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      select: { id: true, slug: true, title: true, data: true, order: true, active: true, updatedAt: true },
    });
  } catch (err) {
    logger.warn("content_items.db_unavailable", {
      collection,
      message: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}

// ──────────────────────── Public getters ────────────────────────────

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const pairList = (v: unknown): { title: string; text: string }[] =>
  Array.isArray(v)
    ? v.map((row) => ({
        title: str((row as Record<string, unknown>)?.title),
        text: str((row as Record<string, unknown>)?.text),
      }))
    : [];
const nameTextList = (v: unknown): { name: string; text: string }[] =>
  Array.isArray(v)
    ? v.map((row) => ({
        name: str((row as Record<string, unknown>)?.name),
        text: str((row as Record<string, unknown>)?.text),
      }))
    : [];
const qaList = (v: unknown): { q: string; a: string }[] =>
  Array.isArray(v)
    ? v.map((row) => ({
        q: str((row as Record<string, unknown>)?.q),
        a: str((row as Record<string, unknown>)?.a),
      }))
    : [];

/** Insights articles - index + reading pages. */
export async function getManagedArticles(): Promise<Article[]> {
  const rows = await readItems("insights");
  if (!rows || rows.length === 0) return ARTICLES;
  return rows.map((r) => {
    const d = r.data as Record<string, unknown>;
    return {
      slug: r.slug,
      title: r.title,
      cat: (["AI", "Engineering", "Design", "Delivery"] as const).includes(d?.cat as Article["cat"])
        ? (d?.cat as Article["cat"])
        : "Engineering",
      image: str(d?.image, "/images/architecture.webp"),
      excerpt: str(d?.excerpt),
      time: str(d?.time, "5 min read"),
      date: str(d?.date),
      body: Array.isArray(d?.body)
        ? (d?.body as Article["body"]).filter(
            (b) => b && (typeof b.p === "string" || typeof b.h === "string" || Array.isArray(b.li)),
          )
        : [],
    };
  });
}

/** Careers open roles. */
export async function getManagedRoles(): Promise<Role[]> {
  const rows = await readItems("careers");
  if (!rows || rows.length === 0) return ROLES;
  return rows.map((r) => {
    const d = r.data as Record<string, unknown>;
    const cat = (["eng", "design", "ops"] as const).includes(d?.cat as Role["cat"]) ? (d?.cat as Role["cat"]) : "eng";
    return {
      title: r.title,
      track: str(d?.track),
      cat,
      exp: str(d?.exp),
      band: str(d?.band),
      ctc: [num(d?.ctcMin, 12), num(d?.ctcMax, 24)] as [number, number],
      blurb: str(d?.blurb),
      duties: strList(d?.duties).filter(Boolean),
      brings: strList(d?.brings).filter(Boolean),
    };
  });
}

/**
 * Case-study disciplines - structure (discipline meta, capabilities) is
 * code-defined; entries come from the shared case-study getter (admin DB
 * rows first, coded dossier records as fallback), so the index, the home
 * cards and the detail pages always tell the same story.
 */
export async function getManagedCaseDisciplines(): Promise<CaseDiscipline[]> {
  const studies = await getCaseStudies();
  if (studies.length === 0) return CASE_DISCIPLINES;
  return CASE_DISCIPLINES_BASE.map((d) => {
    const mine = studies.filter((s) => s.discipline === d.id);
    if (mine.length === 0) return d;
    /* Exactly ONE featured (wide) card per discipline - the layout is one
       big card + a two-up grid. If the admin flags several records
       featured, the first flagged one wins; with none flagged, the first
       record does. Never two big cards in one chapter. */
    const featuredIdx = Math.max(0, mine.findIndex((s) => s.featured));
    const mapped = mine.map((s, i) => {
      const resolved = resolveCaseImages(s);
      // Unverified figures are production-suppressed on cards exactly like
      // the detail page (policy §27); demo records show all + the marker.
      const shown = s.status === "demo" ? (s.results ?? []) : (s.results ?? []).filter((r) => r.verified);
      return ({
      featured: i === featuredIdx,
      name: s.displayClientName || s.title,
      sector: s.industry ?? "",
      services: (s.services ?? []).slice(0, 2).join(" · ") || (s.industry ?? ""),
      stack: (s.technologies ?? []).join(" · "),
      outcome:
        shown.map((r) => `${r.value} ${r.label}`).join(" · ") +
        (s.status === "demo" && shown.length > 0 ? " - demo figures" : ""),
      slug: s.slug,
      status: s.status,
      images: {
        cardWide: resolved.cardWide ? { src: caseImageSrc(s.slug, "cardWide", resolved.cardWide.dataUrl), alt: resolved.cardWide.alt } : null,
        card: resolved.card ? { src: caseImageSrc(s.slug, "card", resolved.card.dataUrl), alt: resolved.card.alt } : null,
      },
      });
    });
    // When real case studies exist for this discipline, the pending
    // placeholder slots are hidden: real work replaces the mock slots.
    return { ...d, entries: mapped };
  });
}

/** Hire roles - index + per-role chapters. */
export async function getManagedHireRoles(): Promise<HireRole[]> {
  const rows = await readItems("hire");
  if (!rows || rows.length === 0) return HIRE_ROLES;
  return rows.map((r) => {
    const d = r.data as Record<string, unknown>;
    return {
      slug: r.slug,
      title: r.title,
      short: str(d?.short),
      tagline: str(d?.tagline),
      heroLead: str(d?.heroLead),
      metaDescription: str(d?.metaDescription),
      intro: [str(d?.intro1), str(d?.intro2)] as [string, string],
      monthly: num(d?.monthly, 240000),
      stack: strList(d?.stack).filter(Boolean),
      engagements: pairList(d?.engagements).filter((x) => x.title || x.text),
      skills: pairList(d?.skills).filter((x) => x.title || x.text),
      process: nameTextList(d?.process).filter((x) => x.name || x.text),
      why: pairList(d?.why).filter((x) => x.title || x.text),
      faqs: qaList(d?.faqs).filter((x) => x.q || x.a),
      iconSlug: str(d?.iconSlug),
      related: strList(d?.related).filter(Boolean),
    };
  });
}

/** AI practice chapters (/ai/[slug]/). */
export async function getManagedAiServices(): Promise<AiService[]> {
  const rows = await readItems("ai-services");
  if (!rows || rows.length === 0) return AI_SERVICES;
  return rows.map((r) => {
    const d = r.data as Record<string, unknown>;
    return {
      slug: r.slug,
      title: r.title,
      short: str(d?.short),
      tagline: str(d?.tagline),
      heroLead: str(d?.heroLead),
      metaDescription: str(d?.metaDescription),
      overview: [str(d?.overview1), str(d?.overview2)] as [string, string],
      engagements: pairList(d?.engagements).filter((x) => x.title || x.text),
      process: nameTextList(d?.process).filter((x) => x.name || x.text),
      stack: strList(d?.stack).filter(Boolean),
      faqs: qaList(d?.faqs).filter((x) => x.q || x.a),
    };
  });
}

/** The agent fleet (/ai-agents/). */
export async function getManagedAgents(): Promise<Agent[]> {
  const rows = await readItems("agents");
  if (!rows || rows.length === 0) return AGENTS;
  return rows.map((r) => {
    const d = r.data as Record<string, unknown>;
    return {
      slug: r.slug,
      name: str(d?.name, r.title),
      short: str(d?.short),
      desc: str(d?.desc),
      detail: str(d?.detail),
      deliverables: strList(d?.deliverables).filter(Boolean),
      tags: strList(d?.tags).filter(Boolean),
    };
  });
}

// ─────────────────────── Admin-facing helpers ───────────────────────

/** Full rows (including hidden) for the admin index. Null when DB unavailable. */
export async function getAdminItems(collection: CollectionKey): Promise<ItemRow[] | null> {
  return readItems(collection, true);
}

/** True when the collection has no DB rows and the site runs on defaults. */
export async function isFallback(collection: CollectionKey): Promise<boolean> {
  const rows = await readItems(collection);
  return !rows || rows.length === 0;
}

/** Import (upsert) a collection's seed items from the constants. */
export async function importDefaults(collection: CollectionKey): Promise<number> {
  const def = CONTENT_COLLECTIONS[collection];
  const seeds: SeedItem[] = def.seeds();
  for (const [i, seed] of seeds.entries()) {
    await prisma!.contentItem.upsert({
      where: { collection_slug: { collection, slug: seed.slug } },
      create: {
        collection,
        slug: seed.slug,
        title: seed.title,
        order: seed.order ?? i,
        active: seed.active ?? true,
        // The coded defaults ARE the live site content - materialize them
        // as published so admin edits take effect immediately.
        contentStatus: "published",
        data: seed.data as import("@prisma/client").Prisma.InputJsonValue,
      },
      update: { title: seed.title, order: seed.order ?? i },
    });
  }
  await revalidateManagedContent();
  return seeds.length;
}
