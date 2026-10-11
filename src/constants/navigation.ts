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
/* Href contract: root-relative, no trailing slash, final destination slug.
 * Legacy short slugs (mobile-apps, ui-ux, custom-software) stay served by
 * 308 redirects in next.config.ts for external equity, but every internal
 * menu/submenu/footer link points directly at the canonical route so no
 * click ever bounces through a redirect. */

export const AI_LINKS: NavLink[] = [
  { label: "AI Agents", href: "/ai-agents", pro: true, desc: "Focused roles, knowledge, tools and human review" },
  { label: "Business Automation", href: "/ai/automation", desc: "Connected workflows, clear rules and approvals" },
  { label: "Generative AI & LLM Integration", href: "/ai/generative-ai", desc: "Knowledge search, drafting and product copilots" },
  { label: "AI Consulting & Strategy", href: "/ai/consulting", desc: "Feasibility, priorities and a practical first step" },
  { label: "Machine Learning & Analytics", href: "/ai/machine-learning", desc: "Forecasting, patterns and model operations" },
];

export const SERVICE_LINKS: NavLink[] = [
  { label: "Web Development", href: "/services/web-development", desc: "Fast, search-strong websites and platforms" },
  { label: "Mobile App Development", href: "/services/mobile-app-development", desc: "iOS and Android, Flutter and React Native" },
  { label: "UI/UX Design", href: "/services/ui-ux-design", desc: "Research, prototypes, design systems" },
  { label: "Cloud & DevOps", href: "/services/cloud-devops", desc: "Infrastructure that scales quietly" },
  { label: "Data & Analytics", href: "/services/data-analytics", desc: "Pipelines, dashboards, decisions" },
  { label: "AI Agent Development", href: "/services/ai-agent-development", desc: "Tool use, evaluation and human oversight" },
  { label: "Custom Software", href: "/services/custom-software-development", desc: "Operational systems built to last" },
  { label: "Digital Marketing & SEO", href: "/services/digital-marketing", desc: "Growth across search and social" },
  { label: "QA & Testing", href: "/services/qa-testing", desc: "Quality engineered in, not bolted on" },
  { label: "Product Engineering", href: "/services/product-engineering", desc: "From first prototype to scale" },
];

export const HIRE_LINKS: NavLink[] = [
  { label: "AI & ML Engineers", href: "/hire/ai-ml-engineers", desc: "Models, pipelines, LLM systems" },
  { label: "Frontend Developers", href: "/hire/frontend-developers", desc: "React and Next.js interfaces" },
  { label: "Backend Developers", href: "/hire/backend-developers", desc: "APIs, services, data layers" },
  { label: "Full Stack Developers", href: "/hire/full-stack-developers", desc: "End to end product engineers" },
  { label: "Mobile Developers", href: "/hire/mobile-developers", desc: "Flutter and React Native" },
  { label: "DevOps & QA Engineers", href: "/hire/devops-qa-engineers", desc: "Reliability and quality gates" },
];

export const INDUSTRY_LINKS: NavLink[] = [
  { label: "Healthcare", href: "/industries/healthcare", desc: "Patient and clinical systems" },
  { label: "FinTech & Banking", href: "/industries/fintech", desc: "Payments, ledgers, compliance" },
  { label: "Ecommerce & Retail", href: "/industries/ecommerce", desc: "Storefronts and operations" },
  { label: "Logistics & Supply Chain", href: "/industries/logistics", desc: "Fleet, tracking, fulfilment" },
  { label: "Real Estate", href: "/industries/real-estate", desc: "Listings, portals, transactions" },
  { label: "Education & EdTech", href: "/industries/education", desc: "Learning platforms and classrooms" },
  { label: "Travel & Hospitality", href: "/industries/travel", desc: "Booking and guest experience" },
  { label: "Manufacturing & 4.0", href: "/industries/manufacturing", desc: "IoT and shop-floor systems" },
  { label: "Government", href: "/industries/government", desc: "Public-sector grade platforms" },
  { label: "Energy & Utilities", href: "/industries/energy", desc: "Grid, billing, field operations" },
];

/** Company destinations shared by the desktop mega-menu and mobile drawer. */
export const WHO_WE_ARE_LINKS: NavLink[] = [
  { label: "About Us", href: "/about", desc: "Our team, story and approach to building software" },
  { label: "Services", href: "/services", desc: "Explore the full range of design and engineering services" },
  { label: "Enterprise", href: "/enterprise", desc: "Delivery, collaboration and vendor review for larger organisations" },
  { label: "Contact Us", href: "/contact", desc: "Start a conversation or reach our team directly" },
];

/* ----------------------------- Header nav ----------------------------- */

export const HEADER_NAV: NavItem[] = [
  {
    label: "Who We Are",
    mega: true,
    children: WHO_WE_ARE_LINKS,
    feature: {
      title: "Meet Savo",
      copy: "Get to know our team, explore our services and find the right way to work together.",
      cta: "About Us",
      href: "/about",
    },
  },
  {
    label: "AI",
    href: "/ai-agents",
    mega: true,
    children: AI_LINKS,
    feature: {
      eyebrow: "AI Agents",
      title: "See a task, end to end.",
      copy: "Explore focused agents and illustrative workflows - from the source information to a human-reviewed next step.",
      cta: "Explore AI agents",
      href: "/ai-agents",
    },
  },
  {
    label: "Services",
    href: "/services",
    children: SERVICE_LINKS,
    feature: {
      eyebrow: "Project Estimator",
      title: "Start with the right scope",
      copy: "See how design, development and ongoing support fit together around the product you want to build.",
      cta: "Explore our services",
      href: "/#services",
    },
  },
  {
    label: "Hire Developers",
    href: "/hire",
    children: HIRE_LINKS,
    feature: {
      eyebrow: "Build Your Team",
      title: "The skills your team needs next",
      copy: "Find the engineering roles that complement your team, your technology and the work ahead.",
      cta: "Explore developer roles",
      href: "/hire",
    },
  },
  {
    label: "Industries",
    href: "/industries",
    children: INDUSTRY_LINKS,
    feature: {
      eyebrow: "Industry Experience",
      title: "Built around the way you work",
      copy: "Explore sector-specific workflows, integrations and product considerations before defining the solution.",
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
  /* Enterprise buyer track (spec Parts 21–24): trust, enterprise, profile. */
  enterprise: [
    { label: "Trust & Security", href: "/trust" },
    { label: "Enterprise", href: "/enterprise" },
    { label: "Company Profile", href: "/company-profile" },
    { label: "Technology & Architecture", href: "/technology" },
  ],
  quick: [
    { label: "Client Login", href: "/portal" },
    { label: "Employee Login", href: "/employee-portal" },
    { label: "Hire Developers", href: "/hire" },
    { label: "AI Agents", href: "/ai-agents", pro: true },
    { label: "Get a Quote", href: "/start-a-project" },
    { label: "Ask Savo Assistant", href: "/#ai" },
  ],
} as const satisfies Record<string, readonly (NavLink & { action?: "dialog" })[]>;
