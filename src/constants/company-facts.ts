/**
 * COMPANY FACTS REGISTRY - the single canonical source of company truth.
 * (Master specification Parts 6 & 7: centralize every company fact,
 * eliminate fact inconsistencies across pages.)
 *
 * Every fact carries:
 *   value - the fact itself (or null when awaiting verified input)
 *   status - "verified" | "requires-verified-input" | "computed"
 *   source - where the truth came from
 *   verifiedDate / reviewDate - governance (Part 108)
 *   visibility - "public" | "internal"
 *
 * HARD RULE (Part 117 - zero fabrication): a fact with status
 * "requires-verified-input" must never render as an assertion on the
 * public site. Surfaces either omit it or show an explicit pending state.
 *
 * Dynamic values (Part 7) are computed - e.g. years in business derives
 * from the verified founding year, so no page can drift out of sync.
 */

import { SITE, SOCIAL_LINKS, OFFICES } from "@/constants/site";

export type FactStatus = "verified" | "requires-verified-input" | "computed";

export type CompanyFact<T = unknown> = {
  value: T;
  status: FactStatus;
  /** Where the truth comes from (never published - internal governance). */
  source: string;
  verifiedDate?: string;
  reviewDate?: string;
  visibility: "public" | "internal";
};

const REQUIRES_INPUT = "REQUIRES_VERIFIED_INPUT";

export const COMPANY_FACTS = {
  /* - Identity -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - */
  brandName: fact(SITE.name, "verified", "Company communications / savotechnologies.com", "2026-09-25"),
  legalName: fact(SITE.legalName, "verified", "Company communications", "2026-09-25"),
  tagline: fact(SITE.tagline, "verified", "Brand guidelines", "2026-09-25"),
  positioning: fact(
    "Strategy, design, engineering, AI and growth - one accountable team.",
    "requires-verified-input",
    "Master specification §Final - awaiting Savo approval of final positioning sentence",
  ),

  /* - Founding & time in business -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - */
  foundedYear: fact("2015", "verified", "Company records / existing site statement", "2026-09-25"),
  incorporationDate: fact(null, "requires-verified-input", "Certificate of incorporation (Savo to supply)"),
  yearsInBusiness: computeFact(() => new Date().getFullYear() - 2015, "Computed from verified founding year (2015)"),

  /* - Locations (Part 58 - never present a market as an office) -  -  - */
  headquarters: fact(
    `${SITE.hq.street}, ${SITE.hq.city}, ${SITE.hq.region} ${SITE.hq.postalCode}, ${SITE.hq.country}`,
    "verified",
    "Supplied by Savo, 2026-09-25",
    "2026-09-25",
  ),
  registeredOffice: fact(null, "requires-verified-input", "Registered office address if different from HQ (Savo to confirm)"),
  operationalOffices: fact(
    "Indore, India (engineering HQ) · Granges-Marnand, Switzerland (head office)",
    "verified",
    "Supplied by Savo, 2026-09-25",
    "2026-09-25",
  ),
  supportedMarkets: fact(
    "India, and international clients served remotely",
    "verified",
    "Existing verified site statement",
    "2026-09-25",
  ),

  /* - Registration identifiers -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - */
  cin: fact(null, "requires-verified-input", "CIN from certificate of incorporation (Savo to supply)"),
  gst: fact(null, "requires-verified-input", "GSTIN (Savo to supply)"),

  /* - Contact -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - */
  email: fact(SITE.email, "verified", "Company communications", "2026-09-25"),
  phone: fact(SITE.phone, "verified", "Supplied by Savo", "2026-09-25"),
  hrPhone: fact(SITE.hrPhone, "verified", "Supplied by Savo (HR line)", "2026-09-25"),

  /* - Scale figures (Part 9 / 117 - only verified numbers, ever) -  - */
  projectsDelivered: fact(null, "requires-verified-input", "Savo project ledger - client-approved count"),
  clientsSupported: fact(null, "requires-verified-input", "Savo accounts list - client-approved count"),
  industriesServed: fact(null, "requires-verified-input", "Derived from verified engagements"),
  marketsReached: fact(null, "requires-verified-input", "Derived from verified engagements"),
  teamSize: fact(null, "requires-verified-input", "HR records (Savo to supply a range they are comfortable publishing)"),

  /* - Leadership & team -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - */
  leadership: fact(null, "requires-verified-input", "Names, roles, bios, photos (Savo to supply with approval)"),
  expertiseGroups: fact(
    [
      "Product Strategy",
      "Product Design",
      "Frontend Engineering",
      "Backend Engineering",
      "Mobile Engineering",
      "AI & Machine Learning",
      "Cloud & DevOps",
      "Quality Engineering",
      "Search & Growth",
      "Project Delivery",
    ],
    "verified",
    "Reflects the ten published service disciplines (savo.v7 services model)",
    "2026-10-02",
  ),

  /* - Social & review profiles (verified accounts only) -  -  -  - */
  socialProfiles: fact(
    SOCIAL_LINKS.map((s) => ({ label: s.label, href: s.href })),
    "verified",
    "Savo-controlled accounts, supplied by Savo",
    "2026-09-25",
  ),
  reviewProfiles: fact(null, "requires-verified-input", "Clutch / GoodFirms / Google Business URLs (Savo to supply)"),

  /* - Recognition -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - */
  certifications: fact(null, "requires-verified-input", "Certificates + evidence (Savo to supply)"),
  awards: fact(null, "requires-verified-input", "Award names, years, links (Savo to supply)"),
  partnerships: fact(null, "requires-verified-input", "Partner program evidence (Savo to supply)"),
} as const;

/* - Helpers -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  - */

function fact<T>(
  value: T,
  status: FactStatus,
  source: string,
  verifiedDate?: string,
): CompanyFact<T> {
  return { value, status, source, ...(verifiedDate ? { verifiedDate } : {}), visibility: "public" };
}

function computeFact<T>(compute: () => T, source: string): CompanyFact<T> {
  return { value: compute(), status: "computed", source, visibility: "public" };
}

/** Public, verified fact values only - safe for rendering as assertions. */
export function verifiedValue<T>(f: CompanyFact<T>): T | null {
  return f.status === "requires-verified-input" ? null : f.value;
}

/** All facts still awaiting Savo input - powers the proof dashboard (Part 98). */
export function pendingFacts(): { key: string; source: string }[] {
  return Object.entries(COMPANY_FACTS)
    .filter(([, f]) => f.status === "requires-verified-input")
    .map(([key, f]) => ({ key, source: f.source }));
}

/** Human-readable years-in-business ("10", "11"…) - computed, never stale. */
export function yearsInBusiness(): number {
  return new Date().getFullYear() - 2015;
}

/** Presence model reused by location surfaces (Part 58 - offices stay offices, markets stay markets). */
export const PRESENCE_MODEL = OFFICES.map((o) => ({
  region: o.region,
  cityLine: o.cityLine,
  kind: o.kind,
  status: o.status,
})) as readonly { region: string; cityLine: string; kind: string; status: string }[];

export { REQUIRES_INPUT };
