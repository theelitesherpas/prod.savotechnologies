/** The six core service groups shown on the homepage. */

export type ServiceGroup = {
  id: string;
  index: string;
  title: string;
  /** Short name for the per-service CTA, e.g. "Discuss a web project". */
  ctaName: string;
  positioning: string;
  capabilities: string[];
};

export const SERVICES: ServiceGroup[] = [
  {
    id: "web",
    index: "01",
    title: "Web Experiences",
    ctaName: "web",
    positioning:
      "Fast, scalable digital experiences designed around people and business outcomes.",
    capabilities: [
      "Corporate Websites",
      "Marketing Websites",
      "Web Applications",
      "Next.js Development",
      "React Development",
      "Headless Architecture",
      "Customer Portals",
      "Progressive Web Apps",
      "API Integrations",
      "Conversion-focused Experiences",
    ],
  },
  {
    id: "mobile",
    index: "02",
    title: "Mobile Products",
    ctaName: "mobile",
    positioning:
      "Mobile experiences designed to feel native, intuitive and built for long-term product growth.",
    capabilities: [
      "iOS",
      "Android",
      "Flutter",
      "React Native",
      "Cross-platform Development",
      "Native Integration",
      "Push Notifications",
      "Payments",
      "Maps",
      "Analytics",
      "API Integrations",
    ],
  },
  {
    id: "ai",
    index: "03",
    title: "AI & Intelligent Systems",
    ctaName: "AI",
    positioning:
      "AI that performs meaningful work, connects with real business systems and creates measurable value.",
    capabilities: [
      "AI Agents",
      "Agentic AI",
      "Generative AI",
      "LLM Applications",
      "AI Assistants",
      "RAG Systems",
      "Knowledge Systems",
      "AI Search",
      "AI Automation",
      "Document Intelligence",
      "Voice AI",
      "Multi-agent Workflows",
      "Tool Calling",
      "Business Process Automation",
    ],
  },
  {
    id: "software",
    index: "04",
    title: "Software & SaaS",
    ctaName: "software",
    positioning:
      "Software engineered around real operational requirements — not generic templates.",
    capabilities: [
      "Custom Software",
      "SaaS Platforms",
      "Business Applications",
      "Customer Portals",
      "Admin Systems",
      "Marketplaces",
      "Dashboards",
      "Subscription Platforms",
      "Multi-tenant Applications",
      "Enterprise Systems",
    ],
  },
  {
    id: "design",
    index: "05",
    title: "Product & Experience Design",
    ctaName: "design",
    positioning:
      "Beautiful interfaces are useful only when they make the product easier to understand and use.",
    capabilities: [
      "Product Strategy",
      "UX Research",
      "Information Architecture",
      "UI Design",
      "UX Design",
      "Design Systems",
      "Prototyping",
      "Conversion Design",
      "Usability Testing",
    ],
  },
  {
    id: "growth",
    index: "06",
    title: "Growth",
    ctaName: "growth",
    positioning:
      "Launching is only the beginning. We help digital products get discovered, understood and converted.",
    capabilities: [
      "Digital Marketing",
      "SEO",
      "AEO",
      "GEO",
      "Performance Marketing",
      "Content Strategy",
      "Conversion Optimization",
      "Analytics",
      "Marketing Automation",
    ],
  },
];

/** Slow, refined capability divider between hero chapters. */
export const MARQUEE_ITEMS = [
  "Strategy",
  "Product Design",
  "Web",
  "Mobile",
  "Software",
  "AI",
  "Automation",
  "Growth",
] as const;
