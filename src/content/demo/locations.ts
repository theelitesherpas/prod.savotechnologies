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

export type MarketPresence = {
  id: string;
  region: string;
  /** "hq" = verified physical operations; "market" = service presence only. */
  kind: "hq" | "market";
  /** City-level line only — never an invented street address. */
  cityLine: string;
  /** General market wording; must be confirmed before production. */
  description: string;
  /** Verified contact numbers only; null otherwise. */
  mobile: string | null;
  mobileE164: string | null;
  status: ContentStatus;
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
  description: "Primary operations — engineering, design and delivery run from the Indore headquarters.",
  mobile: "+91 75029 01234",
  mobileE164: "+917502901234",
  status: "verified",
};

/** DEMO DATA — NOT VERIFIED. Market presences pending Savo confirmation. */
export const DEMO_MARKET_PRESENCE: MarketPresence[] = [
  {
    id: "switzerland",
    region: "Switzerland",
    kind: "market",
    cityLine: "European Market",
    description:
      "Supporting digital product and technology engagements across Switzerland and selected European markets.",
    mobile: null,
    mobileE164: null,
    status: "demo",
  },
  {
    id: "saudi-arabia",
    region: "Saudi Arabia & GCC",
    kind: "market",
    cityLine: "Middle East Market",
    description:
      "Supporting software, digital product and AI initiatives across Saudi Arabia and the wider GCC market.",
    mobile: null,
    mobileE164: null,
    status: "demo",
  },
  {
    id: "australia",
    region: "Australia",
    kind: "market",
    cityLine: "APAC Market",
    description: "Technology and digital product services for businesses across Australia and the APAC region.",
    mobile: null,
    mobileE164: null,
    status: "demo",
  },
  {
    id: "united-kingdom",
    region: "United Kingdom",
    kind: "market",
    cityLine: "UK Market",
    description: "Supporting UK businesses with product design, software engineering and digital development.",
    mobile: null,
    mobileE164: null,
    status: "demo",
  },
  {
    id: "usa",
    region: "United States",
    kind: "market",
    cityLine: "North American Market",
    description: "Digital product and engineering capabilities for businesses across the United States.",
    mobile: null,
    mobileE164: null,
    status: "demo",
  },
];
