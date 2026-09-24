/** Global site configuration — single source of truth for meta, contact, footer. */

export const SITE = {
  name: "SAVO Technologies",
  legalName: "Savo Technologies Pvt. Ltd.",
  shortName: "SAVO",
  tagline: "Bold Brands. Built by Savo.",
  description:
    "SAVO Technologies designs and develops premium websites, mobile applications, custom software and AI-powered systems for ambitious businesses worldwide.",
  positioning: "Independent digital product & technology company",
  /** Version-1 company statement (ported from /newdesign). */
  statement:
    "AI agents, web platforms and mobile apps, engineered by one accountable team since 2016. 10 years of global delivery from India.",
  email: "hello@savotechnologies.com",
  phone: "+91 75029 01234",
  phoneE164: "+917502901234",
} as const;

/** Social profiles — URLs as carried from version 1. */
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
    address: ["Savo Technologies Pvt. Ltd.", "Indore, India"] as const,
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
  { label: "Privacy Policy", href: "/privacy/" },
  { label: "Terms of Service", href: "/terms/" },
] as const;
