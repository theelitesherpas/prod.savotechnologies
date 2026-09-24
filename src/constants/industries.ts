/**
 * The industry atlas — content model for /industries/.
 *
 * The ten sectors mirror INDUSTRY_LINKS in navigation.ts (version-1
 * canonical order and hrefs). Each entry is a gateway: the index page
 * renders the atlas row, and the future /industries/[slug] detail pages
 * will open from the same data.
 *
 * HARD CONTENT RULE (PRODUCT.md): never fabricate clients, metrics,
 * certifications or results. Copy describes capability slots drawn from
 * the public services list — regulation names appear only as constraints
 * the engineering respects, never as credentials we hold.
 */

export type Industry = {
  /** Slug — anchors the atlas row and builds the detail-page href. */
  id: string;
  index: string;
  title: string;
  /** Short label for the hero contents board. */
  boardLabel: string;
  /** One-liner under the board label. */
  hint: string;
  /** Atlas-row lead copy. */
  lead: string;
  /** Capability chips — what Savo builds in this sector. */
  capabilities: string[];
  href: string;
};

export const INDUSTRIES_ATLAS: Industry[] = [
  {
    id: "healthcare",
    index: "01",
    title: "Healthcare",
    boardLabel: "Healthcare",
    hint: "Portals · telehealth · records",
    lead: "Patient portals, telehealth workflows and clinical support tools built around privacy-first architecture and audit-ready data handling. We engineer for the moment reliability is an outcome, not a metric.",
    capabilities: [
      "Patient Portals",
      "Telehealth",
      "Records Integration",
      "Appointment Systems",
      "Privacy by Design",
      "Audit Trails",
    ],
    href: "/industries/healthcare/",
  },
  {
    id: "fintech",
    index: "02",
    title: "FinTech & Banking",
    boardLabel: "FinTech",
    hint: "Payments · lending · ledgers",
    lead: "Payments, lending platforms and banking tools where security, reconciliation and uptime are the product. We build finance software the way regulators read it: every action traceable, every number exact.",
    capabilities: [
      "Payment Platforms",
      "Digital Wallets",
      "Lending Systems",
      "KYC Workflows",
      "Fraud Signals",
      "Ledger Integrations",
    ],
    href: "/industries/fintech/",
  },
  {
    id: "ecommerce",
    index: "03",
    title: "Ecommerce & Retail",
    boardLabel: "Ecommerce",
    hint: "Storefronts · catalogues · checkout",
    lead: "Storefronts, product platforms and omnichannel experiences engineered for speed, search and conversion. From catalogue to checkout, the whole pipeline stays measurable.",
    capabilities: [
      "Storefronts",
      "Headless Commerce",
      "Product Catalogues",
      "Checkout & Payments",
      "Inventory Sync",
      "Marketplaces",
    ],
    href: "/industries/ecommerce/",
  },
  {
    id: "logistics",
    index: "04",
    title: "Logistics & Supply Chain",
    boardLabel: "Logistics",
    hint: "Fleet · freight · warehousing",
    lead: "Fleet, freight and warehouse systems that turn movement into data, tracked, routed and predicted in real time, from first mile to last.",
    capabilities: [
      "Fleet Tracking",
      "Route Optimisation",
      "Warehouse Systems",
      "Order Management",
      "Carrier Integrations",
      "Live Dashboards",
    ],
    href: "/industries/logistics/",
  },
  {
    id: "real-estate",
    index: "05",
    title: "Real Estate",
    boardLabel: "Real Estate",
    hint: "Listings · tours · agent tools",
    lead: "Listing platforms, search and virtual-tour experiences that make property discovery feel effortless, with agent tools that keep every lead moving.",
    capabilities: [
      "Listing Platforms",
      "Search & Filters",
      "Virtual Tours",
      "CRM Integrations",
      "Lead Routing",
      "Agent Portals",
    ],
    href: "/industries/real-estate/",
  },
  {
    id: "education",
    index: "06",
    title: "Education & EdTech",
    boardLabel: "Education",
    hint: "Learning · assessment · analytics",
    lead: "Learning platforms, course systems and assessment tools designed for engagement at scale, on any device, in any classroom or out of one.",
    capabilities: [
      "Learning Platforms",
      "Course Systems",
      "Assessments",
      "Video Lessons",
      "Progress Analytics",
      "Mobile Learning",
    ],
    href: "/industries/education/",
  },
  {
    id: "travel",
    index: "07",
    title: "Travel & Hospitality",
    boardLabel: "Travel",
    hint: "Booking · properties · guests",
    lead: "Booking engines, property systems and guest experiences built for the way people plan, book and remember travel, and the operations behind each stay.",
    capabilities: [
      "Booking Engines",
      "Property Management",
      "Channel Integrations",
      "Guest Apps",
      "Dynamic Pricing",
      "Review Systems",
    ],
    href: "/industries/travel/",
  },
  {
    id: "manufacturing",
    index: "08",
    title: "Manufacturing & 4.0",
    boardLabel: "Manufacturing",
    hint: "Shop floor · IoT · telemetry",
    lead: "Shop floor to top floor: production dashboards, machine telemetry and predictive maintenance that connect equipment to decisions.",
    capabilities: [
      "IoT Dashboards",
      "Machine Telemetry",
      "Predictive Maintenance",
      "Production Tracking",
      "ERP Integration",
      "Worker Applications",
    ],
    href: "/industries/manufacturing/",
  },
  {
    id: "government",
    index: "09",
    title: "Government",
    boardLabel: "Government",
    hint: "Citizen services · digitisation",
    lead: "Public-sector platforms where accessibility, transparency and multilingual service are requirements, not features, procurement-grade documentation included.",
    capabilities: [
      "Citizen Portals",
      "Service Digitisation",
      "Accessibility First",
      "Multilingual Delivery",
      "Document Workflows",
      "Open Data",
    ],
    href: "/industries/government/",
  },
  {
    id: "energy",
    index: "10",
    title: "Energy & Utilities",
    boardLabel: "Energy",
    hint: "Field · grid · billing",
    lead: "Field operations, consumption analytics and customer platforms for the energy economy, from grid-scale operations to the household bill.",
    capabilities: [
      "Field Service Apps",
      "Consumption Analytics",
      "Billing Platforms",
      "IoT Monitoring",
      "Reporting Systems",
      "Customer Portals",
    ],
    href: "/industries/energy/",
  },
];

/** Cross-sector foundations — the load-bearing walls of every engagement. */
export const INDUSTRY_FOUNDATIONS = [
  {
    title: "Regulation-aware engineering",
    text: "Access control, audit trails, retention and privacy handled as architecture, not paperwork. The sector's rulebook shapes the schema on day one.",
    points: ["Role-based access", "Audit trails", "Data residency"],
  },
  {
    title: "Systems of record",
    text: "ERP, CRM, payments, health records, logistics APIs, products are built to join what already runs the business, not to replace it in secret.",
    points: ["ERP & CRM", "Payment rails", "Legacy bridges"],
  },
  {
    title: "Reliability & observability",
    text: "Uptime budgets, monitoring and alerting from the first release. When software carries operations, its health is a business metric.",
    points: ["Monitoring", "Alerting", "Incident drills"],
  },
  {
    title: "Security by design",
    text: "Least privilege, encryption in transit and at rest, dependency hygiene and tested recovery, reviewed as part of the build, not after it.",
    points: ["Encryption", "Least privilege", "Recovery drills"],
  },
] as const;
