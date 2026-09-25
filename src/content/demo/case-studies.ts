/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO CASE STUDIES — FICTIONAL DESIGN PROJECTS
 * DEMO — REPLACE BEFORE PRODUCTION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Polished fictional projects so case-study cards, the selected-work band
 * and the /case-studies dossier remain visually complete while real,
 * client-approved engagements are pending.
 *
 * None of these are Savo clients. Every metric is invented. Names were
 * checked against common trademarks at authoring time and chosen as
 * generic fictional identities — they must never be presented as real
 * engagements, in production, in sitemaps or in structured data.
 *
 * Visual policy: cards use the existing abstract wireframe art only —
 * no real company logos, no third-party trademarks, no fabricated
 * testimonial portraits (see demo/testimonial.ts for the honest preview).
 *
 * Source of truth for replacements: DEMO_CONTENT_REPLACEMENT.md
 */

import type { ContentStatus } from "@/lib/content-mode";

export type DemoCaseStudy = {
  /** Fictional project identity. */
  name: string;
  /** Discipline board this specimen files under on /case-studies. */
  discipline: "web" | "mobile" | "ai" | "software" | "design" | "growth";
  industry: string;
  services: string;
  summary: string;
  stack: string[];
  results: { value: string; label: string }[];
  /** Wireframe art variant used by the card renderer. */
  variant: "a" | "b" | "c";
  status: ContentStatus;
};

export const DEMO_CASE_STUDIES: DemoCaseStudy[] = [
  {
    name: "Meridian Commerce",
    discipline: "web",
    industry: "Ecommerce · Web Platform · Product Engineering",
    services: "Ecommerce platform · Product engineering",
    summary:
      "A modern commerce platform designed around faster product discovery, streamlined purchasing and scalable content management.",
    stack: ["Next.js", "TypeScript", "PostgreSQL"],
    results: [
      { value: "+42%", label: "Conversion Improvement" },
      { value: "-31%", label: "Page Load Time" },
      { value: "2.4×", label: "Faster Content Publishing" },
    ],
    variant: "a",
    status: "demo",
  },
  {
    name: "NovaFlow",
    discipline: "ai",
    industry: "SaaS · Workflow Automation · AI",
    services: "Workflow platform · AI automation",
    summary:
      "A workflow platform combining operational dashboards, intelligent automation and AI-assisted task processing in one unified product experience.",
    stack: ["Next.js", "PostgreSQL", "AI/LLM Integration", "Cloud Infrastructure"],
    results: [
      { value: "38%", label: "Less Manual Processing" },
      { value: "2.1×", label: "Faster Workflow Completion" },
      { value: "24/7", label: "Automated Workflow Availability" },
    ],
    variant: "b",
    status: "demo",
  },
  {
    name: "Aster Health",
    discipline: "mobile",
    industry: "Healthcare Technology · Mobile · Product Design",
    services: "Mobile health product · Product design",
    summary:
      "A mobile-first digital health experience designed to simplify appointment access, communication and everyday patient interactions.",
    stack: ["Flutter", "API Integration", "PostgreSQL", "Cloud"],
    results: [
      { value: "4.7/5", label: "Demo User Rating" },
      { value: "46%", label: "Faster Booking Flow" },
      { value: "32%", label: "Higher Digital Engagement" },
    ],
    variant: "c",
    status: "demo",
  },
  {
    name: "Northstar Logistics",
    discipline: "software",
    industry: "Logistics · Operations Platform",
    services: "Operations platform · Workflow engineering",
    summary:
      "A unified operations platform designed to improve shipment visibility, workflow coordination and reporting across distributed teams.",
    stack: ["Next.js", "Node.js", "PostgreSQL"],
    results: [
      { value: "34%", label: "Faster Operational Workflows" },
      { value: "28%", label: "Less Manual Administration" },
      { value: "99.9%", label: "Demo Availability Target" },
    ],
    variant: "a",
    status: "demo",
  },
];

/**
 * DEMO DATA — NOT VERIFIED. Fictional client brands for any logo/brand
 * strip ("trusted by" style). Abstract wordmarks only — never render as
 * real customer relationships, and never in production.
 */
export const DEMO_CLIENTS: { name: string; status: ContentStatus }[] = [
  "Meridian",
  "NovaFlow",
  "Aster",
  "Northstar",
  "Lumio",
  "Orbit",
].map((name) => ({ name, status: "demo" as const }));
