/**
 * The Savo agent fleet - content for /ai-agents/.
 *
 * Ported from version 1 (lib/agents-data.tsx) with v6 rules: the six
 * personas are Savo's published product offering - capability claims
 * about our own agents carry over; client results and invented
 * deployments do not. Drawn as the site's own square-node schematics.
 */

export type Agent = {
  slug: string;
  name: string;
  short: string;
  desc: string;
  detail: string;
  deliverables: string[];
  tags: string[];
};

export const AGENTS: Agent[] = [
  {
    slug: "salesbot",
    name: "Savo SalesBot",
    short: "Sales",
    desc: "Talks to every visitor the moment they arrive, answers product questions, scores intent and books meetings straight into your CRM.",
    detail:
      "SalesBot answers product questions from your approved knowledge base, scores intent against your ideal customer profile, and books qualified meetings directly into your reps' calendars. Unqualified traffic is nurtured instead of lost.",
    deliverables: [
      "Trained on your product docs, pricing and FAQs",
      "Lead scoring against your ideal customer profile",
      "Calendar booking with routing to the right rep",
      "Full conversation transcripts synced to your CRM",
    ],
    tags: ["24/7", "CRM integration", "Lead scoring"],
  },
  {
    slug: "supportagent",
    name: "Savo SupportAgent",
    short: "Support",
    desc: "Absorbs the repetitive share of your ticket queue and escalates edge cases to humans with full context attached.",
    detail:
      "SupportAgent resolves tier 1 questions from your help center across chat, email and widget, tracks sentiment, and hands edge cases to humans with the full conversation, customer history and a suggested resolution attached.",
    deliverables: [
      "Tier 1 resolution across chat, email and widget",
      "Multilingual conversations at native quality",
      "Human handoff with summarized context",
      "CSAT capture and weekly quality reports",
    ],
    tags: ["Multilingual", "Human handoff", "Ticket sync"],
  },
  {
    slug: "recruitai",
    name: "Savo RecruitAI",
    short: "Recruiting",
    desc: "Screens resumes, runs structured first-round chats and ranks candidates against your scorecard, bias audited.",
    detail:
      "RecruitAI reads every resume against your scorecard, runs structured first-round conversations, and delivers a ranked shortlist with evidence for every decision. Bias audits run on each cohort so your process stays defensible and fair.",
    deliverables: [
      "Resume screening against a custom scorecard",
      "Structured async first-round interviews",
      "Ranked shortlists with per-candidate evidence",
      "Bias audit report for every hiring cohort",
    ],
    tags: ["Resume parsing", "ATS sync", "Bias audits"],
  },
  {
    slug: "insightagent",
    name: "Savo InsightAgent",
    short: "Analytics",
    desc: "Answers data questions in plain English, keeps live dashboards current and flags anomalies before they cost money.",
    detail:
      "InsightAgent sits on your warehouse and turns plain-English questions into governed SQL. Every answer cites its query, every dashboard stays live, and anomalies surface before the monthly report would have caught them.",
    deliverables: [
      "Plain-English queries over governed SQL",
      "Live dashboards your team can trust",
      "Anomaly alerts on revenue and ops metrics",
      "Row-level security and query audit logs",
    ],
    tags: ["NL → SQL", "Live dashboards", "Anomaly alerts"],
  },
  {
    slug: "contentagent",
    name: "Savo ContentAgent",
    short: "Content",
    desc: "Drafts brand-aligned marketing copy, SEO pages and social posts in your voice, with human approval built in.",
    detail:
      "ContentAgent learns your brand voice from your best-performing material, then drafts landing pages, SEO articles and social campaigns that sound like you on the first pass. Nothing publishes without human approval, and every draft carries its sources.",
    deliverables: [
      "Brand voice model trained on your best copy",
      "SEO-aware landing pages and articles",
      "Multichannel social drafts on a calendar",
      "Human approval gate with revision history",
    ],
    tags: ["Brand voice", "SEO aware", "Approval flows"],
  },
  {
    slug: "opsagent",
    name: "Savo OpsAgent",
    short: "Operations",
    desc: "Triages incidents, runs remediation runbooks and posts status updates to your channels, including at 3 a.m.",
    detail:
      "OpsAgent watches your stack, triages alerts by blast radius, and executes the runbooks you trust while paging a human only when it matters. It posts status updates in plain language, so incidents get handled before customers notice.",
    deliverables: [
      "Alert triage ranked by customer impact",
      "Automated remediation via your runbooks",
      "Plain-language status posts to Slack and email",
      "Full incident timeline for every review",
    ],
    tags: ["Runbooks", "On-call relief", "Status posts"],
  },
];

/** Deployment path - the published 2–4 week promise. */
export const AGENT_DEPLOY_STEPS = [
  { name: "Scope the job", text: "The workflow, data, tools and escalation rules the agent will operate within, written down first." },
  { name: "Ground it", text: "Retrieval and integrations built over your real systems, permissions scoped to the agent's role." },
  { name: "Guard & evaluate", text: "Guardrails, approval gates and test suites that measure quality before and after every change." },
  { name: "Supervised live", text: "The agent starts supervised, earns autonomy with evidence, and keeps a human escalation path forever." },
] as const;

export const AGENT_FAQS = [
  { q: "How fast can an agent go live?", a: "A focused first workflow typically deploys in two to four weeks: scope, ground, guard, then supervised live. Complexity of integrations is the honest variable." },
  { q: "Where does our data live?", a: "In your infrastructure. Agents connect to your systems with scoped credentials; nothing about your data needs to leave your cloud." },
  { q: "What stops an agent doing something wrong?", a: "Explicit permission boundaries, confidence gates, human-approval steps for sensitive actions, and full audit logs. An agent's credentials are scoped like an employee's, and revocable." },
  { q: "Can agents work together?", a: "Yes, agents compose into workflows, with one orchestrating and others executing, each still guarded by its own rules and escalation paths." },
] as const;
