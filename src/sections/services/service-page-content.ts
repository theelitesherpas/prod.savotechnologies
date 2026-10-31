import { serviceDetail, type ServiceDetail } from "@/constants/services-detail";

/** Code-authored presentation for the shared service route; not CMS-managed proof. */
type Editorial = Pick<ServiceDetail, "tagline" | "heroLead" | "overview" | "architecture" | "quality"> & {
  questions: ServiceDetail["faqs"];
};
const EDITORIAL: Record<string, Editorial> = {
  "web-development": {
    tagline: "Websites and web apps built around your business.",
    heroLead: "From a stronger online presence to a platform your customers use every day, we bring design, development and integrations together to build the right web experience.",
    overview: ["Your website should do more than explain what you do. It should help people find what they need, take the next step and come back with confidence.", "We build marketing websites, customer portals and web applications around those journeys. Content management, performance, accessibility and connections to your existing systems are considered together, so the result works for your customers and the people who manage it."],
    architecture: "We choose the rendering, content model and API structure around how your application will be used. That can mean a server-rendered website, a headless content platform or a browser application with authenticated workflows. The aim is useful functionality without unnecessary complexity.",
    quality: "The test plan can cover key user journeys, browser and device compatibility, accessibility, performance and analytics. Acceptance criteria and launch checks are agreed before release.",
    questions: [
      { q: "Which technologies should we use?", a: "Next.js, React and TypeScript are options, not a requirement. We consider your content, integrations, team skills, hosting and expected usage before recommending a stack. Maintaining the finished product matters as much as building it." },
      { q: "Can our team manage the content?", a: "We can include a CMS with the editing roles, content types and preview workflow your team needs. What is editable, along with training and documentation, is agreed during scoping rather than left until handover." },
      { q: "Will the website support SEO and AI discovery?", a: "We can address crawlability, semantic structure, metadata, structured data and performance. These support discoverability, while content quality, competition and third-party search systems also influence visibility. Rankings or AI citations are not guaranteed." },
    ],
  },
  "mobile-app-development": {
    tagline: "Mobile apps made for the way people use them.",
    heroLead: "Useful iOS and Android experiences, from a first product release to connected apps with payments, device features and offline workflows.",
    overview: ["A good mobile product fits into a person's day. It makes the important tasks easy, responds clearly when the connection changes and feels at home on the device.", "We bring product design, cross-platform development and native integrations into one delivery plan. Platform choice, backend services, testing and app-store preparation are shaped around your audience and the features they actually need."],
    architecture: "Flutter, React Native and native development each have a place. We evaluate device integrations, offline behaviour, backend APIs and release requirements before choosing the approach. Sync and recovery rules are designed around the realities of mobile networks.",
    quality: "Testing is planned around the devices and OS versions your audience uses, including permissions, network changes, payments and critical journeys. Store preparation and release checks are scoped alongside development.",
    questions: [
      { q: "Should we choose native, Flutter or React Native?", a: "The choice depends on device features, platform differences, performance requirements and your team's maintenance needs. Cross-platform development can share substantial code; native development may be more suitable for deeply platform-specific experiences." },
      { q: "Can you take over an existing app?", a: "Yes. A technical review helps us understand the codebase, dependencies, backend, crash history and store status. We then agree what to stabilise, retain or replace before planning new features." },
      { q: "Do you help with app-store submission?", a: "Store preparation and submission support can be included in scope. This may cover build distribution, assets and review responses. Approval remains the decision of Apple or Google, and privacy declarations require accurate information from all parties." },
    ],
  },
  "ui-ux-design": {
    tagline: "Clearer experiences. More useful products.",
    heroLead: "Research, product journeys and interface design that help people understand your product and move through it with confidence.",
    overview: ["Design works when people can find their way, understand their choices and complete what they came to do. Visual quality matters, but clarity is what makes it useful.", "We connect research, information architecture, prototyping and interface design. The level of research and testing is matched to the problem, with reusable components and implementation guidance that help the design carry through into the finished product."],
    architecture: "Journeys, content structure and component behaviour are resolved together. Design tokens, interaction states and handover guidance are aligned with the codebase so that the system can be implemented and maintained consistently.",
    quality: "Reviews can include contrast, keyboard interaction, content clarity and state coverage. Prototypes and usability sessions help test uncertain assumptions; the participant plan and accessibility requirements are agreed for the engagement.",
    questions: [
      { q: "Can you work with our development team?", a: "Yes. We can align designs with your stack and component system, document interactions and support implementation reviews. Collaboration and handover responsibilities are agreed with your team." },
      { q: "Do we need a design system?", a: "A reusable component and token system is useful when multiple screens, products or teams need consistency. For a smaller project, a focused UI kit may be enough. The investment should match the product's scale." },
    ],
  },
  "cloud-devops": {
    tagline: "A clearer path from code to production.",
    heroLead: "Cloud architecture, deployment automation and observability that give your team a more deliberate way to release and run software.",
    overview: ["Infrastructure should support your product rather than become a separate problem to manage. Clear environments, repeatable releases and useful monitoring make the work easier to understand.", "We review the system you have, then plan the improvements that matter: architecture, pipelines, infrastructure as code, visibility and recovery. The tools are chosen for your operating needs and the people who will maintain them."],
    architecture: "Managed hosting, containers and orchestration are evaluated against workload, team capacity and operating requirements. Infrastructure definitions, environment configuration and promotion paths are designed to make changes reviewable.",
    quality: "Pipeline checks, migration rehearsals, rollback paths and alerting are planned around operational risk. Recovery and performance requirements need explicit tests rather than assumptions about the platform.",
    questions: [
      { q: "Do we need Kubernetes?", a: "Not necessarily. A managed platform or simpler container setup may meet the requirements with less operational overhead. We consider scale, service complexity and your team's capacity before recommending orchestration." },
      { q: "Can you help with cloud migration?", a: "Yes. We assess dependencies, data, hosting and recovery requirements, then plan a staged move where practical. Cutover, testing and rollback responsibilities are agreed before changes are made." },
      { q: "Can you review our cloud costs?", a: "We can review usage, resource sizing, storage and billing allocation to identify opportunities. Savings depend on the existing setup and any reliability or contractual constraints; they are not assumed in advance." },
    ],
  },
  "data-analytics": {
    tagline: "Make your data easier to trust and use.",
    heroLead: "Connected data pipelines, reporting and dashboards built around the decisions your business needs to make.",
    overview: ["Useful analytics starts with clear questions and shared definitions. A dashboard is only as dependable as the sources and logic behind it.", "We connect operational data, model the measures that matter and build reporting for the people who use it. Source quality, ownership and review processes are part of the conversation, not problems left for a dashboard to conceal."],
    architecture: "Source systems, ingestion, transformations and reporting are mapped as one flow. Metric definitions, versioned logic and traceability help your team understand where a number comes from and how it changes.",
    quality: "The plan can include schema, freshness and reconciliation checks, with owners for exceptions and changes. Reports are reviewed against source data and the questions they are intended to answer.",
    questions: [
      { q: "Where should we start if our data is spread across systems?", a: "Start with a recurring business decision and the data it needs. We map those sources and definitions, then build a focused pipeline or report before expanding to a wider platform." },
      { q: "Can you work with our existing BI tools?", a: "Yes. We consider your current tools, licences, team familiarity and data environment. A new platform is recommended only when it solves a clear limitation." },
      { q: "Is analytics engineering the same as data science?", a: "Analytics engineering focuses on dependable data models, pipelines and reporting. Forecasting and machine learning build on those foundations, with additional requirements for evaluation and data suitability." },
    ],
  },
  "ai-agent-development": {
    tagline: "AI agents with a clear job and clear boundaries.",
    heroLead: "Knowledge and workflow agents connected to your business systems, with evaluation, permissions and human oversight designed into the approach.",
    overview: ["A useful agent needs more than a convincing answer. It needs reliable sources, a defined role and a safe way to handle uncertainty or hand work back to a person.", "We begin with a specific workflow, assess data readiness and build retrieval, tool access and evaluation around it. The goal is a system you can inspect and improve, with autonomy matched to the risk of the task."],
    architecture: "Knowledge sources, retrieval, model selection and tool access are designed as separate, inspectable parts. Permission boundaries, approval steps and traces help explain what an agent can do and how its behaviour is reviewed.",
    quality: "Representative tasks and failure cases form the evaluation plan. Changes to models, prompts and tools are checked against those cases, with escalation and human review for situations where the system should not act alone.",
    questions: [
      { q: "How do you reduce incorrect AI answers?", a: "Grounding, source references, constrained tools and evaluation can reduce risk. They do not eliminate it. We define fallback and escalation behaviour, and assess whether AI is appropriate for the workflow at all." },
      { q: "How is our data handled?", a: "Hosting, model providers, retention, access and provider training policies must be reviewed for your project. These choices are agreed before connecting sensitive data. An NDA and contractual data responsibilities can be discussed during scoping." },
      { q: "Which model or provider should we choose?", a: "We evaluate options against task quality, latency, cost, data requirements and deployment constraints. Provider choice is part of the technical plan, rather than a promise to use one model for every job." },
    ],
  },
  "custom-software-development": {
    tagline: "Software that fits how your business works.",
    heroLead: "Business applications, SaaS platforms and connected internal tools shaped around your workflows, users and existing systems.",
    overview: ["Custom software makes sense when the important parts of your operation do not fit the tools you already have. The starting point is understanding those gaps, not assuming a rebuild is the answer.", "We map workflows, roles and integrations before planning the product. Working releases, clear acceptance criteria and deliberate handover help keep the system aligned with the people who rely on it."],
    architecture: "Data models, module boundaries, APIs and tenancy are decided around business rules and expected use. We favour an understandable starting architecture, adding distributed components only where the requirements justify them.",
    quality: "Critical workflows, permissions, migrations and integrations guide the test plan. User acceptance and any parallel-running or cutover arrangements are planned with the team that will operate the software.",
    questions: [
      { q: "Should we build custom software or configure an existing tool?", a: "We compare workflow fit, integration needs, ownership costs and your ability to maintain the solution. A configured product is often the better starting point when it meets the important requirements." },
      { q: "Who owns the source code and infrastructure?", a: "Ownership, licensing, repositories, hosting accounts and handover deliverables are defined in the contract. Third-party and open-source components have their own terms, which should be identified during scoping." },
      { q: "Can you extend or modernise an existing system?", a: "Yes. We review the code, data and integrations before agreeing a stabilisation or modernisation plan. A staged approach can retain working parts instead of replacing everything at once." },
    ],
  },
  "digital-marketing": {
    tagline: "Help the right people find your business.",
    heroLead: "Technical SEO, content strategy, AI discovery and performance campaigns connected to meaningful business measurement.",
    overview: ["Growth work is more useful when it connects discovery to what happens next. Visits alone do not explain whether the right people are finding you or taking action.", "We look at the site's technical foundations, the questions buyers ask and the journeys they follow. Content, campaigns and measurement are planned together, with a baseline that makes progress and trade-offs easier to discuss."],
    architecture: "Crawlable pages, semantic content, accurate structured data and coherent internal links support discovery. Campaign and analytics setup connect channels to the actions the business needs to understand.",
    quality: "Reporting is planned against an agreed baseline and measurable goals. Indexing, content quality, tracking and campaign performance are reviewed together, with limitations and attribution assumptions made explicit.",
    questions: [
      { q: "How long does SEO take to show results?", a: "Timing depends on the site's condition, competition, content and search systems. Technical improvements and sustained content work have different time horizons. We agree how progress will be measured without guaranteeing rankings or a fixed growth date." },
      { q: "What are AEO and GEO?", a: "Answer Engine Optimisation and Generative Engine Optimisation concern how useful, clearly structured content may be discovered or cited by answer systems. They support discoverability; no provider can guarantee that an AI assistant will cite a business." },
      { q: "Do you also run paid campaigns?", a: "Search and social campaigns can be included where they fit the acquisition plan. Budgets, creative, landing pages, consent requirements and measurement are scoped together." },
    ],
  },
  "qa-testing": {
    tagline: "Make release decisions with better evidence.",
    heroLead: "Automation, exploratory testing and release checks focused on the journeys, integrations and risks that matter to your product.",
    overview: ["Testing is most valuable when it reflects how the product is used and what a failure would cost. A large suite is not a substitute for coverage of the important paths.", "We assess existing coverage and release practice, then combine automation with exploratory review. Results, defects and known limitations give your team a clearer basis for deciding what is ready to release."],
    architecture: "Unit, integration and end-to-end coverage are balanced around risk and feedback speed. Test data, environments and CI integration are designed alongside the suites so the results can be repeated and investigated.",
    quality: "Critical journeys, device coverage and acceptance criteria define the programme. Flaky tests and uncovered risks are tracked rather than hidden behind a passing report. Testing reduces uncertainty; it cannot promise defect-free software.",
    questions: [
      { q: "How do manual and automated testing work together?", a: "Automation repeats known checks efficiently. Exploratory testing investigates behaviour, usability and unexpected paths. The balance depends on the product's maturity, risk and release frequency." },
      { q: "Can you test a product another team built?", a: "Yes. We review key journeys, architecture, incident history and current coverage, then agree the access and environments needed to test it. A product rebuild is not assumed." },
      { q: "Do you test performance and security?", a: "Load tests, vulnerability checks and access-boundary testing can be scoped where appropriate. Specialist penetration testing, regulatory certification and audit sign-off are separate requirements that need explicit agreement." },
    ],
  },
  "product-engineering": {
    tagline: "Bring product thinking into every release.",
    heroLead: "Strategy, design and engineering in one delivery approach, from testing an idea to developing and improving an established product.",
    overview: ["A product needs more than a list of features. It needs a clear purpose, a way to learn and a team that can connect decisions to what gets built.", "We help frame the problem, prioritise a roadmap and deliver useful releases. Evidence from users and the business informs the next step, whether we work alongside your team or support a wider product engagement."],
    architecture: "Product decisions, technical boundaries and instrumentation are planned together. A shared roadmap and documented decisions help keep design, engineering and business priorities connected as the product evolves.",
    quality: "Working releases are reviewed against acceptance criteria and the goals behind them. User feedback, product measurement and technical checks inform roadmap discussions without treating any one metric as the whole picture.",
    questions: [
      { q: "How is product engineering different from development?", a: "Development implements requirements. Product engineering also helps frame the problem, test assumptions and decide what should come next. The scope can include discovery, design, engineering and iteration." },
      { q: "Can you work within our existing product team?", a: "Yes. Roles, decision-making, delivery cadence and reporting are agreed with your leads. The engagement can complement specific capabilities rather than replace your existing team." },
      { q: "Can you take over an in-flight product?", a: "Yes. We begin with a review of the product, codebase, delivery process and outstanding risks. That review informs a handover or stabilisation plan before the next release is committed." },
    ],
  },
};

const FIT: Record<string, Pick<ServiceDetail, "whenNeeded" | "whenNot">> = {
  "mobile-app-development": { whenNeeded: ["People need to use the product on the move.", "The experience needs device features or offline workflows.", "You want a coordinated approach to iOS and Android."], whenNot: ["A responsive website covers the important journeys.", "A first release needs to focus on one platform or a smaller set of features."] },
  "ui-ux-design": { whenNeeded: ["People struggle to find or complete important tasks.", "Screens and interactions have become inconsistent.", "You need to test a product direction before development."], whenNot: ["A focused interface review would resolve the issue.", "The core problem is positioning or acquisition rather than usability."] },
  "cloud-devops": { whenNeeded: ["Releases or environments depend on manual steps.", "You need better visibility into performance and incidents.", "Cloud operations need clearer ownership and cost understanding."], whenNot: ["Managed hosting already meets the operating requirements.", "A targeted cost or pipeline review would be enough."] },
  "data-analytics": { whenNeeded: ["Reports require repetitive manual assembly.", "Different systems produce conflicting definitions or numbers.", "Teams need a clearer view of the same operational data."], whenNot: ["A simpler reporting tool already answers the questions.", "Source-data problems need to be resolved before a wider platform is built."] },
  "ai-agent-development": { whenNeeded: ["A repeatable knowledge or workflow task needs support.", "You have useful data and a clear owner for the system.", "Actions can be bounded, evaluated and escalated to a person."], whenNot: ["Fixed rules or a straightforward integration solve the task.", "The decision cannot tolerate uncertainty or requires specialist human judgement."] },
  "custom-software-development": { whenNeeded: ["Existing software does not fit important workflows.", "Disconnected tools make operations difficult to manage.", "Your product needs its own roles, data model or integrations."], whenNot: ["A configured off-the-shelf product meets the important requirements.", "The underlying process still needs to be clarified."] },
  "digital-marketing": { whenNeeded: ["The right buyers are not finding the business.", "You need to connect traffic and campaigns to useful actions.", "Technical and content priorities need a coherent plan."], whenNot: ["The product's positioning or audience is not yet clear.", "Site fundamentals need repair before acquisition spend increases."] },
  "qa-testing": { whenNeeded: ["Regressions make releases difficult to trust.", "Manual release checks are becoming a bottleneck.", "You need evidence about critical paths and known risks."], whenNot: ["A focused audit is sufficient for the immediate question.", "Your team needs testing capacity rather than a new testing programme."] },
  "product-engineering": { whenNeeded: ["A product needs a clearer direction and delivery plan.", "Strategy, design and engineering need to work more closely.", "An existing roadmap needs testing against real feedback."], whenNot: ["The requirements are stable and a fixed-scope build is sufficient.", "The need is limited to one discipline rather than an end-to-end engagement."] },
};

export function servicePageDetail(slug: string): ServiceDetail | undefined {
  const original = serviceDetail(slug);
  const copy = EDITORIAL[slug];
  if (!original || !copy) return original;
  const { questions, ...content } = copy;
  const faqs: ServiceDetail["faqs"] = [
    { q: `How much does ${original.title.toLowerCase()} cost?`, a: "Cost depends on scope, complexity, integrations and the level of ongoing involvement. We review your requirements before proposing an approach. Deliverables, assumptions, pricing and change handling are agreed in the proposal and contract." },
    ...(slug === "digital-marketing" ? [] : [{ q: "How is the project timeline decided?", a: "We consider requirements, dependencies, content and data readiness, review cycles and testing. A delivery plan is agreed once those factors are understood. Staged work can help make progress visible without treating an early estimate as a guarantee." }]),
    ...questions,
    { q: "What happens after delivery?", a: "Handover, documentation, training, maintenance and further improvements can be included according to the engagement. Support coverage, response arrangements and responsibilities are agreed separately, so both teams know what happens after the initial work." },
  ];
  return {
    ...original, ...content, ...FIT[slug], faqs,
    security: slug === "ui-ux-design"
      ? "Accessibility requirements and data-sensitive journeys are considered during design. Contrast, keyboard use, clear feedback and appropriate information collection can be included in the review plan."
      : slug === "digital-marketing"
        ? "Content and structured data should reflect what the business can substantiate. Tracking and campaign setup need consent and data-handling requirements reviewed with the people responsible for them."
        : "Access controls, sensitive data, authentication and relevant abuse paths are considered in the technical plan. Regulatory obligations and any specialist audit or security review are scoped explicitly with your team.",
    afterLaunch: "Handover, documentation and any ongoing monitoring or improvement work are planned with your team. Support responsibilities and service arrangements are agreed for the engagement, rather than assumed to be included indefinitely.",
    ...(slug === "web-development" ? {
      whenNeeded: ["Your business needs a new website or web application.", "Your team needs to publish and manage content without routine developer help.", "Customers need a portal, dashboard or self-service workflow.", "Your website needs to connect with the systems you already use."],
      whenNot: ["A hosted website builder already meets the important requirements.", "The experience depends on native device features that a browser cannot adequately support.", "Existing software already meets your requirements without custom development."],
      deliverables: [
        { title: "Corporate & marketing websites", text: "A clear online presence with purposeful journeys, responsive design and content your team can manage." },
        { title: "Custom web applications", text: "Dashboards, business tools and browser-based products shaped around your users and workflows." },
        { title: "Customer & partner portals", text: "Authenticated experiences for accounts, requests, documents and self-service tasks." },
        { title: "Headless content platforms", text: "Structured content and APIs that support flexible publishing across websites and other channels." },
        { title: "Progressive web apps", text: "Installable web experiences with offline or device capabilities where they fit the product." },
        { title: "APIs & business integrations", text: "Connections to payments, CRM, ERP and other services, with clear data flows and error handling." },
      ],
      process: [
        { name: "Discover & plan", text: "Understand your users, business goals, existing systems and constraints. Agree the scope, priorities and acceptance criteria." },
        { name: "Design the experience", text: "Map journeys, content and interactions. Review prototypes and settle the important decisions before development." },
        { name: "Build & validate", text: "Develop the application and its integrations in reviewable stages. Test the key workflows, compatibility and agreed performance requirements." },
        { name: "Launch & hand over", text: "Coordinate deployment, content and launch checks. Provide the agreed documentation, training and next-step support plan." },
      ],
    } : {}),
  };
}
