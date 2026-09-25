/**
 * Global site configuration — single source of truth for meta, contact, footer.
 *
 * Brand hierarchy (one company, four names — never separate entities):
 *   Primary brand:  Savo Technologies
 *   Short brand:    Savo
 *   Legal entity:   Savo Technologies Private Limited
 *   Recognized variant of the legal name: Savo Technologies Pvt Ltd
 *
 * Public-facing text uses "Savo Technologies" / "Savo" — never all-caps
 * "SAVO" (the all-caps lockup exists only inside the logotype artwork).
 */

import { canonicalOrigin } from "@/lib/env";

/** Canonical production origin. Canonical URLs, sitemap, JSON-LD and OG must always use this — never a testing/preview deployment. */
export const CANONICAL_ORIGIN = canonicalOrigin;

export const SITE = {
  name: "Savo Technologies",
  shortName: "Savo",
  legalName: "Savo Technologies Private Limited",
  /** Recognized short form of the legal name (searches, directories). */
  legalNameShort: "Savo Technologies Pvt Ltd",
  tagline: "Bold Brands. Built by Savo.",
  description:
    "Savo Technologies is a software development company in Indore, India, building websites, web applications, mobile apps, custom software and AI systems for clients across India and worldwide.",
  positioning: "Independent digital product & technology company · Indore, India",
  /** Version-1 company statement (ported from /newdesign). */
  statement:
    "AI agents, web platforms and mobile apps, engineered by one accountable team since 2016. 10 years of global delivery from India.",
  email: "hello@savotechnologies.com",
  phone: "+91 75029 01234",
  phoneE164: "+917502901234",
  /** Verified headquarters (entity truth for schema, contact and About). */
  hq: {
    city: "Indore",
    region: "Madhya Pradesh",
    country: "India",
    countryCode: "IN",
    /** Full street address and postal code pending company supply — never invented. */
    street: null as string | null,
    postalCode: null as string | null,
  },
  /** Company registration identifiers — slots only, populated when the company supplies verified values. */
  registration: {
    cin: null as string | null,
    gst: null as string | null,
    foundedYear: "2016",
  },
} as const;

/**
 * Social profiles — genuine, Savo-controlled company accounts, supplied by
 * Savo. Shown in the footer and referenced as `sameAs` in the Organization
 * structured data (verified profiles only, per the hard content rule).
 */
export const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/savotechnologies/" },
  { label: "Instagram", href: "https://www.instagram.com/savotechnologies/" },
  { label: "Facebook", href: "https://www.facebook.com/savotechnologies" },
  { label: "YouTube", href: "https://www.youtube.com/@savotechnologies" },
] as const;

/**
 * Global presence (CONTENT_MODE gated — see src/lib/content-mode.ts).
 *
 * VERIFIED: India is the engineering headquarters (Indore). Everything
 * else is a market/service presence, not a physical office claim:
 * the former "Bahnhofstrasse 10, Zürich" head-office address and the
 * +41 mobile were fabricated placeholders (never a real Savo location)
 * and have been removed — city-level lines and general market wording
 * only, pending Savo confirmation. Demo market cards render in demo mode;
 * production shows the verified HQ plus truthful non-specific wording.
 */
import { IS_DEMO } from "@/lib/content-mode";
import { HQ_PRESENCE, DEMO_MARKET_PRESENCE } from "@/content/demo";

export type Presence = typeof HQ_PRESENCE;

export const OFFICES: Presence[] = IS_DEMO
  ? [HQ_PRESENCE, ...DEMO_MARKET_PRESENCE]
  : [HQ_PRESENCE];

/** Honest production line when only the HQ is verified. */
export const PRESENCE_FALLBACK_NOTE =
  "Engineering, design and delivery run from Indore, India, with engagements across India and worldwide.";

/**
 * Trust strip — NON-CERTIFICATION capability labels (safe in both modes).
 * The v1 claims ("GDPR Compliant", "PCI DSS Ready", "ISO 27001 Aligned")
 * were unheld certifications and are removed: capability wording only,
 * never formal certification claims. See src/content/demo/index.ts.
 */
import { TRUST_CAPABILITY_LABELS } from "@/content/demo";

export const BADGES = TRUST_CAPABILITY_LABELS;

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms and Conditions", href: "/terms-and-conditions" },
] as const;
