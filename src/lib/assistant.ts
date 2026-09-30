/**
 * Savo Assistant - the knowledge engine behind the Ask Savo chat.
 *
 * Deterministic FAQ retrieval over verified site truth (services, process,
 * pricing approach, offices, careers, contact promises). No invented claims:
 * every answer mirrors content published on the site; anything unmatched
 * falls through to a human handoff (enquiry pipeline) instead of a guess.
 *
 * Pure module - unit-tested in tests/assistant.test.ts.
 */

import { IS_DEMO } from "@/lib/content-mode";

export type AssistantLink = { label: string; href: string };

export type AssistantEntry = {
  id: string;
  category: string;
  question: string;
  keywords: string[];
  paragraphs: string[];
  links?: AssistantLink[];
};

export const ASSISTANT_CATEGORIES = [
  "Services",
  "Process & pricing",
  "Company",
  "Careers",
] as const;

export const KNOWLEDGE: AssistantEntry[] = [
  /* ----------------------------- Services ---------------------------- */
  {
    id: "build",
    category: "Services",
    question: "What does Savo build?",
    keywords: ["build", "what do you", "what does savo", "what savo", "services", "capabilities", "offer", "savo", "savo do", "savo does", "savo build", "your company", "what all", "everything", "work on", "what kind"],
    paragraphs: [
      "Six disciplines, one connected team: web experiences, mobile products, AI & intelligent systems, software & SaaS, product & experience design, and growth.",
      "Websites and web apps on Next.js and React; iOS and Android apps in Flutter or React Native; AI agents, RAG systems and copilots in production, plus the design and growth work that keeps them improving after launch.",
    ],
    links: [
      { label: "Explore services", href: "/services" },
      { label: "Industries we serve", href: "/industries" },
    ],
  },
  {
    id: "ai",
    category: "Services",
    question: "Do you build AI agents?",
    keywords: ["ai", "agent", "agents", "llm", "genai", "generative", "rag", "copilot", "chatbot", "automation", "machine", "learning", "ml"],
    paragraphs: [
      "Yes: AI at Savo is production engineering, not demos. Support agents, knowledge agents, document intelligence pipelines and analytics copilots, connected to your real systems with guardrails, human oversight and evaluation from the first sprint.",
      "A first agent typically deploys in 2 to 4 weeks, trained on your data.",
    ],
    links: [
      { label: "AI & intelligent systems", href: "/ai-agents" },
      { label: "Start an AI project", href: "/start" },
    ],
  },
  {
    id: "web",
    category: "Services",
    question: "Do you build websites and web apps?",
    keywords: ["website", "web", "site", "portal", "next", "react", "landing", "pwa", "headless", "build websites", "build a website", "make a website", "website for"],
    paragraphs: [
      "Corporate platforms, marketing sites, customer portals, headless storefronts and full web applications, engineered on Next.js, React and TypeScript for speed, search and conversion.",
      "Every build ships with the growth layer in place: technical SEO, structured data and analytics.",
    ],
    links: [{ label: "Web development", href: "/services/web-development/" }],
  },
  {
    id: "mobile",
    category: "Services",
    question: "Do you build mobile apps?",
    keywords: ["mobile", "app", "apps", "ios", "android", "flutter", "react native", "phone", "apple", "play store"],
    paragraphs: [
      "iOS and Android products that feel native and hold up in daily use: Flutter, React Native or fully native, chosen by the problem rather than by habit.",
      "Payments, maps, notifications, offline-first data and full API integrations are standard parts of our mobile work.",
    ],
    links: [{ label: "Mobile app development", href: "/services/mobile-apps/" }],
  },
  {
    id: "design",
    category: "Services",
    question: "Do you do UI/UX design?",
    keywords: ["design", "ui", "ux", "figma", "prototype", "research", "design system", "interface", "usability"],
    paragraphs: [
      "Research, information architecture, interface systems and prototypes that make complex products obvious, judged by what users accomplish, never by decoration.",
      "Design and engineering sit in one team here, so design decisions are made with implementation in mind.",
    ],
    links: [{ label: "Product & experience design", href: "/services/ui-ux/" }],
  },
  {
    id: "hire",
    category: "Services",
    question: "Can we hire dedicated developers?",
    keywords: ["hire", "dedicated", "developer", "developers", "resource", "resources", "team", "staff", "augment", "engineer", "full stack", "frontend", "backend", "devops"],
    paragraphs: [
      "Yes, vetted engineers join your standup within two weeks: AI & ML, frontend, backend, full stack, mobile, DevOps and QA.",
      "Transparent monthly rates and a two-week trial on every engagement.",
    ],
    links: [{ label: "Hire resources", href: "/hire" }],
  },

  /* ------------------------- Process & pricing ------------------------ */
  {
    id: "cost",
    category: "Process & pricing",
    question: "How much does a project cost?",
    keywords: ["cost", "price", "pricing", "much", "budget", "quote", "estimate", "charge", "fee", "money", "$", "rate", "usd", "dollar", "dollars"],
    paragraphs: [
      "Projects start from $500 USD and scale with what the work actually needs. Most full engagements land between $5k and $100k+.",
      "Rough ranges to plan with: business websites $1.5k to $4k, e-commerce stores $3k to $5k, mobile apps $5k to $15k, SaaS MVPs $8k to $25k, AI agents $2k to $10k, and smaller fixes or landing pages from $500.",
      "Share what you're building and a senior consultant replies within one business day with a realistic fixed-scope, fixed-price proposal, no discovery paywall.",
    ],
    links: [{ label: "Start a project", href: "/start" }],
  },
  {
    id: "start",
    category: "Process & pricing",
    question: "How fast can we start?",
    keywords: ["fast", "start", "begin", "when", "timeline", "soon", "quickly", "long", "kickoff", "launch", "week"],
    paragraphs: [
      "First reply within one business day, every message reaches a human, never a ticket queue. From there: a discovery call, then a fixed-scope proposal.",
      "AI agents deploy in 2 to 4 weeks; hired engineers join your standup within 2 weeks.",
    ],
    links: [{ label: "Contact us", href: "/contact" }],
  },
  {
    id: "process",
    category: "Process & pricing",
    question: "What is your process?",
    keywords: ["process", "method", "methodology", "how do you work", "steps", "approach", "workflow", "discovery", "sprint"],
    paragraphs: [
      "Five steps: Discover (frame the problem and success metrics), Define (requirements, architecture, direction), Design (journeys, interfaces, systems), Build (engineer in iterations with visible progress), Grow (measure, improve, scale).",
      "You see working software early and often, no black-box phases.",
    ],
    links: [{ label: "Our methodology", href: "/#process" }],
  },
  {
    id: "scope",
    category: "Process & pricing",
    question: "What if the scope changes mid-project?",
    keywords: ["scope", "change", "changes", "mid-project", "new ideas", "extra", "added", "flexible"],
    paragraphs: [
      "The agreed price never moves mid-scope. New ideas go into a follow-up scope with its own fixed price, agreed before work starts, in writing.",
    ],
    links: [{ label: "Start a project", href: "/start" }],
  },

  /* ------------------------------ Company ----------------------------- */
  {
    id: "who",
    category: "Company",
    question: "Who is Savo Technologies?",
    keywords: ["who is savo", "who are you", "about", "about savo", "what is savo", "tell me about savo", "tell me about your company", "agency", "background", "history", "experience", "old"],
    paragraphs: [
      "An independent digital product and technology company, web platforms, mobile apps and AI systems, engineered by one accountable team since 2015.",
      "Ten years of global delivery from India, for clients across India, Switzerland, the Gulf, the UK, the USA and Australia.",
    ],
    links: [{ label: "Case studies", href: "/case-studies" }],
  },
  {
    id: "where",
    category: "Company",
    question: "Where are you located?",
    keywords: ["where", "located", "location", "office", "offices", "address", "india", "switzerland", "zurich", "usa", "uk", "london", "australia", "sydney", "saudi", "dubai", "gcc", "headquarters"],
    paragraphs: IS_DEMO
      ? [
          "The engineering headquarters is in Indore, India - that is where the team works every day.",
          "Beyond India, Savo supports engagements across Switzerland and Europe, Dubai and the GCC, Australia, the United Kingdom and the United States. These are market/service presences - confirmed office locations publish as each region supplies a verified address.",
        ]
      : [
          `The engineering headquarters is at 139 PU4, Behind C21 Mall, Vijay Nagar, Scheme 54, Indore 452010, India - that is where the team works every day. Main line +91 75029 01234, HR +91 78988 52345. The Switzerland head office is at Rue de la Fruiterie 13, 1523 Granges-Marnand (+41 76 408 28 72).`,
          "Beyond India and Switzerland, Savo serves clients worldwide. Confirmed office locations publish as each region supplies a verified address.",
        ],
    links: [{ label: "Offices", href: "/contact/#offices" }],
  },
  {
    id: "work",
    category: "Company",
    question: "Can I see your work or case studies?",
    keywords: ["work", "portfolio", "case", "study", "studies", "projects", "clients", "references", "examples", "proof", "results"],
    paragraphs: [
      "The case-study dossier is organized by discipline, web, mobile, AI, software, design and growth, and entries publish only with verified outcomes, which is why most still read 'in preparation'.",
      "Need proof sooner? Ask directly and we will walk you through relevant engagements under NDA, with the numbers clients allow us to share.",
    ],
    links: [
      { label: "Case studies", href: "/case-studies" },
      { label: "Request references", href: "/contact" },
    ],
  },
  {
    id: "stack",
    category: "Company",
    question: "What technologies do you use?",
    keywords: ["tech", "technology", "stack", "tools", "languages", "framework", "frameworks", "database", "cloud", "aws", "infrastructure"],
    paragraphs: [
      "Chosen for the problem, not the fashion: Next.js, React and TypeScript on the web; Flutter and React Native on mobile; Node.js and Python behind; PostgreSQL, Redis and vector search underneath; LLMs, RAG and agent tooling for AI; AWS, Vercel, Cloudflare and Docker to run it.",
    ],
    links: [{ label: "Technology", href: "/#technology" }],
  },

  /* ------------------------- Working together ------------------------ */
  {
    id: "industries",
    category: "Services",
    question: "Which industries do you serve?",
    keywords: ["industry", "industries", "sector", "sectors", "vertical", "verticals", "domain", "domains", "healthcare", "fintech", "banking", "logistics", "real estate", "education", "edtech", "travel", "manufacturing", "government", "energy", "retail"],
    paragraphs: [
      "Ten industry practices with tailored playbooks: Healthcare, FinTech & Banking, Ecommerce & Retail, Logistics & Supply Chain, Real Estate, Education & EdTech, Travel & Hospitality, Manufacturing & 4.0, Government, and Energy & Utilities.",
      "Each practice page explains how Savo works inside that sector's constraints and workflows.",
    ],
    links: [{ label: "Industries", href: "/industries" }],
  },
  {
    id: "team",
    category: "Working together",
    question: "Who will actually work on my project?",
    keywords: ["team", "who works", "who will work", "my project", "developers work", "team size", "how many people", "senior", "junior", "designers", "engineers work", "resources"],
    paragraphs: [
      "One accountable team, not a rotating cast: the senior consultant who replies to your first message stays involved, and the same named engineers and designer carry your project through delivery.",
      "Need more capacity? Vetted engineers join from the hire-a-developer bench with a two-week trial.",
    ],
    links: [{ label: "Our methodology", href: "/#process" }],
  },
  {
    id: "communication",
    category: "Working together",
    question: "How do we stay in touch during the project?",
    keywords: ["communication", "communicate", "updates", "update", "progress", "report", "reporting", "standup", "meeting frequency", "stay in touch", "contact during", "visibility"],
    paragraphs: [
      "You always know where things stand: one senior point of contact, working software you can see at every iteration, and a human reply to every message, never a ticket queue.",
      "Hired engineers join your existing standup and tools; project work runs on agreed demo checkpoints.",
    ],
  },
  {
    id: "nda",
    category: "Working together",
    question: "Do you sign NDAs? Who owns the code?",
    keywords: ["nda", "confidential", "confidentiality", "secret", "privacy of idea", "ownership", "owns", "own the code", "idea", "ip", "intellectual property", "source code ownership", "safe to share"],
    paragraphs: [
      "Yes, NDAs are signed before any project detail is shared, standard practice on every engagement.",
      "What we build for you is yours: code, designs and documentation transfer to you on payment, and confidential material never leaves the agreed circle.",
    ],
  },
  {
    id: "security",
    category: "Working together",
    question: "How do you handle security and quality?",
    keywords: ["security", "secure", "data protection", "gdpr", "compliance", "quality", "testing", "qa", "bugs", "safe", "encryption", "vulnerability"],
    paragraphs: [
      "Security-conscious engineering, privacy-aware development, secure delivery practices and production-focused QA are the baseline on every build, they're printed in our footer because they're policy, not marketing.",
      "Quality is judged in production: tested builds, monitored releases and honest maintenance after launch.",
    ],
  },
  {
    id: "support",
    category: "Services",
    question: "Do you provide support after launch?",
    keywords: ["support", "maintenance", "maintain", "after launch", "post launch", "sla", "bug fixes", "updates after", "retainer", "ongoing"],
    paragraphs: [
      "Yes, Maintenance & Development Support is one of our listed services, and Existing-project support for teams who need urgent help with systems they already run.",
      "Launch is a milestone here, not an exit: measure, improve and scale is literally the fifth step of our process.",
    ],
    links: [{ label: "Our services", href: "/services" }],
  },
  {
    id: "redesign",
    category: "Services",
    question: "Can you redesign or improve an existing product?",
    keywords: ["redesign", "re design", "revamp", "improve existing", "existing website", "existing app", "modernize", "modernise", "old website", "rebuild", "migration", "migrate"],
    paragraphs: [
      "Yes, website redesign and product improvement are core services: experience redesign, conversion optimisation, replatforming and migrations.",
      "We start from what your users already do, keep what works, and change what measurably doesn't.",
    ],
  },
  {
    id: "ecommerce",
    category: "Services",
    question: "Do you build e-commerce stores?",
    keywords: ["ecommerce", "e commerce", "online store", "shop", "shopping", "cart", "checkout", "payments", "payment gateway", "woocommerce", "shopify", "headless commerce"],
    paragraphs: [
      "Yes, headless storefronts, custom e-commerce platforms, PWAs, payment integrations and the growth layer (SEO, analytics, conversion) around them.",
      "Built on the same Next.js/React foundation as the rest of our web work, so speed and search are engineered in from day one.",
    ],
  },
  {
    id: "saas",
    category: "Services",
    question: "Can you build a SaaS product?",
    keywords: ["saas", "multi tenant", "multi-tenant", "subscription", "subscription billing", "platform product", "b2b product", "startup product", "mvp", "software as a service"],
    paragraphs: [
      "Yes, SaaS platforms are a listed service: multi-tenant architecture, billing, dashboards, onboarding and the operational admin side behind them.",
      "For founders we usually start with an MVP scope inside a fixed price, then grow in agreed increments.",
    ],
  },
  {
    id: "software",
    category: "Services",
    question: "Do you build custom software and internal tools?",
    keywords: ["custom software", "internal tool", "internal tools", "erp", "dashboard", "admin panel", "business software", "workflow system", "operations software", "management system", "portal for"],
    paragraphs: [
      "Yes, custom software is one of six core services: operations systems, ERPs, CRMs, internal tools and workflow automation built around how your business actually runs.",
      "Node.js and Python behind, PostgreSQL underneath, and interfaces your team enjoys using.",
    ],
  },
  {
    id: "cloud",
    category: "Services",
    question: "Do you handle cloud and DevOps?",
    keywords: ["cloud", "devops", "aws", "azure", "gcp", "vercel", "hosting", "deploy", "deployment", "ci", "cd", "infrastructure", "server", "docker", "kubernetes", "scaling"],
    paragraphs: [
      "Yes, Cloud & DevOps is a listed service: infrastructure on AWS, Vercel and Cloudflare, Docker-based delivery, CI/CD pipelines, monitoring and scaling.",
      "The same team that builds runs it, so deployment is never an afterthought.",
    ],
  },
  {
    id: "api",
    category: "Services",
    question: "Can you integrate with our existing systems?",
    keywords: ["api", "integration", "integrate", "third party", "webhook", "connect to", "sync", "stripe", "payment integration", "crm integration", "erp integration", "existing system"],
    paragraphs: [
      "Yes, API development & integration is standard work here: payment gateways, CRMs, ERPs, messaging, maps and anything with an API (or a database we can reach).",
      "We also document what we connect so your own team can maintain it.",
    ],
  },
  {
    id: "seo",
    category: "Services",
    question: "Do you do SEO and digital growth?",
    keywords: ["seo", "search engine", "google ranking", "aeo", "geo", "answer engine", "digital marketing", "growth marketing", "traffic", "ranking", "ads", "content marketing"],
    paragraphs: [
      "Yes, Growth is our sixth discipline: technical SEO, AEO (answer-engine optimisation) and GEO for AI-driven search, plus digital marketing that compounds.",
      "Every web build ships with the technical layer already in place: structured data, canonical URLs and analytics.",
    ],
    links: [{ label: "Our services", href: "/services" }],
  },
  {
    id: "why",
    category: "Company",
    question: "Why should we choose Savo?",
    keywords: ["why", "why savo", "why choose", "different", "differentiator", "special", "better", "compare", "competitor", "usps", "unique", "trust"],
    paragraphs: [
      "One accountable team since 2015, the person who replies owns your outcome, no hand-offs into a void. Fixed-scope written proposals, so the price never drifts mid-project.",
      "Case studies publish only verified outcomes, AI work ships with guardrails and evaluation, and every message reaches a human within one business day.",
    ],
  },
  {
    id: "payment",
    category: "Process & pricing",
    question: "What are your payment terms?",
    keywords: ["payment terms", "pay", "invoice", "billing", "instalment", "installment", "upfront", "advance", "milestone payment", "how do we pay"],
    paragraphs: [
      "Payment terms come with your written proposal, fixed price, fixed scope, agreed before work starts, with milestones tied to visible progress.",
      "Hire-a-developer engagements run on transparent monthly rates with a two-week trial.",
    ],
  },
  {
    id: "contract",
    category: "Process & pricing",
    question: "How do contracts and agreements work?",
    keywords: ["contract", "agreement", "terms", "legal", "paperwork", "sign", "engagement letter", "statement of work", "sow"],
    paragraphs: [
      "Every engagement runs on a written statement of work: scope, price, timeline and deliverables agreed in writing before anything starts.",
      "Scope changes never move an agreed price, new ideas become a follow-up scope with its own written price.",
    ],
  },
  {
    id: "meeting",
    category: "Process & pricing",
    question: "Can we book a call or meeting?",
    keywords: ["call", "book a call", "meeting", "schedule", "discovery call", "zoom", "video call", "talk on phone", "phone call", "consultation"],
    paragraphs: [
      "Yes, the fastest way is a callback request or the live chat: leave your number and a senior consultant calls within two business hours.",
      "Prefer to type first? Send the problem and constraints and we'll reply within one business day.",
    ],
    links: [
      { label: "Book a call", href: "/start" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    id: "contact",
    category: "Company",
    question: "How can I contact you?",
    keywords: ["contact", "email", "phone number", "call you", "reach you", "whatsapp", "email address", "phone no", "number"],
    paragraphs: [
      "Email hello@savotechnologies.com, main line +91 75029 01234 (HR: +91 78988 52345), WhatsApp from the site, or the live chat right here.",
      "A senior consultant replies within one business day, and this chat can connect you to the team live.",
    ],
    links: [{ label: "Contact page", href: "/contact" }],
  },
  {
    id: "timezone",
    category: "Company",
    question: "What time zone do you work in?",
    keywords: ["timezone", "time zone", "ist", "cet", "working hours", "overlap", "when are you available", "office hours"],
    paragraphs: [
      "The engineering headquarters in Indore, India (IST) and the Switzerland head office (CET) give us a natural bridge across European and Indian working hours.",
      "Clients keep one agreed rhythm, demo checkpoints, standups for hired engineers, and replies within one business day regardless of zone.",
    ],
  },

  /* ------------------------------ Careers ----------------------------- */
  {
    id: "careers",
    category: "Careers",
    question: "Are you hiring?",
    keywords: ["hiring", "job", "jobs", "career", "careers", "vacancy", "openings", "positions", "apply", "role", "internship", "intern", "fresher"],
    paragraphs: [
      "We hire engineers and designers who are curious, ship weekly and check their ego in, office-first in Indore with hybrid options, INR salaries.",
      "Applications get an engineer-read review and a personal reply within two business days. Four steps to a written offer: application review, technical conversation, meet the team, written offer.",
    ],
    links: [
      { label: "Open roles", href: "/careers" },
      { label: "Apply now", href: "/careers/apply/" },
    ],
  },
];

/* Initial chip set - one strong question per category, plus the human path */
export const INITIAL_SUGGESTIONS = ["build", "cost", "start", "ai", "industries", "where", "careers"] as const;

export const HUMAN_CHIP = "talk-human" as const;

/* ── Conversational small-talk entries (greetings, thanks), they keep the
   chat human instead of falling through to the honest-miss fallback. ── */
export const CONVERSATION_ENTRIES: AssistantEntry[] = [
  {
    id: "greeting",
    category: "Company",
    question: "Say hello",
    keywords: ["hi", "hello", "hey", "hii", "hiii", "yo", "namaste", "good morning", "good afternoon", "good evening", "greetings", "anyone there", "anybody there"],
    paragraphs: [
      "Hello, welcome to Savo! I'm the Savo Assistant. Ask me anything about our services, pricing, timelines or how we work, and I'll answer straight away.",
      "Pick a question below if you like, or just type. And if you'd rather talk to a real person, the team is one tap away.",
    ],
    links: [
      { label: "What Savo builds", href: "/services" },
      { label: "Start a project", href: "/start" },
    ],
  },
  {
    id: "thanks",
    category: "Company",
    question: "Thanks!",
    keywords: ["thanks", "thank", "thank you", "thx", "ty", "appreciate", "bye", "goodbye", "see you", "cheers"],
    paragraphs: [
      "Happy to help! If anything else comes up, services, pricing, timelines, technology, just ask.",
      "And whenever you'd like a human on the other side, the Savo team is one tap away.",
    ],
  },
  {
    id: "howareyou",
    category: "Company",
    question: "How are you?",
    keywords: ["how are you", "how r u", "how's it going", "hows it going", "how are things", "whats up", "what's up", "sup", "hope you are good"],
    paragraphs: [
      "Running well, thanks for asking! More importantly, how can I help you today?",
      "Ask me about Savo's services, pricing, timelines, technology or offices, or pick a question below.",
    ],
  },
  {
    id: "ack",
    category: "Company",
    question: "Okay / got it",
    keywords: ["ok", "okay", "k", "kk", "hmm", "hm", "hmmm", "alright", "gotcha", "got it", "i see", "fine", "cool", "nice", "good one"],
    paragraphs: [
      "Great! Anything else you'd like to explore? Here are a few things people ask me next:",
    ],
  },
  {
    id: "yesno",
    category: "Company",
    question: "Yes / no",
    keywords: ["yes", "yeah", "yep", "yup", "sure", "no", "nope", "nah", "not really"],
    paragraphs: [
      "Got it! Tell me a little more about what you need, or pick one of these:",
    ],
  },
  {
    id: "botidentity",
    category: "Company",
    question: "Are you a bot?",
    keywords: ["are you a bot", "are you human", "are you real", "are you ai", "are you a robot", "who made you", "am i talking to a human", "is this a chatbot", "are you machine", "robot", "talking to a robot", "talking to a human", "talking to a person"],
    paragraphs: [
      "Honest answer: I'm the Savo Assistant, an AI, not a person. I answer from verified Savo site content only, and I won't pretend to be human.",
      "Whenever you want a real person from the team, the human chat is one tap away.",
    ],
  },
  {
    id: "capabilities",
    category: "Company",
    question: "What can you help with?",
    keywords: ["what can you do", "how can you help", "what do you know", "help me", "can you help", "help", "options", "what should i ask", "how does this work", "what is this"],
    paragraphs: [
      "I can answer anything about Savo, services (web, mobile, AI, software, SaaS, design, growth), pricing approach, timelines, our process, technologies, industries, offices and careers.",
      "And for anything personal to your project, I'll connect you to the team. Pick a question below or just type naturally.",
    ],
  },
];

/* Retrieval runs over site-truth entries AND conversational entries. */
const RETRIEVAL_SET: AssistantEntry[] = [...KNOWLEDGE, ...CONVERSATION_ENTRIES];

export function entryById(id: string): AssistantEntry | undefined {
  return RETRIEVAL_SET.find((e) => e.id === id);
}

/* Money words carry the strongest commercial intent - they outrank topic nouns. */
const INTENT_BOOST = new Set([
  "price", "pricing", "cost", "budget", "quote", "estimate", "charge", "fee", "money",
]);

/* Synonym expansion, a keyword concept matches any of its everyday
   phrasings, so "how much do you charge" hits cost without listing every
   word on the entry itself. Applied at module init, not per question. */
const SYNONYMS: Record<string, string[]> = {
  cost: ["price", "pricing", "fee", "fees", "charge", "charges", "rate", "rates", "expensive", "cheap", "quotation", "budget", "money", "costly"],
  timeline: ["long", "duration", "deadline", "fast", "soon", "quickly", "deliver", "delivery", "months", "weeks"],
  mobile: ["app", "apps", "android", "ios", "iphone", "flutter", "application", "applications"],
  web: ["website", "websites", "site", "sites", "portal", "web"],
  ai: ["llm", "gpt", "chatbot", "ml", "machine", "intelligence", "automation", "automate", "copilot"],
  design: ["ui", "ux", "figma", "interface", "usability", "prototype"],
  support: ["maintenance", "maintain", "retainer", "sla"],
  hosting: ["deploy", "deployment", "host", "server", "infrastructure", "devops", "cloud"],
  testing: ["qa", "quality", "bugs", "test"],
  integration: ["api", "apis", "webhook", "integrate", "sync"],
};

function expandedKeywords(entry: AssistantEntry): string[] {
  const out = [...entry.keywords];
  for (const kw of entry.keywords) {
    const extra = SYNONYMS[kw.toLowerCase()];
    if (extra) out.push(...extra);
  }
  return out;
}

/* Conversational short-circuit, "ok", "hmm", "yeah" as (nearly) the whole
   message map straight to the small-talk entries instead of scoring. */
const ACK_WORDS = new Set(["ok", "okay", "okey", "k", "kk", "okayy", "hmm", "hm", "hmmm", "hmmmm", "alright", "gotcha", "fine", "cool", "nice", "great", "good", "awesome", "perfect", "coolio", "understood"]);
/* Specific product nouns beat generic service words on ties: "ecommerce
   website" is an e-commerce question, not a generic web question. */
const STRONG_TOPICS = new Set([
  "saas", "mvp", "ecommerce", "erp", "crm", "seo", "aeo", "geo", "nda",
  "redesign", "migrate", "migration", "revamp", "shopify", "woocommerce",
  "kubernetes", "devops", "webhook", "gdpr", "internship", "intern",
  "healthcare", "fintech", "banking", "logistics", "government", "edtech",
  "manufacturing", "portfolio",
]);

const YESNO_WORDS = new Set(["yes", "yeah", "yep", "yup", "sure", "no", "nope", "nah", "maybe"]);

const ackEntry = (): AssistantEntry | null => {
  const found = CONVERSATION_ENTRIES.find((e) => e.id === "ack");
  return found ?? null;
};
const yesnoEntry = (): AssistantEntry | null => {
  const found = CONVERSATION_ENTRIES.find((e) => e.id === "yesno");
  return found ?? null;
};

/**
 * Deterministic retrieval: score every entry by keyword hits (word-boundary
 * aware, multi-word phrases weigh more, prefix stems count partial credit,
 * synonyms expand coverage). Best entry above threshold wins; conversational
 * short messages short-circuit to small-talk; anything else returns null →
 * honest human handoff.
 */
export function answerQuestion(input: string): AssistantEntry | null {
  const q = ` ${input.toLowerCase().replace(/[^a-z0-9$+'\s]/g, " ").replace(/\s+/g, " ").trim()} `;
  const tokens = q.trim().split(" ").filter(Boolean);
  if (q.trim().length < 1) return null;

  // Small-talk short-circuit for very short messages ("ok", "hmm yeah", "k")
  if (tokens.length <= 3) {
    const meaningful = tokens.filter((t) => t !== "i" && t !== "am" && t !== "a" && t !== "the");
    if (meaningful.length > 0 && meaningful.every((t) => ACK_WORDS.has(t))) {
      return ackEntry();
    }
    if (tokens.length <= 2 && YESNO_WORDS.has(tokens[0] ?? "")) {
      return yesnoEntry();
    }
  }

  let best: { entry: AssistantEntry; score: number } | null = null;

  for (const entry of RETRIEVAL_SET) {
    let score = 0;
    const kws = expandedKeywords(entry).map((k) => k.toLowerCase());
    const phrases = kws.filter((k) => k.includes(" "));
    const words = kws.filter((k) => !k.includes(" "));
    for (const ph of phrases) {
      if (q.includes(` ${ph} `) || q.includes(` ${ph}`)) score += 3;
    }
 // One credit per query token (best boost wins), "website" matching both
    // "web" and "website" counts once, keeping multi-keyword topics honest.
    for (const t of tokens) {
      let tokenBest = 0;
      for (const k of words) {
        if (t === k || (k.length >= 4 && t.startsWith(k))) {
          const boost = INTENT_BOOST.has(k) ? 4 : STRONG_TOPICS.has(k) ? 3 : 2;
          if (boost > tokenBest) tokenBest = boost;
        }
      }
      score += tokenBest;
    }
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }

  return best && best.score >= 2 ? best.entry : null;
}

/** Follow-ups: same category first, then one from each other category. */
export function followUps(entry: AssistantEntry, max = 4): AssistantEntry[] {
  const same = RETRIEVAL_SET.filter((e) => e.category === entry.category && e.id !== entry.id);
  const others = RETRIEVAL_SET.filter((e) => e.category !== entry.category);
  return [...same, ...others].slice(0, max);
}
