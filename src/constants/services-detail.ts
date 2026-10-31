/**
 * Service detail content - drives /services/[slug]/.
 *
 * The ten canonical services mirror SERVICE_LINKS in navigation.ts
 * (version-1 hrefs). Capability copy only - no invented clients,
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

  /* ── Part 34 standard (optional until populated per service) ────── */
  /** When a company needs this service. */
  whenNeeded?: string[];
  /** When it may NOT be the appropriate answer - real judgment. */
  whenNot?: string[];
  /** Architecture considerations that matter for this service. */
  architecture?: string;
  /** Integrations this service commonly wires together. */
  integrations?: string[];
  /** How security is considered. */
  security?: string;
  /** How quality is tested. */
  quality?: string;
  /** What happens after launch. */
  afterLaunch?: string;
  /** Relevant Savo work that proves expertise (case studies/insights). */
  relatedWork?: { label: string; href: string }[];
};

export const SERVICE_DETAILS: ServiceDetail[] = [
  {
    slug: "web-development",
    title: "Web Development",
    short: "Web",
    tagline: "Websites and web apps, engineered to perform.",
    heroLead:
      "Corporate platforms, marketing sites and full web applications, fast, accessible and built on modern architecture that search engines and buyers both respect.",
    metaDescription:
      "Web development by Savo Technologies: corporate websites, web applications, Next.js and React builds, headless architecture and customer portals. Fast, SEO-strong engineering.",
    overview: [
      "The web is where every buyer's journey quietly begins, and where most websites quietly lose them, to slow loads, cluttered journeys and structures search engines can't read. A serious web presence is an engineering product: performance budgets, content architecture, accessibility and analytics wired in from the first commit.",
      "We build on modern foundations like Next.js, React and headless architecture, with performance treated as a feature and SEO/AEO shaped into the information architecture itself. Corporate platforms, customer portals or full applications: the same standard applies, and everything ships with measurement, so the site keeps improving after launch instead of slowly rotting.",
    ],
    image: "/images/code.webp",
    imageCaption: "Performance is a feature. Structure is strategy.",
    stack: ["Next.js", "React", "TypeScript", "Node.js", "Headless CMS", "PostgreSQL"],

    whenNeeded: [
      "Your business needs a new website or browser-based application.",
      "Marketing cannot publish without a developer in the loop, so campaigns ship late.",
      "You need more than a site: portals, dashboards or customer self-service living in the browser.",
      "Content, commerce and customer data live in disconnected systems that drift out of sync.",
    ],
    whenNot: [
      "You need a page live this week and a hosted site builder covers 100 percent of the need; we will say so.",
      "The product is a native-first experience (camera, sensors, deep OS integration) where the browser is the wrong container.",
      "You only need routine content updates or technical support for the system you already run.",
    ],
    architecture:
      "Server-rendered foundations with client interactivity only where it earns its JavaScript. Content, commerce and data decoupled behind typed APIs so every surface stays fast and in sync. Caching and invalidation decided per measured problem, never installed by fashion.",
    integrations: ["Payments", "CRM", "ERP", "Marketing automation", "Search", "Analytics", "Auth/SSO"],
    security:
      "Input validation on every public endpoint, rate limiting, scoped API keys, secrets server-side only, forms protected against spam and abuse. Security is part of the build, not a launch-week audit.",
    quality:
      "Core Web Vitals budgets enforced in CI, accessibility checks against WCAG 2.2 AA, cross-browser and device testing, and analytics verified to fire before a page ships.",
    afterLaunch:
      "Measurement from day one: search visibility, engagement and conversion reviewed on a cadence, content and structure improved against evidence, dependencies and platform health maintained deliberately.",
    relatedWork: [
      { label: "Case study dossier", href: "/case-studies" },
      { label: "Reading: Core Web Vitals budgets", href: "/insights/core-web-vitals-budgets" },
      { label: "Technology choices", href: "/technology" },
    ],
    deliverables: [
      { title: "Corporate & marketing websites", text: "Positioning-led sites with clear journeys, fast loads and CMS-backed content your team actually controls." },
      { title: "Web applications", text: "Full products in the browser, dashboards, portals and tools engineered like software, not brochures." },
      { title: "Headless architecture", text: "Content, commerce and data decoupled behind APIs so every surface stays fast and every channel stays in sync." },
      { title: "Customer portals", text: "Self-service surfaces for accounts, orders, documents and support, reducing ticket load by answering first." },
      { title: "Progressive web apps", text: "Installable, offline-tolerant web experiences where an app-store presence isn't the right answer." },
      { title: "API & integrations", text: "The connective layer, payments, CRM, ERP and third-party services joined into one coherent system." },
    ],
    process: [
      { name: "Architect", text: "Information architecture, content model and technical plan agreed before pixels or code." },
      { name: "Design", text: "Journeys and interfaces designed against real content, prototyped and pressure-tested." },
      { name: "Build", text: "Component-driven engineering with performance budgets enforced in the pipeline." },
      { name: "Run", text: "Analytics, iteration and maintenance, the site keeps earning its place after launch." },
    ],
    faqs: [
    {
      q: "How much does website development cost?",
      a: "It depends on what the site must do: a marketing site with a CMS, a customer portal and a full web application are different products with different budgets. After a short discovery conversation we quote fixed-scope milestones, so the number you approve is the number that holds. Share your brief and you get a tailored cost and timeline within one business day.",
    },
    {
      q: "How long does it take to build a website or web application?",
      a: "Marketing sites typically ship in weeks; platforms and portals take months because content, integrations and user accounts add real scope. Discovery runs two to four weeks and ends with a milestone plan you can hold us to. Speed comes from scope discipline, not shortcuts.",
    },
      { q: "Next.js, React or something else?", a: "We recommend the stack after understanding your product, but Next.js with React and TypeScript is our default for serious web work: performance, SEO and long-term maintainability in one foundation." },
      { q: "How long does a website project take?", a: "A focused marketing site typically ships in weeks; platforms and web applications scope in stages. You get an honest timeline after discovery, with milestones you can hold us to." },
      { q: "Will the site rank on search and AI answers?", a: "Structure, speed and semantics are engineered in, the technical half of SEO and the foundation for AEO. Content strategy and authority build on top of that over time." },
      { q: "Can our team edit everything?", a: "Yes, headless CMS setups give editors full control of content, media and navigation without developer tickets, with roles and preview built in." },
    ],
    industries: ["ecommerce", "real-estate", "government"],
    related: ["ui-ux-design", "digital-marketing", "product-engineering"],
  },
  {
    slug: "mobile-app-development",
    title: "Mobile App Development",
    short: "Mobile",
    tagline: "Mobile products that feel native to the hand.",
    heroLead:
      "iOS and Android apps built with Flutter and React Native, designed thumb-first, engineered for real networks, and shipped to both stores from one codebase.",
    metaDescription:
      "Mobile app development by Savo Technologies: iOS, Android, Flutter and React Native apps with native integrations, payments, offline support and store-ready delivery.",
    overview: [
      "Mobile is where attention lives and patience dies. An app earns its place on a home screen by being fast, respectful of data and battery, and genuinely useful in ten-second bursts, anything less gets deleted no matter how beautiful the pitch was. The hard part is invisible: state that survives poor networks, updates that never break trust, and flows that feel native on every device.",
      "We build with Flutter and React Native for code leverage, and go native where the platform demands it, camera, biometrics, background tasks. Every release passes real-device testing across the size and OS matrix that matters to your audience, and analytics light up the moments where users hesitate, so the product sharpens with every iteration.",
    ],
    image: "/images/mobile.webp",
    imageCaption: "Designed for the thumb. Engineered for the network.",
    stack: ["Flutter", "React Native", "Swift", "Kotlin", "Firebase", "REST & GraphQL"],

    whenNeeded: [
      "Your users reach for their phones in the moment of need, and a mobile browser tab loses them.",
      "The experience needs hardware: camera, biometrics, notifications, offline capture, background sync.",
      "Both platforms matter and one codebase has to carry them without doubling the team.",
      "You want a direct channel to users: push, presence and the home-screen slot competitors can't buy.",
    ],
    whenNot: [
      "The product is content consumption with no device integration; a well-built responsive web app or PWA serves better and skips two app stores.",
      "The app would mostly wrap your website, same content, no offline, no notifications; users notice and delete.",
      "Budget covers one platform only and the audience is desktop-first; build the web product properly first.",
    ],
    architecture:
      "Cross-platform by default (Flutter or React Native), native modules where the platform demands it. Local-first state with deliberate sync and conflict rules, background work scheduled through platform mechanisms, and release channels (TestFlight, play tracks) built into the pipeline from week one.",
    integrations: ["Payments & IAP", "Push (FCM/APNs)", "Maps & location", "Auth (OAuth/biometric)", "Analytics", "Deep links", "Backend APIs"],
    security:
      "Secrets never live in the app binary; authenticated calls are short-lived and token-scoped; biometric gates where the data warrants them; store privacy declarations match actual data collection, because regulators and reviewers both check.",
    quality:
      "Real-device testing across the screen and OS matrix that matches your audience, network-condition testing (2G, offline, flaky handovers), crash and ANR monitoring from the first TestFlight build, and release candidates gated on stability metrics.",
    afterLaunch:
      "Store operations as a rhythm: staged rollouts, review handling, OS-beta compatibility checks each season, crash triage with fix SLAs, and analytics-driven iteration on the funnels that matter.",
    relatedWork: [
      { label: "Reading: Flutter or native", href: "/insights/flutter-vs-native-choosing-honestly" },
      { label: "Reading: Offline-first field apps", href: "/insights/offline-first-field-apps" },
      { label: "Case study dossier", href: "/case-studies" },
    ],
    deliverables: [
      { title: "Cross-platform apps", text: "One codebase, two stores: Flutter and React Native builds that feel native on iOS and Android alike." },
      { title: "Native integrations", text: "Camera, biometrics, notifications, maps and background services, the platform features users assume just work." },
      { title: "Offline-first flows", text: "Apps that keep working when the signal doesn't, local state, sync and conflict handling engineered deliberately." },
      { title: "Payments & commerce", text: "In-app purchases, subscriptions and payment flows with receipts, restores and edge cases handled." },
      { title: "App store delivery", text: "Assets, review guidelines, staged rollouts and crash monitoring, the launch handled end to end." },
      { title: "Product analytics", text: "Event instrumentation that shows where users succeed and stall, feeding each release with evidence." },
    ],
    process: [
      { name: "Shape", text: "Product definition, platform choice and a prototype you can hold on a device." },
      { name: "Design", text: "Thumb-first UI designed against real device sizes, OS conventions and your brand." },
      { name: "Build & test", text: "Iterative builds on real devices across the matrix that matters, with TestFlight and track distribution." },
      { name: "Launch & run", text: "Store submission, staged rollout, crash monitoring and a release rhythm that compounds." },
    ],
    faqs: [
    {
      q: "How much does mobile app development cost?",
      a: "Cost follows the product: number of platforms, backend complexity, integrations like payments or offline sync, and the depth of polish. A focused MVP is the honest starting point for most budgets, and we quote it as a fixed-scope milestone before any long-term commitment.",
    },
    {
      q: "How long does it take to develop a mobile app?",
      a: "A focused MVP is usually a matter of a few months, not weeks; full products with backend systems take longer. Two to four weeks of discovery produces the realistic plan, and staged rollouts put a testable build in real users' hands early.",
    },
    {
      q: "Should we build native, Flutter or React Native?",
      a: "It depends on the product: camera-heavy or platform-deep apps justify native, while most two-platform products ship faster from one Flutter or React Native codebase. We decide per product, not per habit, and publish our full reasoning in a comparison guide on Insights.",
    },
      { q: "Flutter, React Native or fully native?", a: "For most products, Flutter or React Native delivers near-native quality from one codebase, faster and leaner to maintain. When an app is platform-deep (heavy camera, AR, widgets), we go native. The choice follows the product, not our preference." },
      { q: "What does a mobile app project cost?", a: "Scope decides: a focused MVP and a commerce-grade platform differ by an order of magnitude. After a discovery conversation you get a staged estimate with no surprises hidden in phase three." },
      { q: "Do you handle app store approval?", a: "Yes, assets, privacy declarations, guideline compliance and the review cycle are part of delivery, along with staged rollouts and monitoring after release." },
      { q: "Can you take over an existing app?", a: "We start with a structured audit of code, dependencies, crashes and store standing, then take over delivery with a stabilisation plan before new features." },
    ],
    industries: ["fintech", "education", "travel"],
    related: ["ui-ux-design", "web-development", "product-engineering"],
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    short: "Design",
    tagline: "Design that makes products easier to use.",
    heroLead:
      "Product strategy, UX research and interface design, beautiful only when it is clearer, faster and more persuasive than what it replaced.",
    metaDescription:
      "UI/UX design by Savo Technologies: product strategy, UX research, interface design, design systems and prototyping. Interfaces engineered for clarity and conversion.",
    overview: [
      "Good design is not the layer applied after the product works, it is how the product works. Interfaces earn trust in the first seconds, guide the uncertain, and remove the friction that quietly kills conversion. The craft is invisible when done well: hierarchy that answers the next question before it's asked, states for every outcome, and language that respects the reader.",
      "Our design work runs from strategy to shipped interface: research that grounds decisions in real user behaviour, journeys and wireframes that settle structure before styling, and design systems that keep every screen consistent long after handover. Prototypes are tested with real people, and designers sit beside engineers, so what ships is what was designed.",
    ],
    image: "/images/studio.webp",
    imageCaption: "Clarity is the aesthetic. Everything else follows.",
    stack: ["Figma", "Design systems", "Prototyping", "User testing", "Accessibility", "Design tokens"],

    whenNeeded: [
      "Users bounce, get stuck in support, or abandon carts, and nobody can say exactly where the journey loses them.",
      "The product has grown past ad-hoc screens; every new page re-invents buttons, spacing and logic.",
      "A big build is coming and you need journeys, prototypes and evidence before committing engineering budget.",
      "Accessibility complaints, audit failures or legal exposure demand a designed, not patched, response.",
    ],
    whenNot: [
      "Your new product already has agreed journeys, tested prototypes and a complete design system.",
      "The problem is positioning or traffic, not usability; design can't rescue a message nobody wants.",
      "You need production visual design only (a landing page look) without research or systems; that is a lighter engagement than this practice.",
    ],
    architecture:
      "Design decisions are made where they will live: tokens map to the codebase's component structure, states cover empty/loading/error/success, and prototypes are built to test the risky assumptions first, not to decorate the certain ones.",
    integrations: ["Figma", "Design tokens to code", "Analytics & heatmaps", "Usability testing tools", "A/B testing", "WCAG audits"],
    security:
      "Accessibility is treated as a requirement with acceptance criteria, not a post-launch apology. Data-sensitive flows are designed to collect the minimum, and error states never leak technical detail to users.",
    quality:
      "Every flow ships with all states designed; components pass contrast and keyboard checks as they are built; prototypes are tested with real users on task completion before engineering commits.",
    afterLaunch:
      "Design keeps working after ship: analytics and session evidence drive iterations, the design system absorbs new patterns instead of forking them, and quarterly design reviews keep the product honest as it grows.",
    relatedWork: [
      { label: "Reading: WCAG AA in practice", href: "/insights/wcag-aa-in-practice" },
      { label: "Case study dossier", href: "/case-studies" },
      { label: "Technology choices", href: "/technology" },
    ],
    deliverables: [
      { title: "Product strategy", text: "Positioning, journeys and feature prioritisation, what to build, for whom, in what order." },
      { title: "UX research", text: "Interviews, usability testing and analytics review that ground decisions in evidence, not taste." },
      { title: "Interface design", text: "High-fidelity UI with every state designed, from empty and loading to error and success, not just the happy path." },
      { title: "Design systems", text: "Token-based component libraries that keep product surfaces consistent and handover cheap." },
      { title: "Prototyping", text: "Interactive prototypes tested with real users before a line of production code exists." },
      { title: "Conversion design", text: "Flows instrumented and iterated, persuasion that survives measurement." },
    ],
    process: [
      { name: "Understand", text: "Users, business goals and constraints researched and written down as design principles." },
      { name: "Structure", text: "Journeys and wireframes settle information architecture before any visual styling." },
      { name: "Craft", text: "Interface design with full state coverage, accessibility checked as components are built." },
      { name: "Prove", text: "Prototype testing, then design-engineering handover with tokens and specs that hold." },
    ],
    faqs: [
    {
      q: "How much does UX and product design cost?",
      a: "Design engagements are scoped by surface: an audit or a prototype sprint costs far less than a full research-to-design-system engagement. We quote fixed milestones after understanding the product, and the design system we ship keeps future screens cheap.",
    },
    {
      q: "How long does a design project take?",
      a: "Research and prototype cycles typically run in weeks; a full journey-to-design-system engagement runs longer because every state and component is designed, not just the happy path. You review working prototypes with real users before engineering begins.",
    },
    {
      q: "Do you provide UX audits for existing products?",
      a: "Yes. An audit maps where users drop off, what confuses them and which fixes pay back fastest, ranked by evidence from analytics and session data.",
    },
      { q: "Can you work with our engineers?", a: "We design with implementation in mind: tokens, components and specs documented for the stack that will build them. We collaborate directly with your team or ours." },
      { q: "How do you test designs?", a: "Interactive prototypes go to real users for task-based testing; findings feed revisions before code. Post-launch, analytics keeps the loop running." },
      { q: "What is a design system and do we need one?", a: "A shared component and token library that makes every screen consistent and every change cheap. If your product will grow past a handful of screens, it pays for itself quickly." },
    ],
    industries: ["ecommerce", "education", "real-estate"],
    related: ["web-development", "mobile-app-development", "product-engineering"],
  },
  {
    slug: "cloud-devops",
    title: "Cloud & DevOps",
    short: "Cloud",
    tagline: "Infrastructure that behaves like product.",
    heroLead:
      "Cloud architecture, CI/CD pipelines and observability, deployments that boringly work, environments that reproduce, and bills that stay explicable.",
    metaDescription:
      "Cloud and DevOps engineering by Savo Technologies: cloud architecture, CI/CD pipelines, containerisation, infrastructure as code and observability. Reliable, auditable operations.",
    overview: [
      "Infrastructure is where products go to disappoint quietly: deployments that work on Fridays and break on Mondays, environments that drift, outages discovered by customers. Mature operations flip that, infrastructure expressed as code, changes shipped through the same discipline as software, and systems that tell you they're struggling before they fail.",
      "We build that maturity: cloud architecture sized to reality (not resale), pipelines that test and promote automatically, and observability that traces a user problem to its cause in minutes. Security is operational here, with secrets managed, access least-privileged and backups rehearsed, and cost is a monitored metric, not a monthly surprise.",
    ],
    image: "/images/architecture.webp",
    imageCaption: "Boring deployments are a feature.",
    stack: ["AWS", "GCP", "Docker", "Kubernetes", "Terraform", "GitHub Actions"],

    whenNeeded: [
      "Deploys are manual, scary, or happen only when one specific person is awake.",
      "Environments drift, staging lies about production, and rollbacks are folklore.",
      "Outages are discovered by customers before by dashboards, and postmortems rely on memory.",
      "Cloud bills grow faster than the product, and nobody can attribute them.",
    ],
    whenNot: [
      "A single small app on managed hosting runs fine; a Kubernetes estate would be complexity for its own sake. We say that plainly.",
      "There is no engineering capacity to operate what a rebuild would introduce; tooling must match the team that runs it.",
      "The ask is really one-off cost trimming, not operations; a focused review is the honest, cheaper engagement.",
    ],
    architecture:
      "The least complexity that meets the next two years: managed services before self-hosted clusters, infrastructure as code before console clicks, preview environments per branch, and promotion gates (tests, migrations, health checks) that make deploys boring by design.",
    integrations: ["Cloud (AWS/GCP)", "CI/CD", "Containers & Kubernetes", "Terraform/IaC", "Monitoring & alerting", "Secrets management", "Log aggregation"],
    security:
      "Least-privileged access as default, secrets in managed vaults never in repos, network segmentation between tiers, backups with rehearsed restores, and audit trails on every privileged action.",
    quality:
      "Infrastructure changes reviewed like code; pipelines prove health before promotion; rollback is a first-class path tested in rehearsal, not a theory; alerting tuned so pages are rare and real.",
    afterLaunch:
      "Operations on a rhythm: cost reviews, dependency and patch cadence, incident practice, capacity planning against growth, and runbooks kept current so the system outlives any single operator.",
    relatedWork: [
      { label: "Technology & architecture", href: "/technology" },
      { label: "Enterprise governance", href: "/enterprise" },
      { label: "Trust & security", href: "/trust" },
    ],
    deliverables: [
      { title: "Cloud architecture", text: "Environments designed for your scale and compliance needs, efficient by default, resilient where it matters." },
      { title: "CI/CD pipelines", text: "Automated test, build and promotion paths, small releases, fast rollbacks, no ceremonial deploy days." },
      { title: "Infrastructure as code", text: "Terraform-managed, versioned infrastructure, reproducible environments and reviewable changes." },
      { title: "Containers & orchestration", text: "Docker and Kubernetes where they earn their complexity, and simpler choices where they don't." },
      { title: "Observability", text: "Logging, metrics and tracing wired to alerts a human can act on: SLOs, dashboards, incident runbooks." },
      { title: "Security operations", text: "Secrets management, least-privilege access, patching cadence and recovery drills, evidence over assertion." },
    ],
    process: [
      { name: "Assess", text: "Current state, risks and costs mapped; the operational gaps ranked by blast radius." },
      { name: "Architect", text: "Target infrastructure designed as code, with migration steps your team can verify." },
      { name: "Automate", text: "Pipelines and guardrails put in place, deploys, tests, rollbacks and alerts." },
      { name: "Operate", text: "Monitoring, incident practice and cost review on a rhythm, reliability as habit." },
    ],
    faqs: [
    {
      q: "How much does cloud and DevOps consulting cost?",
      a: "Engagements range from a fixed-scope assessment (current state, risks, cost map) to a full rebuild of pipelines and infrastructure. The assessment is the honest first step: it prices the work by evidence instead of guesses.",
    },
    {
      q: "How long does a cloud migration take?",
      a: "Single applications can move in weeks; estates with dependencies and data take months and should migrate in stages with rollback paths. We plan cutovers so downtime is scheduled, never discovered.",
    },
    {
      q: "Can you reduce our existing cloud costs?",
      a: "Usually, yes. Cost is treated as an operational metric: rightsizing, storage lifecycle, reserved capacity and per-service attribution, reviewed on a cadence. We start with an audit that shows where the money actually goes before changing anything.",
    },
      { q: "Can you move us to the cloud?", a: "Yes, assessment, migration plan and staged cutover with rollback paths at every step, from single servers to datacentre estates. Downtime windows are planned, not discovered." },
      { q: "Kubernetes or something simpler?", a: "Kubernetes where scale, multi-service complexity or team practice justifies it; simpler platform choices where they don't. We recommend the least complexity that meets your next two years, not the most impressive." },
      { q: "Do you handle cloud cost optimisation?", a: "Cost is treated as an operational metric: rightsizing, reserved capacity, storage lifecycle and per-service attribution, reviewed on a rhythm so the bill stays explicable." },
      { q: "Can you work alongside our internal team?", a: "Yes, we embed with your engineers, transfer knowledge deliberately and leave documentation and runbooks behind. Dependency is not the goal." },
    ],
    industries: ["logistics", "energy", "manufacturing"],
    related: ["custom-software-development", "data-analytics", "qa-testing"],
  },
  {
    slug: "data-analytics",
    title: "Data & Analytics",
    short: "Data",
    tagline: "Decisions that run on evidence.",
    heroLead:
      "Pipelines, warehouses and dashboards, data collected once, trusted everywhere, and turned into surfaces people actually use to decide.",
    metaDescription:
      "Data and analytics engineering by Savo Technologies: pipelines, warehouses, BI dashboards and decision intelligence. Trusted data turned into decisions.",
    overview: [
      "Most organisations don't lack data, they lack trust in it. Numbers disagree between meetings, reports are assembled by hand each cycle, and the interesting signals sit locked in operational corners nobody queries. The fix is unglamorous and valuable: pipelines that reliably collect, models that define metrics once, and surfaces that answer questions in seconds.",
      "We build that backbone and the decision layers above it. Warehouses modelled around your business rather than a generic template, fed by tested pipelines, surfaced in dashboards tuned to each audience: executive, operational, analytical. Definitions live in one place, lineage is traceable, and the quarter's arguments about whose number is right end.",
    ],
    image: "/images/services/data-analytics-hero.webp",
    imageCaption: "One number, one truth, one place.",
    stack: ["PostgreSQL", "dbt", "Airflow", "Metabase", "Power BI", "Python"],

    whenNeeded: [
      "Reports are assembled by hand every cycle, and the people who built the spreadsheet have moved on.",
      "Numbers disagree between meetings, and decisions stall on whose figure is right.",
      "Operational data sits in disconnected systems, and the interesting questions stay unasked.",
      "Leadership, operations and analysts each need the same truths at different altitudes.",
    ],
    whenNot: [
      "A single spreadsheet maintained by one reliable person answers the business's questions today; a warehouse would be ceremony without need.",
      "The product hasn't found its market yet; heavy data investment should follow signal, not precede it.",
      "The real problem is data capture quality at the source; fixing inputs comes before pipeline elegance.",
    ],
    architecture:
      "Warehouse-first and modelled around your business: sources ingested once, transformations versioned and tested (dbt-style), metric definitions owned in one layer, and lineage traceable from any dashboard number back to its source query.",
    integrations: ["Databases & SaaS sources", "CRMs & ERPs", "Product analytics", "Spreadsheets & files", "BI tools", "Alerting & digests"],
    security:
      "Access scoped per audience (row and column level where the warehouse supports it), PII masked or excluded from analytic surfaces by default, and exports governed so the careful front door isn't undone by a wide back door.",
    quality:
      "Pipelines tested like code: schema contracts, freshness and volume checks, alerting on anomalies, and reconciliation jobs that prove the warehouse matches the source of record.",
    afterLaunch:
      "Dashboards decay without owners: each surface gets a steward and a review cadence, definitions evolve through a change process, and usage analytics retire the reports nobody opens.",
    relatedWork: [
      { label: "Technology & architecture", href: "/technology" },
      { label: "Case study dossier", href: "/case-studies" },
      { label: "AI practice", href: "/ai/machine-learning" },
    ],
    deliverables: [
      { title: "Data pipelines", text: "Collection and transformation flows, tested, monitored and recoverable, from sources to warehouse." },
      { title: "Warehouse modelling", text: "Metrics defined once and trusted everywhere, semantics your finance team will actually sign off on." },
      { title: "BI dashboards", text: "Executive and operational surfaces tuned per audience, answers in seconds, not spreadsheet archaeology." },
      { title: "Event analytics", text: "Product and marketing events instrumented properly, so funnels and cohorts reflect reality." },
      { title: "Reporting automation", text: "The weekly and monthly reports generated, checked and delivered without human assembly." },
      { title: "ML-ready foundations", text: "Clean, documented data layers that analytics and AI work can build on without re-plumbing." },
    ],
    process: [
      { name: "Map", text: "Sources, consumers and current pain mapped; the metric definitions that matter agreed." },
      { name: "Model", text: "Warehouse and semantics designed, one definition per metric, lineage documented." },
      { name: "Build", text: "Pipelines, tests and dashboards delivered iteratively with your team in the loop." },
      { name: "Institutionalise", text: "Alerts on data quality, training for users and a rhythm of refinement as questions mature." },
    ],
    faqs: [
    {
      q: "How much does a data warehouse or BI dashboard cost?",
      a: "It depends on the number of sources, data volume and how many audiences need their own views. A focused first pipeline plus an executive dashboard is a common fixed-scope starting point that proves value before the wider build.",
    },
    {
      q: "How long does an analytics project take?",
      a: "A first trusted pipeline and dashboard typically ships in weeks; organisation-wide warehouses with many source systems take longer and should deliver value at each stage. Definitions are agreed once, so the arguments about numbers end.",
    },
    {
      q: "Can you work with the data tools we already use?",
      a: "Yes. We connect to the CRMs, ERPs, spreadsheets and databases you already run, and we choose BI surfaces your team will actually open. The goal is one trusted number, not another system to maintain.",
    },
      { q: "We have data everywhere, where do we start?", a: "With the decisions your business makes repeatedly. We map the few metric families that drive those decisions, build trust in them first, and expand outward, rather than boiling an ocean of dashboards nobody reads." },
      { q: "Which BI tool should we use?", a: "The one your team will open: Metabase or Looker Studio for lean teams, Power BI where the organisation already lives in Microsoft. We build on what sticks, and keep the semantic layer portable." },
      { q: "Can you fix our unreliable reports?", a: "Yes, pipelines get tests, definitions get versioned, and quality alerts fire before the meeting where the number gets quoted. Trust is rebuilt one reliable cycle at a time." },
      { q: "Is this the same as data science?", a: "No, this is the engineering that makes analysis trustworthy. Once foundations hold, forecasting and ML become possible; without them, every model inherits the mess." },
    ],
    industries: ["manufacturing", "energy", "travel"],
    related: ["ai-agent-development", "cloud-devops", "custom-software-development"],
  },
  {
    slug: "ai-agent-development",
    title: "AI Agent Development",
    short: "AI Agents",
    tagline: "AI that does the work, not just the talk.",
    heroLead:
      "Agents grounded in your data and tools, customer support, operations, research and document workflows with guardrails, oversight and evaluation built in.",
    metaDescription:
      "AI agent development by Savo Technologies: LLM agents grounded in your data, tool-calling workflows, RAG systems and enterprise guardrails. Production AI, evaluated and observable.",
    overview: [
      "The distance between an impressive AI demo and a dependable AI employee is the entire job. Demos charm; production agents need grounding in real data, permission to act within explicit boundaries, graceful fallback when confidence drops, and evaluation that catches regressions before users do. That distance is engineering.",
      "We build agents as systems: retrieval over your documents and APIs, tool-calling into the software that runs your business, human escalation paths that make sense, and observability that shows exactly why an agent did what it did. Security is architectural, access scoped to the agent's role, sensitive actions gated, every decision logged, because an agent with credentials is an employee with keys.",
    ],
    image: "/images/services/ai-agents-hero.webp",
    imageCaption: "Grounded, guarded, observed, production AI.",
    stack: ["OpenAI", "Anthropic", "RAG", "Vector search", "Tool calling", "Evaluations"],

    whenNeeded: [
      "A knowledge-heavy workflow (support, operations, sales research) consumes hours per day and follows learnable patterns.",
      "Your team answers the same questions repeatedly, and the answers live in documents and systems you control.",
      "A process needs 24/7 first-line coverage with human escalation for the cases that deserve judgement.",
      "You want to automate decisions but need every action traceable, scoped and reversible.",
    ],
    whenNot: [
      "The workflow is fully deterministic with fixed rules; a plain integration or script is cheaper and perfectly predictable.",
      "Zero error tolerance applies to the decision itself (legal, medical); agents can prepare, humans decide.",
      "The knowledge base is thin or stale; grounding needs real sources or the agent will be confidently useless.",
      "You want AI on the website as a vibe; a demo without an owner becomes a liability in a quarter.",
    ],
    architecture:
      "Retrieval over your documents and APIs as the knowledge layer, tools with typed inputs and permission scopes as the action layer, evaluation harnesses as the quality gate, and traces as the audit layer. Model choice is a cost/latency decision per task, cached where answers repeat.",
    integrations: ["CRM", "Ticketing", "Product catalogues", "Databases & documents", "Email & messaging", "Telephony"],
    security:
      "Access scoped to the agent's role, sensitive actions gated behind explicit authorization, PII filtered at input and output, every decision logged. An agent with credentials is an employee with keys; we issue keys accordingly.",
    quality:
      "Golden datasets and adversarial cases score every prompt, model or tool change before deployment. Confidence gates route uncertain answers to humans. Regression suites catch behaviour drift before users do.",
    afterLaunch:
      "Agents are products, not features: monitored for containment and satisfaction, reviewed weekly against conversation logs, improved against evaluation, and scoped outward as evidence accumulates.",
    relatedWork: [
      { label: "The agent fleet", href: "/ai-agents" },
      { label: "Reading: AI agents in production", href: "/insights/ai-agents-in-production" },
      { label: "Reading: RAG or fine-tuning", href: "/insights/rag-vs-fine-tuning" },
    ],
    deliverables: [
      { title: "Support agents", text: "Customer-facing agents grounded in your knowledge base, resolving, escalating and logging every conversation." },
      { title: "Operations agents", text: "Internal agents that process documents, reconcile records and chase workflows across your systems." },
      { title: "RAG knowledge systems", text: "Retrieval over your documents and data, answers with sources, hallucination-resistant by design." },
      { title: "Multi-agent workflows", text: "Orchestrated agent teams for complex processes, planning, execution and review roles composed deliberately." },
      { title: "Voice & conversation", text: "Telephony and chat agents with natural handoff to humans when the conversation deserves one." },
      { title: "Evaluation & observability", text: "Test suites, regression checks and traces for every decision, agent behaviour you can audit and improve." },
    ],
    process: [
      { name: "Scope the job", text: "The workflow, data, tools and escalation rules the agent will operate within, written down first." },
      { name: "Ground", text: "Retrieval and integrations built over your real data, with permissions scoped to the agent's role." },
      { name: "Guard & evaluate", text: "Guardrails, human-approval gates and test suites that measure quality before and after every change." },
      { name: "Run & improve", text: "Observability, feedback loops and a cadence of tuning, the agent compounds instead of drifting." },
    ],
    faqs: [
    {
      q: "How much does it cost to build an AI agent?",
      a: "Cost follows data readiness, the number of tools the agent may use, and how much evaluation and guardrail engineering the workflow needs. A first production agent from our existing fleet typically deploys in two to four weeks at a fixed scope, with expansion priced by evidence.",
    },
    {
      q: "How long does it take to deploy an AI agent?",
      a: "A first agent usually goes live in two to four weeks: scoping the job, grounding it in your data, wiring tools and approvals, then supervised live running. Complex multi-agent workflows take longer and ship in stages.",
    },
    {
      q: "Is our data safe when building AI features?",
      a: "Your data stays yours: retrieval happens inside your environment, providers are chosen and configured deliberately, and nothing is used to train third-party models. NDAs are signed before details, and access is scoped to the people building your system.",
    },
      { q: "Will an agent hallucinate about our business?", a: "Grounding is the defence: the agent answers from your documents and data with sources attached, and declines when confidence is low. Evaluation suites catch regressions before customers do, no system is perfect, but this one is accountable." },
      { q: "How do you keep AI agents secure?", a: "Agents run with least-privilege access to systems, sensitive actions require human approval, and every decision is logged and traceable. We treat an agent's credentials like an employee's, scoped, monitored, revocable." },
      { q: "Which model do you use?", a: "The one that earns it. We evaluate options for your tasks and wire the abstraction so models can be swapped as the frontier moves, your product shouldn't marry a vendor." },
      { q: "What does an agent project look like?", a: "A focused first workflow ships in weeks: scope, ground, guard, evaluate. It starts supervised, earns autonomy with evidence, and expands once the pattern proves itself." },
    ],
    industries: ["healthcare", "education", "fintech"],
    related: ["data-analytics", "custom-software-development", "web-development"],
  },
  {
    slug: "custom-software-development",
    title: "Custom Software",
    short: "Software",
    tagline: "Software shaped to the business, not the template.",
    heroLead:
      "SaaS platforms, business applications and internal systems, engineered around your real operations instead of the closest shelf product.",
    metaDescription:
      "Custom software development by Savo Technologies: SaaS platforms, business applications, multi-tenant systems and enterprise tools. Built around your operations, integrated with your stack.",
    overview: [
      "Every business accumulates processes that no shelf product quite fits, so people adapt to the tool, build shadow spreadsheets around it, or simply absorb the friction as normal. Custom software removes that tax: systems shaped to how your operation actually runs, integrated with what you already use, and owned by you outright.",
      "We build the full range: multi-tenant SaaS products, internal business applications, marketplaces and enterprise tools. Architecture decisions are made for your next three years of tenancy, integrations and reporting, and the codebase arrives documented and transferable, because software you can't maintain is software you rented at premium rates.",
    ],
    image: "/images/team.webp",
    imageCaption: "The operation defines the software. Not the reverse.",
    stack: ["TypeScript", "Node.js", "PostgreSQL", "Multi-tenant", "REST & GraphQL", "SaaS billing"],

    whenNeeded: [
      "Your operation is shaped around off-the-shelf software's limits, and workarounds have quietly become the job.",
      "Spreadsheets, chat threads and tribal knowledge hold the processes the business actually runs on.",
      "You need a system nobody sells: your pricing, your workflow, your compliance, your edge.",
      "A spreadsheet-civilisation is scaling into risk: one file, one owner, no audit trail.",
    ],
    whenNot: [
      "A configured SaaS covers 90 percent of the need at a tenth of the cost; we recommend the SaaS and integrate around it.",
      "The process itself is broken or undecided; software will fossilise the confusion. Fix the process first.",
      "Budget fits a point solution, not a platform; we scope honestly to the value, not the ambition.",
    ],
    architecture:
      "Modular monolith first, distributed only when scale or team structure justifies it. Domain-driven boundaries so modules can split later without a rewrite, typed APIs, and multi-tenancy decided deliberately at the start (column, schema or database) because it is expensive to change after customers arrive.",
    integrations: ["Payments & billing", "CRM & ERP", "Email & messaging", "Documents & e-sign", "Auth/SSO", "Accounting", "Third-party APIs"],
    security:
      "Role-based access modelled on the org chart, field-level protection for sensitive data, full audit trails on state-changing actions, and data-retention rules built into the schema, not bolted on at compliance time.",
    quality:
      "Business-critical flows carry automated tests; releases go through staging with migration rehearsals; UAT happens against real workflows with the people who run them; and parallel-running against the old system (spreadsheet or software) proves the replacement before cutover.",
    afterLaunch:
      "Operational software lives or dies with its adoption: training, in-product guidance and a feedback loop from users to roadmap, plus monitoring, patching and incremental releases on a rhythm the operation can absorb.",
    relatedWork: [
      { label: "Technology & architecture", href: "/technology" },
      { label: "Enterprise engagement models", href: "/enterprise" },
      { label: "Reading: Estimating software honestly", href: "/insights/estimating-software-honestly" },
    ],
    deliverables: [
      { title: "SaaS platforms", text: "Multi-tenant products with billing, roles and onboarding, from validation build to scale-ready." },
      { title: "Business applications", text: "The systems your operation runs on, workflows, approvals, records and reporting in one place." },
      { title: "Marketplaces", text: "Multi-sided platforms with vendor tools, commission logic and trust mechanics built in." },
      { title: "Internal tools", text: "Admin consoles and operator surfaces that replace the spreadsheet sprawl behind the scenes." },
      { title: "Legacy modernisation", text: "Old systems understood, stabilized and progressively rebuilt, without a big-bang rewrite gamble." },
      { title: "APIs & integrations", text: "The layer that connects your software to everything else, documented, versioned, monitored." },
    ],
    process: [
      { name: "Understand", text: "Operations, edge cases and integration reality documented, the spec the business actually lives." },
      { name: "Architect", text: "Tenancy, data model and integration plan designed for the scale you're becoming." },
      { name: "Build in slices", text: "Working software every few weeks, usable, testable, adjustable as learning arrives." },
      { name: "Own it", text: "Documentation, handover and support, a codebase your team can carry forward." },
    ],
    faqs: [
    {
      q: "How much does custom software development cost?",
      a: "Custom software is priced by scope: users, roles, integrations, compliance and data migration are the real drivers. We quote fixed milestones after discovery so the budget attaches to working software, not open hourly billing.",
    },
    {
      q: "How long does custom software take to build?",
      a: "Operational systems typically take a few months to a first production release, with parallel-running against the old process before cutover. Discovery produces the honest plan, and each milestone ends in something your team can use.",
    },
    {
      q: "How do we decide between custom software and off-the-shelf?",
      a: "If the workflow is the same as every competitor's, buy SaaS; if the workflow is why customers choose you, build. We publish a full decision framework on Insights and will happily tell you when the honest answer is a subscription.",
    },
      { q: "Custom software or off-the-shelf?", a: "When your process is the differentiator, custom wins; when it's commodity, shelf wins. We'll tell you which side of that line you're on, including when the honest answer is 'configure the tool you have'." },
      { q: "How do you keep budgets controlled?", a: "Fixed-scope stages with defined outcomes, working software at each checkpoint, and change handled as explicit re-scoping, you always know what the next slice costs before approving it." },
      { q: "Who owns the code?", a: "You do, outright, with repositories, documentation and infrastructure you control. Dependency on us is a service choice, never a hostage situation." },
      { q: "Can you extend our existing system?", a: "Yes, we audit what exists, integrate where it's sound, replace what isn't, and modernise progressively instead of betting everything on a rewrite." },
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
      "SEO, AEO and performance marketing, structured so your product is found by search engines, AI answer engines and the humans using both.",
    metaDescription:
      "Digital marketing by Savo Technologies: SEO, AEO for AI answer engines, performance marketing and content strategy. Discovery engineered to compound.",
    overview: [
      "Search has split in two: the classic blue links and the AI answers increasingly read instead of clicked. Winning both demands the same foundation of genuine authority expressed in structures machines can parse, plus the measurement to know which channel actually earns revenue rather than applause.",
      "We run growth as an engineering discipline: technical SEO baked into the product, content strategy built on what your buyers actually search, AEO structuring for the answer engines, and performance campaigns instrumented to revenue. Reports speak in pipeline and acquisition cost, because ranking positions are weather, but compounded authority is climate.",
    ],
    image: "/images/services/digital-marketing-hero.webp",
    imageCaption: "Authority is climate. Rankings are weather.",
    stack: ["Technical SEO", "AEO / GEO", "Google Ads", "Analytics", "Schema", "Content systems"],

    whenNeeded: [
      "The product is good and invisible: buyers search for what you sell and find competitors.",
      "Traffic exists but converts poorly, and nobody can say which visits are which.",
      "AI assistants and answer engines increasingly decide who gets cited, and your content isn't shaped for them.",
      "Spending on ads is climbing while the asset (search presence) stays flat.",
    ],
    whenNot: [
      "The market genuinely doesn't search for the category yet; demand creation (content, outbound, community) precedes search capture.",
      "The site's fundamentals are broken (speed, structure, indexing); technical repair comes before growth spend, and we say so.",
      "You need a viral moment, not a compounding asset; this practice compounds slowly.",
    ],
    architecture:
      "Search work is engineering plus editorial: crawlable semantic structure, schema matching visible content, internal-link graphs around topics rather than keywords, and content built on genuine expertise that both people and models can cite.",
    integrations: ["Google Search Console", "Analytics", "Ads platforms", "Schema/JSON-LD", "CMS", "Sitemap & IndexNow pipelines"],
    security:
      "Growth never at the cost of trust: no cloaked content, no schema claiming what pages don't show, no fabricated reviews. Rankings earned through substance survive updates; tricks rent until they're evicted.",
    quality:
      "Every engagement starts with a baseline (indexation, Core Web Vitals, query landscape) and reports against it: what changed, what it moved, what we learned. Vanity metrics are named and excluded.",
    afterLaunch:
      "Search compounds with cadence: content reviewed against performance quarterly, technical health monitored continuously, and AEO/GEO posture revisited as answer engines evolve, because the landscape changes and so does the work.",
    relatedWork: [
      { label: "This site, as the specimen", href: "/technology" },
      { label: "Reading: Core Web Vitals budgets", href: "/insights/core-web-vitals-budgets" },
      { label: "Ask Savo assistant", href: "/#ai" },
    ],
    deliverables: [
      { title: "Technical SEO", text: "Site architecture, speed, schema and crawlability, the foundation rankings and AI answers stand on." },
      { title: "AEO for answer engines", text: "Content structured so AI assistants cite you when they answer your buyers' questions." },
      { title: "Content strategy", text: "Editorial plans built from real search behaviour, pages that earn traffic and trust, not filler." },
      { title: "Performance marketing", text: "Search and social campaigns instrumented to revenue, with creative tested systematically." },
      { title: "Analytics & attribution", text: "Measurement that survives scrutiny, which channels bring buyers, not just visitors." },
      { title: "Conversion optimisation", text: "Landing experiences tested and tuned so traffic you've earned converts instead of bouncing." },
    ],
    process: [
      { name: "Audit", text: "Technical, content and competitive baseline, where authority exists and where it leaks." },
      { name: "Architect", text: "Keyword-to-page architecture, schema strategy and channel plan sequenced by opportunity." },
      { name: "Execute", text: "Technical fixes, content production and campaigns shipped on a rhythm, each instrumented." },
      { name: "Compound", text: "Monthly evidence loops, double down on what earns, cut what doesn't, build the moat." },
    ],
    faqs: [
    {
      q: "How long does SEO take to show results?",
      a: "Technical fixes can move rankings within weeks, but meaningful organic growth compounds over three to six months of consistent work. We report against a baseline from day one, so progress is measured, not narrated.",
    },
    {
      q: "What are AEO and GEO, and why do they matter?",
      a: "AEO (Answer Engine Optimization) structures your content so answer engines and voice assistants quote it directly; GEO (Generative Engine Optimization) makes AI assistants like ChatGPT and Perplexity cite your company when buyers ask. We build both into the site itself, the way this one is built.",
    },
    {
      q: "Do you handle both Indian and international SEO?",
      a: "Yes. We work across India, Switzerland, the UAE, the UK, the US and beyond, with country-level targeting, hreflang where needed and market-specific keyword research. The same honest methods apply worldwide.",
    },
      { q: "How long does SEO take to work?", a: "Technical wins can show quickly; authority compounds over months. We sequence fast wins first and set traffic expectations per stage, anyone promising instant rankings is selling weather, not climate." },
      { q: "What is AEO and why does it matter?", a: "Answer Engine Optimisation structures your content so AI assistants cite you when answering buyer questions. As more decisions start inside AI answers, being the cited source is the new first page." },
      { q: "Do you run paid ads too?", a: "Yes, search and social performance marketing, always instrumented to pipeline rather than clicks, and treated as a complement to the compounding organic work." },
      { q: "How do you report results?", a: "In acquisition and revenue terms: pipeline by channel, cost per qualified lead, and the trajectory of organic authority. Vanity metrics don't survive our reports." },
    ],
    industries: ["ecommerce", "real-estate", "travel"],
    related: ["web-development", "data-analytics", "ui-ux-design"],
  },
  {
    slug: "qa-testing",
    title: "QA & Testing",
    short: "QA",
    tagline: "Quality you can ship on.",
    heroLead:
      "Automated suites, manual exploration and release engineering, defects caught by machines at 3 a.m. instead of customers at launch.",
    metaDescription:
      "QA and software testing by Savo Technologies: automated test suites, manual exploration, performance and security testing. Release confidence engineered in.",
    overview: [
      "Every untested release is a bet placed with customers' patience. Manual clicking finds the obvious; production finds the expensive. Real quality engineering sits in the pipeline: suites that run on every change, cover the flows that matter and fail loudly before anything ships, leaving human testers free to do what machines can't: explore like a devious user.",
      "We build that system: automated functional suites, API and integration tests, performance baselines and security checks, wired into CI so quality is a gate rather than a phase. Exploratory testing hunts the edges automation can't reach, and every defect found becomes a regression test that ensures it stays fixed.",
    ],
    image: "/images/services/qa-testing-hero.webp",
    imageCaption: "Machines catch the known. Humans hunt the unknown.",
    stack: ["Playwright", "Cypress", "API testing", "Load testing", "CI gates", "Visual regression"],

    whenNeeded: [
      "Releases are followed by the same bugs, regressions the team swore were fixed.",
      "Every deploy needs a full manual pass, so shipping is slow and still surprises.",
      "An audit, contract or launch date demands evidence quality actually happened.",
      "The app is critical enough that a bad release costs money, trust or both.",
    ],
    whenNot: [
      "The product is pre-product-market-fit and changing weekly; heavy test suites would be spent defending code about to be deleted. Focused smoke tests now, the real investment when the shape settles.",
      "The ask is a one-off bug hunt; a targeted manual audit is cheaper and more honest than a testing retainer.",
      "The team already tests well and needs capacity, not a new process; augmentation beats transformation.",
    ],
    architecture:
      "A testing pyramid sized to reality: fast unit coverage on business logic, integration tests on contracts and APIs, a thin end-to-end layer on the journeys that pay the bills, and visual regression where the interface is the product. All gated in CI so quality is a merge condition, not a milestone.",
    integrations: ["CI/CD pipelines", "Issue trackers", "Slack/notifications", "Analytics", "Visual regression baselines"],
    security:
      "Testing includes the abuse paths: auth boundaries, input validation, permission escalation between roles, and file-upload edges, because attackers test those too.",
    quality:
      "The practice is its own proof: coverage that matters is measured against risk, not percentage vanity; flaky tests are triaged like production incidents; and every release ships with evidence of what was verified.",
    afterLaunch:
      "Suites live with the product: new critical paths enter the pyramid as they ship, baselines update through review, and a quarterly audit keeps the safety net from rotting into false confidence.",
    relatedWork: [
      { label: "Reading: WCAG AA in practice", href: "/insights/wcag-aa-in-practice" },
      { label: "Designed beautifully, engineered seriously", href: "/#standard" },
      { label: "Technology & architecture", href: "/technology" },
    ],
    deliverables: [
      { title: "Automated suites", text: "End-to-end and component tests that run on every change, regressions caught in minutes, not releases." },
      { title: "API & integration tests", text: "Contract and integration coverage across services, the seams where bugs actually live." },
      { title: "Exploratory testing", text: "Skilled human testing that hunts edge cases, workflows and 'no one would do that' paths." },
      { title: "Performance testing", text: "Load and stress baselines, knowing the ceiling before the traffic finds it." },
      { title: "Security testing", text: "Vulnerability scanning and review, the cheap catches before the expensive auditors." },
      { title: "Release engineering", text: "Staged rollouts, feature flags and rollback paths, launches that can't take the product down." },
    ],
    process: [
      { name: "Assess", text: "Current coverage, risk hotspots and release pain mapped; the highest-leverage gaps first." },
      { name: "Build suites", text: "Automated coverage for critical flows, wired into the pipeline as a merge gate." },
      { name: "Explore", text: "Manual exploratory passes on each release, the unknown-unknowns, documented." },
      { name: "Guard", text: "Every defect found becomes a regression test; the suite compounds in value." },
    ],
    faqs: [
    {
      q: "How much does software testing cost?",
      a: "Testing is scoped by risk: the critical journeys, devices and integrations your users depend on define the suite. A focused automation engagement on the paths that pay the bills costs far less than a big-bang coverage program.",
    },
    {
      q: "What is the difference between manual and automated testing?",
      a: "Automation catches the known: regressions, contracts and critical flows, on every release. Manual testing hunts the unknown: exploratory issues, usability failures and edge cases no script predicted. Mature teams run both, weighted by risk.",
    },
    {
      q: "Can you test an application another team built?",
      a: "Yes. We start with a structured audit of critical paths, existing coverage and production incident history, then build the safety net your release process is missing. No rebuild required.",
    },
      { q: "Manual or automated testing?", a: "Both, doing different jobs: automation guards the known flows on every change; exploration hunts what automation can't imagine. Quality programmes that lean on only one are half blind." },
      { q: "Can you add QA to an existing product?", a: "Yes, we start with a coverage audit, automate the revenue-critical flows first, and grow the suite from there. The first weeks usually catch dormant bugs that justify everything after." },
      { q: "Will testing slow our releases down?", a: "The opposite, fast suites catch problems in minutes and make releases boring. Teams with real coverage ship more often, because fear stops being the release criterion." },
      { q: "Do you test performance and security?", a: "Yes, load baselines establish your ceilings, and security scanning plus review catch the common holes before auditors or attackers tour them." },
    ],
    industries: ["fintech", "government", "healthcare"],
    related: ["cloud-devops", "custom-software-development", "web-development"],
  },
  {
    slug: "product-engineering",
    title: "Product Engineering",
    short: "Product",
    tagline: "Products built like products, not projects.",
    heroLead:
      "Strategy, design and engineering as one discipline, discovery, roadmap and delivery that compound instead of resetting every quarter.",
    metaDescription:
      "Product engineering by Savo Technologies: product strategy, roadmap execution, cross-functional delivery and launch iteration. End-to-end product building in one team.",
    overview: [
      "The project model builds features and stops; the product model builds outcomes and keeps learning. The difference shows up in a hundred small decisions, what gets measured, what gets cut, what gets launched to learn rather than to impress. Products run by teams who own outcomes outlive products run as ticket queues.",
      "We operate as that product team: strategy that picks the right problems, design and engineering delivering in slices, launches instrumented to answer the question they were built to answer, and roadmaps that adapt to evidence. Whether extending your team or carrying the product end to end, the posture is the same, we own outcomes with you, not tasks for you.",
    ],
    image: "/images/meeting.webp",
    imageCaption: "Outcomes over output. Always.",
    stack: ["Discovery", "Roadmapping", "Cross-functional squads", "Experimentation", "Analytics", "Launch ops"],

    whenNeeded: [
      "The vision is clear but the path isn't; six months of building hasn't moved the metric it was for.",
      "Strategy, design and engineering live in three vendors and three blame zones.",
      "A new product must find market fit fast, with evidence at each step instead of a big-bang bet.",
      "An existing product needs a steward across roadmap, quality and growth, not another feature factory.",
    ],
    whenNot: [
      "The requirements are fully known and stable; a fixed-scope build is cheaper and faster than a discovery-led engagement.",
      "There is no appetite for measurement or iteration; product engineering without feedback loops is just slower custom development.",
      "The initiative needs one discipline (design or engineering) rather than an end-to-end partner; we scope to the narrower need.",
    ],
    architecture:
      "One accountable squad across strategy, design, engineering and growth. Decisions recorded as they're made (ADRs), bets sized to their evidence, instrumentation designed with the feature so outcomes are measurable from day one.",
    integrations: ["Analytics & experimentation", "Roadmapping tools", "Design systems", "Client portal reporting", "Support & feedback loops"],
    security:
      "Security and compliance are roadmap concerns, not afterthoughts: data choices, access models and retention enter planning at discovery, when they're cheap.",
    quality:
      "Outcome reviews on a cadence: metrics against intent, honest post-mortems on misses, roadmap adjustments recorded. The portal shows progress as it happens, not as it's spun.",
    afterLaunch:
      "Product engineering is continuous by definition: after launch the same squad iterates against evidence, or hands over cleanly with documentation and a trained team. Either outcome is a success.",
    relatedWork: [
      { label: "The methodology", href: "/#process" },
      { label: "Case study dossier", href: "/case-studies" },
      { label: "Reading: Estimating software honestly", href: "/insights/estimating-software-honestly" },
    ],
    deliverables: [
      { title: "Product strategy", text: "Positioning, sequencing and the metrics that define 'working', decided before building." },
      { title: "Discovery & validation", text: "Assumptions surfaced and tested cheaply, prototypes and pilots before commitments." },
      { title: "Roadmap execution", text: "Slices of working product on a rhythm, each shippable and each teaching something." },
      { title: "Experimentation", text: "A/B tests and instrumented features, decisions upgraded by evidence, not seniority." },
      { title: "Launch operations", text: "Staged rollouts, feedback loops and iteration cadence after the confetti settles." },
      { title: "Team extension", text: "Senior product engineers embedding with your squad, raising the bar, not just the headcount." },
    ],
    process: [
      { name: "Frame", text: "The outcome, the constraints and the riskiest assumptions, written down and agreed." },
      { name: "Slice", text: "The roadmap cut into shippable increments, each carrying a hypothesis and a metric." },
      { name: "Deliver", text: "Design and engineering in one loop, weekly working software, no handoff cliffs." },
      { name: "Learn & steer", text: "Evidence reviewed on a rhythm; the roadmap adapts and compounds." },
    ],
    faqs: [
    {
      q: "What does product engineering include?",
      a: "One accountable squad across strategy, design, engineering and growth: discovery, roadmap, builds, measurement and iteration. You get outcomes with evidence, not features without owners.",
    },
    {
      q: "How do you price product engineering engagements?",
      a: "Most run as a dedicated team with a monthly rhythm, or as fixed-scope milestones inside a larger roadmap. Discovery comes first and prices the path before either side commits long term.",
    },
    {
      q: "Can you take over an existing product or team?",
      a: "Yes. We start with a structured handover audit, stabilise delivery and documentation, then iterate. The same evidence-first process applies whether we built it or inherited it.",
    },
      { q: "Product engineering versus development?", a: "Development executes a specification. Product engineering questions it, measuring whether the build moved the metric, and steering when it didn't. You get outcomes and judgement, not just output." },
      { q: "Can you work within our existing product org?", a: "Yes, we embed with your rituals, complement your leads and hand over cleanly. The goal is a stronger product org, not a permanent tenant." },
      { q: "How do you handle roadmap changes?", a: "The roadmap is a hypothesis, not a contract. Evidence steers it at agreed checkpoints, which is precisely why products built this way waste less." },
      { q: "Do you start from zero or rescue in-flight products?", a: "Both. Zero-to-one gets discovery and disciplined slices; in-flight rescues get an audit, a stabilisation plan and a rebuilt delivery rhythm." },
    ],
    industries: ["ecommerce", "education", "logistics"],
    related: ["ui-ux-design", "custom-software-development", "mobile-app-development"],
  },
];

export function serviceDetail(slug: string): ServiceDetail | undefined {
  return SERVICE_DETAILS.find((s) => s.slug === slug);
}
