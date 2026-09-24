/**
 * Service detail content — drives /services/[slug]/.
 *
 * The ten canonical services mirror SERVICE_LINKS in navigation.ts
 * (version-1 hrefs). Capability copy only — no invented clients,
 * metrics or results (PRODUCT.md hard rule). SEO-aware phrasing stays
 * honest: what the service is, what it includes, how it runs.
 */

export type ServiceDetail = {
  slug: string;
  title: string;
  /** Short board label. */
  short: string;
  tagline: string;
  heroLead: string;
  metaDescription: string;
  overview: [string, string];
  image: string;
  imageCaption: string;
  /** Hero chip row. */
  stack: string[];
  deliverables: { title: string; text: string }[];
  process: { name: string; text: string }[];
  faqs: { q: string; a: string }[];
  /** Industry ids this service most often lands in. */
  industries: string[];
  related: string[];
};

export const SERVICE_DETAILS: ServiceDetail[] = [
  {
    slug: "web-development",
    title: "Web Development",
    short: "Web",
    tagline: "Websites and web apps, engineered to perform.",
    heroLead:
      "Corporate platforms, marketing sites and full web applications — fast, accessible and built on modern architecture that search engines and buyers both respect.",
    metaDescription:
      "Web development by Savo Technologies: corporate websites, web applications, Next.js and React builds, headless architecture and customer portals. Fast, SEO-strong engineering.",
    overview: [
      "The web is where every buyer's journey quietly begins, and where most websites quietly lose them — to slow loads, cluttered journeys and structures search engines can't read. A serious web presence is an engineering product: performance budgets, content architecture, accessibility and analytics wired in from the first commit.",
      "We build on modern foundations — Next.js, React, headless architectures — with performance treated as a feature and SEO/AEO shaped into the information architecture itself. Corporate platforms, customer portals or full applications: the same standard applies, and everything ships with measurement, so the site keeps improving after launch instead of slowly rotting.",
    ],
    image: "/images/code.webp",
    imageCaption: "Performance is a feature. Structure is strategy.",
    stack: ["Next.js", "React", "TypeScript", "Node.js", "Headless CMS", "PostgreSQL"],
    deliverables: [
      { title: "Corporate & marketing websites", text: "Positioning-led sites with clear journeys, fast loads and CMS-backed content your team actually controls." },
      { title: "Web applications", text: "Full products in the browser — dashboards, portals and tools engineered like software, not brochures." },
      { title: "Headless architecture", text: "Content, commerce and data decoupled behind APIs so every surface stays fast and every channel stays in sync." },
      { title: "Customer portals", text: "Self-service surfaces for accounts, orders, documents and support — reducing ticket load by answering first." },
      { title: "Progressive web apps", text: "Installable, offline-tolerant web experiences where an app-store presence isn't the right answer." },
      { title: "API & integrations", text: "The connective layer — payments, CRM, ERP and third-party services joined into one coherent system." },
    ],
    process: [
      { name: "Architect", text: "Information architecture, content model and technical plan agreed before pixels or code." },
      { name: "Design", text: "Journeys and interfaces designed against real content, prototyped and pressure-tested." },
      { name: "Build", text: "Component-driven engineering with performance budgets enforced in the pipeline." },
      { name: "Run", text: "Analytics, iteration and maintenance — the site keeps earning its place after launch." },
    ],
    faqs: [
      { q: "Next.js, React or something else?", a: "We recommend the stack after understanding your product — but Next.js with React and TypeScript is our default for serious web work: performance, SEO and long-term maintainability in one foundation." },
      { q: "How long does a website project take?", a: "A focused marketing site typically ships in weeks; platforms and web applications scope in stages. You get an honest timeline after discovery — with milestones you can hold us to." },
      { q: "Will the site rank on search and AI answers?", a: "Structure, speed and semantics are engineered in — the technical half of SEO and the foundation for AEO. Content strategy and authority build on top of that over time." },
      { q: "Can our team edit everything?", a: "Yes — headless CMS setups give editors full control of content, media and navigation without developer tickets, with roles and preview built in." },
    ],
    industries: ["ecommerce", "real-estate", "government"],
    related: ["ui-ux", "digital-marketing", "product-engineering"],
  },
  {
    slug: "mobile-apps",
    title: "Mobile App Development",
    short: "Mobile",
    tagline: "Mobile products that feel native to the hand.",
    heroLead:
      "iOS and Android apps built with Flutter and React Native — designed thumb-first, engineered for real networks, and shipped to both stores from one codebase.",
    metaDescription:
      "Mobile app development by Savo Technologies: iOS, Android, Flutter and React Native apps with native integrations, payments, offline support and store-ready delivery.",
    overview: [
      "Mobile is where attention lives and patience dies. An app earns its place on a home screen by being fast, respectful of data and battery, and genuinely useful in ten-second bursts — anything less gets deleted no matter how beautiful the pitch was. The hard part is invisible: state that survives poor networks, updates that never break trust, and flows that feel native on every device.",
      "We build with Flutter and React Native for code leverage, and go native where the platform demands it — camera, biometrics, background tasks. Every release passes real-device testing across the size and OS matrix that matters to your audience, and analytics light up the moments where users hesitate, so the product sharpens with every iteration.",
    ],
    image: "/images/mobile.webp",
    imageCaption: "Designed for the thumb. Engineered for the network.",
    stack: ["Flutter", "React Native", "Swift", "Kotlin", "Firebase", "REST & GraphQL"],
    deliverables: [
      { title: "Cross-platform apps", text: "One codebase, two stores — Flutter and React Native builds that feel native on iOS and Android alike." },
      { title: "Native integrations", text: "Camera, biometrics, notifications, maps and background services — the platform features users assume just work." },
      { title: "Offline-first flows", text: "Apps that keep working when the signal doesn't — local state, sync and conflict handling engineered deliberately." },
      { title: "Payments & commerce", text: "In-app purchases, subscriptions and payment flows with receipts, restores and edge cases handled." },
      { title: "App store delivery", text: "Assets, review guidelines, staged rollouts and crash monitoring — the launch handled end to end." },
      { title: "Product analytics", text: "Event instrumentation that shows where users succeed and stall — feeding each release with evidence." },
    ],
    process: [
      { name: "Shape", text: "Product definition, platform choice and a prototype you can hold on a device." },
      { name: "Design", text: "Thumb-first UI designed against real device sizes, OS conventions and your brand." },
      { name: "Build & test", text: "Iterative builds on real devices across the matrix that matters, with TestFlight and track distribution." },
      { name: "Launch & run", text: "Store submission, staged rollout, crash monitoring and a release rhythm that compounds." },
    ],
    faqs: [
      { q: "Flutter, React Native or fully native?", a: "For most products, Flutter or React Native delivers near-native quality from one codebase — faster and leaner to maintain. When an app is platform-deep (heavy camera, AR, widgets), we go native. The choice follows the product, not our preference." },
      { q: "What does a mobile app project cost?", a: "Scope decides: a focused MVP and a commerce-grade platform differ by an order of magnitude. After a discovery conversation you get a staged estimate with no surprises hidden in phase three." },
      { q: "Do you handle app store approval?", a: "Yes — assets, privacy declarations, guideline compliance and the review cycle are part of delivery, along with staged rollouts and monitoring after release." },
      { q: "Can you take over an existing app?", a: "We start with a structured audit — code, dependencies, crashes, store standing — then take over delivery with a stabilisation plan before new features." },
    ],
    industries: ["fintech", "education", "travel"],
    related: ["ui-ux", "web-development", "product-engineering"],
  },
  {
    slug: "ui-ux",
    title: "UI/UX Design",
    short: "Design",
    tagline: "Design that makes products easier to use.",
    heroLead:
      "Product strategy, UX research and interface design — beautiful only when it is clearer, faster and more persuasive than what it replaced.",
    metaDescription:
      "UI/UX design by Savo Technologies: product strategy, UX research, interface design, design systems and prototyping. Interfaces engineered for clarity and conversion.",
    overview: [
      "Good design is not the layer applied after the product works — it is how the product works. Interfaces earn trust in the first seconds, guide the uncertain, and remove the friction that quietly kills conversion. The craft is invisible when done well: hierarchy that answers the next question before it's asked, states for every outcome, and language that respects the reader.",
      "Our design work runs from strategy to shipped interface: research that grounds decisions in real user behaviour, journeys and wireframes that settle structure before styling, and design systems that keep every screen consistent long after handover. Prototypes are tested with real people, and designers sit beside engineers — so what ships is what was designed.",
    ],
    image: "/images/studio.webp",
    imageCaption: "Clarity is the aesthetic. Everything else follows.",
    stack: ["Figma", "Design systems", "Prototyping", "User testing", "Accessibility", "Design tokens"],
    deliverables: [
      { title: "Product strategy", text: "Positioning, journeys and feature prioritisation — what to build, for whom, in what order." },
      { title: "UX research", text: "Interviews, usability testing and analytics review that ground decisions in evidence, not taste." },
      { title: "Interface design", text: "High-fidelity UI with every state designed — empty, loading, error, success — not just the happy path." },
      { title: "Design systems", text: "Token-based component libraries that keep product surfaces consistent and handover cheap." },
      { title: "Prototyping", text: "Interactive prototypes tested with real users before a line of production code exists." },
      { title: "Conversion design", text: "Flows instrumented and iterated — persuasion that survives measurement." },
    ],
    process: [
      { name: "Understand", text: "Users, business goals and constraints researched and written down as design principles." },
      { name: "Structure", text: "Journeys and wireframes settle information architecture before any visual styling." },
      { name: "Craft", text: "Interface design with full state coverage, accessibility checked as components are built." },
      { name: "Prove", text: "Prototype testing, then design-engineering handover with tokens and specs that hold." },
    ],
    faqs: [
      { q: "Do you redesign existing products?", a: "Yes — and we start with an audit of what works before touching what doesn't. Redesigns preserve earned trust and muscle memory; we change what measurably fails and leave what users rely on." },
      { q: "Can you work with our engineers?", a: "We design with implementation in mind — tokens, components and specs documented for the stack that will build them — and collaborate directly with your team or ours." },
      { q: "How do you test designs?", a: "Interactive prototypes go to real users for task-based testing; findings feed revisions before code. Post-launch, analytics keeps the loop running." },
      { q: "What is a design system and do we need one?", a: "A shared component and token library that makes every screen consistent and every change cheap. If your product will grow past a handful of screens, it pays for itself quickly." },
    ],
    industries: ["ecommerce", "education", "real-estate"],
    related: ["web-development", "mobile-apps", "product-engineering"],
  },
  {
    slug: "cloud-devops",
    title: "Cloud & DevOps",
    short: "Cloud",
    tagline: "Infrastructure that behaves like product.",
    heroLead:
      "Cloud architecture, CI/CD pipelines and observability — deployments that boringly work, environments that reproduce, and bills that stay explicable.",
    metaDescription:
      "Cloud and DevOps engineering by Savo Technologies: cloud architecture, CI/CD pipelines, containerisation, infrastructure as code and observability. Reliable, auditable operations.",
    overview: [
      "Infrastructure is where products go to disappoint quietly: deployments that work on Fridays and break on Mondays, environments that drift, outages discovered by customers. Mature operations flip that — infrastructure expressed as code, changes shipped through the same discipline as software, and systems that tell you they're struggling before they fail.",
      "We build that maturity: cloud architecture sized to reality (not resale), pipelines that test and promote automatically, and observability that traces a user problem to its cause in minutes. Security is operational here — secrets managed, access least-privileged, backups rehearsed — and cost is a monitored metric, not a monthly surprise.",
    ],
    image: "/images/architecture.webp",
    imageCaption: "Boring deployments are a feature.",
    stack: ["AWS", "GCP", "Docker", "Kubernetes", "Terraform", "GitHub Actions"],
    deliverables: [
      { title: "Cloud architecture", text: "Environments designed for your scale and compliance needs — efficient by default, resilient where it matters." },
      { title: "CI/CD pipelines", text: "Automated test, build and promotion paths — small releases, fast rollbacks, no ceremonial deploy days." },
      { title: "Infrastructure as code", text: "Terraform-managed, versioned infrastructure — reproducible environments and reviewable changes." },
      { title: "Containers & orchestration", text: "Docker and Kubernetes where they earn their complexity — and simpler choices where they don't." },
      { title: "Observability", text: "Logging, metrics and tracing wired to alerts a human can act on — SLOs, dashboards, incident runbooks." },
      { title: "Security operations", text: "Secrets management, least-privilege access, patching cadence and recovery drills — evidence over assertion." },
    ],
    process: [
      { name: "Assess", text: "Current state, risks and costs mapped; the operational gaps ranked by blast radius." },
      { name: "Architect", text: "Target infrastructure designed as code, with migration steps your team can verify." },
      { name: "Automate", text: "Pipelines and guardrails put in place — deploys, tests, rollbacks and alerts." },
      { name: "Operate", text: "Monitoring, incident practice and cost review on a rhythm — reliability as habit." },
    ],
    faqs: [
      { q: "Can you move us to the cloud?", a: "Yes — assessment, migration plan and staged cutover with rollback paths at every step, from single servers to datacentre estates. Downtime windows are planned, not discovered." },
      { q: "Kubernetes or something simpler?", a: "Kubernetes where scale, multi-service complexity or team practice justifies it; simpler platform choices where they don't. We recommend the least complexity that meets your next two years, not the most impressive." },
      { q: "Do you handle cloud cost optimisation?", a: "Cost is treated as an operational metric: rightsizing, reserved capacity, storage lifecycle and per-service attribution — reviewed on a rhythm so the bill stays explicable." },
      { q: "Can you work alongside our internal team?", a: "Yes — we embed with your engineers, transfer knowledge deliberately and leave documentation and runbooks behind. Dependency is not the goal." },
    ],
    industries: ["logistics", "energy", "manufacturing"],
    related: ["custom-software", "data-analytics", "qa-testing"],
  },
  {
    slug: "data-analytics",
    title: "Data & Analytics",
    short: "Data",
    tagline: "Decisions that run on evidence.",
    heroLead:
      "Pipelines, warehouses and dashboards — data collected once, trusted everywhere, and turned into surfaces people actually use to decide.",
    metaDescription:
      "Data and analytics engineering by Savo Technologies: pipelines, warehouses, BI dashboards and decision intelligence. Trusted data turned into decisions.",
    overview: [
      "Most organisations don't lack data — they lack trust in it. Numbers disagree between meetings, reports are assembled by hand each cycle, and the interesting signals sit locked in operational corners nobody queries. The fix is unglamorous and valuable: pipelines that reliably collect, models that define metrics once, and surfaces that answer questions in seconds.",
      "We build that backbone and the decision layers above it. Warehouses modelled around your business — not a generic template — fed by tested pipelines, surfaced in dashboards tuned to each audience: executive, operational, analytical. Definitions live in one place, lineage is traceable, and the quarter's arguments about whose number is right end.",
    ],
    image: "/images/services/data-analytics-hero.webp",
    imageCaption: "One number, one truth, one place.",
    stack: ["PostgreSQL", "dbt", "Airflow", "Metabase", "Power BI", "Python"],
    deliverables: [
      { title: "Data pipelines", text: "Collection and transformation flows — tested, monitored and recoverable, from sources to warehouse." },
      { title: "Warehouse modelling", text: "Metrics defined once and trusted everywhere — semantics your finance team will actually sign off on." },
      { title: "BI dashboards", text: "Executive and operational surfaces tuned per audience — answers in seconds, not spreadsheet archaeology." },
      { title: "Event analytics", text: "Product and marketing events instrumented properly, so funnels and cohorts reflect reality." },
      { title: "Reporting automation", text: "The weekly and monthly reports generated, checked and delivered without human assembly." },
      { title: "ML-ready foundations", text: "Clean, documented data layers that analytics and AI work can build on without re-plumbing." },
    ],
    process: [
      { name: "Map", text: "Sources, consumers and current pain mapped; the metric definitions that matter agreed." },
      { name: "Model", text: "Warehouse and semantics designed — one definition per metric, lineage documented." },
      { name: "Build", text: "Pipelines, tests and dashboards delivered iteratively with your team in the loop." },
      { name: "Institutionalise", text: "Alerts on data quality, training for users and a rhythm of refinement as questions mature." },
    ],
    faqs: [
      { q: "We have data everywhere — where do we start?", a: "With the decisions your business makes repeatedly. We map the few metric families that drive those decisions, build trust in them first, and expand outward — rather than boiling an ocean of dashboards nobody reads." },
      { q: "Which BI tool should we use?", a: "The one your team will open: Metabase or Looker Studio for lean teams, Power BI where the organisation already lives in Microsoft. We build on what sticks, and keep the semantic layer portable." },
      { q: "Can you fix our unreliable reports?", a: "Yes — pipelines get tests, definitions get versioned, and quality alerts fire before the meeting where the number gets quoted. Trust is rebuilt one reliable cycle at a time." },
      { q: "Is this the same as data science?", a: "No — this is the engineering that makes analysis trustworthy. Once foundations hold, forecasting and ML become possible; without them, every model inherits the mess." },
    ],
    industries: ["manufacturing", "energy", "travel"],
    related: ["ai-agent-development", "cloud-devops", "custom-software"],
  },
  {
    slug: "ai-agent-development",
    title: "AI Agent Development",
    short: "AI Agents",
    tagline: "AI that does the work, not just the talk.",
    heroLead:
      "Agents grounded in your data and tools — customer support, operations, research and document workflows with guardrails, oversight and evaluation built in.",
    metaDescription:
      "AI agent development by Savo Technologies: LLM agents grounded in your data, tool-calling workflows, RAG systems and enterprise guardrails. Production AI, evaluated and observable.",
    overview: [
      "The distance between an impressive AI demo and a dependable AI employee is the entire job. Demos charm; production agents need grounding in real data, permission to act within explicit boundaries, graceful fallback when confidence drops, and evaluation that catches regressions before users do. That distance is engineering.",
      "We build agents as systems: retrieval over your documents and APIs, tool-calling into the software that runs your business, human escalation paths that make sense, and observability that shows exactly why an agent did what it did. Security is architectural — access scoped to the agent's role, sensitive actions gated, every decision logged — because an agent with credentials is an employee with keys.",
    ],
    image: "/images/services/ai-agents-hero.webp",
    imageCaption: "Grounded, guarded, observed — production AI.",
    stack: ["OpenAI", "Anthropic", "RAG", "Vector search", "Tool calling", "Evaluations"],
    deliverables: [
      { title: "Support agents", text: "Customer-facing agents grounded in your knowledge base — resolving, escalating and logging every conversation." },
      { title: "Operations agents", text: "Internal agents that process documents, reconcile records and chase workflows across your systems." },
      { title: "RAG knowledge systems", text: "Retrieval over your documents and data — answers with sources, hallucination-resistant by design." },
      { title: "Multi-agent workflows", text: "Orchestrated agent teams for complex processes — planning, execution and review roles composed deliberately." },
      { title: "Voice & conversation", text: "Telephony and chat agents with natural handoff to humans when the conversation deserves one." },
      { title: "Evaluation & observability", text: "Test suites, regression checks and traces for every decision — agent behaviour you can audit and improve." },
    ],
    process: [
      { name: "Scope the job", text: "The workflow, data, tools and escalation rules the agent will operate within — written down first." },
      { name: "Ground", text: "Retrieval and integrations built over your real data, with permissions scoped to the agent's role." },
      { name: "Guard & evaluate", text: "Guardrails, human-approval gates and test suites that measure quality before and after every change." },
      { name: "Run & improve", text: "Observability, feedback loops and a cadence of tuning — the agent compounds instead of drifting." },
    ],
    faqs: [
      { q: "Will an agent hallucinate about our business?", a: "Grounding is the defence: the agent answers from your documents and data with sources attached, and declines when confidence is low. Evaluation suites catch regressions before customers do — no system is perfect, but this one is accountable." },
      { q: "How do you keep AI agents secure?", a: "Agents run with least-privilege access to systems, sensitive actions require human approval, and every decision is logged and traceable. We treat an agent's credentials like an employee's — scoped, monitored, revocable." },
      { q: "Which model do you use?", a: "The one that earns it. We evaluate options for your tasks and wire the abstraction so models can be swapped as the frontier moves — your product shouldn't marry a vendor." },
      { q: "What does an agent project look like?", a: "A focused first workflow ships in weeks: scope, ground, guard, evaluate. It starts supervised, earns autonomy with evidence, and expands once the pattern proves itself." },
    ],
    industries: ["healthcare", "education", "fintech"],
    related: ["data-analytics", "custom-software", "web-development"],
  },
  {
    slug: "custom-software",
    title: "Custom Software",
    short: "Software",
    tagline: "Software shaped to the business, not the template.",
    heroLead:
      "SaaS platforms, business applications and internal systems — engineered around your real operations instead of the closest shelf product.",
    metaDescription:
      "Custom software development by Savo Technologies: SaaS platforms, business applications, multi-tenant systems and enterprise tools. Built around your operations, integrated with your stack.",
    overview: [
      "Every business accumulates processes that no shelf product quite fits — so people adapt to the tool, build shadow spreadsheets around it, or simply absorb the friction as normal. Custom software removes that tax: systems shaped to how your operation actually runs, integrated with what you already use, and owned by you outright.",
      "We build the full range: multi-tenant SaaS products, internal business applications, marketplaces and enterprise tools. Architecture decisions are made for your next three years — tenancy, integrations, reporting — and the codebase arrives documented and transferable, because software you can't maintain is software you rented at premium rates.",
    ],
    image: "/images/team.webp",
    imageCaption: "The operation defines the software. Not the reverse.",
    stack: ["TypeScript", "Node.js", "PostgreSQL", "Multi-tenant", "REST & GraphQL", "SaaS billing"],
    deliverables: [
      { title: "SaaS platforms", text: "Multi-tenant products with billing, roles and onboarding — from validation build to scale-ready." },
      { title: "Business applications", text: "The systems your operation runs on — workflows, approvals, records and reporting in one place." },
      { title: "Marketplaces", text: "Multi-sided platforms with vendor tools, commission logic and trust mechanics built in." },
      { title: "Internal tools", text: "Admin consoles and operator surfaces that replace the spreadsheet sprawl behind the scenes." },
      { title: "Legacy modernisation", text: "Old systems understood, stabilized and progressively rebuilt — without a big-bang rewrite gamble." },
      { title: "APIs & integrations", text: "The layer that connects your software to everything else — documented, versioned, monitored." },
    ],
    process: [
      { name: "Understand", text: "Operations, edge cases and integration reality documented — the spec the business actually lives." },
      { name: "Architect", text: "Tenancy, data model and integration plan designed for the scale you're becoming." },
      { name: "Build in slices", text: "Working software every few weeks — usable, testable, adjustable as learning arrives." },
      { name: "Own it", text: "Documentation, handover and support — a codebase your team can carry forward." },
    ],
    faqs: [
      { q: "Custom software or off-the-shelf?", a: "When your process is the differentiator, custom wins; when it's commodity, shelf wins. We'll tell you which side of that line you're on — including when the honest answer is 'configure the tool you have'." },
      { q: "How do you keep budgets controlled?", a: "Fixed-scope stages with defined outcomes, working software at each checkpoint, and change handled as explicit re-scoping — you always know what the next slice costs before approving it." },
      { q: "Who owns the code?", a: "You do — outright, with repositories, documentation and infrastructure you control. Dependency on us is a service choice, never a hostage situation." },
      { q: "Can you extend our existing system?", a: "Yes — we audit what exists, integrate where it's sound, replace what isn't, and modernise progressively instead of betting everything on a rewrite." },
    ],
    industries: ["fintech", "logistics", "healthcare"],
    related: ["cloud-devops", "ai-agent-development", "qa-testing"],
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing & SEO",
    short: "Growth",
    tagline: "Discovery that compounds.",
    heroLead:
      "SEO, AEO and performance marketing — structured so your product is found by search engines, AI answer engines and the humans using both.",
    metaDescription:
      "Digital marketing by Savo Technologies: SEO, AEO for AI answer engines, performance marketing and content strategy. Discovery engineered to compound.",
    overview: [
      "Search has split in two: the classic blue links and the AI answers increasingly read instead of clicked. Winning both demands the same foundation — genuine authority expressed in structures machines can parse — plus the measurement to know which channel actually earns revenue rather than applause.",
      "We run growth as an engineering discipline: technical SEO baked into the product, content strategy built on what your buyers actually search, AEO structuring for the answer engines, and performance campaigns instrumented to revenue. Reports speak in pipeline and acquisition cost — because ranking positions are weather, but compounded authority is climate.",
    ],
    image: "/images/services/digital-marketing-hero.webp",
    imageCaption: "Authority is climate. Rankings are weather.",
    stack: ["Technical SEO", "AEO / GEO", "Google Ads", "Analytics", "Schema", "Content systems"],
    deliverables: [
      { title: "Technical SEO", text: "Site architecture, speed, schema and crawlability — the foundation rankings and AI answers stand on." },
      { title: "AEO for answer engines", text: "Content structured so AI assistants cite you when they answer your buyers' questions." },
      { title: "Content strategy", text: "Editorial plans built from real search behaviour — pages that earn traffic and trust, not filler." },
      { title: "Performance marketing", text: "Search and social campaigns instrumented to revenue, with creative tested systematically." },
      { title: "Analytics & attribution", text: "Measurement that survives scrutiny — which channels bring buyers, not just visitors." },
      { title: "Conversion optimisation", text: "Landing experiences tested and tuned so traffic you've earned converts instead of bouncing." },
    ],
    process: [
      { name: "Audit", text: "Technical, content and competitive baseline — where authority exists and where it leaks." },
      { name: "Architect", text: "Keyword-to-page architecture, schema strategy and channel plan sequenced by opportunity." },
      { name: "Execute", text: "Technical fixes, content production and campaigns shipped on a rhythm, each instrumented." },
      { name: "Compound", text: "Monthly evidence loops — double down on what earns, cut what doesn't, build the moat." },
    ],
    faqs: [
      { q: "How long does SEO take to work?", a: "Technical wins can show quickly; authority compounds over months. We sequence fast wins first and set traffic expectations per stage — anyone promising instant rankings is selling weather, not climate." },
      { q: "What is AEO and why does it matter?", a: "Answer Engine Optimisation structures your content so AI assistants cite you when answering buyer questions. As more decisions start inside AI answers, being the cited source is the new first page." },
      { q: "Do you run paid ads too?", a: "Yes — search and social performance marketing, always instrumented to pipeline rather than clicks, and treated as a complement to the compounding organic work." },
      { q: "How do you report results?", a: "In acquisition and revenue terms: pipeline by channel, cost per qualified lead, and the trajectory of organic authority. Vanity metrics don't survive our reports." },
    ],
    industries: ["ecommerce", "real-estate", "travel"],
    related: ["web-development", "data-analytics", "ui-ux"],
  },
  {
    slug: "qa-testing",
    title: "QA & Testing",
    short: "QA",
    tagline: "Quality you can ship on.",
    heroLead:
      "Automated suites, manual exploration and release engineering — defects caught by machines at 3 a.m. instead of customers at launch.",
    metaDescription:
      "QA and software testing by Savo Technologies: automated test suites, manual exploration, performance and security testing. Release confidence engineered in.",
    overview: [
      "Every untested release is a bet placed with customers' patience. Manual clicking finds the obvious; production finds the expensive. Real quality engineering sits in the pipeline — suites that run on every change, cover the flows that matter, and fail loudly before anything ships — leaving human testers free to do what machines can't: explore like a devious user.",
      "We build that system: automated functional suites, API and integration tests, performance baselines and security checks, wired into CI so quality is a gate rather than a phase. Exploratory testing hunts the edges automation can't reach, and every defect found becomes a regression test that ensures it stays fixed.",
    ],
    image: "/images/services/qa-testing-hero.webp",
    imageCaption: "Machines catch the known. Humans hunt the unknown.",
    stack: ["Playwright", "Cypress", "API testing", "Load testing", "CI gates", "Visual regression"],
    deliverables: [
      { title: "Automated suites", text: "End-to-end and component tests that run on every change — regressions caught in minutes, not releases." },
      { title: "API & integration tests", text: "Contract and integration coverage across services — the seams where bugs actually live." },
      { title: "Exploratory testing", text: "Skilled human testing that hunts edge cases, workflows and 'no one would do that' paths." },
      { title: "Performance testing", text: "Load and stress baselines — knowing the ceiling before the traffic finds it." },
      { title: "Security testing", text: "Vulnerability scanning and review — the cheap catches before the expensive auditors." },
      { title: "Release engineering", text: "Staged rollouts, feature flags and rollback paths — launches that can't take the product down." },
    ],
    process: [
      { name: "Assess", text: "Current coverage, risk hotspots and release pain mapped; the highest-leverage gaps first." },
      { name: "Build suites", text: "Automated coverage for critical flows, wired into the pipeline as a merge gate." },
      { name: "Explore", text: "Manual exploratory passes on each release — the unknown-unknowns, documented." },
      { name: "Guard", text: "Every defect found becomes a regression test; the suite compounds in value." },
    ],
    faqs: [
      { q: "Manual or automated testing?", a: "Both, doing different jobs: automation guards the known flows on every change; exploration hunts what automation can't imagine. Quality programmes that lean on only one are half blind." },
      { q: "Can you add QA to an existing product?", a: "Yes — we start with a coverage audit, automate the revenue-critical flows first, and grow the suite from there. The first weeks usually catch dormant bugs that justify everything after." },
      { q: "Will testing slow our releases down?", a: "The opposite — fast suites catch problems in minutes and make releases boring. Teams with real coverage ship more often, because fear stops being the release criterion." },
      { q: "Do you test performance and security?", a: "Yes — load baselines establish your ceilings, and security scanning plus review catch the common holes before auditors or attackers tour them." },
    ],
    industries: ["fintech", "government", "healthcare"],
    related: ["cloud-devops", "custom-software", "web-development"],
  },
  {
    slug: "product-engineering",
    title: "Product Engineering",
    short: "Product",
    tagline: "Products built like products, not projects.",
    heroLead:
      "Strategy, design and engineering as one discipline — discovery, roadmap and delivery that compound instead of resetting every quarter.",
    metaDescription:
      "Product engineering by Savo Technologies: product strategy, roadmap execution, cross-functional delivery and launch iteration. End-to-end product building in one team.",
    overview: [
      "The project model builds features and stops; the product model builds outcomes and keeps learning. The difference shows up in a hundred small decisions — what gets measured, what gets cut, what gets launched to learn rather than to impress. Products run by teams who own outcomes outlive products run as ticket queues.",
      "We operate as that product team: strategy that picks the right problems, design and engineering delivering in slices, launches instrumented to answer the question they were built to answer, and roadmaps that adapt to evidence. Whether extending your team or carrying the product end to end, the posture is the same — we own outcomes with you, not tasks for you.",
    ],
    image: "/images/meeting.webp",
    imageCaption: "Outcomes over output. Always.",
    stack: ["Discovery", "Roadmapping", "Cross-functional squads", "Experimentation", "Analytics", "Launch ops"],
    deliverables: [
      { title: "Product strategy", text: "Positioning, sequencing and the metrics that define 'working' — decided before building." },
      { title: "Discovery & validation", text: "Assumptions surfaced and tested cheaply — prototypes and pilots before commitments." },
      { title: "Roadmap execution", text: "Slices of working product on a rhythm, each shippable and each teaching something." },
      { title: "Experimentation", text: "A/B tests and instrumented features — decisions upgraded by evidence, not seniority." },
      { title: "Launch operations", text: "Staged rollouts, feedback loops and iteration cadence after the confetti settles." },
      { title: "Team extension", text: "Senior product engineers embedding with your squad — raising the bar, not just the headcount." },
    ],
    process: [
      { name: "Frame", text: "The outcome, the constraints and the riskiest assumptions — written down and agreed." },
      { name: "Slice", text: "The roadmap cut into shippable increments, each carrying a hypothesis and a metric." },
      { name: "Deliver", text: "Design and engineering in one loop — weekly working software, no handoff cliffs." },
      { name: "Learn & steer", text: "Evidence reviewed on a rhythm; the roadmap adapts and compounds." },
    ],
    faqs: [
      { q: "Product engineering versus development?", a: "Development executes a specification. Product engineering questions it — measuring whether the build moved the metric, and steering when it didn't. You get outcomes and judgement, not just output." },
      { q: "Can you work within our existing product org?", a: "Yes — we embed with your rituals, complement your leads and hand over cleanly. The goal is a stronger product org, not a permanent tenant." },
      { q: "How do you handle roadmap changes?", a: "The roadmap is a hypothesis, not a contract. Evidence steers it at agreed checkpoints — which is precisely why products built this way waste less." },
      { q: "Do you start from zero or rescue in-flight products?", a: "Both. Zero-to-one gets discovery and disciplined slices; in-flight rescues get an audit, a stabilisation plan and a rebuilt delivery rhythm." },
    ],
    industries: ["ecommerce", "education", "logistics"],
    related: ["ui-ux", "custom-software", "mobile-apps"],
  },
];

export function serviceDetail(slug: string): ServiceDetail | undefined {
  return SERVICE_DETAILS.find((s) => s.slug === slug);
}
