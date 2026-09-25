/**
 * Savo Assistant — the knowledge engine behind the Ask Savo chat.
 *
 * Deterministic FAQ retrieval over verified site truth (services, process,
 * pricing approach, offices, careers, contact promises). No invented claims:
 * every answer mirrors content published on the site; anything unmatched
 * falls through to a human handoff (enquiry pipeline) instead of a guess.
 *
 * Pure module — unit-tested in tests/assistant.test.ts.
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
    keywords: ["build", "do you do", "what do you", "what does savo", "services", "capabilities", "offer"],
    paragraphs: [
      "Six disciplines, one connected team: web experiences, mobile products, AI & intelligent systems, software & SaaS, product & experience design, and growth.",
      "Websites and web apps on Next.js and React; iOS and Android apps in Flutter or React Native; AI agents, RAG systems and copilots in production, plus the design and growth work that keeps them improving after launch.",
    ],
    links: [
      { label: "Explore services", href: "/#services" },
      { label: "Industries we serve", href: "/#industries" },
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
      { label: "AI & intelligent systems", href: "/#ai" },
      { label: "Start an AI project", href: "/#start" },
    ],
  },
  {
    id: "web",
    category: "Services",
    question: "Do you build websites and web apps?",
    keywords: ["website", "web", "site", "portal", "next", "react", "ecommerce", "store", "shop", "landing", "pwa", "headless"],
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
    keywords: ["cost", "price", "pricing", "much", "budget", "quote", "estimate", "charge", "fee", "money", "$", "rate"],
    paragraphs: [
      "It depends on scope, and we are straight about it. Most engagements fall between $5k and $100k+, and you always see a fixed-scope proposal with a fixed price before any work starts.",
      "Tell us what you are building and a senior consultant replies within one business day with a realistic range, no discovery paywall.",
    ],
    links: [{ label: "Start a project", href: "/#start" }],
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
    links: [{ label: "Our methodology", href: "/#methodology" }],
  },
  {
    id: "scope",
    category: "Process & pricing",
    question: "What if the scope changes mid-project?",
    keywords: ["scope", "change", "changes", "mid-project", "new ideas", "extra", "added", "flexible"],
    paragraphs: [
      "The agreed price never moves mid-scope. New ideas go into a follow-up scope with its own fixed price, agreed before work starts, in writing.",
    ],
    links: [{ label: "Start a project", href: "/#start" }],
  },

  /* ------------------------------ Company ----------------------------- */
  {
    id: "who",
    category: "Company",
    question: "Who is Savo Technologies?",
    keywords: ["who is savo", "about", "savo", "agency", "background", "history", "experience", "old"],
    paragraphs: [
      "An independent digital product and technology company, web platforms, mobile apps and AI systems, engineered by one accountable team since 2016.",
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
          "The engineering headquarters is in Indore, India — that is where the team works every day.",
          "Beyond India, Savo supports engagements across Switzerland and Europe, Saudi Arabia and the GCC, Australia, the United Kingdom and the United States. These are market/service presences — confirmed office locations publish as each region supplies a verified address.",
        ]
      : [
          "The engineering headquarters is in Indore, India — that is where the team works every day.",
          "Beyond India, Savo serves clients worldwide. Confirmed office locations publish as each region supplies a verified address.",
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

  /* ------------------------------ Careers ----------------------------- */
  {
    id: "careers",
    category: "Careers",
    question: "Are you hiring?",
    keywords: ["hiring", "job", "jobs", "career", "careers", "vacancy", "openings", "positions", "apply", "role"],
    paragraphs: [
      "We hire engineers and designers who are curious, ship weekly and check their ego in, remote first across India, INR salaries.",
      "Applications get an engineer-read review and a personal reply within two business days. Four steps to a written offer, including a paid pairing session.",
    ],
    links: [
      { label: "Open roles", href: "/careers" },
      { label: "Apply now", href: "/careers/apply/" },
    ],
  },
];

/* Initial chip set — one strong question per category, plus the human path */
export const INITIAL_SUGGESTIONS = ["build", "cost", "ai", "start", "where", "careers"] as const;

export const HUMAN_CHIP = "talk-human" as const;

export function entryById(id: string): AssistantEntry | undefined {
  return KNOWLEDGE.find((e) => e.id === id);
}

/* Money words carry the strongest commercial intent — they outrank topic nouns. */
const INTENT_BOOST = new Set([
  "price", "pricing", "cost", "budget", "quote", "estimate", "charge", "fee", "money",
]);

/**
 * Deterministic retrieval: score every entry by keyword hits (word-boundary
 * aware, multi-word phrases weigh more). Best entry above threshold wins;
 * anything else returns null → honest human handoff.
 */
export function answerQuestion(input: string): AssistantEntry | null {
  const q = ` ${input.toLowerCase().replace(/[^a-z0-9$+\s]/g, " ").replace(/\s+/g, " ").trim()} `;
  if (q.trim().length < 2) return null;

  let best: { entry: AssistantEntry; score: number } | null = null;

  for (const entry of KNOWLEDGE) {
    let score = 0;
    for (const kw of entry.keywords) {
      const k = kw.toLowerCase();
      if (k.includes(" ")) {
        if (q.includes(` ${k} `) || q.includes(` ${k}`)) score += 3;
      } else if (q.includes(` ${k} `)) {
        score += INTENT_BOOST.has(k) ? 4 : 2;
      } else if (q.includes(k) && k.length >= 5) {
        score += 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }

  return best && best.score >= 2 ? best.entry : null;
}

/** Follow-ups: same category first, then one from each other category. */
export function followUps(entry: AssistantEntry, max = 3): AssistantEntry[] {
  const same = KNOWLEDGE.filter((e) => e.category === entry.category && e.id !== entry.id);
  const others = KNOWLEDGE.filter((e) => e.category !== entry.category);
  return [...same, ...others].slice(0, max);
}
