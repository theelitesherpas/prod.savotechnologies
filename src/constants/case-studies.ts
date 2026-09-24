/**
 * Case-study dossier — the discipline index that drives /case-studies/.
 *
 * HARD CONTENT RULE (PRODUCT.md): never fabricate clients, metrics or
 * results. Every entry is an honest specimen slot: the sector, services
 * and stack describe capability slots drawn from the public services and
 * industries lists; names stay bracketed and outcomes stay pending until
 * SAVO supplies verified engagements. The page copy states this policy
 * explicitly — "In preparation" is the honest state, not a defect.
 */

export type CaseEntry = {
  featured: boolean;
  /** Bracketed until a verified engagement is published. */
  name: string;
  sector: string;
  services: string;
  stack: string;
  /** Placeholder until the client approves real figures. */
  outcome: string;
};

export type CaseDiscipline = {
  id: "web" | "mobile" | "ai" | "software" | "design" | "growth";
  index: string;
  title: string;
  lead: string;
  /** Short board label + hint for the hero index cells. */
  hint: string;
  /** Engagement types filed under this discipline (capability chips). */
  capabilities: string[];
  entries: CaseEntry[];
};

const PENDING_OUTCOME = "[Verified project result required]";
const PENDING_NAME = "[Project Name]";

export const CASE_DISCIPLINES: CaseDiscipline[] = [
  {
    id: "web",
    index: "02",
    title: "Web development",
    lead: "Marketing platforms, customer portals, headless storefronts and full web applications — engineered for speed, search and conversion. Engagements file here as they complete and their results verify.",
    hint: "Platforms · portals · storefronts",
    capabilities: [
      "Corporate Websites",
      "Web Applications",
      "Next.js Development",
      "Headless Architecture",
      "Customer Portals",
      "Progressive Web Apps",
    ],
    entries: [
      {
        featured: true,
        name: PENDING_NAME,
        sector: "Professional Services",
        services: "Corporate platform · Customer portal",
        stack: "Next.js · Node.js · PostgreSQL",
        outcome: PENDING_OUTCOME,
      },
      {
        featured: false,
        name: PENDING_NAME,
        sector: "Retail & eCommerce",
        services: "Headless storefront · PWA",
        stack: "Next.js · Headless CMS · Stripe",
        outcome: PENDING_OUTCOME,
      },
      {
        featured: false,
        name: PENDING_NAME,
        sector: "Travel & Hospitality",
        services: "Booking platform · Content system",
        stack: "React · Node.js · AWS",
        outcome: PENDING_OUTCOME,
      },
    ],
  },
  {
    id: "mobile",
    index: "03",
    title: "Mobile products",
    lead: "iOS and Android products that feel native and hold up in daily use — Flutter, React Native or fully native, chosen by the problem rather than by habit.",
    hint: "iOS · Android · cross-platform",
    capabilities: [
      "iOS & Android",
      "Flutter",
      "React Native",
      "Push Notifications",
      "Payments",
      "Offline-first Data",
    ],
    entries: [
      {
        featured: true,
        name: PENDING_NAME,
        sector: "Healthcare",
        services: "Patient app · Telehealth · Notifications",
        stack: "Flutter · Firebase · WebRTC",
        outcome: PENDING_OUTCOME,
      },
      {
        featured: false,
        name: PENDING_NAME,
        sector: "FinTech & Banking",
        services: "Digital wallet · eKYC · Payments",
        stack: "Flutter · Node.js · PCI DSS",
        outcome: PENDING_OUTCOME,
      },
      {
        featured: false,
        name: PENDING_NAME,
        sector: "Logistics & Supply Chain",
        services: "Fleet tracking · Offline-first",
        stack: "React Native · Maps · GraphQL",
        outcome: PENDING_OUTCOME,
      },
    ],
  },
  {
    id: "ai",
    index: "04",
    title: "AI & intelligent systems",
    lead: "Agents, RAG systems and copilots that perform real work inside business workflows — built with guardrails, human oversight and evaluation from the first sprint.",
    hint: "Agents · RAG · copilots",
    capabilities: [
      "AI Agents",
      "RAG Systems",
      "LLM Applications",
      "Document Intelligence",
      "AI Search",
      "Evaluation & Guardrails",
    ],
    entries: [
      {
        featured: true,
        name: PENDING_NAME,
        sector: "Enterprise",
        services: "Support agent · Knowledge base",
        stack: "Python · LLMs · RAG · PostgreSQL",
        outcome: PENDING_OUTCOME,
      },
      {
        featured: false,
        name: PENDING_NAME,
        sector: "Professional Services",
        services: "Document intelligence · Extraction",
        stack: "Python · LLMs · Vector search",
        outcome: PENDING_OUTCOME,
      },
      {
        featured: false,
        name: PENDING_NAME,
        sector: "Education & EdTech",
        services: "Learning copilot · Tutoring",
        stack: "Python · LLMs · Evals",
        outcome: PENDING_OUTCOME,
      },
    ],
  },
  {
    id: "software",
    index: "05",
    title: "Software & SaaS",
    lead: "Custom platforms, SaaS products and internal systems shaped around real operations — multi-tenant by design, and boring in exactly the right places.",
    hint: "SaaS · operations systems",
    capabilities: [
      "Custom Software",
      "SaaS Platforms",
      "Multi-tenant Applications",
      "Admin Systems",
      "Dashboards",
      "API Integrations",
    ],
    entries: [
      {
        featured: true,
        name: PENDING_NAME,
        sector: "Startups",
        services: "SaaS platform · Billing · Multi-tenant",
        stack: "TypeScript · Node.js · PostgreSQL",
        outcome: PENDING_OUTCOME,
      },
      {
        featured: false,
        name: PENDING_NAME,
        sector: "Manufacturing & 4.0",
        services: "Operations system · Dashboards",
        stack: "React · Node.js · Redis",
        outcome: PENDING_OUTCOME,
      },
    ],
  },
  {
    id: "design",
    index: "06",
    title: "Product & experience design",
    lead: "Research, interface systems and prototypes that make complex products obvious — design judged by what users accomplish, never by decoration.",
    hint: "UX · design systems",
    capabilities: [
      "UX Research",
      "Information Architecture",
      "UI & UX Design",
      "Design Systems",
      "Prototyping",
      "Usability Testing",
    ],
    entries: [
      {
        featured: true,
        name: PENDING_NAME,
        sector: "SaaS",
        services: "Product UX · Design system",
        stack: "Figma · Design tokens",
        outcome: PENDING_OUTCOME,
      },
      {
        featured: false,
        name: PENDING_NAME,
        sector: "Retail & eCommerce",
        services: "Experience redesign · CRO",
        stack: "Figma · Prototyping · Testing",
        outcome: PENDING_OUTCOME,
      },
    ],
  },
  {
    id: "growth",
    index: "07",
    title: "Growth",
    lead: "Search, answer engines and conversion work that compounds after launch — measured against pipeline and revenue, not vanity metrics.",
    hint: "SEO · AEO · conversion",
    capabilities: [
      "SEO",
      "AEO & GEO",
      "Conversion Optimization",
      "Analytics",
      "Content Strategy",
      "Marketing Automation",
    ],
    entries: [
      {
        featured: true,
        name: PENDING_NAME,
        sector: "Professional Services",
        services: "SEO · AEO · Structured data",
        stack: "Next.js · Schema.org · GA4",
        outcome: PENDING_OUTCOME,
      },
      {
        featured: false,
        name: PENDING_NAME,
        sector: "Travel & Hospitality",
        services: "Performance marketing · CRO",
        stack: "Analytics · A/B testing",
        outcome: PENDING_OUTCOME,
      },
    ],
  },
];

/** Representative studio photography per discipline (duotone, inks with the document). */
export const CASE_PHOTO: Record<CaseDiscipline["id"], string> = {
  web: "/images/code.webp",
  mobile: "/images/mobile.webp",
  ai: "/images/meeting.webp",
  software: "/images/architecture.webp",
  design: "/images/studio.webp",
  growth: "/images/team.webp",
};

/** What every dossier carries once published (editorial-policy band). */
export const DOSSIER_CONTENTS = [
  "Client & sector",
  "The challenge, in plain words",
  "Approach & architecture",
  "Technology stack",
  "Timeline & team",
  "Verified outcomes",
] as const;
