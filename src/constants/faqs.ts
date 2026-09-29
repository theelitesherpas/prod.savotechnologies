/**
 * Central FAQ content — the AEO/GEO surface for pages that don't have a
 * dedicated content file for questions (service, industry and AI pages
 * carry their own). Every answer is honest, anchored to how Savo actually
 * works (PRODUCT.md hard content rule): no invented metrics, timelines
 * or certifications. Questions are phrased the way people search.
 */

export type FaqItem = { q: string; a: string };

/** Homepage — the company-level answer surface. */
export const HOME_FAQS: FaqItem[] = [
  {
    q: "What does Savo Technologies do?",
    a: "Savo Technologies is a technology and digital product partner. We build websites and web applications, mobile apps for iOS and Android, custom software and SaaS platforms, AI agents and agentic systems, and we design and grow products with UI/UX design, SEO, AEO and GEO services. Strategy, design, engineering and growth under one team.",
  },
  {
    q: "Where is Savo Technologies located?",
    a: "Our engineering headquarters is in Indore, Madhya Pradesh, India, and our head office is in Granges-Marnand, Switzerland. We work with clients across India, Switzerland, Europe, the Middle East and beyond — with senior coverage across both Indian and European working hours.",
  },
  {
    q: "Does Savo build AI agents and agentic systems?",
    a: "Yes. AI agents are a core engineering capability, not an add-on: we design and build agents with tool use, retrieval-augmented generation, evaluation and guardrails, LLM applications and workflow automation that ship into production under real reliability requirements.",
  },
  {
    q: "How does a project with Savo start?",
    a: "You send a message or a project brief. A senior consultant replies within one business day, then we run a discovery call around your actual constraints and follow with a fixed-scope proposal. Nothing is committed before the scope, timeline and deliverables are written down.",
  },
  {
    q: "How is pricing structured?",
    a: "After the discovery call you receive a fixed-scope proposal with the engagement priced against written deliverables — not open hourly billing. Every assumption is stated in the proposal, so the number you approve is the number that holds.",
  },
  {
    q: "What technologies does Savo work with?",
    a: "Modern, proven stacks: Next.js, React, Node.js and PostgreSQL for web platforms; Flutter and React Native for mobile; Python for AI and data work; cloud infrastructure across AWS and integrations from payments to messaging. Technology is chosen for the problem, never for the résumé.",
  },
  {
    q: "Does Savo provide SEO, AEO and GEO services?",
    a: "Yes. Beyond classic SEO, we optimise for AEO (answer engines, featured snippets, voice) and GEO (generative engines — being cited by AI assistants). This site itself is built the way we build for clients: structured data, clean entities and machine-readable answers.",
  },
  {
    q: "Can Savo work with our existing team or codebase?",
    a: "Yes — engagements range from full product builds to embedding with existing teams. We take over existing codebases, augment in-house teams with dedicated specialists, and document everything we touch so your team stays in control.",
  },
];

/** Hire resources page. */
export const HIRE_FAQS: FaqItem[] = [
  {
    q: "How does hiring from Savo work?",
    a: "You choose a role — engineer, designer or specialist — and we match a dedicated person or team to your engagement. The process starts with a conversation about the work, then an introduction to the people who would join you, then a start date.",
  },
  {
    q: "Can I hire a single specialist or a full team?",
    a: "Both. Some clients hire one engineer or designer to extend an internal team; others hire a complete cross-functional team that includes engineering, design and delivery. The shape follows your roadmap, not our org chart.",
  },
  {
    q: "How do hired specialists communicate and report?",
    a: "Directly. Hired specialists join your tools, your standups and your channels — you talk to the person doing the work, not an account manager relaying messages. Written updates and honest status are part of how we work by default.",
  },
  {
    q: "What time zones do hired resources cover?",
    a: "Our teams work from Indore, India, with senior presence in Switzerland. For European and Indian clients that means real overlap in working hours; for others we agree fixed overlap windows before the engagement starts.",
  },
  {
    q: "Where do hired resources work from?",
    a: "Our specialists are office-first in Indore with hybrid options, employed by Savo Technologies and dedicated to your engagement. You get the continuity of a team member with the flexibility of an external engagement.",
  },
];

/** Contact page — practical pre-message questions. */
export const CONTACT_FAQS: FaqItem[] = [
  {
    q: "How quickly will I get a response?",
    a: "Within one business day — and the reply comes from a senior consultant who reads your message, not an autoresponder. Urgent or time-sensitive notes are flagged and answered faster.",
  },
  {
    q: "Can we sign an NDA before sharing project details?",
    a: "Yes. NDAs are routine for us — request one in your first message and we will have it ready before the discovery call. Your ideas, documents and code stay protected from the first conversation.",
  },
  {
    q: "What should I include in my first message?",
    a: "What you want to build or improve, where it stands today, and any timeline or constraints you already know. A budget range helps us propose realistically, but it is not required to start the conversation.",
  },
  {
    q: "Do you work with startups and enterprises?",
    a: "Both. We work with founders building a first product, companies modernising existing platforms, and enterprises running regulated, high-reliability systems. The engagement shape changes; the engineering bar does not.",
  },
];

/** Switzerland location page — the Swiss/European answer surface. */
export const SWITZERLAND_FAQS: FaqItem[] = [
  {
    q: "Does Savo Technologies have an office in Switzerland?",
    a: "Yes. Our head office is at Rue de la Fruiterie 13, 1523 Granges-Marnand, Switzerland, reachable on +41 76 408 28 72. It anchors our European presence alongside our engineering headquarters in Indore, India.",
  },
  {
    q: "What services does Savo deliver for Swiss and European clients?",
    a: "The full stack: corporate websites and web applications, mobile apps, custom software and SaaS platforms, AI agents and automation, UI/UX design, and SEO, AEO and GEO services — delivered by one team across our Swiss and Indian offices.",
  },
  {
    q: "How does the India–Switzerland setup benefit clients?",
    a: "You get senior presence in your time zone and a deep engineering bench working while Europe sleeps. The Swiss office covers European working hours and local accountability; the Indore headquarters supplies the engineering capacity that keeps timelines short.",
  },
  {
    q: "In which time zone does Savo work with Swiss clients?",
    a: "Our Swiss office works Central European Time, aligned with your business day. The India engineering team works ahead, which means progress is visible in your morning and questions raised in your afternoon are answered by the next morning.",
  },
  {
    q: "Can we meet on site in Switzerland?",
    a: "Yes — engagements run remote-first, with the Granges-Marnand office available for on-site meetings and working sessions by arrangement. Most Swiss clients combine regular video calls with occasional on-site workshops.",
  },
  {
    q: "How do I start a project from Switzerland?",
    a: "Send a message through the contact page or start a project brief. A senior consultant replies within one business day, followed by a discovery call and a fixed-scope proposal — with an NDA on request before any details are shared.",
  },
];
