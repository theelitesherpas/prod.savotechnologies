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

/** Delivery regions (version-1 footer). */
export const OFFICES = [
  { region: "India · HQ", lines: ["Savo Technologies Pvt. Ltd.", "Indore · Ahmedabad"] },
  { region: "USA", lines: ["Delivery & client success", "North America"] },
  { region: "Saudi Arabia & GCC", lines: ["Delivery & client success", "Riyadh · Dubai · Manama"] },
  { region: "United Kingdom", lines: ["Delivery & client success", "London"] },
  { region: "Australia", lines: ["Delivery & client success", "Sydney"] },
] as const;

/** Compliance badges (version-1 footer claims). */
export const BADGES = ["GDPR Compliant", "SSL Secured", "PCI DSS Ready", "ISO 27001 Aligned"] as const;

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy/" },
  { label: "Terms of Service", href: "/terms/" },
] as const;
