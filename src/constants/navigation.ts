/**
 * SAVO v6 navigation - ported from the version-1 site (/newdesign).
 * Labels, hrefs and feature-card copy carry over unchanged; v6 renders
 * them in its own design language. Future routes (services/*, hire/*,
 * industries/*, careers, portal) resolve to the designed "in production"
 * page until those pages are built in v6.
 */

export type NavLink = { label: string; href: string; pro?: boolean };

export type NavFeature = {
  title: string;
  copy: string;
  cta: string;
  href: string;
};

export type NavItem = {
  label: string;
  /** Where the top-level entry itself points (dropdown parent link). */
  href?: string;
  children?: NavLink[];
  feature?: NavFeature;
  /** "dialog" opens the enquiry drawer instead of navigating. */
  action?: "dialog";
  /** Mega panel spans the full shell (AI flagship); dropdowns are compact. */
  mega?: boolean;
};

/* ---------------- Link lists (version-1 canonical order) ------------- */

export const AI_LINKS: NavLink[] = [
  { label: "AI Agents", href: "/ai-agents", pro: true },
  { label: "AI Automation", href: "/ai/automation/" },
  { label: "Generative AI & LLM Integration", href: "/ai/generative-ai/" },
  { label: "AI Consulting & Strategy", href: "/ai/consulting/" },
  { label: "Machine Learning & Analytics", href: "/ai/machine-learning/" },
];

export const SERVICE_LINKS: NavLink[] = [
  { label: "Web Development", href: "/services/web-development/" },
  { label: "Mobile App Development", href: "/services/mobile-apps/" },
  { label: "UI/UX Design", href: "/services/ui-ux/" },
  { label: "Cloud & DevOps", href: "/services/cloud-devops/" },
  { label: "Data & Analytics", href: "/services/data-analytics/" },
  { label: "AI Agent Development", href: "/services/ai-agent-development/" },
  { label: "Custom Software", href: "/services/custom-software/" },
  { label: "Digital Marketing & SEO", href: "/services/digital-marketing/" },
  { label: "QA & Testing", href: "/services/qa-testing/" },
  { label: "Product Engineering", href: "/services/product-engineering/" },
];

export const HIRE_LINKS: NavLink[] = [
  { label: "AI & ML Engineers", href: "/hire/ai-ml-engineers/" },
  { label: "Frontend Developers", href: "/hire/frontend-developers/" },
  { label: "Backend Developers", href: "/hire/backend-developers/" },
  { label: "Full Stack Developers", href: "/hire/full-stack-developers/" },
  { label: "Mobile Developers", href: "/hire/mobile-developers/" },
  { label: "DevOps & QA Engineers", href: "/hire/devops-qa-engineers/" },
];

export const INDUSTRY_LINKS: NavLink[] = [
  { label: "Healthcare", href: "/industries/healthcare/" },
  { label: "FinTech & Banking", href: "/industries/fintech/" },
  { label: "Ecommerce & Retail", href: "/industries/ecommerce/" },
  { label: "Logistics & Supply Chain", href: "/industries/logistics/" },
  { label: "Real Estate", href: "/industries/real-estate/" },
  { label: "Education & EdTech", href: "/industries/education/" },
  { label: "Travel & Hospitality", href: "/industries/travel/" },
  { label: "Manufacturing & 4.0", href: "/industries/manufacturing/" },
  { label: "Government", href: "/industries/government/" },
  { label: "Energy & Utilities", href: "/industries/energy/" },
];

/* ----------------------------- Header nav ----------------------------- */

export const HEADER_NAV: NavItem[] = [
  {
    label: "AI",
    href: "/ai-agents",
    mega: true,
    children: AI_LINKS,
    feature: {
      title: "Deploy your first AI agent in 2 to 4 weeks",
      copy: "Six production ready personas, trained on your data, guarded by enterprise security.",
      cta: "Explore the fleet",
      href: "/ai-agents",
    },
  },
  {
    label: "Services",
    href: "/services",
    children: SERVICE_LINKS,
    feature: {
      title: "Scope it in minutes",
      copy: "The instant estimator prices your project with no contact details needed.",
      cta: "Open the estimator",
      href: "/#services",
    },
  },
  {
    label: "Hire Developers",
    href: "/hire",
    children: HIRE_LINKS,
    feature: {
      title: "A senior dev in your standup within 2 weeks",
      copy: "Vetted engineers, transparent monthly rates and a two week trial on every engagement.",
      cta: "See roles and rates",
      href: "/hire",
    },
  },
  {
    label: "Industries",
    href: "/industries",
    children: INDUSTRY_LINKS,
    feature: {
      title: "Ten sectors, one playbook",
      copy: "Regulation fluent teams in healthcare, fintech and the Gulf energy economy.",
      cta: "Explore industries",
      href: "/industries",
    },
  },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Insights", href: "/insights" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

/* ----------------------------- Footer nav ----------------------------- */

export const FOOTER_NAV = {
  services: [
    ...SERVICE_LINKS,
    { label: "All Services", href: "/services" },
  ],
  industries: [
    ...INDUSTRY_LINKS,
    { label: "All Industries", href: "/industries" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Insights", href: "/insights" },
    { label: "Indore Office", href: "/locations/indore" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  quick: [
    { label: "Client Login", href: "/portal" },
    { label: "Employee Login", href: "/employee-portal" },
    { label: "Hire Developers", href: "/hire" },
    { label: "AI Agents", href: "/ai-agents", pro: true },
    { label: "Get a Quote", href: "/start" },
    { label: "Ask Savo Assistant", href: "/#ai" },
  ],
} as const satisfies Record<string, readonly (NavLink & { action?: "dialog" })[]>;
