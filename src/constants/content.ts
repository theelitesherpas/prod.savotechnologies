/** Homepage narrative content - methodology, technology, why-savo, industries, growth. */

export const METHODOLOGY = [
  {
    index: "01",
    name: "Discover",
    text: "Understand the business, users, market and technical challenge.",
  },
  {
    index: "02",
    name: "Define",
    text: "Turn insight into product requirements, architecture and direction.",
  },
  {
    index: "03",
    name: "Design",
    text: "Create intuitive user journeys, interfaces and systems.",
  },
  {
    index: "04",
    name: "Build",
    text: "Engineer reliable digital products using modern technology.",
  },
  {
    index: "05",
    name: "Grow",
    text: "Measure performance, improve the product and help it scale.",
  },
] as const;

export const TECHNOLOGY_STACK = [
  { category: "Web", items: ["Next.js", "React", "TypeScript", "Tailwind CSS"] },
  { category: "Mobile", items: ["Flutter", "React Native", "Swift", "Kotlin"] },
  { category: "Backend", items: ["Node.js", "Python", "REST APIs", "GraphQL"] },
  { category: "Data", items: ["PostgreSQL", "Redis", "Vector Search"] },
  {
    category: "AI",
    items: ["LLMs", "RAG", "AI Agents", "Embeddings", "Structured Outputs", "Tool Calling"],
  },
  { category: "Infrastructure", items: ["Vercel", "AWS", "Cloudflare", "Docker"] },
] as const;

export const WHY_SAVO = [
  {
    title: "Product Thinking",
    text: "We first understand what should be built and why.",
  },
  {
    title: "Design + Engineering",
    text: "Design decisions are made with implementation in mind, and engineering decisions consider the user experience.",
  },
  {
    title: "AI-Native Thinking",
    text: "AI is considered as part of the product architecture, not added afterward as a marketing feature.",
  },
  {
    title: "Built to Scale",
    text: "Architecture, maintainability, security and performance are considered from the beginning.",
  },
  {
    title: "One Connected Team",
    text: "Strategy, design, engineering, AI and growth work together rather than as disconnected vendors.",
  },
  {
    title: "Long-Term Product Mindset",
    text: "A launch is not the finish line. Digital products should continue improving.",
  },
] as const;

/**
 * Impact metrics - CONTENT_MODE gated (see src/lib/content-mode.ts).
 *
 * demo mode:  polished DEMO values (src/content/demo/company.ts) so the
 *             statistics band stays visually complete for design review.
 *             DEMO DATA - NOT VERIFIED, never in JSON-LD/SEO/metadata.
 * production: honest pending slots ("…") - false statistics are never
 *             rendered; verified figures replace them when Savo supplies
 *             them via the admin-managed company configuration.
 */
import { IS_DEMO } from "@/lib/content-mode";
import { DEMO_METRICS } from "@/content/demo";

export const METRICS = IS_DEMO
  ? DEMO_METRICS.map(({ value, label }) => ({ value, label }))
  : ([
      { value: "…", label: "Projects Delivered" },
      { value: "…", label: "Clients Supported" },
      { value: "…", label: "Industries Served" },
      { value: "…", label: "Markets Reached" },
    ] as const);

export const INDUSTRIES = [
  "Retail & eCommerce",
  "Healthcare",
  "FinTech",
  "Real Estate",
  "Education",
  "Travel",
  "Hospitality",
  "Logistics",
  "Manufacturing",
  "Professional Services",
  "Startups",
  "Enterprise",
] as const;

export const AI_USE_CASES = [
  "Customer Support Agent",
  "Sales Qualification Agent",
  "Internal Knowledge Agent",
  "Research Agent",
  "Operations Agent",
  "Document Processing Agent",
  "Business Process Automation",
  "No-Code & Low-Code Workflows",
] as const;

export const AI_TRUST_POINTS = [
  "Security",
  "Guardrails",
  "Human Oversight",
  "Observability",
  "Permissions",
  "Evaluation",
  "Fallback Behavior",
  "Business Integrations",
] as const;

/** Agent pipeline stages for the AI section visualization. */
export const AI_PIPELINE = [
  { label: "User / Business Event", note: "trigger" },
  { label: "AI Agent", note: "perception" },
  { label: "Reasoning & Orchestration", note: "planning" },
  { label: "Tools + Company Data", note: "grounding" },
  { label: "CRM · ERP · APIs · PostgreSQL · Documents", note: "systems" },
  { label: "Action / Result", note: "execution" },
  { label: "Human Approval When Required", note: "governance" },
] as const;

export const GROWTH_CHANNELS = [
  {
    abbr: "SEO",
    name: "Search Engine Optimization",
    text: "Being found when people actively search for what you build, technical, structural and content work that compounds.",
  },
  {
    abbr: "AEO",
    name: "Answer Engine Optimization",
    text: "Being the answer AI assistants cite, structured, unambiguous content that machines can trust and quote.",
  },
  {
    abbr: "GEO",
    name: "Generative Engine Optimization",
    text: "Presence inside generative search, where an increasing share of buying decisions now begin.",
  },
] as const;

export const GROWTH_CAPABILITIES = [
  "Analytics",
  "Conversion Optimization",
  "Performance Marketing",
  "Content Strategy",
  "Marketing Automation",
] as const;

/**
 * Selected work placeholders. Every field is clearly a placeholder until
 * verified SAVO case studies are supplied - nothing here is presented as fact.
 */
export const WORK_PLACEHOLDERS = [
  {
    featured: true,
    name: "[Project Name]",
    industry: "[Industry]",
    services: "[Service]",
    stack: "[Technology]",
    outcome: "[Verified project result required]",
    variant: "a" as const,
  },
  {
    featured: false,
    name: "[Project Name]",
    industry: "[Industry]",
    services: "[Service]",
    stack: "[Technology]",
    outcome: "[Verified project result required]",
    variant: "b" as const,
  },
  {
    featured: false,
    name: "[Project Name]",
    industry: "[Industry]",
    services: "[Service]",
    stack: "[Technology]",
    outcome: "[Verified project result required]",
    variant: "c" as const,
  },
] as const;
