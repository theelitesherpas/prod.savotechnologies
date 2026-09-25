import "server-only";
import { prisma } from "@/lib/prisma";
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
   * managed here instead of hardcoded). Empty string = not supplied —
   * the public site renders honest pending slots until a value exists. */
  metrics: {
    projectsDelivered: string;
    clientsSupported: string;
    industriesServed: string;
    marketsReached: string;
  };
};

const KEYS = [
  "contact_email",
  "contact_phone",
  "announcement",
  "metric_projects",
  "metric_clients",
  "metric_industries",
  "metric_markets",
] as const;

export async function getSettings(): Promise<SiteSettings> {
  const defaults: SiteSettings = {
    contactEmail: SITE.email,
    contactPhone: SITE.phone,
    announcement: null,
    metrics: { projectsDelivered: "", clientsSupported: "", industriesServed: "", marketsReached: "" },
  };
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
    };
  } catch {
    return defaults; // never break rendering over settings
  }
}
