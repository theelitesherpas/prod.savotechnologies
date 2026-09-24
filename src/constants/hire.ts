/**
 * Hire — the roles catalogue and per-role detail content for /hire/.
 *
 * Ported from version 1 (savotech-website, lib/hire-data.tsx) with v6
 * content rules applied: process facts and rates carry over (they are
 * the published model); invented clients, testimonials and unverified
 * performance figures are NOT ported (PRODUCT.md hard rule).
 */

export type HireRole = {
  slug: string;
  title: string;
  short: string;
  tagline: string;
  heroLead: string;
  metaDescription: string;
  intro: [string, string];
  /** INR per month, dedicated senior — the published transparent rate. */
  monthly: number;
  /** Core stack chips (marquee + kit). */
  stack: string[];
  /** Workbench slots — what the engineer takes on. */
  engagements: { title: string; text: string }[];
  skills: { title: string; text: string }[];
  process: { name: string; text: string }[];
  why: { title: string; text: string }[];
  faqs: { q: string; a: string }[];
  /** Service-icon slug used as the role mark. */
  iconSlug: string;
  related: string[];
};

export const HIRE_ROLES: HireRole[] = [
  {
    slug: "ai-ml-engineers",
    title: "AI & ML Engineers",
    short: "AI & ML",
    tagline: "AI engineers who ship to production",
    heroLead:
      "Dedicated AI and ML engineers who have deployed agents, RAG systems and predictive models, not researchers with notebooks, engineers with pager duty.",
    metaDescription:
      "Hire dedicated AI and ML engineers from Savo Technologies: LLM applications, RAG, predictive models and MLOps. Matched in 48 hours, two week paid trial, transparent monthly rates.",
    intro: [
      "Serious AI work is engineering: retrieval over real data, evaluation suites that catch regressions, guardrails that hold under live traffic, and cost-aware inference that survives its own bill. That is the profile we vet for.",
      "Start with one engineer or a full pod, architect, engineer and data engineer working as your team, on your roadmap, in your standups. Your data stays in your cloud; you own every model and every line from the first commit.",
    ],
    monthly: 120000,
    stack: ["Python", "LangChain", "PyTorch", "pgvector", "Airflow", "MLflow", "FastAPI", "AWS"],
    engagements: [
      { title: "Custom AI agents & copilots", text: "Agents grounded in your data with tool calling, guardrails and human escalation designed in." },
      { title: "RAG knowledge systems", text: "Retrieval pipelines over your documents, answers with sources, hallucination-resistant by design." },
      { title: "LLM app integration", text: "Language-model features woven into existing products without disrupting what already works." },
      { title: "Forecasting & prediction", text: "Demand, churn and risk models monitored in production, not parked in a notebook." },
      { title: "Recommendation & anomaly detection", text: "Ranking systems and fraud/anomaly signals tied to metrics your business tracks." },
      { title: "Evaluation & MLOps", text: "Test suites, drift monitoring and retraining loops so models stay honest after launch." },
    ],
    skills: [
      { title: "LLM applications", text: "Agents, RAG pipelines, evaluation suites and guardrails that survive real traffic." },
      { title: "Predictive models", text: "Forecasting, recommendation and anomaly models monitored in production." },
      { title: "Data engineering", text: "Pipelines and feature stores that feed models reliably, versioned like code." },
      { title: "MLOps", text: "Deployment, drift monitoring and retraining loops so models stay honest." },
    ],
    process: [
      { name: "Share your needs", text: "A 30 minute call to understand the role, stack and team fit." },
      { name: "Meet matched engineers", text: "We shortlist within 48 hours; you interview whoever you want." },
      { name: "Two week paid trial", text: "Work together on real tasks. Not a fit? Replace or walk away." },
      { name: "Onboard and scale", text: "Same engineers long term. Add or reduce with 30 days notice." },
    ],
    why: [
      { title: "Production scars", text: "Engineers who have run models under real load, on call, for years. They design for failure from day one." },
      { title: "Business first", text: "Every model ties to a metric you track. No science projects on your budget." },
      { title: "Full stack around the model", text: "APIs, dashboards and integrations come from the same team, not a handoff." },
      { title: "Transparent rates", text: "One monthly rate per engineer. No recruitment fees, no benching charges." },
    ],
    faqs: [
      { q: "How quickly can an AI engineer start?", a: "Typically within two weeks of your first call. Senior profiles are shared within 48 hours, and most clients interview the same week." },
      { q: "What if the engineer is not a good fit?", a: "The first two weeks are a paid trial. If the fit is wrong, we replace the engineer or you stop, no questions asked." },
      { q: "Do they work only for us?", a: "Yes. Dedicated means dedicated: your engineer works exclusively on your product, in your tools and standups." },
      { q: "Who owns the code and models?", a: "You do, from the first commit, including training code and evaluation sets." },
    ],
    iconSlug: "ai-agent-development",
    related: ["full-stack-developers", "backend-developers"],
  },
  {
    slug: "frontend-developers",
    title: "Frontend Developers",
    short: "Frontend",
    tagline: "Frontend developers who sweat the pixels",
    heroLead:
      "React and Next.js engineers who treat performance budgets, accessibility and design fidelity as non-negotiable. They build design systems, not just screens.",
    metaDescription:
      "Hire dedicated frontend developers from Savo Technologies: React, Next.js, TypeScript, design systems and Core Web Vitals discipline. Matched in 48 hours with a two week paid trial.",
    intro: [
      "The frontend is where your product is judged in seconds. Our engineers ship interfaces that stay fast under content, accessible to every user and faithful to the design system they help maintain, with performance budgets enforced in CI, not aspirational.",
      "Embedded in your team from week one: your repo, your reviews, your Friday demos. They pair with designers in Figma, test on real devices and leave every component more reusable than they found it.",
    ],
    monthly: 85000,
    stack: ["React", "Next.js", "TypeScript", "Tailwind", "Storybook", "Playwright", "Vercel", "Figma"],
    engagements: [
      { title: "React & Next.js product builds", text: "App router, SSR and edge rendering, or careful migrations out of legacy React." },
      { title: "Design systems", text: "Component libraries, tokens and Storybook docs your whole team actually adopts." },
      { title: "Performance rescue", text: "Core Web Vitals budgets diagnosed, enforced in CI and defended release after release." },
      { title: "Accessibility upgrades", text: "WCAG 2.2 AA as a habit: keyboard paths, screen readers, reduced motion." },
      { title: "Headless commerce storefronts", text: "Fast, indexed, conversion-tuned storefronts on headless architecture." },
      { title: "Dashboard & data UIs", text: "Complex state made legible, tables, charts and flows that stay fast at scale." },
    ],
    skills: [
      { title: "React and Next.js", text: "App router, SSR, edge rendering and migrations from legacy React." },
      { title: "Design systems", text: "Component libraries, tokens and Storybook docs your whole team uses." },
      { title: "Performance", text: "Core Web Vitals budgets enforced in CI, not aspirational." },
      { title: "Accessibility", text: "WCAG 2.2 AA as a habit: keyboard, screen readers, reduced motion." },
    ],
    process: [
      { name: "Share your needs", text: "Stack, product area and the collaboration model you prefer." },
      { name: "Meet matched developers", text: "Shortlist within 48 hours with code samples and project history." },
      { name: "Two week paid trial", text: "Real tickets, real reviews. Keep or replace, your call." },
      { name: "Onboard and scale", text: "Long term dedication with the flexibility to resize." },
    ],
    why: [
      { title: "Design empathy", text: "They read Figma like engineers and argue for the user, not the framework." },
      { title: "Performance culture", text: "Budgets in CI, real device testing, no regressions shipped." },
      { title: "Senior by default", text: "Every profile we send has shipped and maintained production UI at scale." },
      { title: "Transparent rates", text: "One monthly rate. No recruiter cut stacked on top." },
    ],
    faqs: [
      { q: "Can they work in our existing codebase?", a: "That is the norm. Most engagements start inside an existing React or Next.js app, including older architectures we modernise incrementally." },
      { q: "How do you test their skills?", a: "Every candidate passes a practical review with our leads covering architecture, debugging and a live component build before you ever see the profile." },
      { q: "Do they join our standups and tools?", a: "Yes: Slack, Jira, GitHub, rituals. They behave like your employee, just on our payroll." },
      { q: "Can we hire them full time later?", a: "Yes, convert to your payroll after six months with a simple conversion fee." },
    ],
    iconSlug: "web-development",
    related: ["full-stack-developers", "mobile-developers"],
  },
  {
    slug: "backend-developers",
    title: "Backend Developers",
    short: "Backend",
    tagline: "Backend developers who build for the worst day",
    heroLead:
      "Node.js, Python and Go engineers designing APIs, data models and integrations that hold up under load and audit. Security-minded, test-obsessed, documentation-friendly.",
    metaDescription:
      "Hire dedicated backend developers from Savo Technologies: Node.js, Python, Go, PostgreSQL, integrations and security hardening. Matched in 48 hours, two week paid trial, transparent rates.",
    intro: [
      "The backend is a promise made under pressure: every request correct, every integration recoverable, every audit answerable. Our engineers carry regulated traffic for a living: payments, records and ledgers. They also write the documentation the next hire can follow.",
      "From payment rails to clinical records, they design for the worst day and then make it boring. Tests as a habit, least-privilege as a default, and runbooks that turn incidents into checklists.",
    ],
    monthly: 90000,
    stack: ["Node.js", "Python", "PostgreSQL", "Redis", "GraphQL", "Docker", "AWS", "Terraform"],
    engagements: [
      { title: "API design & development", text: "REST and GraphQL services with versioning and docs other teams enjoy consuming." },
      { title: "Microservices & monolith rescue", text: "Boundaries drawn honestly, including the discipline to keep a monolith when it serves you." },
      { title: "Payments & billing integrations", text: "Rails, reconciliation and retries engineered so the numbers always balance." },
      { title: "Database design & tuning", text: "PostgreSQL schemas and queries tuned for real access patterns, not demos." },
      { title: "Auth & security hardening", text: "Least privilege, encryption and the boring hygiene that prevents incidents." },
      { title: "Backend audits & rescue", text: "Inherit a service, stabilise it, and resume shipping without the sleepless nights." },
    ],
    skills: [
      { title: "APIs and services", text: "REST and GraphQL design, versioning, and docs other teams enjoy." },
      { title: "Data modelling", text: "PostgreSQL and NoSQL schemas tuned for real access patterns." },
      { title: "Integrations", text: "Payments, CRMs, ERPs and third-party APIs with retries and audit trails." },
      { title: "Security", text: "Auth, least privilege, encryption and the boring hygiene that prevents incidents." },
    ],
    process: [
      { name: "Share your needs", text: "Workload, stack and the compliance context, if any." },
      { name: "Meet matched developers", text: "Shortlist within 48 hours with architecture samples." },
      { name: "Two week paid trial", text: "Ship a real slice with your team reviewing every PR." },
      { name: "Onboard and scale", text: "Grow into a pod with a lead when you are ready." },
    ],
    why: [
      { title: "Regulated experience", text: "PCI and HIPAA-aligned, GDPR-ready engineers who know what auditors ask." },
      { title: "Boring reliability", text: "Backups, restores rehearsed, dashboards before incidents." },
      { title: "Clear writing", text: "Design docs and runbooks your next hire can follow." },
      { title: "Transparent rates", text: "One monthly rate per engineer, however hairy the problem." },
    ],
    faqs: [
      { q: "Which backend stacks do you cover?", a: "Primarily Node.js, Python and Go with PostgreSQL. If your stack differs, tell us, we will say no honestly if we cannot staff it well." },
      { q: "Can they take over an existing service?", a: "Yes. Most engagements begin with a knowledge-transfer week and a stabilisation plan before new features." },
      { q: "How is my data kept safe?", a: "Engineers work in your infrastructure with least-privilege access, NDA signed, and access revoked the day an engagement ends." },
      { q: "Can we start with one and grow?", a: "Most clients do. One engineer proving the model, then a pod of three to five within a quarter." },
    ],
    iconSlug: "custom-software",
    related: ["devops-qa-engineers", "ai-ml-engineers"],
  },
  {
    slug: "full-stack-developers",
    title: "Full Stack Developers",
    short: "Full Stack",
    tagline: "Full stack developers who own features end to end",
    heroLead:
      "Product-minded engineers comfortable from the database to the pixel: React on the front, Node or Python behind, PostgreSQL underneath, deployed on AWS.",
    metaDescription:
      "Hire dedicated full stack developers from Savo Technologies: React, Next.js, Node.js and PostgreSQL in one head. Feature ownership end to end, 48 hour matching, two week paid trial.",
    intro: [
      "When a feature needs one owner instead of three specialists, this is the profile. Our full stack engineers carry work from acceptance criteria to deploy button, tests and docs included, and ask why before they ask how.",
      "Ideal for zero-to-one phases, MVPs and teams where breadth beats depth: they scope honestly, push back with alternatives instead of excuses, and leave the codebase easier to extend than they found it.",
    ],
    monthly: 95000,
    stack: ["React", "Next.js", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS", "Playwright"],
    engagements: [
      { title: "MVP builds", text: "Zero to launch with a senior who has done it before, no assembled-by-committee first version." },
      { title: "Feature development end to end", text: "One owner per feature: schema, API, UI, tests and the deploy button." },
      { title: "SaaS products", text: "Multi-tenant foundations, billing and onboarding shipped as one coherent system." },
      { title: "Internal tools & admin panels", text: "The operational software your team deserves, built like a product not a spreadsheet." },
      { title: "Technology migrations", text: "Re-platforming in slices, shipping value along the way, not freezing for a rewrite." },
      { title: "Product rescue", text: "Inherit a stalled build, stabilise it, and get it moving again with a plan you can read." },
    ],
    skills: [
      { title: "Feature ownership", text: "From acceptance criteria to deploy button, including tests and docs." },
      { title: "Modern web stack", text: "Next.js, TypeScript, Node APIs and PostgreSQL schemas in one head." },
      { title: "Cloud deployment", text: "CI/CD, environments and monitoring set up and maintained." },
      { title: "Product judgment", text: "They ask why, propose simpler paths and flag risks early." },
    ],
    process: [
      { name: "Share your needs", text: "Product area and the stack depth needed front versus back." },
      { name: "Meet matched developers", text: "Shortlist within 48 hours, full stack profiles with shipped products." },
      { name: "Two week paid trial", text: "One real feature slice, reviewed by your lead." },
      { name: "Onboard and scale", text: "Add specialists around them as the product grows." },
    ],
    why: [
      { title: "Fewer handoffs", text: "One owner per feature means fewer meetings and faster Fridays." },
      { title: "Startup velocity", text: "Built for zero-to-one phases where breadth beats depth." },
      { title: "Senior judgment", text: "They scope honestly and push back with alternatives, not excuses." },
      { title: "Transparent rates", text: "One monthly rate, however wide the stack." },
    ],
    faqs: [
      { q: "Is full stack a jack of all trades?", a: "Ours are senior engineers who chose breadth. Each also has a deep specialism, front or back, which we match to where your work is heavier." },
      { q: "Can they lead a small team?", a: "Yes. Several of our full stack engineers run pods of two to four as tech leads." },
      { q: "How do you ensure code quality?", a: "Your reviews, our internal standards, automated tests and CI. Every engineer also has a Savo lead they can pull in for second opinions." },
      { q: "What does it cost to stop?", a: "Thirty days notice. No exit fees, no buyouts, and all work product is yours." },
    ],
    iconSlug: "product-engineering",
    related: ["frontend-developers", "backend-developers"],
  },
  {
    slug: "mobile-developers",
    title: "Mobile Developers",
    short: "Mobile",
    tagline: "Mobile developers who ship weekly",
    heroLead:
      "React Native and Flutter engineers, with Swift and Kotlin native specialists when the hardware demands it. Weekly store builds as a rhythm, crashes as exceptions.",
    metaDescription:
      "Hire dedicated mobile developers from Savo Technologies: React Native, Flutter, Swift and Kotlin. Weekly releases, offline-first apps, store operations. 48 hour matching, paid trial.",
    intro: [
      "Mobile is a rhythm discipline: weekly store builds, crashes treated as exceptions, and interfaces that survive real devices, bad networks and one-handed use. Our engineers have shipped fintech wallets, logistics trackers and healthcare apps across regions.",
      "Cross-platform where it earns its keep, native where the platform insists. Offline-first sync when the field has no signal, store operations handled end to end, listings, reviews, phased rollouts.",
    ],
    monthly: 90000,
    stack: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase", "Fastlane", "Detox", "Node.js"],
    engagements: [
      { title: "iOS & Android development", text: "One codebase, both stores, or full native when the product demands it." },
      { title: "Native modules", text: "Swift and Kotlin for camera, payments, BLE and background work." },
      { title: "Offline-first field apps", text: "Sync engines that survive dead zones and reconcile cleanly when signal returns." },
      { title: "App rescue & modernisation", text: "Crash and dependency audit first, then stabilise and resume weekly releases." },
      { title: "In-app payments & subscriptions", text: "Purchases, restores and edge cases handled on both stores." },
      { title: "Store operations", text: "Release trains, review handling, phased rollouts and ASO." },
    ],
    skills: [
      { title: "Cross platform", text: "React Native and Flutter apps with native quality and shared code discipline." },
      { title: "Native modules", text: "Swift and Kotlin for camera, payments, BLE and background work." },
      { title: "Offline first", text: "Sync engines that survive dead zones and bad networks." },
      { title: "Store operations", text: "Release trains, phased rollouts, review handling and ASO." },
    ],
    process: [
      { name: "Share your needs", text: "Platform, app stage and whether native depth is required." },
      { name: "Meet matched developers", text: "Shortlist within 48 hours with store links they shipped." },
      { name: "Two week paid trial", text: "Build on your TestFlight or Play track with your team." },
      { name: "Onboard and scale", text: "Add a designer or backend engineer around them as needed." },
    ],
    why: [
      { title: "Real device discipline", text: "Testing across the device mix your market actually uses, not just emulators." },
      { title: "Store veterans", text: "Hundreds of approvals navigated, including fintech scrutiny." },
      { title: "Backend fluent", text: "They speak APIs, auth and push infrastructure natively." },
      { title: "Transparent rates", text: "One monthly rate per engineer, platform agnostic." },
    ],
    faqs: [
      { q: "React Native, Flutter or native?", a: "Depends on your product. We staff all three and recommend honestly, including a hybrid where only some screens go native." },
      { q: "Can they rescue an existing app?", a: "Frequently. Crash and dependency audit first, then stabilise, modernise and resume weekly releases." },
      { q: "Do they handle store approvals?", a: "Yes: listings, metadata, screenshots, review responses and phased rollouts on both stores." },
      { q: "Can one developer cover both platforms?", a: "With React Native or Flutter, yes, that is the point. Pure native needs two specialists, which we also staff." },
    ],
    iconSlug: "mobile-apps",
    related: ["full-stack-developers", "frontend-developers"],
  },
  {
    slug: "devops-qa-engineers",
    title: "DevOps & QA Engineers",
    short: "DevOps & QA",
    tagline: "DevOps and QA engineers who delete 3am pages",
    heroLead:
      "Infrastructure as code, pipelines that deploy on merge, and test suites that catch regressions before your users do. They make releases boring, on purpose.",
    metaDescription:
      "Hire dedicated DevOps and QA engineers from Savo Technologies: Terraform, Kubernetes, CI/CD pipelines, Playwright automation and observability. 48 hour matching, paid trial, transparent rates.",
    intro: [
      "Reliability is engineered, not hoped for. Our DevOps and QA engineers build the machinery your product ships on: cloud accounts managed like code, deployments small enough to be boring, and quality gates that actually gate.",
      "From AWS landing zones to Playwright farms, everything they build arrives documented with runbooks, diagrams and a proper handover, so the capability stays with you, whatever happens next.",
    ],
    monthly: 95000,
    stack: ["AWS", "Kubernetes", "Terraform", "Docker", "GitHub Actions", "ArgoCD", "Playwright", "Grafana"],
    engagements: [
      { title: "AWS landing zones", text: "Accounts, guardrails and cost controls set up so growth doesn't create chaos." },
      { title: "Kubernetes build & operations", text: "Clusters sized to reality, with the discipline simpler options sometimes beat." },
      { title: "CI/CD pipeline engineering", text: "Trunk-based flows, preview environments and one-click rollbacks." },
      { title: "Test automation", text: "Playwright suites wired into CI with flake control, tests that gate, not decorate." },
      { title: "Observability & on-call setup", text: "Dashboards, alerts and runbooks tuned to your actual SLAs." },
      { title: "Cloud cost programmes", text: "Right-sizing and commitment strategy with savings visible in billing cycles." },
    ],
    skills: [
      { title: "Infrastructure as code", text: "Terraform-managed cloud accounts, peer reviewed like product code." },
      { title: "CI/CD pipelines", text: "Trunk based flows, preview environments, one click rollbacks." },
      { title: "Test automation", text: "Playwright and Detox suites wired into CI with flake control." },
      { title: "Observability", text: "Dashboards, alerts and runbooks tuned to your SLAs." },
    ],
    process: [
      { name: "Share your needs", text: "Cloud, pain points and where releases hurt today." },
      { name: "Meet matched engineers", text: "Shortlist within 48 hours with systems they run today." },
      { name: "Two week paid trial", text: "Fix one real pipeline or build one real test suite." },
      { name: "Onboard and scale", text: "Keep them on retainer or hand over with full runbooks." },
    ],
    why: [
      { title: "Audit ready", text: "PCI and SOC experience: guardrails, evidence and documentation built in." },
      { title: "Cost hunters", text: "Right-sizing and commitment strategy that pays for the engagement." },
      { title: "Quality gates", text: "Tests that gate releases, not decorate them." },
      { title: "Transparent rates", text: "One monthly rate; on-call optional and clearly priced." },
    ],
    faqs: [
      { q: "Can they take over our existing setup?", a: "That is most of the work: audit, stabilise, improve incrementally. No big-bang migrations unless truly needed." },
      { q: "Do you offer on call?", a: "Yes, with defined SLAs and runbooks, priced transparently on top of the monthly rate." },
      { q: "Is QA a separate engineer?", a: "You can hire pure QA automation, pure DevOps, or one engineer covering both for smaller setups." },
      { q: "What happens when they leave?", a: "Everything is code and documented: runbooks, diagrams and a proper handover are part of the engagement, not extras." },
    ],
    iconSlug: "cloud-devops",
    related: ["backend-developers", "full-stack-developers"],
  },
];

export function hireRole(slug: string): HireRole | undefined {
  return HIRE_ROLES.find((r) => r.slug === slug);
}

/** Shared engagement models — the index page's cabinet. */
export const HIRE_MODELS = [
  {
    title: "Dedicated developer",
    text: "One engineer embedded in your team, your tools, your standups. Monthly, cancel with 30 days notice.",
  },
  {
    title: "Build pod",
    text: "A lead plus two or three engineers who own a product area end to end, shipping weekly from week two.",
  },
  {
    title: "Squad with QA",
    text: "A full delivery unit with engineering, QA and a delivery manager, for teams shipping against hard deadlines.",
  },
] as const;

/** Process facts of the published model (no invented performance figures). */
export const HIRE_FACTS = [
  { v: "48 hours", l: "to matched profiles" },
  { v: "2 weeks", l: "to a senior in your standup" },
  { v: "Paid trial", l: "two weeks, cancel anytime" },
  { v: "30 days", l: "notice to scale up or down" },
] as const;
