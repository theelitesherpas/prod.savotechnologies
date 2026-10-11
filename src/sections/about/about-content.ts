import { verifiedValue, COMPANY_FACTS } from "@/constants/company-facts";
import { SITE } from "@/constants/site";
import { IS_DEMO } from "@/lib/content-mode";
import { DEMO_METRICS } from "@/content/demo";

/**
 * About-page content - original company introduction restored, with the
 * established Savo visual identity. Verified facts and editorial philosophy
 * are distinct from visibly labelled demo history, profiles and metrics.
 * Buyer questions are shared verbatim with the FAQPage schema.
 */

export const ABOUT_VALUES = [
  { t: "Say the hard thing early", d: "Bad news travels fastest here. A risk named in week one is a plan; the same risk named at launch is an apology." },
  { t: "Own the outcome", d: "We do not hand over code and disappear. We ship outcomes and stay reachable while they prove themselves." },
  { t: "Write it down", d: "Decisions live in documents, not memories. Every project can survive a team change without drama." },
  { t: "Boring where it counts", d: "Proven technology for the load bearing walls. Innovation budget spent where users can feel it." },
  { t: "Teach the client", d: "Success means you understand your system deeply enough to leave us. Most stay anyway, which is the point." },
  { t: "Craft is respect", d: "Accessible, fast, documented software is how we respect the people who use it and the ones who maintain it." },
] as const;

/** Editorial mission/vision, not certifications or achieved outcomes. */
export const ABOUT_PURPOSE = [
  { title: "Our mission", statement: "Turn complex challenges into useful software.", text: "Bring strategy, design and engineering together around the people using the product - and the business behind it." },
  { title: "Our vision", statement: "Technology people can understand, use and improve.", text: "Build with clarity and care, so the next decision, the next release and the next team have a stronger place to start." },
] as const;

export type AboutMetricValues = { projectsDelivered: string; clientsSupported: string; industriesServed: string; marketsReached: string };
export function buildAboutMetrics(values: AboutMetricValues, demo = IS_DEMO) {
  if (demo) return DEMO_METRICS.map(metric => ({ value: metric.value, label: metric.label }));
  return [
    { value: values.projectsDelivered || "To be confirmed", label: "Projects Delivered" },
    { value: values.clientsSupported || "To be confirmed", label: "Clients Supported" },
    { value: values.industriesServed || "To be confirmed", label: "Industries Served" },
    { value: values.marketsReached || "To be confirmed", label: "Markets Reached" },
  ];
}

export const ABOUT_CRAFTS = [
  {
    k: "Engineering",
    v: "Boring where it counts, ambitious where it pays. Proven technology for the foundation, modern where it creates advantage. Architecture decisions are written down, including the ones we rejected and why.",
  },
  {
    k: "Design",
    v: "Design is how it works, made visible. Research before pixels, systems over screens, and restraint as a feature. A design is finished when nothing decorative is left to remove.",
  },
  {
    k: "AI",
    v: "Models are components, not products. Every AI system ships with grounding, guardrails, evaluation and a fallback. If a deterministic workflow serves better, we build that instead.",
  },
] as const;

/** The ten verified disciplines, each linked to where that work lives. */
export const ABOUT_DISCIPLINES: { label: string; href: string }[] = (verifiedValue(COMPANY_FACTS.expertiseGroups) ?? []).map((group) => {
  const key = group.toLowerCase();
  const href =
    key.includes("strategy") ? "/services" :
    key.includes("design") ? "/services/ui-ux-design" :
    key.includes("frontend") ? "/services/web-development" :
    key.includes("backend") ? "/services/custom-software-development" :
    key.includes("mobile") ? "/services/mobile-app-development" :
    key.includes("ai") || key.includes("machine") ? "/ai-agents" :
    key.includes("cloud") || key.includes("devops") ? "/services/cloud-devops" :
    key.includes("quality") ? "/services/qa-testing" :
    key.includes("search") || key.includes("growth") ? "/services/digital-marketing" :
    "/enterprise";
  return { label: group, href };
});

/** Verified identity facts only - nothing pending is rendered as an assertion. */
export function aboutFacts(): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [
    { label: "Legal entity", value: String(verifiedValue(COMPANY_FACTS.legalName) ?? SITE.legalName) },
    { label: "Founded", value: String(verifiedValue(COMPANY_FACTS.foundedYear) ?? SITE.registration.foundedYear) },
    { label: "Engineering HQ", value: "Indore, Madhya Pradesh, India" },
    { label: "Head office", value: "Granges-Marnand, Switzerland" },
    { label: "Working model", value: String(verifiedValue(COMPANY_FACTS.supportedMarkets) ?? "") },
    { label: "Disciplines", value: `${ABOUT_DISCIPLINES.length} specialist disciplines` },
  ];
  return facts.filter((f) => f.value.trim().length > 0);
}

/** Buyer due-diligence questions - shared verbatim with the FAQPage schema. */
export const ABOUT_FAQS = [
  { q: "How do we know a software development company is reliable before hiring?", a: "Verify, do not take the website's word: ask for engagement walkthroughs under NDA, check whether claims are evidenced, test how they answer hard questions, and start with a paid pilot milestone. Reliability shows in specifics, not superlatives. Our own proof policy publishes only verified work, and references are available to qualified buyers." },
  { q: "What are the red flags when choosing a development company?", a: "A fixed price quoted before anyone asked a question, no tradeoffs in any answer, everything is possible, every conversation runs through a salesperson, and contracts where you never quite own the code. Any one of these deserves a harder look; our buyer guides on Insights list the full set." },
  { q: "Should we hire freelancers, an agency or a dedicated team?", a: "Freelancers suit focused skills and short gaps; an agency suits fixed-scope projects with a clear brief; a dedicated team suits products that keep evolving and need design, engineering and delivery moving together. Match the model to your uncertainty, not to whoever pitched first." },
  { q: "Is it safe to outsource software development to India?", a: "It depends on the partner, not the country. India produces world-class engineering; the variance is in process and transparency. Check verifiable work, communication rhythm, code ownership terms and security practice, the same checklist as anywhere. Savo operates from a verified Indore headquarters with these practices published on our trust page." },
  { q: "What should a good project brief include before asking for quotes?", a: "The problem in plain language, who the users are, what exists today, must-have outcomes, constraints like compliance or deadlines, and an honest budget range. Briefs like these get real numbers back; vague briefs get sales calls. Our discovery process exists to build exactly this document with you." },
  { q: "What questions should we ask a development company before signing?", a: "Five: how do you ground AI answers or technical claims in our reality, how does the week-to-week process run, who owns the code and when, can we speak to references, and what does leaving look like. Strong companies answer these easily. We publish our own answers across this site, including how to review a technical proposal on Insights." },
] as const;
