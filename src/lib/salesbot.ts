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
  /** Attempts remaining in the current stage after this turn. */
  stageAttempts: number;
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
  /** Consecutive non-productive turns in the current stage - powers the
   *  never-loop guarantee: after 2, the agent accepts and moves on. */
  stageAttempts: number;
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

/**
 * Budget extraction - normalizes currencies and ranges before banding.
 * Bands (site-honest): under $5k ~ under ₹4L · $5-25k ~ ₹4-20L · $25k+.
 * `expectBudget` allows bare numbers ("10k") when we just asked for one.
 */
function normalizeMoney(t: string): string {
  return t
    // symbol AFTER the amount ("10k usd", "15 lakh rupees") → before it
    .replace(/(\d[\d.,]*\s*(?:k|thousand|million|lakh|crore)?)\s*(?:usd|dollars?|bucks)\b/gi, "$$$1")
    .replace(/(\d[\d.,]*\s*(?:k|thousand|lakh|crore)?)\s*(?:rupees?|rs\.?|inr)\b/gi, "₹$1")
    .replace(/\b(usd|dollars?|bucks)\b/gi, "$")
    .replace(/\b(rupees?|rs\.?|inr)\b/gi, "₹")
    .replace(/\b(lacs?|lakhs?)\b/gi, "lakh")
    .replace(/\b(crores?)\b/gi, "crore")
    .replace(/[–—]/g, "-");
}

const D = "(\\d+(?:\\.\\d+)?)";
const RANGE = `${D}\\s*(?:-|to)\\s*(?:${D}\\s*)?`;
const K_BAND = (upper: number): NonNullable<SalesbotSlots["budgetBand"]> =>
  upper < 5 ? "under-5k" : upper <= 25 ? "5k-25k" : "25k-plus";
const L_BAND = (upperL: number): NonNullable<SalesbotSlots["budgetBand"]> =>
  upperL < 4 ? "under-5k" : upperL <= 20 ? "5k-25k" : "25k-plus";
const BAND_LABEL: Record<NonNullable<SalesbotSlots["budgetBand"]>, string> = {
  "under-5k": "under $5k",
  "5k-25k": "$5k to $25k",
  "25k-plus": "$25k+",
  undisclosed: "to be discussed",
};

export function extractBudget(
  text: string,
  opts?: { expectBudget?: boolean },
): { band: NonNullable<SalesbotSlots["budgetBand"]>; label: string } | null {
  const t = normalizeMoney(text);

  // explicit "not sure / flexible / discuss" family
  if (/\b(?:not sure|no budget|flexible|undecided|don'?t know|dunno|no idea|no clue|to be discussed|discuss|depends)\b/i.test(t)) {
    return { band: "undisclosed", label: BAND_LABEL.undisclosed };
  }

  // dollar ranges: $5-25k, $5k-$25k, $10 to $30k
  let m = t.match(new RegExp(`\\$\\s*${RANGE}k?\\b`, "i"));
  if (m) {
    const upper = parseFloat(m[2] || m[1]);
    if (!Number.isNaN(upper)) return { band: K_BAND(upper), label: BAND_LABEL[K_BAND(upper)] };
  }
  // dollar singles: $10k, $12,000, under/over $4k
  m = t.match(new RegExp(`(?:under|below|less than|max|up to|over|above|more than|around|about|approx|budget of)?\\s*\\$\\s*${D}\\s*(k)?\\b`, "i"));
  if (m) {
    let v = parseFloat(m[1]);
    if (m[2] !== "k" && v >= 1000) v = v / 1000; // $12,000 written plainly
    if (!Number.isNaN(v)) return { band: K_BAND(v), label: BAND_LABEL[K_BAND(v)] };
  }
  // lakh ranges: ₹8-10 lakh, 5 to 6 lakh, 15-20 lakh
  m = t.match(new RegExp(`(?:₹\\s*)?${RANGE}lakh\\b`, "i"));
  if (m) {
    const upper = parseFloat(m[2] || m[1]);
    if (!Number.isNaN(upper)) return { band: L_BAND(upper), label: BAND_LABEL[L_BAND(upper)] };
  }
  // lakh singles: ₹3 lakhs, 12 lakh, around ₹7 lakh
  m = t.match(new RegExp(`(?:₹\\s*)?${D}\\s*(?:lakh|l)\\b`, "i"));
  if (m) {
    const v = parseFloat(m[1]);
    if (!Number.isNaN(v)) return { band: L_BAND(v), label: BAND_LABEL[L_BAND(v)] };
  }
  // crore: 1 crore, ₹1.5 crore
  m = t.match(new RegExp(`(?:₹\\s*)?${D}\\s*crore\\b`, "i"));
  if (m) return { band: "25k-plus", label: BAND_LABEL["25k-plus"] };
  // absolute rupees: ₹50,000 / 50000 / ₹800000 (>= ₹40k treated as budget)
  m = t.match(new RegExp(`₹\\s*${D}(?:,(\\d{3}))*(?:\\s*(?:k|thousand))?\\b`, "i")) || t.match(new RegExp(`\\b${D}(?:,(\\d{3}))+\\b`));
  if (m) {
    const raw = t.match(/([\d,]+(?:\.\d+)?)/g);
    const v = raw ? parseFloat(raw[0].replace(/,/g, "")) : NaN;
    if (!Number.isNaN(v)) {
      const l = v >= 100000 ? v / 100000 : v / 100000; // rupees → lakh
      return { band: L_BAND(l), label: BAND_LABEL[L_BAND(l)] };
    }
  }
  // bare k values ("10k") - only when a budget was just requested or the
  // message mentions spending
  if (opts?.expectBudget || /budget|spend|spending|invest|cost/i.test(t)) {
    m = t.match(new RegExp(`(?:under|below|less than|over|above|around|about|approx)?\\s*\\b${D}\\s*k\\b`, "i"));
    if (m) {
      const v = parseFloat(m[1]);
      if (!Number.isNaN(v)) return { band: K_BAND(v), label: BAND_LABEL[K_BAND(v)] };
    }
  }
  return null;
}

const TIMELINE_PATTERNS: { re: RegExp; urgency: NonNullable<SalesbotSlots["urgency"]>; label: string }[] = [
  { re: /\b(?:asap|as soon as possible|immediately|urgent|urgently|right away|this week|next week|yesterday|right now|quickly|emergency)\b/i, urgency: "urgent", label: "Urgent (days)" },
  { re: /\b(?:this month|next month|few weeks|1 week|2 weeks|3 weeks|4 weeks|30 days|six weeks|1 month|one month|2 months|two months)\b/i, urgency: "urgent", label: "Within weeks" },
  { re: /\b(?:this quarter|next quarter|q[1-4]|3 months|couple of months|by diwali|before (?:diwali|christmas|new year)|end of (?:the )?year|few months)\b/i, urgency: "this-quarter", label: "This quarter" },
  { re: /\b(?:exploring|just looking|research|researching|no rush|later|next year|sometime|eventually|early stages|planning|not decided|no timeline)\b/i, urgency: "exploring", label: "Exploring" },
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
  return { id, stage: "greet", slots: emptySlots(), turns: 0, stageAttempts: 0, transcript: [], createdAt: now, updatedAt: now };
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
  const budget = extractBudget(text, { expectBudget: stage === "qualify-budget" });
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
  const attempts = session.stageAttempts || 0;
  const bumpAttempt = () => Math.min(attempts + 1, 2);

  // Questions are answered at ANY stage first (guardrails apply), then
  // the agent returns to its qualification thread.
  if (intent === "question" && stage !== "qna" && stage !== "brief") {
    const qa = matchQA(text);
    const answer = qa
      ? qa.answer
      : "That one's outside my approved knowledge, and I don't guess - a senior consultant replies within one business day with the real answer.";
    const backTo =
      stage === "qualify-budget"
        ? "\n\nBack to it: your budget band - under $5k, $5-25k, $25k+, or \"not sure yet\"?"
        : stage === "qualify-timeline"
          ? "\n\nBack to it: urgent, this quarter, or still exploring?"
          : stage === "discover"
            ? "\n\nSo - what are you looking to build or solve?"
            : "";
    return turn(answer + backTo, qa ? `question:${qa.id}` : "question:unmatched", slots, stage, stage, suggestionsFor(stage), session, null, bumpAttempt());
  }

  // A bare "yes / ok / sure" during qualification = not sure yet. Move on.
  if (intent === "affirm" && (stage === "qualify-budget" || stage === "qualify-timeline")) {
    if (stage === "qualify-budget") {
      slots.budget = "to be discussed";
      slots.budgetBand = "undisclosed";
      reply = "No problem - I'll mark budget as to-be-discussed, the consultant will shape it with you. And timeline: urgent, this quarter, or still exploring?";
      nextStage = "qualify-timeline";
    } else {
      slots.timeline = "not stated";
      reply = "Noted - I'll leave the timeline open. Let me put the recommendation together.";
      nextStage = slots.services.length ? "recommend" : "qualify-timeline";
      if (nextStage === "recommend") return recommendTurn(slots, { ...session, stageAttempts: 0 });
    }
    return turn(reply, intent, slots, stage, nextStage, suggestionsFor(nextStage), session, null, 0);
  }

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
      if (!slots.need && intent === "statement" && text.length > 12) slots.need = text.slice(0, 240);

      if (slots.budget || intent === "decline") {
        if (!slots.budget) {
          slots.budget = "to be discussed";
          slots.budgetBand = "undisclosed";
        }
        reply = `And timeline: when does this need to be live - urgent, this quarter, or still exploring?`;
        nextStage = "qualify-timeline";
        suggestions.push("Urgent", "This quarter", "Just exploring");
        break;
      }

      // Escape after two unproductive turns: accept and move on, never loop.
      if (attempts >= 1) {
        slots.budget = "not stated";
        slots.budgetBand = "undisclosed";
        reply = "Let's not belabour the budget - I'll mark it open and keep qualifying. Timeline: urgent, this quarter, or still exploring?";
        nextStage = "qualify-timeline";
        suggestions.push("Urgent", "This quarter", "Exploring");
        return turn(reply, intent, slots, stage, nextStage, suggestions, session, null, 0);
      }

      reply = `Got it. Budget-wise, even a rough band helps me route you: under $5k, $5k to $25k, $25k+, or "not sure yet" - all valid answers.`;
      return turn(reply, intent, slots, stage, "qualify-budget", ["Around $10k", "₹8-10 lakh", "Not sure yet"], session, null, bumpAttempt());
    }

    case "qualify-timeline": {
      if (slots.timeline || intent === "decline") {
        if (!slots.timeline) slots.timeline = "not stated";
        if (slots.services.length === 0) {
          reply = "Thanks. One more so my recommendation is precise: which is closest - a website or platform, a mobile app, an AI agent or automation, custom software, design, or growth/SEO?";
          nextStage = "recommend";
          suggestions.push("Website or platform", "AI agent", "Custom software");
          break;
        }
        return recommendTurn(slots, { ...session, stageAttempts: 0 });
      }

      if (attempts >= 1) {
        slots.timeline = "not stated";
        reply = "I'll leave the timeline open - no problem. Let me put the recommendation together.";
        nextStage = slots.services.length ? "recommend" : "qualify-timeline";
        if (nextStage === "recommend") return recommendTurn(slots, { ...session, stageAttempts: 0 });
        return turn(reply, intent, slots, stage, nextStage, ["Website or platform", "AI agent", "Custom software"], session, null, 0);
      }

      return turn("Understood. Timeline-wise: urgent, this quarter, or still exploring the idea?", intent, slots, stage, "qualify-timeline", ["Urgent", "This quarter", "Exploring"], session, null, bumpAttempt());
    }

    case "recommend":
    case "qna": {
      if (intent === "question" || stage === "qna") {
        const qa = matchQA(text);
        if (qa) {
          intent = `question:${qa.id}`;
          reply = qa.answer;
          const { score } = scoreLead(slots);
          if (score >= 40 || session.turns >= 4) {
            reply += "\n\nAnything else - or shall I put the qualification brief together?";
            suggestions.push("Build the brief", "How do you price?", "What's your process?");
          } else {
            suggestions.push("Build the brief", "What tech do you use?");
          }
          nextStage = "qna";
          break;
        }
        intent = "question:unmatched";
        reply = "That one's outside my approved knowledge, and I don't guess - inventing answers is how agents lose trust. A senior consultant replies within one business day; I'll flag it in the handoff. Meanwhile: pricing, process, tech stack, AI capability and who Savo is - all fair game.";
        suggestions.push("How do you price?", "What's your process?", "Build the brief");
        nextStage = "qna";
        break;
      }
      if (/brief|summary|handoff|recommend|next step|what.*(recommend|suggest)|proposal/i.test(lower) || intent === "affirm") {
        return recommendTurn(slots, { ...session, stageAttempts: 0 });
      }
      if (services.length || budget || timeline) {
        const { score } = scoreLead(slots);
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
      if (intent === "question" || intent.startsWith("question:")) {
        return step({ ...session, stage: "qna", stageAttempts: 0 }, text);
      }
      return recommendTurn(slots, { ...session, stageAttempts: 0 });
    }
  }

  return turn(reply, intent, slots, stage, nextStage, suggestions, session, null, nextStage === stage ? bumpAttempt() : 0);
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
  stageAttempts = 0,
): SalesbotTurn {
  const { score, label } = scoreLead(slots);
  return { reply, stage, nextStage, slots, suggestions: [...new Set(suggestions)].slice(0, 3), intent, leadScore: score, leadLabel: label, stageAttempts, brief };
}

/** Quick replies matching the stage the conversation returns to. */
function suggestionsFor(stage: SalesbotStage): string[] {
  if (stage === "qualify-budget") return ["Around $10k", "₹8-10 lakh", "Not sure yet"];
  if (stage === "qualify-timeline") return ["Urgent", "This quarter", "Exploring"];
  if (stage === "discover") return ["A new website", "An AI agent", "A mobile app"];
  return ["Build the brief", "How do you price?"];
}
