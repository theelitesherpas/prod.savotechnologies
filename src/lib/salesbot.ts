/**
 * Savo SalesBot - the live demo engine behind /ai-agents/salesbot.
 *
 * A deterministic conversational sales agent: intent classification,
 * entity extraction (need, budget, timeline), slot-filling across a
 * qualification state machine, service matching against Savo's real
 * catalogue, guardrails (no invented pricing, human escalation), and a
 * CRM-ready structured handoff brief. Every turn also exposes its
 * internal state - stage, slots, lead score - so the demo shows the
 * agent thinking, not a script pretending to think.
 *
 * Pure module - unit-tested in tests/salesbot.test.ts.
 */

export type SalesbotStage =
  | "greet"
  | "discover"
  | "qualify-budget"
  | "qualify-timeline"
  | "recommend"
  | "qna"
  | "brief";

export type SalesbotSlots = {
  need: string | null;
  budget: string | null;
  budgetBand: "under-5k" | "5k-25k" | "25k-plus" | "undisclosed" | null;
  timeline: string | null;
  urgency: "urgent" | "this-quarter" | "exploring" | null;
  services: string[];
  contact: string | null;
};

export type SalesbotTurn = {
  reply: string;
  stage: SalesbotStage;
  nextStage: SalesbotStage;
  slots: SalesbotSlots;
  suggestions: string[];
  intent: string;
  leadScore: number;
  leadLabel: "Cold" | "Warm" | "Hot";
  brief: SalesbotBrief | null;
};

export type SalesbotBrief = {
  need: string;
  services: { title: string; why: string }[];
  budget: string;
  timeline: string;
  leadLabel: string;
  summary: string;
};

export type SalesbotSession = {
  id: string;
  stage: SalesbotStage;
  slots: SalesbotSlots;
  turns: number;
  transcript: { role: "user" | "bot"; text: string }[];
  createdAt: number;
  updatedAt: number;
};

/* ── Savo service catalogue for matching (mirror of the public site) ── */

const SERVICE_MATCHERS: { title: string; why: string; keywords: string[] }[] = [
  { title: "Web Development", why: "Marketing sites, portals and storefronts on Next.js, built for speed and search.", keywords: ["website", "web site", "web app", "web application", "portal", "storefront", "ecommerce", "e-commerce", "online store", "store", "shop", "landing", "site", "cms", "next.js", "react"] },
  { title: "Mobile App Development", why: "iOS and Android from one Flutter or React Native codebase, shipped to both stores.", keywords: ["mobile", "app", "ios", "android", "flutter", "react native", "play store", "app store", "phone"] },
  { title: "AI Agent Development", why: "Agents like this one, copilots and RAG systems, guarded and observable in production.", keywords: ["ai", "agent", "chatbot", "bot", "llm", "gpt", "rag", "copilot", "automation", "intelligent", "machine learning", "ml"] },
  { title: "Custom Software Development", why: "Portals, SaaS products and internal systems shaped around how you operate.", keywords: ["custom software", "saas", "erp", "crm", "internal tool", "dashboard", "back office", "platform", "system"] },
  { title: "UI/UX Design", why: "Research, interface systems and prototypes that make complex products obvious.", keywords: ["design", "ui", "ux", "figma", "prototype", "redesign", "brand", "interface", "usability"] },
  { title: "Digital Marketing & SEO", why: "Search, answer engines and conversion work that compounds after launch.", keywords: ["seo", "marketing", "growth", "ads", "campaign", "content", "lead gen", "traffic", "aeo", "analytics"] },
];

/* ── Entity extraction ─────────────────────────────────────────────── */

const BUDGET_PATTERNS: { re: RegExp; band: NonNullable<SalesbotSlots["budgetBand"]>; label: string }[] = [
  { re: /\b(?:under|below|less than|max|up to|budget of)?\s*(?:₹|rs\.?|inr)?\s*([1-4](?:\.\d+)?)\s*(?:l|lakh|lac|lakhs)\b/i, band: "under-5k", label: "under $5k" },
  { re: /\$\s*[1-4](?:\.\d+)?\s*k\b/i, band: "under-5k", label: "under $5k" },
  { re: /\b(?:under|below|less than)\s*\$?\s*5\s*k\b/i, band: "under-5k", label: "under $5k" },
  { re: /\b(?:₹|rs\.?|inr)?\s*([5-9]|1[0-9]|2[0-5])(?:\.\d+)?\s*(?:l|lakh|lac|lakhs)\b/i, band: "5k-25k", label: "$5k to $25k" },
  { re: /\$\s*(?:5|6|7|8|9)(?:,\d{3})?\s*k?\b|\$\s*(?:1[0-9]|2[0-5])(?:,\d{3})?\s*k\b/i, band: "5k-25k", label: "$5k to $25k" },
  { re: /\$\s*(?:2[6-9]|[3-9]\d|\d{3,})(?:,\d{3})?\s*k?\b/i, band: "25k-plus", label: "$25k+" },
  { re: /\b(?:₹|rs\.?|inr)?\s*(?:2[6-9]|[3-9]\d|\d{2,})\s*(?:l|lakh|lac|lakhs)\b/i, band: "25k-plus", label: "$25k+" },
  { re: /\b(?:not sure|unknown|no budget|flexible|undecided|don'?t know|no idea|discuss)\b/i, band: "undisclosed", label: "to be discussed" },
];

const TIMELINE_PATTERNS: { re: RegExp; urgency: NonNullable<SalesbotSlots["urgency"]>; label: string }[] = [
  { re: /\b(?:asap|immediately|urgent|urgently|right away|this week|yesterday|right now|quickly)\b/i, urgency: "urgent", label: "Urgent (this week)" },
  { re: /\b(?:this month|next month|few weeks|2 weeks|3 weeks|30 days|4 weeks|six weeks|1 month|one month)\b/i, urgency: "urgent", label: "Within a month" },
  { re: /\b(?:this quarter|next quarter|q[1-4]|2 months|3 months|couple of months|by summer|by fall)\b/i, urgency: "this-quarter", label: "This quarter" },
  { re: /\b(?:exploring|just looking|research|researching|no rush|later|next year|sometime|eventually|early stages|planning)\b/i, urgency: "exploring", label: "Exploring" },
];

export function extractServices(text: string): string[] {
  const t = ` ${text.toLowerCase()} `;
  const hits = new Set<string>();
  for (const s of SERVICE_MATCHERS) {
    if (s.keywords.some((k) => t.includes(` ${k}`) || t.includes(`${k} `) || t.includes(k))) {
      hits.add(s.title);
    }
  }
  // avoid the generic 'app' keyword capturing inside 'application for a job'
  if (hits.has("Mobile App Development") && /\b(job|hiring|career|resume|vacancy|apply)\b/i.test(text)) {
    hits.delete("Mobile App Development");
  }
  return [...hits].slice(0, 3);
}

export function extractBudget(text: string): { band: NonNullable<SalesbotSlots["budgetBand"]>; label: string } | null {
  for (const p of BUDGET_PATTERNS) {
    const m = text.match(p.re);
    if (m) return { band: p.band, label: p.label };
  }
  return null;
}

export function extractTimeline(text: string): { urgency: NonNullable<SalesbotSlots["urgency"]>; label: string } | null {
  for (const p of TIMELINE_PATTERNS) {
    if (p.re.test(text)) return { urgency: p.urgency, label: p.label };
  }
  return null;
}

/* ── Guardrailed knowledge answers (site truth only) ───────────────── */

const QA: { id: string; keywords: string[]; answer: string; links?: { label: string; href: string }[] }[] = [
  {
    id: "pricing",
    keywords: ["price", "pricing", "cost", "how much", "charge", "rate", "quote", "budget do you", "expensive"],
    answer:
      "Honest answer: I don't quote numbers, because a real estimate needs your scope. Savo prices fixed-scope engagements after a short discovery - and the estimate arrives with the architecture, not after. Ballpark thinking: smaller product work and websites sit at the lower end, full platforms and AI systems higher. Want the real number? I can hand you to a senior consultant at the end of this chat.",
  },
  {
    id: "process",
    keywords: ["process", "how do you work", "steps", "methodology", "how it works", "delivery", "sprint", "timeline do you"],
    answer:
      "The delivery rhythm is the same every time: a one-document brief, a blueprint with honest estimates, weekly slices you can click, then ship-measure-improve. You always know exactly who is building your software and why.",
    links: [{ label: "How we run projects", href: "/#method" }],
  },
  {
    id: "ai",
    keywords: ["ai", "agent", "llm", "gpt", "chatbot", "automation", "rag", "copilot", "machine learning"],
    answer:
      "AI at Savo is production engineering: agents (like me), copilots, RAG knowledge systems and document pipelines, connected to your real systems with guardrails, human oversight and evaluation from the first sprint. A first agent typically deploys in 2 to 4 weeks.",
    links: [{ label: "The agent fleet", href: "/ai-agents" }],
  },
  {
    id: "tech",
    keywords: ["tech stack", "technology", "next.js", "react", "flutter", "aws", "hosting", "stack", "database", "postgres"],
    answer:
      "The defaults: Next.js and React for web, Flutter or React Native for mobile, Node.js and PostgreSQL behind, cloud-native deployment. Chosen for the load-bearing walls - proven technology where it counts.",
  },
  {
    id: "who",
    keywords: ["who are you", "about savo", "company", "where are you", "indore", "switzerland", "team", "how big"],
    answer:
      "Savo Technologies: an independent digital product and technology company, building since 2015. Headquarters in Indore, a Switzerland office, and clients across six regions. One accountable team from brief to run.",
    links: [{ label: "About Savo", href: "/about" }],
  },
  {
    id: "careers",
    keywords: ["job", "hiring", "career", "vacancy", "internship", "resume", "position", "opening", "apply for a job"],
    answer:
      "That's the HR desk, not mine - but I can point you: open roles live at savotechnologies.com/careers, and hr@savotechnologies.com reaches the hiring team directly. Now, back to what you're building?",
    links: [{ label: "Careers", href: "/careers" }],
  },
];

function matchQA(text: string): { id: string; keywords: string[]; answer: string; links?: { label: string; href: string }[] } | null {
  const t = text.toLowerCase();
  let best: { entry: (typeof QA)[number]; score: number } | null = null;
  for (const entry of QA) {
    const score = entry.keywords.filter((k) => t.includes(k)).length;
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }
  return best?.entry ?? null;
}

/* ── Lead scoring ──────────────────────────────────────────────────── */

export function scoreLead(slots: SalesbotSlots): { score: number; label: "Cold" | "Warm" | "Hot" } {
  let s = 0;
  if (slots.need) s += 20;
  if (slots.services.length > 0) s += 20;
  if (slots.services.length > 1) s += 5;
  if (slots.budget && slots.budgetBand !== "undisclosed") s += 20;
  if (slots.budgetBand === "undisclosed") s += 8;
  if (slots.timeline) s += 15;
  if (slots.urgency === "urgent") s += 15;
  else if (slots.urgency === "this-quarter") s += 8;
  const score = Math.min(100, s);
  const label = score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";
  return { score, label };
}

/* ── The state machine ─────────────────────────────────────────────── */

export function newSession(id: string): SalesbotSession {
  const now = Date.now();
  return { id, stage: "greet", slots: emptySlots(), turns: 0, transcript: [], createdAt: now, updatedAt: now };
}

export function emptySlots(): SalesbotSlots {
  return { need: null, budget: null, budgetBand: null, timeline: null, urgency: null, services: [], contact: null };
}

const GREETING =
  "Hello. I'm Savo SalesBot - the agent Savo deploys to qualify inbound leads, answer product questions and book conversations with the right engineer. This is my live demo: everything I extract from our chat appears on the right, in real time.\n\nTo start the qualification the way I would with a real visitor: what are you looking to build or solve?";

const DISCOVERY_PROMPT = "Got it. What outcome does the business need from it - more enquiries, an internal tool that saves hours, a product to sell? One sentence is enough.";

export function step(session: SalesbotSession, message: string): SalesbotTurn {
  const slots: SalesbotSlots = { ...session.slots, services: [...session.slots.services] };
  const text = message.trim();
  const lower = text.toLowerCase();
  let intent = "statement";
  let reply = "";
  let stage = session.stage;
  let nextStage = session.stage;
  const suggestions: string[] = [];

  const isQuestion = /\?\s*$/.test(text) || /^(what|how|who|when|where|why|do you|can you|are you|is it|does savo|tell me)/i.test(text);
  const isGreeting = /^(hi|hello|hey|good (morning|afternoon|evening)|namaste)\b/i.test(lower);

  // ── intent classification ──
  if (isGreeting && session.turns === 0) intent = "greeting";
  else if (isQuestion) intent = "question";
  else if (/^(yes|yeah|yep|sure|ok|okay|sounds good|correct|right|please do|go ahead)\b/i.test(lower)) intent = "affirm";
  else if (/^(no|nope|not really|nah|later)\b/i.test(lower)) intent = "decline";
  else if (/\b(restart|start over|reset)\b/i.test(lower)) intent = "restart";

  // ── entity extraction (runs on every turn, any stage) ──
  const services = extractServices(text);
  for (const s of services) if (!slots.services.includes(s)) slots.services.push(s);
  const budget = extractBudget(text);
  if (budget) {
    slots.budget = budget.label;
    slots.budgetBand = budget.band;
  }
  const timeline = extractTimeline(text);
  if (timeline) {
    slots.timeline = timeline.label;
    slots.urgency = timeline.urgency;
  }

  if (intent === "restart") {
    const fresh = emptySlots();
    Object.assign(slots, fresh);
    stage = "greet";
    nextStage = "discover";
    reply = "Session reset. What are you looking to build or solve?";
    return turn(reply, intent, slots, stage, nextStage, ["I need a new website", "We want an AI chatbot", "A mobile app for our field team"], session);
  }

  // ── stage machine ──
  switch (stage) {
    case "greet": {
      if (intent === "greeting") {
        reply = GREETING.split("\n\n")[0] + "\n\nWhat are you looking to build or solve?";
        nextStage = "discover";
        suggestions.push("A new company website", "An AI agent like you", "A mobile app");
      } else {
        slots.need = text.slice(0, 240);
        reply = DISCOVERY_PROMPT;
        nextStage = "qualify-budget";
        suggestions.push("More customer enquiries", "Automate manual work", "A product to sell");
      }
      break;
    }

    case "discover":
    case "qualify-budget": {
      if (stage === "discover" && !slots.need) slots.need = text.slice(0, 240);
      if (stage === "qualify-budget" && !slots.need && intent === "statement") slots.need = text.slice(0, 240);

      if (stage === "discover" && !slots.budget && intent !== "question") {
        // discovery answer → move to budget
        reply = slots.services.length
          ? `Understood - ${slots.services[0].toLowerCase()} it is. Two quick qualification questions and I'll match you to the right engagement. First: do you have a budget range in mind? A band is fine ("under $5k", "$10k-ish", "not sure yet").`
          : "Noted. Two quick qualification questions and I'll match you to the right engagement. First: do you have a budget range in mind? A band is fine (\"under $5k\", \"$10k-ish\", \"not sure yet\").";
        nextStage = "qualify-budget";
        suggestions.push("Around $10k", "₹15 lakhs", "Not sure yet");
        break;
      }
      if (slots.budget || intent === "decline") {
        if (!slots.budget) {
          slots.budget = "not stated";
          slots.budgetBand = "undisclosed";
        }
        reply = `${slots.timeline ? "Good - " : ""}And timeline: when does this need to be live? "Yesterday", this quarter, or still exploring?`;
        nextStage = "qualify-timeline";
        suggestions.push("ASAP - it's urgent", "This quarter", "Just exploring");
        break;
      }
      // unanswered budget question at qualify-budget stage
      reply = "Noted. On budget, even a rough band helps me route you correctly: under $5k, $5-25k, $25k+, or \"not sure yet\" - all valid answers.";
      nextStage = "qualify-budget";
      suggestions.push("Under $5k", "$5k to $25k", "Not sure yet");
      break;
    }

    case "qualify-timeline": {
      if (slots.timeline || intent === "decline") {
        if (!slots.timeline) slots.timeline = "not stated";
        if (slots.services.length === 0) {
          reply = "Thanks. One more thing so my recommendation is precise: which of these is closest to the work - a website or platform, a mobile app, an AI agent or automation, custom software, design, or growth/SEO?";
          nextStage = "recommend";
          suggestions.push("Website or platform", "AI agent", "Custom software");
          break;
        }
        stage = "recommend";
        // fall through to recommend handling below
        return recommendTurn(slots, session);
      }
      reply = "Understood. Timeline-wise: urgent, this quarter, or still exploring the idea?";
      nextStage = "qualify-timeline";
      suggestions.push("Urgent", "This quarter", "Exploring");
      break;
    }

    case "recommend":
    case "qna": {
      if (intent === "question" || stage === "qna") {
        const qa = matchQA(text);
        if (qa) {
          intent = `question:${qa.id}`;
          reply = qa.answer;
          const { score, label } = scoreLead(slots);
          if (score >= 40 || session.turns >= 4) {
            reply += "\n\nAnything else I can answer - or shall I put the qualification brief together?";
            suggestions.push("Build the brief", "How do you price?", "What's your process?");
            nextStage = "qna";
          } else {
            nextStage = "qna";
            suggestions.push("Build the brief", "What tech do you use?");
          }
          break;
        }
        // unmatched question → guardrail: honest deflection
        intent = "question:unmatched";
        reply = "That one's outside my approved knowledge, and I don't guess - inventing answers is how agents lose trust. A senior consultant replies within one business day with the real answer; I'll flag it in the handoff brief. Meanwhile: pricing, process, tech stack, AI capability and who Savo is - all fair game.";
        suggestions.push("How do you price?", "What's your process?", "Build the brief");
        nextStage = "qna";
        break;
      }
      if (/brief|summary|handoff|recommend|next step|what.*(recommend|suggest)|proposal/i.test(lower) || intent === "affirm") {
        return recommendTurn(slots, session);
      }
      // statements still slot-fill
      if (services.length || budget || timeline) {
        const { score, label } = scoreLead(slots);
        reply = `Captured: ${[
          slots.services.length ? `services (${slots.services.length})` : null,
          budget ? "budget" : null,
          timeline ? "timeline" : null,
        ]
          .filter(Boolean)
          .join(", ")}. ${score >= 40 ? "Ready for me to assemble the handoff brief?" : "Keep going, or ask me anything."}`;
        nextStage = "qna";
        suggestions.push("Build the brief", "How do you price?");
        break;
      }
      reply = "Happy to keep qualifying. Tell me more about the need, or say \"build the brief\" when you want the structured handoff.";
      suggestions.push("Build the brief", "How do you price?", "Who is Savo?");
      nextStage = "qna";
      break;
    }

    case "brief":
    default: {
      // After the brief, the agent stays available: questions get guarded
      // answers, "restart" resets, anything else re-offers the handoff.
      if (intent === "question" || intent.startsWith("question:")) {
        stage = "qna";
        return step({ ...session, stage: "qna" }, text);
      }
      return recommendTurn(slots, session);
    }
  }

  return turn(reply, intent, slots, stage, nextStage, suggestions, session);
}

function recommendTurn(slots: SalesbotSlots, session: SalesbotSession): SalesbotTurn {
  const matched = (slots.services.length ? slots.services : inferServices(slots)).map((title) => {
    const m = SERVICE_MATCHERS.find((s) => s.title === title);
    return { title, why: m?.why ?? "Matched from your stated need." };
  });
  const { score, label } = scoreLead(slots);
  const brief: SalesbotBrief = {
    need: slots.need ?? "(not stated in this session)",
    services: matched.slice(0, 3),
    budget: slots.budget ?? "not stated",
    timeline: slots.timeline ?? "not stated",
    leadLabel: label,
    summary:
      `Inbound lead, qualified by SalesBot. Need: ${slots.need ?? "not stated"}. Matched services: ${matched.map((m) => m.title).join(", ") || "none matched"}. Budget ${slots.budget ?? "not stated"}, timeline ${slots.timeline ?? "not stated"}. Lead score ${score}/100 (${label}). Recommended next step: ${label === "Hot" ? "same-day senior consultant call" : "reply within one business day"}.`,
  };
  const reply =
    `Qualification complete - here's the structured handoff brief, exactly as I would deliver it to the CRM:\n\n` +
    `Need: ${brief.need}\nMatched services: ${brief.services.map((s) => s.title).join(", ") || "-"}\nBudget: ${brief.budget} · Timeline: ${brief.timeline}\nLead score: ${score}/100 (${label})\n\n` +
    `On the live deployment this syncs to your CRM with the full transcript, books the meeting and routes it to the right rep. Here in the demo: the brief is rendered on the right, ready to hand on.`;
  return turn(reply, "brief", slots, "recommend", "brief", ["Start again"], session, brief);
}

function inferServices(slots: SalesbotSlots): string[] {
  if (!slots.need) return [];
  const fromNeed = extractServices(slots.need);
  return fromNeed.length ? fromNeed : ["Web Development"];
}

function turn(
  reply: string,
  intent: string,
  slots: SalesbotSlots,
  stage: SalesbotStage,
  nextStage: SalesbotStage,
  suggestions: string[],
  session: SalesbotSession,
  brief: SalesbotBrief | null = null,
): SalesbotTurn {
  const { score, label } = scoreLead(slots);
  return { reply, stage, nextStage, slots, suggestions: [...new Set(suggestions)].slice(0, 3), intent, leadScore: score, leadLabel: label, brief };
}
