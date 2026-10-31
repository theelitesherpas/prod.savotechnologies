/**
 * Industry detail content - drives /industries/[slug]/.
 *
 * One chapter per sector from INDUSTRIES_ATLAS. Copy is capability copy:
 * SEO-aware (sector + "development"/"software"/"platform" phrasing) but
 * strictly honest - no invented clients, metrics, certifications or
 * results (PRODUCT.md hard rule). Regulation names appear only as
 * constraints the engineering respects.
 */

import type { Industry } from "./industries";

export type IndustryDetail = {
  /** Matches an INDUSTRIES_ATLAS entry. */
  id: Industry["id"];
  title: string;
  /** Hero statement (serif). */
  tagline: string;
  /** Hero lead paragraph. */
  heroLead: string;
  /** SEO meta description (~155 chars). */
  metaDescription: string;
  /** Landscape section - two paragraphs. */
  overview: [string, string];
  /** Hero image caption. */
  imageCaption: string;
  /** Detail image caption. */
  detailCaption: string;
  /** Engagement markers - short honest statements for the detail rail. */
  markers: string[];
  /** What we build - six cells. */
  solutions: { title: string; text: string }[];
  /** Vector plate - the flow we engineer. */
  flow: {
    heading: string;
    intro: string;
    nodes: { label: string; note: string }[];
  };
  faqs: { q: string; a: string }[];
  relatedIndustries: Industry["id"][];
  relatedServices: string[];

  /* ── Part 54 standard (optional until populated per industry) ──── */
  /** The sector's real challenges (not generic pain). */
  challenges?: { title: string; text: string }[];
  /** Operational workflows the sector actually runs (Part 55 depth). */
  operations?: { title: string; items: string[] }[];
  /** Technology this sector's systems are built on. */
  technology?: string[];
  /** Systems these platforms integrate with. */
  integrations?: string[];
  /** Sector-specific security considerations. */
  security?: string;
  /** Where AI genuinely applies in this sector. */
  aiOpportunities?: { title: string; text: string }[];
  /** Proof/reading cross-links. */
  relatedWork?: { label: string; href: string }[];
};

export const INDUSTRY_DETAILS: IndustryDetail[] = [
  {
    id: "healthcare",
    title: "Healthcare",
    tagline: "Healthcare software, engineered for trust.",
    heroLead:
      "Patient portals, telehealth platforms and clinical support tools, built where privacy, reliability and clear audit trails are the baseline, not the afterthought.",
    metaDescription:
      "Healthcare software development by Savo Technologies: patient portals, telehealth, records integration and privacy-first clinical tools. Regulation-aware engineering, one team end to end.",
    overview: [
      "Healthcare products carry a weight most software never touches: a dropped session is a missed consultation, a unclear record is a clinical risk, a privacy lapse is a legal event. The sector runs on interoperability standards, layered access rules and consent, and every workflow assumes the system will still be there tomorrow.",
      "We build for that reality. Savo engineers healthcare platforms the way clinical staff use them: task-focused, audit-ready and calm under load. Design work removes friction for patients who are often anxious, hurried or on a small screen in a waiting room. Security and privacy shape the architecture from the first schema, and every release is regression-tested before it touches anything that resembles production care.",
    ],
    imageCaption: "Clinical work runs on trust, software should too.",
    detailCaption: "Modern care is distributed. The platform has to hold.",
    markers: [
      "Privacy-first architecture",
      "Audit trails on every critical action",
      "Role-based access as a foundation",
      "Tested releases, rollback-ready",
    ],
    solutions: [
      { title: "Patient portals", text: "Appointment booking, results, messaging and consent, self-service that reduces call volume and no-shows." },
      { title: "Telehealth platforms", text: "Video consultation workflows built for low bandwidth, clear triage and follow-up that actually closes the loop." },
      { title: "Records integration", text: "HL7/FHIR-style interfaces and API layers that connect your product to the systems clinicians already use." },
      { title: "Clinical support tools", text: "Dashboards and decision-support surfaces that summarise, flag and document, without replacing clinical judgement." },
      { title: "Practice operations", text: "Scheduling, billing, rostering and inventory built around how clinics and departments actually run." },
      { title: "Assisted-living & wellness", text: "Medication reminders, monitoring dashboards and family-facing apps for continuous care outside the ward." },
    ],
    flow: {
      heading: "The patient flow we engineer",
      intro:
        "From first contact to closed episode, every stage instrumented, access-controlled and documented.",
      nodes: [
        { label: "Patient entry", note: "portal · app · referral" },
        { label: "Triage & consent", note: "intake forms · rules" },
        { label: "Consultation", note: "video · in-person" },
        { label: "Records & results", note: "integration · audit" },
        { label: "Follow-up", note: "reminders · closure" },
      ],
    },
    challenges: [
      { title: "Privacy is the architecture", text: "Patient data carries legal weight everywhere. Consent, role-based access and audit trails are structural decisions, not compliance checkboxes added before launch." },
      { title: "Interoperability or isolation", text: "Records live in standards-bound systems. Software that can't speak the sector's formats becomes another silo clinicians resent." },
      { title: "Reliability is clinical", text: "A portal down during telehealth hours is a cancelled consultation. These systems are judged at their worst moment, not their average one." },
      { title: "Users under stress", text: "Patients use these products while anxious, unwell or hurrying a parent through a form. Clarity is a safety feature." },
    ],
    operations: [
      {
        title: "Patient-facing workflows",
        items: ["Appointment booking with queues, slots and reminders", "Telehealth sessions with waiting rooms and follow-ups", "Records and reports access with consent boundaries", "Prescription refills and medication schedules", "Bills, claims and payment history in one place"],
      },
      {
        title: "Clinical & staff workflows",
        items: ["Referral and triage routing between departments", "Care plans with tasks, milestones and handovers", "Documentation templates that fit, not fight, the chart", "Role-scoped dashboards for doctors, nurses and admin", "Shift and roster management for care teams"],
      },
      {
        title: "Data & compliance workflows",
        items: ["Consent capture, tracking and withdrawal end to end", "Audit trails on every record access and change", "Data retention and deletion per jurisdiction rules", "Interoperability through sector standards (HL7/FHIR where required)", "Backup and restore rehearsed against clinical downtime"],
      },
      {
        title: "Operations intelligence",
        items: ["No-show and utilisation analytics", "Patient satisfaction and outcome tracking", "Automated recall and preventive-care outreach", "Anonymised reporting for management and regulators"],
      },
    ],
    technology: ["Next.js patient surfaces", "Node.js services", "PostgreSQL with strict access models", "Video/telehealth integration", "HL7/FHIR interfaces where required", "Encrypted storage and audit logging"],
    integrations: ["EHR/EMR systems", "Lab information systems", "Payment gateways", "Messaging (SMS/email/WhatsApp)", "Calendar and scheduling", "Identity verification"],
    security:
      "Healthcare security is baseline, not feature: encryption at rest and in transit, role-based access at record level, complete audit trails, consent enforcement in the API layer, and retention handling built into the schema.",
    aiOpportunities: [
      { title: "Triage support", text: "Structured intake that gathers symptoms accurately and routes urgency correctly, with clinicians making every judgment call." },
      { title: "Records summarisation", text: "Clinician-facing digests of long histories, grounded strictly in the record, citing sources, saving reading time without replacing judgment." },
      { title: "Operations automation", text: "Recall scheduling, claims paperwork and report routing handled automatically, with humans reviewing exceptions." },
    ],
    relatedWork: [
      { label: "Trust & security", href: "/trust" },
      { label: "Custom software", href: "/services/custom-software-development" },
      { label: "Reading: AI agents in production", href: "/insights/ai-agents-in-production" },
    ],
    faqs: [
    {
      q: "How much does healthcare software development cost?",
      a: "Cost is driven by compliance depth, integrations with records systems, and the roles that need access. A focused patient-facing module is a different budget from a full telehealth platform; discovery prices the honest scope before commitment.",
    },
    {
      q: "How long does it take to build a telehealth or patient portal platform?",
      a: "A first usable patient journey typically ships in a few months, with clinical workflows and integrations following in stages. Privacy, consent and audit requirements are designed in from the first schema, not retrofitted.",
    },
    {
      q: "Can you integrate with EHR/EMR systems and HL7 or FHIR standards?",
      a: "Yes. Interoperability is a first-class deliverable: we build interface layers to existing records, scheduling and lab systems using the sector's standards, so the new platform strengthens the ecosystem instead of adding a silo.",
    },
      { q: "Do you build HIPAA-compliant healthcare software?", a: "We engineer to compliance requirements like HIPAA as architectural constraints, encryption, access control, audit trails and data minimisation are designed in from the start. Final compliance sign-off for your jurisdiction is owned jointly with your compliance officer, and we support the audit process with full documentation." },
      { q: "Can you integrate with our existing hospital or clinic systems?", a: "Yes. Interoperability is a first-class deliverable: we build API layers and interface with existing records, scheduling and billing systems rather than asking a clinic to replace what already works." },
      { q: "How do you handle patient data security?", a: "Least-privilege access, encryption in transit and at rest, segregated environments, and audit logging on every critical action. Security review is part of each release cycle, not a separate phase bolted on at the end." },
      { q: "Do you build telehealth for low-bandwidth regions?", a: "We optimise video workflows for constrained networks with adaptive quality, graceful degradation to audio and resumable sessions, because reliable care cannot depend on perfect infrastructure." },
    ],
    relatedIndustries: ["education", "government"],
    relatedServices: ["custom-software-development", "ai-agent-development", "web-development"],
  },
  {
    id: "fintech",
    title: "FinTech & Banking",
    tagline: "Finance software, built to reconcile.",
    heroLead:
      "Payment platforms, lending systems and banking tools where every number must balance, every action must trace, and downtime is measured in money.",
    metaDescription:
      "Fintech software development by Savo Technologies: payment platforms, digital wallets, lending systems and KYC workflows. Reconciliation-grade engineering with full auditability.",
    overview: [
      "Financial software is judged by a different bar. Reconciliation must be exact to the last sub-unit, idempotency is a design requirement not a nicety, and regulators can ask any transaction to tell its full story. On top of that, customers now expect banking-grade experiences to feel as effortless as the best consumer apps.",
      "Savo builds for both bars at once. Ledgers are modelled deliberately, money operations are idempotent and observable, and KYC/AML workflows are treated as product surfaces users can actually complete. From payment rails to portfolio dashboards, the engineering is traceable end to end, because in finance, the audit is the product working correctly.",
    ],
    imageCaption: "Markets move in milliseconds. The ledger must not.",
    detailCaption: "Every transaction tells a story, the system must remember it.",
    markers: [
      "Idempotent money operations",
      "Ledger-first data modelling",
      "Traceable KYC/AML workflows",
      "Uptime treated as budget",
    ],
    solutions: [
      { title: "Payment platforms", text: "Checkout, transfers and recurring billing with reconciliation built into the core, not reconciled after the fact." },
      { title: "Digital wallets", text: "Multi-currency wallet systems with clear transaction histories, limits and dispute flows." },
      { title: "Lending platforms", text: "Application, underwriting support, disbursement and repayment journeys that a compliance officer can follow end to end." },
      { title: "KYC & onboarding", text: "Document verification workflows, risk flags and audit records, designed so completion rates climb while fraud surface shrinks." },
      { title: "Wealth & portfolio tools", text: "Dashboards for holdings, performance and reporting that make complex data legible at a glance." },
      { title: "Banking integrations", text: "API layers over banking partners, card networks and payment rails, with sandboxed testing before anything moves." },
    ],
    flow: {
      heading: "The money flow we engineer",
      intro:
        "Initiation to settlement, every hop idempotent, signed and replay-safe.",
      nodes: [
        { label: "Initiation", note: "checkout · transfer" },
        { label: "Verification", note: "KYC · risk rules" },
        { label: "Authorisation", note: "rails · limits" },
        { label: "Settlement", note: "ledger entry" },
        { label: "Reconciliation", note: "match · report" },
      ],
    },
    challenges: [
      { title: "Money has no rollback button", text: "In payments and ledgers, a bad write is a reconciliation incident at best. Idempotency, transactional integrity and double-entry thinking are the floor, not the ceiling." },
      { title: "Regulation shapes the schema", text: "KYC, AML and jurisdiction rules decide what data exists, how long it lives and who may see it. Retrofitting compliance is the most expensive rewrite there is." },
      { title: "Trust is the product", text: "Users hand over money and identity in one session. Any moment of doubt, a broken flow, an unexplained fee, an insecure-looking screen, ends the relationship." },
      { title: "Partners and rails", text: "Banks, gateways and card networks each bring their own failures, latencies and webhooks. The system must be correct when they aren't." },
    ],
    operations: [
      { title: "Onboarding & identity", items: ["KYC/KYB flows with document capture and verification", "Risk scoring and manual review queues", "Account opening with funding and activation", "Ongoing monitoring and periodic re-verification"] },
      { title: "Payments & ledgering", items: ["Payment initiation, capture and settlement tracking", "Double-entry ledgers with immutable journal history", "Refunds, reversals and dispute handling", "Reconciliation against bank and gateway statements"] },
      { title: "Money movement controls", items: ["Approval matrices for payouts and treasury ops", "Limits, velocity rules and freeze/hold workflows", "Audit trails on every privileged action", "Regulatory reporting extracts"] },
      { title: "Customer operations", items: ["Account dashboards with balances and statements", "Transaction history with dispute initiation", "Notifications for every material event", "Support tooling with scoped data visibility"] },
    ],
    technology: ["TypeScript end to end", "Node.js services", "PostgreSQL with strict transactional discipline", "Event queues for money movement", "Idempotent API design", "Encrypted storage and secrets management"],
    integrations: ["Payment gateways", "Banking APIs / open banking", "KYC/AML providers", "Card networks", "Messaging & notifications", "Accounting systems"],
    security: "Financial-grade by construction: least-privilege access, encryption everywhere, immutable audit logs, idempotent writes, segregated environments and no production data in test systems, ever.",
    aiOpportunities: [
      { title: "Fraud & anomaly detection", text: "Transaction streams scored for patterns rules miss, with human review on the flagged tail." },
      { title: "Document intelligence", text: "KYC documents read, validated and extracted automatically, exceptions routed to officers." },
      { title: "Support automation", text: "Grounded agents answering balance, status and process questions, escalating anything touching money decisions." },
    ],
    relatedWork: [
      { label: "Trust & security", href: "/trust" },
      { label: "Custom software", href: "/services/custom-software-development" },
      { label: "Enterprise", href: "/enterprise" },
    ],
    faqs: [
    {
      q: "How much does fintech app development cost?",
      a: "Financial products are priced by their rails: payment integrations, ledger correctness, KYC flows and compliance depth are the real scope drivers. We quote fixed milestones after discovery, with the riskiest pieces built and proven first.",
    },
    {
      q: "How long does it take to build a fintech product?",
      a: "A compliant MVP with one payment path and KYC typically takes a few months; full platforms with multiple rails and markets take longer and ship in stages. Reconciliation and audit trails are part of the first release, not a later phase.",
    },
    {
      q: "How do you handle PCI compliance and payment security?",
      a: "We keep card data out of your systems entirely by integrating certified payment providers, so PCI scope stays minimal. What remains in scope, access control, audit logging and idempotent money handling, is engineered to standard from day one.",
    },
      { q: "Can you build PCI-DSS-aware payment flows?", a: "Yes, we design card-data flows so sensitive data is tokenised and scope is minimised from the first architecture decision. Where certified third-party processors handle card storage, we integrate and harden the surrounding workflows." },
      { q: "How do you ensure financial calculations are exact?", a: "Decimal-first arithmetic, ledger-style double-entry modelling and idempotent operations tested with replay scenarios. Money bugs are treated as security-class defects." },
      { q: "Do you integrate with existing core banking systems?", a: "We build integration layers over core banking APIs, card networks and payment processors, with sandboxed environments and contract tests so partner changes surface before they break production." },
      { q: "Can you help us pass a technical audit?", a: "Auditability is designed in: immutable logs, documented data flows, access histories and environment segregation. We support your audit with the technical evidence it needs." },
    ],
    relatedIndustries: ["ecommerce", "government"],
    relatedServices: ["custom-software-development", "mobile-app-development", "qa-testing"],
  },
  {
    id: "ecommerce",
    title: "Ecommerce & Retail",
    tagline: "Commerce platforms that convert.",
    heroLead:
      "Headless storefronts, product platforms and omnichannel operations, engineered for speed, search visibility and a checkout that never gets in the way.",
    metaDescription:
      "Ecommerce development by Savo Technologies: headless storefronts, product platforms, checkout optimisation and inventory sync. Fast, searchable storefronts built to convert.",
    overview: [
      "Every hundred milliseconds of load time and every awkward step of checkout shows up directly in revenue. Ecommerce succeeds when catalogue, search, cart, payment and fulfilment behave like one system, and fails when they behave like five tools taped together. Add marketplaces, promotions and multi-location inventory and the complexity compounds quietly.",
      "We build storefronts and the operational platform behind them as one product. Frontends ship as fast, accessible, search-optimised experiences; backends handle catalogue scale, inventory truth and order orchestration without drama. Analytics is wired in from day one, so merchandising and marketing decisions run on evidence instead of instinct.",
    ],
    imageCaption: "The storefront is the easy part. The system behind it is the product.",
    detailCaption: "Catalogue to doorstep, one pipeline, measured end to end.",
    markers: [
      "Performance budgets on every page",
      "SEO/AEO built into the structure",
      "Inventory as a single source of truth",
      "Checkout instrumented for conversion",
    ],
    solutions: [
      { title: "Headless storefronts", text: "Next.js commerce frontends, fast, themeable and indexed by search and AI answer engines alike." },
      { title: "Product platforms", text: "Catalogue management, variants, media and merchandising rules that scale past ten thousand SKUs without slowing editors down." },
      { title: "Checkout & payments", text: "Streamlined single-page flows, wallets, and abandoned-cart recovery, instrumented so every drop-off is visible." },
      { title: "Inventory & order sync", text: "Multi-location stock, reservations and order routing that keep the promise the storefront makes." },
      { title: "Marketplaces", text: "Multi-vendor catalogues, commission rules and seller portals for owned marketplace plays." },
      { title: "Retail operations", text: "POS integration, fulfilment workflows and returns handling that connect the shop floor to the platform." },
    ],
    flow: {
      heading: "The purchase flow we engineer",
      intro:
        "Discovery to repeat purchase, each stage measured, each handoff owned.",
      nodes: [
        { label: "Discovery", note: "search · SEO · AEO" },
        { label: "Product", note: "catalogue · media" },
        { label: "Cart", note: "pricing · promos" },
        { label: "Checkout", note: "payments · trust" },
        { label: "Fulfilment", note: "sync · returns" },
      ],
    },
    challenges: [
      { title: "Conversion is engineered", text: "Every 100ms of latency and every extra checkout field has a measurable cost. Commerce platforms win in the boring details: caching, facets, and the shortest honest path to pay." },
      { title: "Operations in the loop", text: "Inventory, fulfilment, returns and support are the product too. A storefront that ignores the warehouse just moves the queue." },
      { title: "Peak or die", text: "Sale days decide the year. Architecture that wobbles at 5x traffic taxifies marketing spend." },
      { title: "Data everywhere", text: "Products, prices and stock live in ERP, PIM, marketplaces and the store. One truth, many surfaces, constant sync." },
    ],
    operations: [
      { title: "Storefront & discovery", items: ["Catalogue with faceted search and merchandising overrides", "Media pipelines for rich, fast product pages", "Promotions, bundles and pricing rules", "Saved carts, wishlists and back-in-stock alerts"] },
      { title: "Checkout & payments", items: ["Guest and account checkout with minimal friction", "Payment methods per market, including wallets and COD", "Tax, shipping and duty calculation", "Order confirmation and failure recovery"] },
      { title: "Post-purchase operations", items: ["Order routing to fulfilment and logistics partners", "Returns and exchange workflows", "Invoices, credit notes and accounting sync", "Support views with full order context"] },
      { title: "Commerce intelligence", items: ["Funnel analytics: view to cart to purchase", "Cohort and repeat-purchase reporting", "Inventory forecasting signals", "Marketplace and ad-channel performance in one view"] },
    ],
    technology: ["Next.js commerce frontends", "Headless architecture", "PostgreSQL catalogue and order models", "Search with merchandising control", "Edge caching", "Node.js services"],
    integrations: ["Payment gateways", "ERP & inventory systems", "Marketplace APIs", "Shipping & logistics", "Email/SMS marketing", "Analytics & tag managers"],
    security: "PCI scope kept minimal by using certified payment providers, no card data touching our servers, strict access control on customer records, and fraud screening at the order edge.",
    aiOpportunities: [
      { title: "Search & discovery", text: "Natural-language search and recommendations tuned to conversion, evaluated against revenue, not clicks." },
      { title: "Content at scale", text: "Product descriptions enriched and translated automatically, with human review gates before publish." },
      { title: "Support containment", text: "Agents answering order-status and returns questions from live data, handing anything sensitive to humans." },
    ],
    relatedWork: [
      { label: "Case study dossier", href: "/case-studies" },
      { label: "Web development", href: "/services/web-development" },
      { label: "Digital marketing", href: "/services/digital-marketing" },
    ],
    faqs: [
    {
      q: "How much does ecommerce website development cost?",
      a: "A storefront on a configured platform and a custom commerce platform are different budgets. We scope by catalogue size, integrations and checkout complexity, and quote fixed milestones so spend attaches to working revenue paths.",
    },
    {
      q: "Shopify or a custom ecommerce platform: which should we choose?",
      a: "If standard catalogue-and-checkout covers your model, a configured platform wins on speed and cost. When pricing rules, subscriptions, marketplace behaviour or deep integrations are your edge, custom pays back. We assess honestly and say which one fits.",
    },
    {
      q: "How long does it take to launch an online store?",
      a: "A focused storefront can launch in weeks; headless builds with ERP sync and custom checkout take months and ship in stages. Peak-season readiness is planned as a milestone, not discovered in November.",
    },
      { q: "Headless commerce or a platform like Shopify?", a: "Both are legitimate. We recommend headless when differentiation, speed or complex catalogues matter, and platform-plus-integration when speed-to-market wins. The decision starts from your catalogue size, team and roadmap, not from our preference." },
      { q: "How do you improve conversion rate?", a: "By instrumenting the full funnel first, then removing friction where the data points, page speed, checkout steps, trust signals and mobile ergonomics. Optimisation is continuous and evidence-led." },
      { q: "Can you migrate our store without losing SEO rankings?", a: "Yes, migrations preserve URL structures or ship deliberate redirect maps, keep structured data intact, and stage cutover with parity checks so search equity carries over." },
      { q: "Do you build multi-vendor marketplaces?", a: "We build marketplace platforms with vendor onboarding, commission engines, catalogue aggregation and seller operations, sized from focused B2B marketplaces to consumer plays." },
    ],
    relatedIndustries: ["logistics", "travel"],
    relatedServices: ["web-development", "digital-marketing", "product-engineering"],
  },
  {
    id: "logistics",
    title: "Logistics & Supply Chain",
    tagline: "Logistics software that sees the whole move.",
    heroLead:
      "Fleet platforms, freight systems and warehouse operations, turning physical movement into live data you can route, predict and act on.",
    metaDescription:
      "Logistics software development by Savo Technologies: fleet tracking, route optimisation, warehouse systems and carrier integrations. Real-time visibility from first mile to last.",
    overview: [
      "Logistics is a real-time system that happens to involve trucks. Customers expect a live answer to “where is it”, dispatchers need exceptions surfaced before they become failures, and margin hides in the difference between a good route and a great one. Meanwhile the data lives everywhere (ERPs, telematics, WMS, carrier APIs) and nowhere at once.",
      "Savo builds the connective tissue and the surfaces on top: live tracking, route and load planning, warehouse workflows and exception dashboards that fold many systems into one operating picture. Real-time pipelines keep the map honest, and operational tools are designed for the person under pressure, dispatchers, warehouse leads and drivers on a mount in a cab.",
    ],
    imageCaption: "The port never sleeps. The software can't either.",
    detailCaption: "Visibility is the product, everything else follows it.",
    markers: [
      "Real-time event pipelines",
      "Exception-first operations design",
      "Integration over rip-and-replace",
      "Interfaces built for gloves, glare and haste",
    ],
    solutions: [
      { title: "Fleet tracking", text: "Live vehicle visibility with geofencing, ETA computation and alerting that finds problems before customers do." },
      { title: "Route optimisation", text: "Multi-stop planning that respects time windows, vehicle constraints and driver hours, and recomputes when the day changes." },
      { title: "Warehouse systems", text: "Inbound, putaway, picking and packing workflows on scanners and touch screens, designed for the pace of a real floor." },
      { title: "Order management", text: "Order orchestration across channels with status truth shared by customers, dispatch and finance." },
      { title: "Carrier integrations", text: "Booking, tracking and document flows over carrier and freight-partner APIs, normalised into one interface." },
      { title: "Control-tower dashboards", text: "The single pane where exceptions, SLAs and live flow state resolve into decisions." },
    ],
    flow: {
      heading: "The shipment flow we engineer",
      intro:
        "Order to proof of delivery, tracked at every hop, exception-flagged throughout.",
      nodes: [
        { label: "Order in", note: "OMS · ERP sync" },
        { label: "Plan", note: "route · load" },
        { label: "Execute", note: "track · telematics" },
        { label: "Exceptions", note: "alerts · replan" },
        { label: "Delivered", note: "POD · invoice" },
      ],
    },
    challenges: [
      { title: "The field is offline", text: "Drivers, warehouses and checkpoints sit on the network's edge. Software that assumes connectivity fails exactly when the goods are moving." },
      { title: "State is physical", text: "A shipment is a physical object with a digital shadow. When they disagree, someone's inventory, invoice or customer is wrong." },
      { title: "Everyone needs a different view", text: "Customer, driver, dispatcher, warehouse and accounts each see the same trip differently. One data model, many altitudes." },
      { title: "Proof is the product", text: "PODs, signatures, photos and timestamps are the legal backbone of every delivery and every invoice." },
    ],
    operations: [
      { title: "Dispatch & planning", items: ["Order intake and consolidation", "Route planning with constraints and priorities", "Driver and vehicle assignment", "Exception boards for delays and failures"] },
      { title: "In the field", items: ["Driver apps with offline-first manifests", "Proof of delivery: signature, photo, geotag", "Cash and COD handling where it applies", "Customer notifications with live status"] },
      { title: "Warehouse & hub flows", items: ["Inbound booking and dock scheduling", "Pick, pack and dispatch with scan verification", "Cross-docking and hub transfers", "Inventory accuracy cycles"] },
      { title: "Finance & visibility", items: ["Freight billing and detention/demurrage tracking", "Driver settlements and payout runs", "Customer portals with track-and-trace", "KPI dashboards: OTIF, cost per drop, utilisation"] },
    ],
    technology: ["Flutter driver apps (offline-first)", "Node.js dispatch services", "PostgreSQL with sync discipline", "Map, routing and geofencing services", "Event queues for status streams", "Photo/POD storage pipelines"],
    integrations: ["Transport management systems", "ERP & accounting", "Customer portals and CRMs", "SMS/WhatsApp notifications", "GPS and telematics", "Marketplace and order sources"],
    security: "Location and recipient data are personal data: scoped access per role, encrypted mobile storage, tamper-evident proof records and retention rules that respect both operations and privacy law.",
    aiOpportunities: [
      { title: "Route intelligence", text: "Sequencing and ETAs that learn from real traffic and dwell times, suggested to dispatchers, not forced on them." },
      { title: "Document automation", text: "PODs, waybills and invoices read and matched automatically, exceptions to humans." },
      { title: "Exception triage", text: "Delays and failures classified and escalated with the right context attached, before customers call." },
    ],
    relatedWork: [
      { label: "Reading: Offline-first field apps", href: "/insights/offline-first-field-apps" },
      { label: "Mobile development", href: "/services/mobile-app-development" },
      { label: "Case study dossier", href: "/case-studies" },
    ],
    faqs: [
    {
      q: "How much does logistics software development cost?",
      a: "Scope drivers are the fleet of devices, offline depth and the number of systems to integrate: TMS, ERP, telematics. A first dispatch-and-POD loop is a common fixed-scope start that proves value in the field quickly.",
    },
    {
      q: "How long does it take to build a delivery or fleet management app?",
      a: "A driver app with offline manifests and proof of delivery typically ships in a few months, followed by warehouse and settlement modules in stages. Field conditions are designed for from day one, gloves, glare and dead zones included.",
    },
    {
      q: "Can your logistics apps work offline in remote areas?",
      a: "Yes. Offline-first is our default for field software: manifests, captures and signatures sync when connectivity returns, with conflict rules that keep records trustworthy. We publish our field-app engineering notes on Insights.",
    },
      { q: "Can you build live tracking on top of our existing telematics?", a: "Yes, we integrate telematics, ERP and WMS data into one real-time layer rather than asking you to replace hardware or systems that already work. The tracking surface is only as good as the pipeline under it, so that is where the engineering goes." },
      { q: "How does route optimisation actually help?", a: "It reduces distance and idle time within your real constraints, time windows, vehicle types, driver shifts. The system proposes, dispatchers decide, and every run feeds back into the next plan." },
      { q: "Do your warehouse tools work on scanners and rugged devices?", a: "We build for the floor: large touch targets, offline-tolerant workflows, scanning-first interfaces and layouts that survive gloves, glare and pace. Warehouse software fails when it is designed for offices." },
      { q: "Can you give our customers a tracking portal?", a: "Yes, branded tracking portals and notification flows (email, SMS, WhatsApp) that answer “where is it” before the support call happens." },
    ],
    relatedIndustries: ["ecommerce", "manufacturing"],
    relatedServices: ["custom-software-development", "cloud-devops", "product-engineering"],
  },
  {
    id: "real-estate",
    title: "Real Estate",
    tagline: "Property platforms that close.",
    heroLead:
      "Listing platforms, search and tour experiences, and agent tools, built so discovery feels effortless and every lead is worked, not lost.",
    metaDescription:
      "Real estate software development by Savo Technologies: listing platforms, map search, virtual tours, CRM integration and agent portals. Property discovery built to convert.",
    overview: [
      "Property search is an emotional product wrapped in a data problem. Buyers filter on price and bedrooms but decide on light, street feel and “could I live here”, while the platform juggles fresh inventory, agent workflows, document-heavy transactions and the patience of a market that checks listings hourly.",
      "We build the full loop: fast faceted and map search, rich media and tour scheduling, lead routing that responds in minutes not mornings, and agent portals that make follow-up systematic. Listings stay fresh through sync and verification, and every enquiry lands in a CRM-shaped pipeline instead of an inbox black hole.",
    ],
    imageCaption: "The decision is emotional. The platform still has to be exact.",
    detailCaption: "Inventory moves daily, the platform keeps the promise.",
    markers: [
      "Search that answers in one keystroke",
      "Lead response measured in minutes",
      "Media pipelines that keep listings rich",
      "Agent tools that make follow-up systemic",
    ],
    solutions: [
      { title: "Listing platforms", text: "Fast faceted and map search over fresh inventory, with saved searches and alerts that bring buyers back." },
      { title: "Media & tours", text: "Photo, video, floorplan and virtual-tour pipelines that make every listing feel worth the visit." },
      { title: "Lead routing & CRM", text: "Enquiry capture, scoring and routing that connects the right buyer to the right agent, and logs every touch." },
      { title: "Agent portals", text: "Pipeline views, task queues and performance surfaces that turn follow-up from habit into system." },
      { title: "Developer & project sites", text: "Launch platforms for new projects, inventory, pricing and buyer progress in one place." },
      { title: "Portal integrations", text: "Aggregation sync with major listing portals so inventory reaches every audience without manual double entry." },
    ],
    flow: {
      heading: "The buyer flow we engineer",
      intro:
        "Search to signature, each stage instrumented so no serious lead goes cold.",
      nodes: [
        { label: "Discovery", note: "search · portals" },
        { label: "Shortlist", note: "saves · alerts" },
        { label: "Viewing", note: "tours · scheduling" },
        { label: "Offer", note: "docs · pipeline" },
        { label: "Close", note: "handover · aftercare" },
      ],
    },
    /* ── Part 55 operational depth ───────────────────────────── */
    challenges: [
      { title: "Inventory that lies", text: "A listing shown as available after it sold doesn't just annoy buyers, it burns the brand. Status, price and availability must be correct across the site, the portals and the sales floor at once." },
      { title: "Speed-to-lead is the whole game", text: "Property buyers enquire with five competitors in one sitting. Response inside minutes converts; response next morning hands the deal to whoever answered first." },
      { title: "Documents and money move together", text: "Bookings, payment schedules, agreements and handover carry strict sequences. A missing receipt or a mis-versioned agreement is a legal event, not a UX hiccup." },
      { title: "Channel complexity", text: "Brokers, channel partners, direct sales and portals all feed the same inventory with different economics. Pricing and attribution have to hold across all of them." },
    ],
    operations: [
      {
        title: "Presentation & discovery",
        items: [
          "Project presentation sites for launches: narrative, masterplan, media",
          "Property listings with faceted search, map search and location layers",
          "Unit inventory with availability, pricing and plan variations kept live",
          "Media pipelines: photos, video, floorplans, 360° tours",
          "Saved searches and alerts that bring buyers back on their own schedule",
        ],
      },
      {
        title: "Enquiry to close",
        items: [
          "Enquiry workflows: capture, dedupe, score and acknowledge instantly",
          "CRM integration so context travels with the lead, not in inboxes",
          "Lead routing by territory, project and channel, with escalation timers",
          "Channel partner management: attribution, payouts and performance views",
          "Tour scheduling with reminders that cut no-shows",
        ],
      },
      {
        title: "Buyer progression",
        items: [
          "Payment schedules: milestones, dues, receipts and overdue visibility",
          "Customer portals: booking status, documents, demands and statements",
          "Construction updates: stage-wise progress with dated evidence",
          "Document access: agreements, allotments and handovers, versioned and audited",
          "Post-sale service requests that keep the relationship after the keys",
        ],
      },
      {
        title: "Operation intelligence",
        items: [
          "Analytics: source to site visit to booking, the funnel that matters",
          "Inventory heatmaps: what moves, at what price, in how many days",
          "Automation: portal sync, routine follow-ups, availability updates",
          "Fraud and duplicate lead checks before they pollute the pipeline",
        ],
      },
    ],
    technology: ["Next.js storefronts", "Map & geo services", "Search infrastructure (faceted + geo)", "PostgreSQL with inventory models", "Media pipelines", "Node.js services"],
    integrations: ["Listing portals", "CRMs (native and custom)", "Payment gateways", "Messaging (WhatsApp/SMS/email)", "Document & e-sign", "Telephony/missed-call", "Analytics"],
    security:
      "Buyer data is financial-grade: identity documents, payment records and agreements demand access control per role, encrypted storage, complete audit trails and retention rules that match the jurisdiction.",
    aiOpportunities: [
      { title: "Lead qualification", text: "Enquiries enriched and scored on intent signals, with the first response drafted and routed while the buyer is still warm." },
      { title: "Listing intelligence", text: "Automatic tagging, description drafting and duplicate detection that keep inventory clean as it scales." },
      { title: "Buyer assistant", text: "A grounded agent answering availability, pricing and process questions from live inventory, handing to a human agent for the decision moments." },
    ],
    relatedWork: [
      { label: "Case study dossier", href: "/case-studies" },
      { label: "Web development", href: "/services/web-development" },
      { label: "AI agent development", href: "/services/ai-agent-development" },
    ],
    faqs: [
    {
      q: "How much does a real estate portal cost to build?",
      a: "Portal cost follows inventory size, map and search depth, CRM integrations and the buyer-facing portal features. A launch platform for one project is a different budget from a multi-city marketplace; discovery prices your actual model.",
    },
    {
      q: "How long does real estate website development take?",
      a: "A project presentation site with live inventory ships in weeks; full portals with CRM routing, payment schedules and buyer accounts take months, delivered in stages. Speed-to-lead features come first because they pay back first.",
    },
    {
      q: "Can you integrate the portal with our CRM and listing platforms?",
      a: "Yes: enquiries land in your CRM with full context, and inventory syncs two-way with the listing portals you sell through. One edit updates every surface, so availability never lies.",
    },
      { q: "Can you build a property portal like the major listing sites?", a: "We build listing platforms with the features that matter at your scale, from faceted and map search to fresh inventory, agent tools and portal sync, shaped to your market rather than cloned from a generic portal." },
      { q: "How do virtual tours work in your builds?", a: "We integrate 360° media, video and floorplans into listing pages with scheduling attached, so fascination converts into a booked viewing instead of a bounce." },
      { q: "Do you integrate with CRMs agents already use?", a: "Yes, enquiry flows land in your existing CRM with full context, and where none exists we shape a pipeline that mirrors how your team actually sells." },
      { q: "How do listings stay fresh across portals?", a: "Sync integrations and verification workflows keep status, price and media consistent everywhere inventory appears, one edit, every surface updated." },
    ],
    relatedIndustries: ["travel", "fintech"],
    relatedServices: ["web-development", "digital-marketing", "mobile-app-development"],
  },
  {
    id: "education",
    title: "Education & EdTech",
    tagline: "Learning platforms that hold attention.",
    heroLead:
      "Course systems, assessment platforms and classroom tools, designed for engagement at scale, on any device a learner actually owns.",
    metaDescription:
      "EdTech software development by Savo Technologies: learning platforms, course systems, assessments and progress analytics. Education products built for engagement at scale.",
    overview: [
      "Learning software competes with the entire attention economy. Students arrive on mid-range phones, patchy connections and ten-minute windows; teachers need authoring tools that respect their evenings; institutions need evidence that learning actually happened. Very few products survive all three demands at once.",
      "We build for the weakest connection and the shortest attention span first. Video streams adapt, progress saves itself, and lessons resume exactly where they stopped. Assessment engines handle integrity and instant feedback, and analytics surfaces show teachers where a class is struggling before the exam does. The result feels light to use and is anything but light underneath.",
    ],
    imageCaption: "Ten focused minutes beat an hour of scattered video.",
    detailCaption: "The classroom is wherever the learner is today.",
    markers: [
      "Offline-tolerant learning flows",
      "Adaptive video on real-world bandwidth",
      "Assessment with integrity and instant feedback",
      "Progress analytics for early intervention",
    ],
    solutions: [
      { title: "Learning platforms", text: "Course delivery, enrolment and progress tracking that work on the devices and networks learners actually have." },
      { title: "Assessment systems", text: "Question banks, timed exams, integrity tooling and instant feedback that keeps momentum." },
      { title: "Live & hybrid classes", text: "Scheduling, virtual classrooms and recordings stitched into the same progress record as coursework." },
      { title: "Tutoring marketplaces", text: "Matching, scheduling, payments and session tooling for one-to-one and small-group models." },
      { title: "Institution operations", text: "Admissions, fee workflows and communication surfaces that connect students, parents and staff." },
      { title: "Progress analytics", text: "Dashboards that surface struggle early, per learner, per class, per curriculum objective." },
    ],
    flow: {
      heading: "The learning flow we engineer",
      intro:
        "Enrolment to mastery, progress preserved at every step, intervention flagged early.",
      nodes: [
        { label: "Enrol", note: "onboarding · placement" },
        { label: "Learn", note: "video · practice" },
        { label: "Assess", note: "quizzes · integrity" },
        { label: "Analyse", note: "mastery · gaps" },
        { label: "Certify", note: "credentials · records" },
      ],
    },
    challenges: [
      { title: "Two customers, one product", text: "Students experience the learning; institutions pay for the outcomes. The platform must serve both without shortchanging either." },
      { title: "Engagement is the metric", text: "Completion, not enrolment, is the hard part. Design that loses learners in week two fails regardless of features." },
      { title: "Content is heavy", text: "Video, assessments and materials strain performance and cost. Delivery must scale on a school's budget." },
      { title: "Assessment integrity", text: "Grading carries trust. Fair workflows, verifiable records and anti-cheating measures are the product's spine." },
    ],
    operations: [
      { title: "Learning delivery", items: ["Course structures with cohorts and self-paced paths", "Video, reading and interactive content delivery", "Assignments with deadlines and grading workflows", "Progress tracking visible to learner and mentor"] },
      { title: "Institution operations", items: ["Admissions and enrolment flows", "Batch, term and timetable management", "Faculty roles and workload views", "Certificates and verifiable records"] },
      { title: "Assessment & feedback", items: ["Quizzes and exams with question banks", "Plagiarism and integrity checks", "Rubric-based evaluation", "Result publication and appeals"] },
      { title: "Engagement intelligence", items: ["At-risk learner flags from behaviour signals", "Content effectiveness analytics", "Attendance and participation tracking", "Outcome reporting for institutions"] },
    ],
    technology: ["Next.js learning platforms", "Video streaming and CDN delivery", "PostgreSQL with cohort models", "Node.js services", "Adaptive assessment engines", "Accessibility-first UI"],
    integrations: ["Student information systems", "Payment gateways for fees", "Video platforms", "Identity/SSO for institutions", "Messaging and announcements", "Analytics"],
    security: "Student data, especially minors', demands consent-aware handling, role-scoped visibility for guardians and faculty, and regional education-privacy compliance built into the data model.",
    aiOpportunities: [
      { title: "Adaptive practice", text: "Question difficulty and sequence adjusting to the learner, grounded in proven learning science." },
      { title: "Grading assistance", text: "Objective sections auto-scored, subjective drafts pre-graded with faculty making final calls." },
      { title: "Mentoring support", text: "Grounded assistants answering syllabus and process questions, escalating wellbeing signals to humans immediately." },
    ],
    relatedWork: [
      { label: "Case study dossier", href: "/case-studies" },
      { label: "UI/UX design", href: "/services/ui-ux-design" },
      { label: "Product engineering", href: "/services/product-engineering" },
    ],
    faqs: [
    {
      q: "How much does an LMS or e-learning platform cost?",
      a: "Cost follows the learning model: self-paced content, live cohorts, assessments and certification each add scope, and video delivery shapes infrastructure. We quote a fixed first milestone that proves learning outcomes early.",
    },
    {
      q: "How long does it take to build an e-learning platform?",
      a: "A course delivery MVP typically ships in a few months; institution-grade systems with batches, fees and certifications take longer, in stages. Completion, not enrolment, is the metric we design for.",
    },
    {
      q: "Do you build online examination and proctoring features?",
      a: "Yes: question banks, timed attempts, integrity checks and results with appeals. Assessment workflows are engineered for fairness and auditability, with faculty controlling every judgment call.",
    },
      { q: "Can you build a platform that works on low-end devices?", a: "That is the default assumption. We design for mid-range Android phones and intermittent connectivity with adaptive streaming, local progress caching and resumable sessions, then let better hardware enjoy the same flow faster." },
      { q: "How do you handle exam integrity online?", a: "Layered tooling: timed sessions, question randomisation, plagiarism checks and proctoring integrations where required, proportionate to what is being certified." },
      { q: "Do you integrate with student information systems?", a: "We integrate enrolment, gradebook and roster data with existing SIS/LMS systems so the new platform strengthens the record of learning instead of forking it." },
      { q: "Can analytics predict students at risk?", a: "Progress analytics surface lagging engagement and mastery gaps early, giving teachers a timely nudge list. The judgement of how to intervene stays with the educator." },
    ],
    relatedIndustries: ["healthcare", "government"],
    relatedServices: ["product-engineering", "mobile-app-development", "ai-agent-development"],
  },
  {
    id: "travel",
    title: "Travel & Hospitality",
    tagline: "Travel products people enjoy booking.",
    heroLead:
      "Booking engines, property systems and guest experiences, built for how people plan, book and remember travel, and the operations behind every stay.",
    metaDescription:
      "Travel and hospitality software development by Savo Technologies: booking engines, property management, channel integrations and guest apps. Experiences built to book and return.",
    overview: [
      "Travel is the rare purchase people research for hours and complete in seconds. The winning products compress a chaotic decision of dates, budgets, reviews, photos and trust into a flow that feels like planning, not paperwork. Behind it sits an operational reality: rate parity, channel sync, seasonality and service recovery at speed.",
      "We build both sides. Guest-facing search, dynamic packaging and booking flows are engineered for speed and clarity on mobile, while property and operations systems keep inventory, rates and reservations consistent across every channel. After checkout, guest apps and feedback loops turn a stay into a relationship the next booking can build on.",
    ],
    imageCaption: "The trip starts on a phone, usually in a hurry.",
    detailCaption: "A great stay is operations the guest never sees.",
    markers: [
      "Mobile-first booking flows",
      "Rate and inventory truth across channels",
      "Service recovery built into the product",
      "Loyalty that feels like memory, not points",
    ],
    solutions: [
      { title: "Booking engines", text: "Search, dynamic pricing and checkout for stays, trips and packages, fast on mobile, honest about availability." },
      { title: "Property management", text: "Reservations, housekeeping and maintenance workflows that run the stay from check-in to invoice." },
      { title: "Channel management", text: "Rate and inventory sync across OTAs and direct channels, protecting parity without manual vigilance." },
      { title: "Guest applications", text: "Digital check-in, in-stay requests and local recommendations, service in the pocket." },
      { title: "Reviews & reputation", text: "Feedback capture after the moment it happens, routed to the team that can act on it." },
      { title: "Loyalty & offers", text: "Programmes and promotions that recognise returning guests and fill quiet seasons deliberately." },
    ],
    flow: {
      heading: "The guest flow we engineer",
      intro:
        "Dreaming to returning, every stage fast, consistent and recoverable when plans change.",
      nodes: [
        { label: "Discover", note: "search · inspiration" },
        { label: "Decide", note: "rates · reviews" },
        { label: "Book", note: "checkout · confirmations" },
        { label: "Stay", note: "check-in · service" },
        { label: "Return", note: "loyalty · rebooking" },
      ],
    },
    challenges: [
      { title: "Inventory that expires", text: "An unsold room-night or seat tonight is worth nothing tomorrow. Pricing, availability and speed decide revenue." },
      { title: "Search converts or dies", text: "Travellers compare five tabs. Slow, vague or cluttered discovery loses the booking before the experience begins." },
      { title: "The trip is multi-system", text: "Flights, stays, transfers and activities each live in different supplier systems. The platform's job is coherence across them." },
      { title: "Disruption is normal", text: "Cancellations, delays and changes are routine, not edge cases. Rebooking flows and communication make or break trust." },
    ],
    operations: [
      { title: "Discovery & booking", items: ["Search with dates, occupancy and flexible filters", "Rate and availability aggregation from suppliers", "Booking flows with holds, timeouts and confirmations", "Dynamic pricing and promo rules"] },
      { title: "Trip management", items: ["Vouchers, tickets and itinerary delivery", " Modifications, cancellations and refund workflows", "Supplier confirmation and reconciliation", "Traveller communication at every stage"] },
      { title: "Supplier & inventory", items: ["Contracted allotments and free-sale inventory", "Channel manager sync in both directions", "Commission and markup engines", "Supplier payment cycles"] },
      { title: "Experience intelligence", items: ["Search-to-booking funnels by segment", "Cancellation and no-show analytics", "Review capture and service recovery", "Repeat traveller identification and win-back"] },
    ],
    technology: ["Next.js booking surfaces", "Caching layers for availability search", "PostgreSQL reservation models", "Supplier API adapters", "Message queues for confirmations", "Node.js services"],
    integrations: ["GDS and supplier APIs", "Payment gateways", "Channel managers", "Review platforms", "Messaging (email/SMS/WhatsApp)", "Loyalty systems"],
    security: "Passports, payment details and itineraries are high-value data: encryption throughout, scoped access, fraud screening on bookings, and PCI handled via certified providers.",
    aiOpportunities: [
      { title: "Discovery assistance", text: "Natural-language trip planning that narrows real inventory, not a chatbot dreaming of hotels." },
      { title: "Dynamic offers", text: "Bundles and upgrades tuned to demand and traveller profile, within revenue rules." },
      { title: "Disruption automation", text: "Rebooking options prepared and offered the moment a supplier change lands, humans handling judgment cases." },
    ],
    relatedWork: [
      { label: "Web development", href: "/services/web-development" },
      { label: "Mobile development", href: "/services/mobile-app-development" },
      { label: "Case study dossier", href: "/case-studies" },
    ],
    faqs: [
    {
      q: "How much does travel website or booking platform development cost?",
      a: "Budget follows the supply side: how many supplier APIs, how dynamic the pricing, and the modification and refund complexity. A direct-booking site for one operator costs far less than a multi-supplier marketplace, and discovery prices the difference honestly.",
    },
    {
      q: "How long does it take to build a booking platform?",
      a: "A first bookable flow with confirmation and vouchers typically ships in a few months; full supplier aggregation and disruption handling follow in stages. The cancellation path is designed as carefully as the happy path.",
    },
    {
      q: "Can you integrate GDS, channel managers and supplier APIs?",
      a: "Yes. We build typed adapter layers over the supplier systems you sell from, with queue-based sync that absorbs their outages without breaking your checkout. Availability shown is availability real.",
    },
      { q: "Can you build a booking engine that doesn't redirect guests?", a: "Yes, direct booking on your own domain, with live availability and payment capture. Keeping the flow on-site protects margin and the guest relationship at the same time." },
      { q: "How do you keep rates consistent across channels?", a: "Channel management sits at the centre: one inventory and rate source, synchronised to OTAs and direct sales, with conflict rules that prevent oversells before they reach the front desk." },
      { q: "Do you build for tours and activities, not just stays?", a: "We build booking for experiences too, with availability calendars, group sizes, guides and waivers: the same engineering with different inventory." },
      { q: "What about last-minute changes and cancellations?", a: "The workflows are designed for plans changing: self-service modifications, policy-aware refunds and rebooking paths that turn a cancellation into the next reservation." },
    ],
    relatedIndustries: ["ecommerce", "real-estate"],
    relatedServices: ["web-development", "custom-software-development", "data-analytics"],
  },
  {
    id: "manufacturing",
    title: "Manufacturing & 4.0",
    tagline: "Shop floor to top floor, one pipeline.",
    heroLead:
      "Production dashboards, machine telemetry and predictive maintenance, connecting equipment to decisions in real time.",
    metaDescription:
      "Manufacturing software development by Savo Technologies: IoT dashboards, machine telemetry, predictive maintenance and ERP integration. Industry 4.0 platforms that connect equipment to decisions.",
    overview: [
      "A factory already produces enormous amounts of data, machines log states, lines log counts, operators log knowledge in notebooks nobody reads. Industry 4.0 is less about new sensors than about closing the loop: getting that signal into systems that turn it into schedules, maintenance orders and decisions before yield drifts or a line stops.",
      "Savo builds the loop. Telemetry pipelines collect from machines and MES layers, dashboards make line health legible at a glance, and maintenance tooling flags the anomaly before it becomes downtime. All of it integrates with the ERP that actually runs the business, because a beautiful dashboard that ignores planning is decoration.",
    ],
    imageCaption: "The line generates data. The question is who hears it.",
    detailCaption: "Industry 4.0 is a closed loop, not a dashboard.",
    markers: [
      "Telemetry pipelines from existing machines",
      "Anomaly alerts before downtime",
      "ERP-integrated, not ERP-adjacent",
      "Interfaces readable on the floor",
    ],
    solutions: [
      { title: "IoT dashboards", text: "Live line health, counts and throughput, the plant's pulse on one screen, from any browser." },
      { title: "Machine telemetry", text: "Collection from PLCs, gateways and MES layers into one time-series picture of the floor." },
      { title: "Predictive maintenance", text: "Anomaly detection and maintenance triggers that schedule the fix before the failure schedules itself." },
      { title: "Production tracking", text: "Orders, batches and traceability, what was made, when, by which line, from which lot." },
      { title: "ERP integration", text: "Consumption, output and orders synced with the planning system, so operations and finance agree." },
      { title: "Worker applications", text: "Andon boards, work instructions and quality checks on floor-hardened devices." },
    ],
    flow: {
      heading: "The signal flow we engineer",
      intro:
        "Machine to decision, collected, contextualised and closed back into planning.",
      nodes: [
        { label: "Sense", note: "PLCs · sensors" },
        { label: "Collect", note: "pipelines · time-series" },
        { label: "Contextualise", note: "MES · ERP join" },
        { label: "Decide", note: "alerts · schedules" },
        { label: "Act", note: "work orders · loop" },
      ],
    },
    challenges: [
      { title: "The shop floor is the network edge", text: "Machines, operators and inspectors work where Wi-Fi dies. Data capture must survive reality, not the demo room." },
      { title: "Systems that don't talk", text: "ERP, MES, quality and maintenance each hold part of the truth. Integration, not replacement, is usually the win." },
      { title: "Traceability is contractual", text: "Batch, lot and serial genealogy answers to customers and regulators. Gaps become recalls." },
      { title: "Downtime is money", text: "Every minute of an unplanned stop has a number. The software's job is visibility before it is beauty." },
    ],
    operations: [
      { title: "Production operations", items: ["Work orders and production scheduling", "Machine and line monitoring (IoT/SCADA bridges)", "Downtime tracking with reason codes", "Operator logbooks and shift handovers"] },
      { title: "Quality workflows", items: ["In-process inspections with tolerances", "Non-conformance reports and CAPA tracking", "Batch and lot traceability end to end", "COA and quality document generation"] },
      { title: "Maintenance & assets", items: ["Preventive maintenance calendars", "Breakdown workflows with spare consumption", "Asset history and OEE views", "Spare parts inventory tracking"] },
      { title: "Planning intelligence", items: ["OEE and bottleneck analytics", "Energy and consumption monitoring", "Supplier quality scorecards", "Cost-per-unit visibility"] },
    ],
    technology: ["Flutter shop-floor apps (offline-first)", "Node.js integration services", "PostgreSQL with traceability models", "IIoT gateways and MQTT", "ERP/MES connectors", "Time-series monitoring"],
    integrations: ["ERP systems", "MES/SCADA", "IoT sensors and gateways", "Weighbridges and test equipment", "Supplier portals", "Accounting"],
    security: "OT and IT security handled as one surface: segmented networks, scoped device identities, signed firmware paths where applicable, and audit trails that satisfy customer audits.",
    aiOpportunities: [
      { title: "Predictive maintenance", text: "Sensor patterns flagging failures before they stop the line, with maintenance reviewing the calls." },
      { title: "Visual quality inspection", text: "Camera-based defect detection on defined defect classes, humans handling ambiguity." },
      { title: "Production planning assist", text: "Schedule suggestions absorbing real constraints, planners approving before anything shifts." },
    ],
    relatedWork: [
      { label: "Reading: Offline-first field apps", href: "/insights/offline-first-field-apps" },
      { label: "Custom software", href: "/services/custom-software-development" },
      { label: "Data & analytics", href: "/services/data-analytics" },
    ],
    faqs: [
    {
      q: "How much does manufacturing software cost?",
      a: "Scope follows the shop floor: machines to monitor, traceability depth, and the ERP/MES systems to integrate with. A line-monitoring and quality workflow pilot is a common fixed-scope first step.",
    },
    {
      q: "How long does MES or IoT implementation take?",
      a: "A monitored line with dashboards and alerts typically comes live in a few months; plant-wide rollouts proceed line by line. Integration with the ERP you already run is the plan, replacement is not.",
    },
    {
      q: "Can you connect our existing ERP and shop-floor machines?",
      a: "Yes, through IIoT gateways and MES/SCADA bridges, with edge handling for the network's dead zones. The data model unifies batch traceability across both worlds.",
    },
      { q: "Do we need new machines to get started?", a: "Usually not. Most equipment exposes states through PLCs or gateways; we start by instrumenting what you already have and extend sensing only where the data gap justifies it." },
      { q: "How does predictive maintenance actually work here?", a: "Baseline behaviour is learned per machine, deviations are flagged with context, and maintenance orders are raised with evidence attached. It is about catching the slow drift early, not crystal-ball prediction." },
      { q: "Can you integrate with our existing ERP?", a: "Yes, integration is the point. Consumption, output and orders sync with your planning system so the floor picture and the business picture are the same picture." },
      { q: "Is the dashboard usable on the shop floor?", a: "We design for distance, glare and gloves: large type, high contrast, glanceable states. A dashboard nobody on the floor can read is a screen saver." },
    ],
    relatedIndustries: ["logistics", "energy"],
    relatedServices: ["data-analytics", "cloud-devops", "custom-software-development"],
  },
  {
    id: "government",
    title: "Government",
    tagline: "Public services that feel public.",
    heroLead:
      "Citizen portals, service digitisation and internal workflows, where accessibility, transparency and multilingual delivery are requirements, not features.",
    metaDescription:
      "Government software development by Savo Technologies: citizen portals, service digitisation, document workflows and accessibility-first public platforms. Procurement-grade documentation included.",
    overview: [
      "Public-sector software serves everyone of every ability, language, connection speed and level of digital confidence, and it does so in daylight: procurement documents its requirements, auditors trace its decisions, and accessibility standards are the floor, not the ceiling. Few environments punish shortcuts harder.",
      "We build for that daylight deliberately. Accessibility is engineered into components, not audited in afterwards; multilingual delivery treats every language as a first-class citizen of the interface; and documentation is written for the review that will read it. From citizen-facing portals to internal document workflows, the measure of the work is whether the least confident user in the jurisdiction can complete the task.",
    ],
    imageCaption: "Public software is judged in daylight.",
    detailCaption: "Accessibility is the floor, not the ceiling.",
    markers: [
      "WCAG-minded component engineering",
      "Multilingual as a first-class concern",
      "Documentation written for review",
      "Offline-tolerant for low-connectivity citizens",
    ],
    solutions: [
      { title: "Citizen portals", text: "Service directories, applications and status tracking, self-service that reduces queue pressure on offices." },
      { title: "Service digitisation", text: "Paper workflows rebuilt as guided digital journeys with save-and-resume for citizens who need it." },
      { title: "Document workflows", text: "Intake, verification, approval routing and records retention, traceable by design." },
      { title: "Internal operations", text: "Case management and dashboards for departments, with role-scoped views and full action histories." },
      { title: "Open data platforms", text: "Publication pipelines that turn internal datasets into public APIs and visualisations." },
      { title: "Accessibility remediation", text: "Audits and fixes for existing platforms, bringing them up to standard without a full rebuild." },
    ],
    flow: {
      heading: "The service flow we engineer",
      intro:
        "Citizen request to fulfilled service, guided, traceable and language-agnostic at every step.",
      nodes: [
        { label: "Request", note: "portal · assisted" },
        { label: "Verify", note: "documents · identity" },
        { label: "Process", note: "routing · approvals" },
        { label: "Notify", note: "status · language" },
        { label: "Fulfil", note: "delivery · record" },
      ],
    },
    challenges: [
      { title: "Public trust, public scrutiny", text: "Government systems fail in public. Accessibility, uptime and transparency are legal requirements, not aspirations." },
      { title: "Scale with seasons", text: "Deadlines (filings, admissions, grants) create thundering herds. Systems must be sized for the peak, cheap at the trough." },
      { title: "Inclusion is law", text: "Every citizen is a user: languages, literacy, devices, assistive tech. WCAG is the floor, not the goal." },
      { title: "Procurement and longevity", text: "Public projects outlive vendors. Open standards, documentation and clean handover are constitutional, not courteous." },
    ],
    operations: [
      { title: "Citizen services", items: ["Application and registration workflows with status tracking", "Document upload, verification and correction loops", "Payments and fee reconciliation", "Grievance and RTI-style request handling"] },
      { title: "Internal administration", items: ["Case routing between departments with SLAs", "Approval chains with delegation rules", "Notices, circulars and public communication", "Role-based dashboards for officers"] },
      { title: "Data & records", items: ["Verified record issuance with audit trails", "Retention and archival per policy", "Inter-departmental data sharing with consent boundaries", "Management information and compliance reporting"] },
      { title: "Transparency operations", items: ["Public dashboards and disclosures", "Service-level performance publication", "Feedback and satisfaction capture", "Audit-ready logging on every state change"] },
    ],
    technology: ["Next.js citizen portals (WCAG-first)", "Node.js services", "PostgreSQL with records discipline", "SMS/email gateways for reach", "Regional language support", "Rigid audit logging"],
    integrations: ["Identity and verification systems", "Payment gateways", "Departmental databases", "DigiLocker-style document systems where applicable", "Notification gateways", "GIS platforms"],
    security: "Citizen data at public-trust grade: strict role scoping, complete audit trails, encryption everywhere, segregation of environments and adversarial testing before citizen exposure.",
    aiOpportunities: [
      { title: "Citizen assistance", text: "Grounded assistants answering scheme, status and process questions in plain language, with human escalation built in." },
      { title: "Document processing", text: "Applications and attachments read, validated and routed automatically, officers deciding outcomes." },
      { title: "Service analytics", text: "Bottleneck detection across departments so service levels improve by evidence." },
    ],
    relatedWork: [
      { label: "Trust & security", href: "/trust" },
      { label: "Reading: WCAG AA in practice", href: "/insights/wcag-aa-in-practice" },
      { label: "Enterprise", href: "/enterprise" },
    ],
    faqs: [
    {
      q: "How much does government software development cost?",
      a: "Public platforms are scoped by citizen volume peaks, accessibility obligations and department integrations. Procurement-friendly fixed milestones with documentation are standard, and discovery prices the scope before tender commitments.",
    },
    {
      q: "How long does an e-governance platform take to build?",
      a: "A citizen service with applications, status tracking and payments typically ships in months; department-wide workflows follow in phases. Accessibility and audit readiness are launch requirements, not enhancements.",
    },
    {
      q: "Do you build WCAG-accessible and audit-ready systems?",
      a: "Yes: WCAG-aligned interfaces as the floor, complete audit trails on state changes, and documentation that survives vendor transitions. We publish our accessibility practice notes on Insights.",
    },
      { q: "How do you ensure accessibility compliance?", a: "Accessibility is engineered into the component layer, from semantics, contrast and keyboard paths to screen-reader behaviour, and verified with assistive technologies during the build, not in a remediation sprint after launch." },
      { q: "Can you deliver in multiple languages?", a: "Yes. Multilingual delivery is architectural: content, interface and documents are structured for translation, and right-to-left layouts are supported where the jurisdiction needs them." },
      { q: "Do you work within public procurement processes?", a: "We are used to structured procurement: scoped documentation, staged deliverables and evidence trails written for review. The paperwork is treated as part of the engineering." },
      { q: "Can citizens use these services on low connectivity?", a: "Services are built to degrade gracefully with save-and-resume, lightweight pages and offline-tolerant steps, because a public service that requires a flagship phone excludes part of the public." },
    ],
    relatedIndustries: ["healthcare", "education"],
    relatedServices: ["web-development", "custom-software-development", "qa-testing"],
  },
  {
    id: "energy",
    title: "Energy & Utilities",
    tagline: "Energy software, from field to bill.",
    heroLead:
      "Field operations, consumption analytics and customer platforms for the energy economy, grid-scale operations to the household bill, one engineering standard.",
    metaDescription:
      "Energy and utilities software development by Savo Technologies: field service apps, consumption analytics, IoT monitoring and customer billing platforms. From grid operations to the household bill.",
    overview: [
      "The energy sector runs on long-lived assets, distributed teams and a metering truth that everything downstream, from billing and planning to customer trust, depends on. Field crews work where connectivity is a rumour, asset data lives in decades of formats, and customers now expect a utility experience as clear as any consumer app.",
      "Savo builds across that span. Field service tools work offline and sync when the signal returns. Consumption analytics turn meter and IoT streams into planning-grade insight. And customer platforms make the bill, the usage and the plan legible, because trust in a utility is built one clear statement at a time.",
    ],
    imageCaption: "The grid is the original real-time system.",
    detailCaption: "Field work happens where the signal ends.",
    markers: [
      "Offline-first field tooling",
      "Metering truth as a foundation",
      "Billing that explains itself",
      "Asset data across decades of formats",
    ],
    solutions: [
      { title: "Field service apps", text: "Jobs, routes, safety checks and evidence capture, working offline, syncing when the signal returns." },
      { title: "Consumption analytics", text: "Meter and IoT streams turned into usage insight for customers and planning-grade signals for operators." },
      { title: "Billing platforms", text: "Tariff-aware billing that explains itself, line-item clarity instead of statement mystery." },
      { title: "IoT monitoring", text: "Grid and asset telemetry with thresholds, alerts and histories that support operations." },
      { title: "Customer portals", text: "Usage, plans, payments and moving-house flows that reduce call-centre load." },
      { title: "Reporting systems", text: "Regulatory and operational reporting generated from live data, not assembled by hand each cycle." },
    ],
    flow: {
      heading: "The energy flow we engineer",
      intro:
        "Generation to statement, metered, monitored and made legible for operator and customer alike.",
      nodes: [
        { label: "Generate", note: "assets · telemetry" },
        { label: "Distribute", note: "grid · monitoring" },
        { label: "Meter", note: "reads · IoT" },
        { label: "Bill", note: "tariffs · clarity" },
        { label: "Serve", note: "portal · support" },
      ],
    },
    challenges: [
      { title: "Assets in hard places", text: "Plants, pipelines, solar fields and meters sit beyond comfortable networks. Monitoring must assume thin pipes and long nights." },
      { title: "Safety is non-negotiable", text: "Permits, isolation procedures and incident records carry lives and licences. Workflow discipline is the product." },
      { title: "Data volume, decision latency", text: "Thousands of signals per minute against a handful of decisions per day. The platform must compress honestly." },
      { title: "Commercial complexity", text: "Tariffs, PPAs, UOMs and settlement rules make billing its own engineering discipline." },
    ],
    operations: [
      { title: "Asset monitoring", items: ["SCADA/IoT ingestion with historian storage", "Threshold alerting with acknowledgement trails", "Asset health scores and degradation trends", "Energy production and availability dashboards"] },
      { title: "Field operations", items: ["Work permits with isolation and clearance steps", "Inspection checklists with photo evidence (offline-capable)", "Fault reporting to resolution workflows", "Crew scheduling and site access logs"] },
      { title: "Commercial operations", items: ["Meter data collection and validation (MDM)", "Billing by tariff, PPA and consumption", "Settlement and reconciliation statements", "Customer portals with usage visibility"] },
      { title: "Compliance intelligence", items: ["Statutory inspection calendars", "Incident and near-miss registers", "Emission and sustainability reporting", "Regulator-ready audit extracts"] },
    ],
    technology: ["Time-series ingestion and storage", "Flutter field apps (offline-first)", "Node.js services", "PostgreSQL commercial models", "Alerting and rules engines", "GIS and asset registries"],
    integrations: ["SCADA and IoT gateways", "Meter data systems", "ERP and billing", "Weather and forecast feeds", "Workforce management", "GIS platforms"],
    security: "Critical-infrastructure discipline: network segmentation between OT and IT, signed firmware paths, role-scoped control actions, and incident-response runbooks tested rather than filed.",
    aiOpportunities: [
      { title: "Predictive asset health", text: "Degradation flagged weeks early from sensor patterns, maintenance planning the response." },
      { title: "Generation and load forecasting", text: "Forecast models tuned per site, feeding dispatch and settlement with confidence bands." },
      { title: "Field document automation", text: "Permits and inspection paperwork read, checked and filed automatically, engineers approving safety steps." },
    ],
    relatedWork: [
      { label: "Data & analytics", href: "/services/data-analytics" },
      { label: "Cloud & DevOps", href: "/services/cloud-devops" },
      { label: "Reading: Offline-first field apps", href: "/insights/offline-first-field-apps" },
    ],
    faqs: [
    {
      q: "How much does energy sector software cost?",
      a: "Cost follows asset count, telemetry volume and commercial complexity like tariffs and settlement. A monitored-asset pilot with alerting is the common fixed-scope entry that proves value before plant-wide rollout.",
    },
    {
      q: "How long does an energy monitoring platform take to build?",
      a: "Ingestion plus dashboards and alerts for a first site typically ships in a few months; multi-site scale and billing follow in stages. Safety workflows like permits get the longest runway because they must.",
    },
    {
      q: "Can you integrate with SCADA, smart meters and IoT sensors?",
      a: "Yes: time-series ingestion from SCADA and IoT gateways, MDM validation for meters, and GIS for asset registers. OT/IT segmentation is respected by design, not by exception.",
    },
      { q: "Can field apps really work without connectivity?", a: "Yes, offline-first design keeps jobs, forms and evidence capture working in dead zones, then reconciles safely when the signal returns. Conflict handling is engineered, not hoped for." },
      { q: "How do you handle billing accuracy?", a: "Metering data is validated at ingestion, tariff logic is explicit and versioned, and every statement is reproducible from its inputs. A bill a customer cannot understand is treated as a defect." },
      { q: "Do you integrate with legacy asset systems?", a: "That is the daily reality of the sector. We build integration layers over decades-old formats and historian systems, meeting the data where it lives." },
      { q: "Can you modernise our customer portal?", a: "Yes, usage clarity, plan management, payments and moving-house flows, delivered progressively so service continuity is never at risk." },
    ],
    relatedIndustries: ["manufacturing", "government"],
    relatedServices: ["cloud-devops", "data-analytics", "custom-software-development"],
  },
];

export function industryDetail(id: string): IndustryDetail | undefined {
  return INDUSTRY_DETAILS.find((d) => d.id === id);
}
