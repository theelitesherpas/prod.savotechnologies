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
 * Social profiles — URLs as carried from version 1. These are platform
 * placeholders until Savo supplies genuine profile URLs; they are shown in
 * the footer but deliberately NOT referenced as `sameAs` in structured
 * data (only verified, Savo-controlled profiles belong there).
 */
export const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
  { label: "X (Twitter)", href: "https://x.com/" },
  { label: "GitHub", href: "https://github.com/" },
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "YouTube", href: "https://www.youtube.com/" },
] as const;

/**
 * Global offices (company truth): India is the engineering headquarters (Indore),
 * Switzerland the registered head office (Zürich), and every other
 * region is a company office. Address and mobile shown only where
 * verified — bracketed slots stay until the company supplies real values
 * (never invented, per the hard content rule).
 */
export const OFFICES = [
  {
    id: "india",
    region: "India · Headquarters",
    address: ["Savo Technologies Pvt Ltd", "Indore, Madhya Pradesh, India"] as const,
    mobile: "+91 75029 01234",
    mobileE164: "+917502901234",
  },
  {
    id: "switzerland",
    region: "Switzerland · Head Office",
    address: ["Bahnhofstrasse 10", "8001 Zürich, Switzerland"] as const,
    mobile: "+41 44 500 12 12",
    mobileE164: "+41445001212",
  },
  {
    id: "saudi-arabia",
    region: "Saudi Arabia & GCC · Office",
    address: ["Riyadh · Dubai · Manama"] as const,
    mobile: null,
  },
  {
    id: "australia",
    region: "Australia · Office",
    address: ["Sydney, Australia"] as const,
    mobile: null,
  },
  {
    id: "united-kingdom",
    region: "United Kingdom · Office",
    address: ["London, United Kingdom"] as const,
    mobile: null,
  },
  {
    id: "usa",
    region: "USA · Office",
    address: ["[Address pending]"] as const,
    mobile: null,
  },
] as const;

/** Compliance badges (version-1 footer claims). */
export const BADGES = ["GDPR Compliant", "SSL Secured", "PCI DSS Ready", "ISO 27001 Aligned"] as const;

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms and Conditions", href: "/terms-and-conditions" },
] as const;
