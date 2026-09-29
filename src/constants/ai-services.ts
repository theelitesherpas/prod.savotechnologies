/**
 * AI practice pages - content for /ai/[slug]/ (generative-ai,
 * consulting, machine-learning). Capability copy only.
 */

export type AiService = {
  slug: string;
  title: string;
  short: string;
  tagline: string;
  heroLead: string;
  metaDescription: string;
  overview: [string, string];
  engagements: { title: string; text: string }[];
  process: { name: string; text: string }[];
  stack: string[];
  faqs: { q: string; a: string }[];
};

export const AI_SERVICES: AiService[] = [
  {
    slug: "generative-ai",
    title: "Generative AI & LLM Integration",
    short: "GenAI",
    tagline: "Generative AI, wired into the business",
    heroLead:
      "Language models put to work inside your product, grounded in your data, guarded by evaluation suites, and priced for production rather than demos.",
    metaDescription:
      "Generative AI and LLM integration by Savo Technologies: RAG systems, copilots, content pipelines and AI features shipped into production, evaluated, observable and cost-aware.",
    overview: [
      "The gap between a generative AI demo and a generative AI feature that earns its place is engineering: retrieval that cites sources, prompts versioned like code, evaluations that catch regressions, and inference bills that stay explicable. That gap is where we work.",
      "We integrate language models into real products, copilots beside your users' workflows, knowledge systems over your documents, content pipelines with human approval gates, on whichever model earns the job, abstracted so the frontier can move without breaking your product.",
    ],
    engagements: [
      { title: "RAG knowledge systems", text: "Retrieval over your documents with sources attached, answers users can verify and trust." },
      { title: "Product copilots", text: "Assistants embedded beside real workflows, acting with permissions and escalating deliberately." },
      { title: "Content pipelines", text: "Drafting, tagging and localization flows with human approval gates and full revision history." },
      { title: "AI search", text: "Natural-language search over structured and unstructured data, ranked for your domain." },
      { title: "Model integration & abstraction", text: "Provider wiring that stays swappable, evaluations decide the model, not the marketing." },
      { title: "Cost & safety engineering", text: "Inference budgets, caching, rate governance and guardrails tuned for production traffic." },
    ],
    process: [
      { name: "Ground", text: "Retrieval and context built over your real data, with permissions scoped correctly." },
      { name: "Guard", text: "Guardrails, approval gates and evaluation suites that measure quality continuously." },
      { name: "Integrate", text: "The model wired into your product surfaces, not a chat box bolted to the side." },
      { name: "Improve", text: "Traces, feedback loops and a tuning cadence that compounds instead of drifting." },
    ],
    stack: ["OpenAI", "Anthropic", "RAG", "Vector search", "Evaluations", "Guardrails"],
    faqs: [
      { q: "Which LLM should we use?", a: "The one that earns it on your tasks. We evaluate options for your workloads and wire the abstraction so models swap as the frontier moves, your product never marries a vendor." },
      { q: "How do you prevent hallucinations?", a: "Grounding first: answers come from your data with sources attached, confidence gates route uncertainty to humans, and evaluation suites catch regressions before users do. No system is perfect; this one is accountable." },
      { q: "What does inference cost to run?", a: "It is engineered, not discovered: caching, model tiering and prompt budgets keep costs explicable. We report inference spend as a product metric from the first release." },
      { q: "Can you add AI to an existing product?", a: "Yes, most of our work lands inside existing products. The integration layer respects your architecture instead of demanding a rewrite." },
    ],
  },
  {
    slug: "consulting",
    title: "AI Consulting & Strategy",
    short: "AI Strategy",
    tagline: "An AI strategy that survives contact with reality",
    heroLead:
      "Where AI actually pays in your business, mapped honestly, sequenced by value, and sized to the organisation that has to run it.",
    metaDescription:
      "AI consulting and strategy by Savo Technologies: opportunity mapping, feasibility assessment, build-vs-buy decisions and roadmaps. Honest advice, no hype, evidence-led.",
    overview: [
      "Most AI strategies fail in the same place: a slide deck full of use cases nobody can run. A real strategy starts from your workflows and data, separates the automatable from the aspirational, and sequences work by value delivered versus effort required.",
      "We consult the way we build, honestly. If an off-the-shelf tool beats a custom build, we say so. If the data isn't ready, that is the first project. And every recommendation arrives with an estimated cost of ownership, not just a vision.",
    ],
    engagements: [
      { title: "Opportunity mapping", text: "Your workflows inventoried and scored, where AI pays, where it merely impresses." },
      { title: "Feasibility & data readiness", text: "An honest audit of data, integrations and skills, the real prerequisites, gap by gap." },
      { title: "Build vs buy decisions", text: "Vendor-neutral analysis with total cost of ownership, not license-price theater." },
      { title: "AI roadmap", text: "A sequenced plan with measurable checkpoints, pilot, prove, then scale what works." },
      { title: "Governance & policy", text: "Usage policies, review boards and risk frameworks your organisation can actually operate." },
      { title: "Team enablement", text: "Coaching and pairing that leaves your team able to run the AI practice without us." },
    ],
    process: [
      { name: "Discover", text: "Workshops and interviews across the business, where the hours and the margin leak." },
      { name: "Assess", text: "Data, systems and skills audited against what each opportunity actually needs." },
      { name: "Sequence", text: "A roadmap cut by value and effort, with a first win chosen for its proof value." },
      { name: "Accompany", text: "We stay through the first builds, steering, reviewing and transferring the capability." },
    ],
    stack: ["Discovery workshops", "Feasibility audits", "Roadmapping", "Governance", "Enablement"],
    faqs: [
      { q: "Do you only recommend building with you?", a: "No. Roughly a third of our recommendations are buy-or-configure, and we say so in writing. A strategy that always ends in custom development is a sales deck, not a strategy." },
      { q: "How long does an AI strategy engagement take?", a: "A focused assessment runs a few weeks; deeper programmes with governance and enablement run a quarter. You get a written roadmap either way, never a workshop that ends in applause." },
      { q: "Can you work with our existing AI team?", a: "Yes, we embed as senior sparring partners: reviewing architecture, raising standards and leaving the team stronger, not dependent." },
      { q: "What if AI isn't right for us yet?", a: "Then you will hear that, with the reasons and what to fix first, usually data foundations. Honest noes are part of the service." },
    ],
  },
  {
    slug: "machine-learning",
    title: "Machine Learning & Analytics",
    short: "ML",
    tagline: "Models that earn their keep in production",
    heroLead:
      "Forecasting, recommendation and anomaly systems, trained on your data, monitored in production, and retired honestly when they stop paying.",
    metaDescription:
      "Machine learning and analytics engineering by Savo Technologies: forecasting, recommendation engines, anomaly detection and MLOps. Models monitored, evaluated and maintained in production.",
    overview: [
      "A model is a promise that decays. Without monitoring, retraining and honest evaluation, last quarter's accurate forecast becomes this quarter's confident mistake. Production ML is a maintenance discipline as much as a modelling one.",
      "We build the whole loop: pipelines that feed models reliably, training that is versioned and reproducible, deployment that is boring, and monitoring that tells you when the world has moved. Forecasting, recommendation, anomaly detection, the same standard applies.",
    ],
    engagements: [
      { title: "Forecasting systems", text: "Demand, revenue and capacity forecasts with confidence bounds and tracked accuracy." },
      { title: "Recommendation engines", text: "Ranking tuned to your metrics, relevance that serves the business, not just the benchmark." },
      { title: "Anomaly detection", text: "Fraud, outage and drift signals with alerting that respects an operator's attention." },
      { title: "Churn & LTV models", text: "Customer models wired into CRM actions, not parked in a dashboard." },
      { title: "MLOps", text: "Deployment, drift monitoring and retraining loops so models stay honest after launch." },
      { title: "Feature engineering", text: "Pipelines and stores that turn raw operational data into model-ready signal, versioned like code." },
    ],
    process: [
      { name: "Frame", text: "The decision the model serves, the metric that proves it, and the baseline it must beat." },
      { name: "Build", text: "Pipelines and training with versioned data and reproducible runs, no notebook archaeology." },
      { name: "Deploy", text: "Models shipped behind monitoring, with rollback as easy as any other release." },
      { name: "Maintain", text: "Drift alerts, scheduled retraining and honest retirement when a model stops paying." },
    ],
    stack: ["Python", "PyTorch", "scikit-learn", "Airflow", "MLflow", "Feast"],
    faqs: [
      { q: "Do we need a data science team first?", a: "No, we build the first systems and can operate them with you. Over time we document and transfer, so your team inherits capability instead of a black box." },
      { q: "How do you know a model is working?", a: "Every model ships with a baseline, a target metric and live monitoring. If it stops beating the baseline, you will know before the board does." },
      { q: "Can you take over an existing model?", a: "Yes, we audit training, data and monitoring first, stabilise what works, and rebuild only what is actually broken." },
      { q: "What about our data privacy?", a: "Data stays in your infrastructure with scoped access, and models are trained where your governance allows. Nothing about your data needs to leave your cloud." },
    ],
  },
  {
    slug: "automation",
    title: "Business Automation",
    short: "Automation",
    tagline: "Automate the work between the work",
    heroLead:
      "Workflow automation, no-code and low-code platforms, and AI-powered processes: we connect the applications, data, APIs and AI systems your business already runs into workflows that execute repetitive operational work automatically. Use no-code where it is sufficient, custom engineering where it is necessary, and both when that makes the best system.",
    metaDescription:
      "Business automation by Savo Technologies: no-code and low-code automation, workflow automation, business process automation and AI-powered workflows on n8n, Make, Zapier and Power Automate, connected to your CRM, ERP, documents and approvals with human oversight where it matters.",
    overview: [
      "Between every pair of systems in your company sits work nobody was hired to do: re-keying invoices, chasing approvals, updating the CRM after the call, assembling the report from four tabs. Business automation is the engineering discipline that removes that work. It connects rules, data, applications, AI and human approvals into workflows that actually execute, not chatbots that talk about executing.",
      "Not every automation needs custom software, and not every automation needs AI. Rule-based workflows connect the tools you already run; AI-powered workflows add understanding, extraction, classification and decision support where judgment is required. We are an automation engineering partner, not an n8n agency: no-code where it is sufficient, custom APIs, integrations, databases and AI components where they are necessary, combined when that creates the best system.",
    ],
    engagements: [
      { title: "Document processing", text: "Invoices, contracts, KYC and claims read, validated and posted into your systems, exceptions routed for review." },
      { title: "Sales & CRM workflows", text: "Enrichment, follow-ups, pipeline updates and handoffs executed from real signals, not reminders." },
      { title: "Finance & reporting", text: "Reconciliation, month-end packs and recurring reports assembled from source systems, checked and delivered." },
      { title: "Onboarding & offboarding", text: "Customers or employees moved through every system, account, notification and approval in one tracked flow." },
      { title: "Back-office operations", text: "Data entry, catalog updates, order processing and internal approvals, the quiet work, automated." },
      { title: "Integration fabric", text: "API-driven connections between your existing tools, so automation reads and writes where the work already lives." },
    ],
    process: [
      { name: "Map", text: "The process walked end to end, every system, handoff and wait state documented with the people who run it." },
      { name: "Bound", text: "Decisions the machine may make defined explicitly, with thresholds, confidence gates and the human approval points." },
      { name: "Connect", text: "The workflow wired into your existing systems through their APIs. Nothing gets replaced, everything gets connected." },
      { name: "Run", text: "Live with full audit trails, monitoring on every step, and a tuning cadence that widens automation as trust earns." },
    ],
    stack: ["n8n", "Make", "Zapier", "Power Automate", "Webhooks & REST APIs", "PostgreSQL", "Supabase", "OpenAI", "Anthropic", "Gemini", "Google Workspace", "Microsoft 365", "Slack", "CRM & ERP connectors"],
    faqs: [
      { q: "Do we have to replace our current systems?", a: "No. The automation layer connects through the APIs of the tools you already run, your CRM, ERP, mail, documents and internal apps. We integrate what works instead of demanding a migration." },
      { q: "Do we need AI for automation to be worth it?", a: "No. Plenty of valuable automation is pure workflow: rule-based connections between the apps you already use, moving data, triggering actions and keeping records in sync. AI earns its place only where a step needs understanding or judgment, and we will say so honestly when it does not." },
      { q: "What is the difference between workflow automation and AI-powered automation?", a: "Workflow automation is rule-based: when this happens, do that, across your existing applications. AI-powered automation adds intelligent steps: classifying an email, extracting invoice fields, drafting a reply, deciding whether an exception needs a human. Most systems we ship combine both, with AI only where rules run out." },
      { q: "Do you only work with n8n?", a: "No. n8n is one important tool in our stack, alongside Make, Zapier, Microsoft Power Automate and custom code. We are technology-agnostic: the platform is chosen for your systems, team and governance needs, not our preferences." },
      { q: "What happens when the AI is unsure?", a: "It stops and asks. Every decision has explicit bounds and confidence thresholds; anything outside them routes to a human with the full context attached. The machine handles the routine, people handle judgment." },
      { q: "What if we outgrow no-code?", a: "That is exactly why an engineering company runs this practice. When a workflow hits the limits of a no-code platform, we extend it with custom APIs, integrations, databases or AI components, so the system grows instead of getting rebuilt." },
      { q: "Which processes should we automate first?", a: "High volume, rule-shaped and currently eating someone's week: document intake, follow-ups, reconciliation, onboarding. We map your workflows and sequence by value delivered against effort, quick wins fund the deeper builds." },
      { q: "Is it auditable and secure?", a: "Every step is logged: what was read, what was decided, on what basis, who approved what. Access follows your existing permissions, data stays in your infrastructure, and the trail answers any auditor's question." },
    ],
  },
];

export function aiService(slug: string): AiService | undefined {
  return AI_SERVICES.find((s) => s.slug === slug);
}
