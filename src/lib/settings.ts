import "server-only";
import { prisma } from "@/lib/prisma";
import { cachePublicData, PUBLIC_SITE_CHROME_CACHE_TAG } from "@/lib/public-cache";
import { SITE } from "@/constants/site";
import { CONTACT_HERO_ALT, CONTACT_HERO_IMAGE } from "@/constants/contact";
import { ABOUT_HERO_ALT, ABOUT_HERO_IMAGE } from "@/constants/about";

/**
 * Site-wide settings the admin panel can override at runtime.
 * Falls back to src/constants/site.ts for every missing key, so a fresh
 * database changes nothing about the public site.
 */

export type SiteSettings = {
  contactEmail: string;
  contactPhone: string;
  announcement: string | null;
  /** Company impact metrics (policy §28: verified company information,
   * managed here instead of hardcoded). Empty string = not supplied -
   * the public site renders honest pending slots until a value exists. */
  metrics: {
    projectsDelivered: string;
    clientsSupported: string;
    industriesServed: string;
    marketsReached: string;
  };
  /** Project lead popup master switch (auto-triggers only; CTA opens always work). */
  leadModalEnabled: boolean;
  /** Contact page hero photo ("Let's talk about what's next." figure) and
   * its alt text - admin-uploaded via /admin/content, content-addressed
   * /api/site-img/<hash> WebP or a coded /images/ path. */
  contactHeroImage: string;
  contactHeroAlt: string;
  /** About page hero photo ("One team, accountable" figure) and its alt
   * text - same storage/validation contract as the contact hero. */
  aboutHeroImage: string;
  aboutHeroAlt: string;
};

const KEYS = [
  "contact_email",
  "contact_phone",
  "announcement",
  "metric_projects",
  "metric_clients",
  "metric_industries",
  "metric_markets",
  "lead_modal_enabled",
  "contact_hero_image",
  "contact_hero_alt",
  "about_hero_image",
  "about_hero_alt",
] as const;

function defaultSettings(): SiteSettings {
  return {
    contactEmail: SITE.email,
    contactPhone: SITE.phone,
    announcement: null,
    metrics: { projectsDelivered: "", clientsSupported: "", industriesServed: "", marketsReached: "" },
    leadModalEnabled: true,
    contactHeroImage: CONTACT_HERO_IMAGE,
    contactHeroAlt: CONTACT_HERO_ALT,
    aboutHeroImage: ABOUT_HERO_IMAGE,
    aboutHeroAlt: ABOUT_HERO_ALT,
  };
}

/** An admin-managed hero value may only be a content-addressed site
 * upload or a coded local raster - anything else (empty, stale, injected)
 * falls back to the coded default. */
function safeHeroImage(value: string | undefined, fallback: string): string {
  const v = value?.trim() ?? "";
  if (/^\/api\/site-img\/[a-f0-9]{64}$/.test(v)) return v;
  if (/^\/images\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g|avif)$/i.test(v) && !v.includes("..")) return v;
  return fallback;
}

async function readSettings(): Promise<SiteSettings> {
  const defaults = defaultSettings();
  if (!prisma) return defaults;

  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: [...KEYS] } },
      select: { key: true, value: true },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      contactEmail: map.get("contact_email")?.trim() || defaults.contactEmail,
      contactPhone: map.get("contact_phone")?.trim() || defaults.contactPhone,
      announcement: map.get("announcement")?.trim() || null,
      metrics: {
        projectsDelivered: map.get("metric_projects")?.trim() ?? "",
        clientsSupported: map.get("metric_clients")?.trim() ?? "",
        industriesServed: map.get("metric_industries")?.trim() ?? "",
        marketsReached: map.get("metric_markets")?.trim() ?? "",
      },
      leadModalEnabled: map.get("lead_modal_enabled") !== "0",
      contactHeroImage: safeHeroImage(map.get("contact_hero_image"), CONTACT_HERO_IMAGE),
      contactHeroAlt: map.get("contact_hero_alt")?.trim().slice(0, 200) || CONTACT_HERO_ALT,
      aboutHeroImage: safeHeroImage(map.get("about_hero_image"), ABOUT_HERO_IMAGE),
      aboutHeroAlt: map.get("about_hero_alt")?.trim().slice(0, 200) || ABOUT_HERO_ALT,
    };
  } catch {
    return defaults; // never break rendering over settings
  }
}

const readCachedSettings = cachePublicData("site-settings", readSettings, [PUBLIC_SITE_CHROME_CACHE_TAG]);

export function getSettings(): Promise<SiteSettings> {
  return prisma ? readCachedSettings() : Promise.resolve(defaultSettings());
}
