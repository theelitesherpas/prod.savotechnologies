/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO CASE STUDIES - FICTIONAL DESIGN PROJECTS (FULL DOSSIER)
 * DEMO - REPLACE BEFORE PRODUCTION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Polished fictional projects with the complete dossier format - challenge,
 * solution, stack, results, palette, timeline and a testimonial PREVIEW -
 * so the public detail pages (/case-studies/[slug]) and the admin editor
 * can be evaluated end to end before real, client-approved engagements
 * arrive.
 *
 * None of these are Savo clients. Every metric is invented. Names were
 * checked against common trademarks at authoring time and chosen as
 * generic fictional identities - they must never be presented as real
 * engagements, in production, in sitemaps or in structured data.
 *
 * Source of truth for replacements: DEMO_CONTENT_REPLACEMENT.md
 */

import type { CaseStudyRecord } from "@/lib/case-study-schema";

export type DemoCaseStudy = CaseStudyRecord & {
  /** Wireframe art variant used by card renderers (presentation only). */
  variant: "a" | "b" | "c";
};

export const DEMO_CASE_STUDIES: DemoCaseStudy[] = [
  {
    title: "Meridian Commerce",
    clientName: "Meridian Commerce (demo)",
    displayClientName: "Meridian Commerce",
    discipline: "web",
    industry: "Ecommerce · Web Platform · Product Engineering",
    summary:
      "A modern commerce platform designed around faster product discovery, streamlined purchasing and scalable content management.",
    challenge:
      "The existing storefront buried products three clicks deep, content updates required a developer, and checkout abandonment climbed every peak season. Merchandising and engineering worked from different data, so campaigns shipped late and search relevance drifted.",
    solution:
      "We rebuilt the storefront as a composable Next.js platform: an intent-driven discovery layer with faceted search, a headless content model the merchandising team edits directly, and a checkout reduced to a single focused flow. Design system, component library and analytics events shipped as one system, not three.",
    services: ["Corporate Websites", "Web Applications", "Next.js Development", "Headless Architecture", "Progressive Web Apps"],
    technologies: ["Next.js", "TypeScript", "PostgreSQL"],
    results: [
      { value: "+42%", label: "Conversion Improvement", verified: false },
      { value: "-31%", label: "Page Load Time", verified: false },
      { value: "2.4×", label: "Faster Content Publishing", verified: false },
    ],
    palette: [
      { name: "Ink", hex: "#14161c" },
      { name: "Porcelain", hex: "#f4f2ec" },
      { name: "Meridian Blue", hex: "#1f4ee8" },
      { name: "Signal Amber", hex: "#e8a00f" },
    ],
    year: "2025",
    duration: "16 weeks",
    teamSize: "5 specialists",
    testimonial: {
      quote:
        "Placeholder testimonial - this slot carries the approved client quote for the engagement, its delivery experience and the measurable value created.",
      name: "Client Name",
      role: "Role · Company",
    },
    featured: true,
    status: "demo",
    variant: "a",
    gallery: [],
    authorName: "",
    clientLocation: "",
    businessModel: "",
    platforms: "",
    keyFeatures: [],
    integrations: [],
    liveUrl: null,
  },
  {
    title: "NovaFlow",
    clientName: "NovaFlow (demo)",
    displayClientName: "NovaFlow",
    discipline: "ai",
    industry: "SaaS · Workflow Automation · AI",
    summary:
      "A workflow platform combining operational dashboards, intelligent automation and AI-assisted task processing in one unified product experience.",
    challenge:
      "Operations teams stitched together six tools with spreadsheets and hand-offs. Every exception meant a person re-keying data, and nobody could see the state of a workflow without asking three departments. Manual processing consumed the team's best hours.",
    solution:
      "One unified product: a visual workflow builder with real-time operational dashboards, rule-based automation for the deterministic steps, and an AI layer - retrieval over company data with guardrails and human approval gates - for the exceptions. Every action is logged, observable and reversible.",
    services: ["Web Applications", "Custom Software Development", "AI Agent Development", "Business Process Automation"],
    technologies: ["Next.js", "PostgreSQL", "AI/LLM Integration", "Cloud Infrastructure"],
    results: [
      { value: "38%", label: "Less Manual Processing", verified: false },
      { value: "2.1×", label: "Faster Workflow Completion", verified: false },
      { value: "24/7", label: "Automated Workflow Availability", verified: false },
    ],
    palette: [
      { name: "Deep Space", hex: "#0d1220" },
      { name: "Circuit Violet", hex: "#6c4cf1" },
      { name: "Flow Teal", hex: "#12b5a5" },
      { name: "Mist", hex: "#e9edf5" },
    ],
    year: "2025",
    duration: "24 weeks",
    teamSize: "6 specialists",
    testimonial: {
      quote:
        "Placeholder testimonial - this slot carries the approved client quote for the engagement, its delivery experience and the measurable value created.",
      name: "Client Name",
      role: "Role · Company",
    },
    featured: true,
    status: "demo",
    variant: "b",
    gallery: [],
    authorName: "",
    clientLocation: "",
    businessModel: "",
    platforms: "",
    keyFeatures: [],
    integrations: [],
    liveUrl: null,
  },
  {
    title: "Aster Health",
    clientName: "Aster Health (demo)",
    displayClientName: "Aster Health",
    discipline: "mobile",
    industry: "Healthcare Technology · Mobile · Product Design",
    summary:
      "A mobile-first digital health experience designed to simplify appointment access, communication and everyday patient interactions.",
    challenge:
      "Patients booked by phone during office hours, missed reminders arrived by SMS if at all, and follow-up questions had no home. The clinic's staff spent hours a day on scheduling phone traffic, and no-show rates stayed stubbornly high.",
    solution:
      "A Flutter mobile product designed around the patient's day: self-service booking with real-time availability, a secure in-app conversation channel with the care team, and gentle, well-timed reminders. Accessibility (WCAG AA) and privacy-aware data handling shaped the architecture from the first sprint.",
    services: ["Mobile Application Development", "UI/UX Design", "API Development & Integration"],
    technologies: ["Flutter", "API Integration", "PostgreSQL", "Cloud"],
    results: [
      { value: "4.7/5", label: "Demo User Rating", verified: false },
      { value: "46%", label: "Faster Booking Flow", verified: false },
      { value: "32%", label: "Higher Digital Engagement", verified: false },
    ],
    palette: [
      { name: "Aster Green", hex: "#0f7a5a" },
      { name: "Clinical White", hex: "#f7faf8" },
      { name: "Slate", hex: "#2c3a43" },
      { name: "Calm Sky", hex: "#cfe6f2" },
    ],
    year: "2026",
    duration: "20 weeks",
    teamSize: "4 specialists",
    testimonial: {
      quote:
        "Placeholder testimonial - this slot carries the approved client quote for the engagement, its delivery experience and the measurable value created.",
      name: "Client Name",
      role: "Role · Company",
    },
    featured: true,
    status: "demo",
    variant: "c",
    gallery: [],
    authorName: "",
    clientLocation: "",
    businessModel: "",
    platforms: "",
    keyFeatures: [],
    integrations: [],
    liveUrl: null,
  },
  {
    title: "Northstar Logistics",
    clientName: "Northstar Logistics (demo)",
    displayClientName: "Northstar Logistics",
    discipline: "software",
    industry: "Logistics · Operations Platform",
    summary:
      "A unified operations platform designed to improve shipment visibility, workflow coordination and reporting across distributed teams.",
    challenge:
      "Shipment status lived in email threads and three legacy systems. Dispatchers reconciled spreadsheets twice a day, reporting to management was a weekly manual export, and exceptions surfaced late - usually after the customer called.",
    solution:
      "A single operations platform: live shipment visibility with event timelines, exception queues that route work to the right team, and reporting that assembles itself. A Node.js services layer integrates the legacy systems rather than replacing them in one risky cut-over.",
    services: ["Custom Software Development", "Web Applications", "API Development & Integration", "Cloud & Backend Engineering"],
    technologies: ["Next.js", "Node.js", "PostgreSQL"],
    results: [
      { value: "34%", label: "Faster Operational Workflows", verified: false },
      { value: "28%", label: "Less Manual Administration", verified: false },
      { value: "99.9%", label: "Demo Availability Target", verified: false },
    ],
    palette: [
      { name: "North", hex: "#101828" },
      { name: "Compass Orange", hex: "#ff6a2b" },
      { name: "Route Blue", hex: "#2f6fed" },
      { name: "Fog", hex: "#eef1f6" },
    ],
    year: "2026",
    duration: "18 weeks",
    teamSize: "5 specialists",
    testimonial: {
      quote:
        "Placeholder testimonial - this slot carries the approved client quote for the engagement, its delivery experience and the measurable value created.",
      name: "Client Name",
      role: "Role · Company",
    },
    featured: true,
    status: "demo",
    variant: "a",
    gallery: [],
    authorName: "",
    clientLocation: "",
    businessModel: "",
    platforms: "",
    keyFeatures: [],
    integrations: [],
    liveUrl: null,
  },
];

/**
 * DEMO DATA - NOT VERIFIED. Fictional client brands for any logo/brand
 * strip ("trusted by" style). Abstract wordmarks only - never render as
 * real customer relationships, and never in production.
 */
export const DEMO_CLIENTS: { name: string; status: "demo" | "verified" }[] = [
  "Meridian",
  "NovaFlow",
  "Aster",
  "Northstar",
  "Lumio",
  "Orbit",
].map((name) => ({ name, status: "demo" as const }));
