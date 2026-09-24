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
};

const KEYS = ["contact_email", "contact_phone", "announcement"] as const;

export async function getSettings(): Promise<SiteSettings> {
  const defaults: SiteSettings = {
    contactEmail: SITE.email,
    contactPhone: SITE.phone,
    announcement: null,
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
    };
  } catch {
    return defaults; // never break rendering over settings
  }
}
