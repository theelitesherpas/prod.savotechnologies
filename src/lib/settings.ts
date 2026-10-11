import "server-only";
import { prisma } from "@/lib/prisma";
import { cachePublicData, PUBLIC_SITE_CHROME_CACHE_TAG } from "@/lib/public-cache";
import { SITE } from "@/constants/site";

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
] as const;

function defaultSettings(): SiteSettings {
  return {
    contactEmail: SITE.email,
    contactPhone: SITE.phone,
    announcement: null,
    metrics: { projectsDelivered: "", clientsSupported: "", industriesServed: "", marketsReached: "" },
    leadModalEnabled: true,
  };
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
    };
  } catch {
    return defaults; // never break rendering over settings
  }
}

const readCachedSettings = cachePublicData("site-settings", readSettings, [PUBLIC_SITE_CHROME_CACHE_TAG]);

export function getSettings(): Promise<SiteSettings> {
  return prisma ? readCachedSettings() : Promise.resolve(defaultSettings());
}
