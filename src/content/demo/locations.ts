/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO MARKET PRESENCE — INTERNATIONAL SECTION
 * DEMO — REPLACE BEFORE PRODUCTION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Distinguishes a VERIFIED physical headquarters from an unverified
 * market/service presence. No fabricated street addresses, no invented
 * office phones, no "Head Office in Zürich" claims — city-level lines
 * only ("Zürich, Switzerland"), and general market wording everywhere
 * else. All market descriptions require Savo confirmation before any
 * production use.
 *
 * Source of truth for replacements: DEMO_CONTENT_REPLACEMENT.md
 */

import type { ContentStatus } from "@/lib/content-mode";

export type PresencePhone = {
  /** Optional line label, e.g. "HR". */
  label?: string;
  /** Display grouping, e.g. "+91 7502 901234". */
  display: string;
  /** Dialable form for tel: links. */
  e164: string;
};

export type MarketPresence = {
  id: string;
  /** Country / region name — the card headline. */
  region: string;
  /** "hq" = primary operations; "office" = verified physical office;
   *  "market" = service presence only (no office claim). */
  kind: "hq" | "office" | "market";
  /** City-level line (market cards; never an invented street address). */
  cityLine: string;
  /** Verified street address (physical offices only). */
  addressLine?: string;
  /** Market wording (market cards only; must be confirmed before production). */
  description?: string;
  /** Verified phone lines, in order (physical offices only). */
  phones?: PresencePhone[];
  status: ContentStatus;
};

/** Card designation rendered under the region name. */
export const PRESENCE_LABEL: Record<MarketPresence["kind"], string> = {
  hq: "Headquarters",
  office: "Head Office",
  market: "Market Presence",
};

/**
 * Verified headquarters — the one record that is NOT demo. Kept alongside
 * the demo set so the presence grid has a single source.
 */
export const HQ_PRESENCE: MarketPresence = {
  id: "india",
  region: "India",
  kind: "hq",
  cityLine: "Indore, Madhya Pradesh, India",
  addressLine: "139 PU4, Behind C21 Mall, Vijay Nagar, Scheme 54, Indore 452010",
  phones: [
    { display: "+91 7502 901234", e164: "+917502901234" },
    { display: "+91 7503 901234", e164: "+917503901234" },
    { label: "HR", display: "+91 78988 52345", e164: "+917898852345" },
  ],
  status: "verified",
};

/**
 * Verified physical offices — render in BOTH modes (never gated).
 * Switzerland head office supplied by Savo, 2026-09-25.
 */
export const CH_OFFICE: MarketPresence = {
  id: "switzerland",
  region: "Switzerland",
  kind: "office",
  cityLine: "Granges-Marnand, Switzerland",
  addressLine: "Rue de la Fruiterie 13, 1523 Granges-Marnand",
  phones: [{ display: "+41 76 408 28 72", e164: "+41764082872" }],
  status: "verified",
};

/** All verified offices, in display order. */
export const VERIFIED_OFFICES: MarketPresence[] = [HQ_PRESENCE, CH_OFFICE];

/** DEMO DATA — NOT VERIFIED. Market presences pending Savo confirmation. */
export const DEMO_MARKET_PRESENCE: MarketPresence[] = [
  {
    id: "saudi-arabia",
    region: "Saudi Arabia & GCC",
    kind: "market",
    cityLine: "Middle East Market",
    description:
      "Supporting software, digital product and AI initiatives across Saudi Arabia and the wider GCC market.",
    status: "demo",
  },
  {
    id: "australia",
    region: "Australia",
    kind: "market",
    cityLine: "APAC Market",
    description: "Technology and digital product services for businesses across Australia and the APAC region.",
    status: "demo",
  },
  {
    id: "united-kingdom",
    region: "United Kingdom",
    kind: "market",
    cityLine: "UK Market",
    description: "Supporting UK businesses with product design, software engineering and digital development.",
    status: "demo",
  },
  {
    id: "usa",
    region: "United States",
    kind: "market",
    cityLine: "North American Market",
    description: "Digital product and engineering capabilities for businesses across the United States.",
    status: "demo",
  },
];
