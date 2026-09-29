/**
 * SAVO v6 navigation - ported from the version-1 site (/newdesign).
 * Labels, hrefs and feature-card copy carry over unchanged; v6 renders
 * them in its own design language. Future routes (services/*, hire/*,
 * industries/*, careers, portal) resolve to the designed "in production"
 * page until those pages are built in v6.
 */

export type NavLink = { label: string; href: string; pro?: boolean; /** One-line contextual descriptor shown in the mega-drawer. */
  desc?: string };

export type NavFeature = {
  /** Small mono eyebrow above the feature title (e.g. "AI AGENTS"). */
  eyebrow?: string;
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
  { label: "AI Agents", href: "/ai-agents", pro: true, desc: "Production personas, trained on your data" },
  { label: "Business Automation", href: "/ai/automation/", desc: "No-code, low-code and AI-powered workflows" },
  { label: "Generative AI & LLM Integration", href: "/ai/generative-ai/", desc: "LLMs wired into real products" },
  { label: "AI Consulting & Strategy", href: "/ai/consulting/", desc: "Roadmaps, audits and honest feasibility" },
  { label: "Machine Learning & Analytics", href: "/ai/machine-learning/", desc: "Models and insight from your data" },
];

export const SERVICE_LINKS: NavLink[] = [
  { label: "Web Development", href: "/services/web-development/", desc: "Fast, search-strong websites and platforms" },
  { label: "Mobile App Development", href: "/services/mobile-apps/", desc: "iOS and Android, Flutter and React Native" },
  { label: "UI/UX Design", href: "/services/ui-ux/", desc: "Research, prototypes, design systems" },
  { label: "Cloud & DevOps", href: "/services/cloud-devops/", desc: "Infrastructure that scales quietly" },
  { label: "Data & Analytics", href: "/services/data-analytics/", desc: "Pipelines, dashboards, decisions" },
  { label: "AI Agent Development", href: "/services/ai-agent-development/", desc: "Agents with guardrails, in production" },
  { label: "Custom Software", href: "/services/custom-software/", desc: "Operational systems built to last" },
  { label: "Digital Marketing & SEO", href: "/services/digital-marketing/", desc: "Growth across search and social" },
  { label: "QA & Testing", href: "/services/qa-testing/", desc: "Quality engineered in, not bolted on" },
  { label: "Product Engineering", href: "/services/product-engineering/", desc: "From first prototype to scale" },
];

export const HIRE_LINKS: NavLink[] = [
  { label: "AI & ML Engineers", href: "/hire/ai-ml-engineers/", desc: "Models, pipelines, LLM systems" },
  { label: "Frontend Developers", href: "/hire/frontend-developers/", desc: "React and Next.js interfaces" },
  { label: "Backend Developers", href: "/hire/backend-developers/", desc: "APIs, services, data layers" },
  { label: "Full Stack Developers", href: "/hire/full-stack-developers/", desc: "End to end product engineers" },
  { label: "Mobile Developers", href: "/hire/mobile-developers/", desc: "Flutter and React Native" },
  { label: "DevOps & QA Engineers", href: "/hire/devops-qa-engineers/", desc: "Reliability and quality gates" },
];

export const INDUSTRY_LINKS: NavLink[] = [
  { label: "Healthcare", href: "/industries/healthcare/", desc: "Patient and clinical systems" },
  { label: "FinTech & Banking", href: "/industries/fintech/", desc: "Payments, ledgers, compliance" },
  { label: "Ecommerce & Retail", href: "/industries/ecommerce/", desc: "Storefronts and operations" },
  { label: "Logistics & Supply Chain", href: "/industries/logistics/", desc: "Fleet, tracking, fulfilment" },
  { label: "Real Estate", href: "/industries/real-estate/", desc: "Listings, portals, transactions" },
  { label: "Education & EdTech", href: "/industries/education/", desc: "Learning platforms and classrooms" },
  { label: "Travel & Hospitality", href: "/industries/travel/", desc: "Booking and guest experience" },
  { label: "Manufacturing & 4.0", href: "/industries/manufacturing/", desc: "IoT and shop-floor systems" },
  { label: "Government", href: "/industries/government/", desc: "Public-sector grade platforms" },
  { label: "Energy & Utilities", href: "/industries/energy/", desc: "Grid, billing, field operations" },
];

/* ----------------------------- Header nav ----------------------------- */

export const HEADER_NAV: NavItem[] = [
  {
    label: "AI",
    href: "/ai-agents",
    mega: true,
    children: AI_LINKS,
    feature: {
      eyebrow: "AI Agents",
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
      eyebrow: "Project Estimator",
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
      eyebrow: "Build Your Team",
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
      eyebrow: "Industry Experience",
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
    { label: "Switzerland Office", href: "/locations/switzerland" },
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
