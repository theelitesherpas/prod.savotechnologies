/** Global site configuration — single source of truth for nav, footer, meta. */

export const SITE = {
  name: "SAVO Technologies",
  shortName: "SAVO",
  tagline: "Bold Brands. Built by Savo.",
  description:
    "SAVO Technologies designs and develops premium websites, mobile applications, custom software and AI-powered systems for ambitious businesses worldwide.",
  positioning: "Independent digital product & technology company",
  /** Contact point — intentionally unset until SAVO supplies a real address. */
  email: null as string | null,
} as const;

export type NavItem = {
  label: string;
  href: string;
  /** null = route planned but not built yet; rendered as a non-breaking placeholder. */
  ready: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Services", href: "/#services", ready: true },
  { label: "Work", href: "/#work", ready: true },
  { label: "AI", href: "/#ai", ready: true },
  { label: "Industries", href: "/#industries", ready: true },
  { label: "About", href: "/#studio", ready: true },
  { label: "Insights", href: "/#growth", ready: false },
];

export const FOOTER_COLUMNS = [
  {
    heading: "Services",
    links: [
      { label: "Web Development", href: "/#services" },
      { label: "Mobile Development", href: "/#services" },
      { label: "AI & Agents", href: "/#ai" },
      { label: "Software Development", href: "/#services" },
      { label: "UI/UX Design", href: "/#services" },
      { label: "Digital Growth", href: "/#growth" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Work", href: "/#work" },
      { label: "About", href: "/#studio" },
      { label: "Process", href: "/#process" },
      { label: "Insights", href: "/#growth", ready: false },
      { label: "Careers", href: "/#", ready: false },
      { label: "Contact", href: "/#start", ready: false },
    ],
  },
] as const;

/** Social profiles — URLs pending from SAVO; never invented. */
export const SOCIAL_LINKS = [
  { label: "LinkedIn", href: null },
  { label: "Instagram", href: null },
  { label: "Behance", href: null },
] as const;

export const LEGAL_LINKS = [
  { label: "Privacy", href: "/#", ready: false },
  { label: "Terms", href: "/#", ready: false },
  { label: "Cookies", href: "/#", ready: false },
  { label: "Accessibility", href: "/#", ready: false },
] as const;
