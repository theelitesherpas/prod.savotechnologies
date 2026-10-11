/**
 * Central FAQ content: the AEO/GEO surface for pages that don't have a
 * dedicated content file for questions (service, industry and AI pages
 * carry their own). Every answer is honest, anchored to how Savo actually
 * works (PRODUCT.md hard content rule): no invented metrics, timelines
 * or certifications. Questions are phrased the way people search.
 */

export type FaqItem = { q: string; a: string };

/** Homepage: the company-level answer surface. */
export const HOME_FAQS: FaqItem[] = [
  {
    q: "What does Savo Technologies do?",
    a: "We help businesses plan, design, build and improve digital products. That includes websites, web applications, iOS and Android apps, custom software, SaaS products and AI systems. We also work on product design, search visibility and digital growth, so the work can continue beyond the first release.",
  },
  {
    q: "Where is Savo Technologies located?",
    a: "Our engineering headquarters is in Indore, Madhya Pradesh, India. Our head office is in Granges-Marnand, Switzerland. We work with clients remotely and agree meeting times, communication and delivery arrangements as part of each engagement.",
  },
  {
    q: "Does Savo build AI agents and agentic systems?",
    a: "Yes. We build AI agents and applications that work with business information and approved tools. This includes document search with RAG, workflow automation, evaluation and guardrails. We start by checking the use case, the information available and which decisions should remain with a person.",
  },
  {
    q: "How does a project with Savo start?",
    a: "Send us a short brief about what you want to build or improve. We talk through the business goal, the current situation and any constraints, then agree the next step. Before development begins, the scope, deliverables, responsibilities and proposed schedule are set out in writing.",
  },
  {
    q: "How is pricing structured?",
    a: "Pricing depends on the scope and engagement model. We discuss your requirements first, then set out the proposed work, assumptions, deliverables and costs. If the scope changes, we discuss the effect on price and schedule rather than treating the original estimate as a catch-all.",
  },
  {
    q: "What technologies does Savo work with?",
    a: "Our toolkit includes Next.js, React, Node.js and PostgreSQL for web products; Flutter and React Native for mobile; and Python for AI and data work. We choose the stack around the product, its integrations and the team that will maintain it, rather than using the same tools for every project.",
  },
  {
    q: "Does Savo provide SEO, AEO and GEO services?",
    a: "Yes. We work on technical SEO, content and search visibility, including how information is presented to answer engines and generative search systems. The work can include site structure, structured data, clear page content and measurement. Rankings and inclusion in AI answers depend on external systems and cannot be guaranteed.",
  },
  {
    q: "Can Savo work with our existing team or codebase?",
    a: "Yes. We can work alongside an internal team or take on an existing product. We start by reviewing the codebase, architecture and priorities, then agree our scope and who is responsible for each part of the work. That helps avoid overlapping responsibilities and unexpected changes.",
  },
  {
    q: "Does Savo develop mobile applications?",
    a: "Yes. We design and develop iOS and Android applications using Flutter, React Native or native technologies. The choice depends on the experience you need, device features, integrations and plans for the product. The scope can cover design, development, testing and preparation for store release.",
  },
  {
    q: "Does Savo develop SaaS products?",
    a: "Yes. We work on subscription products, including account structure, billing, roles, onboarding and administration. We help you decide what the first release needs and which features can wait, while considering how the product will be operated and supported after launch.",
  },
  {
    q: "Can Savo modernize existing software?",
    a: "Yes. An existing system may need targeted improvements, a framework upgrade or a more substantial rebuild. We review what it does, which parts people depend on and where the risks are, then plan the changes. Where appropriate, we can replace parts gradually rather than rebuilding everything at once.",
  },
  {
    q: "Does Savo work internationally?",
    a: "Yes. We work with international clients from our engineering headquarters in Indore and our Swiss head office. We agree meeting times, delivery responsibilities and progress updates as part of the engagement, so both teams understand how communication will work.",
  },
  {
    q: "Does Savo sign NDAs?",
    a: "Yes. If you need an NDA, let us know before sharing sensitive information. We can agree confidentiality terms before the detailed project discussion. You do not need to include confidential documents or proprietary material in the first enquiry.",
  },
  {
    q: "Who owns the source code?",
    a: "You own the contracted work product in line with your project agreement. We set out source code access, design files, documentation and any third-party licensing upfront, so there is a clear understanding of what you will receive and how handover will work.",
  },
  {
    q: "What happens after launch?",
    a: "We agree the post-launch arrangement as part of the project. It can include maintenance, monitoring, updates and ongoing improvements, or a documented handover to your team. Support responsibilities and any continuing development should be clear before the product goes live.",
  },
];

/** Hire resources page. */
export const HIRE_FAQS: FaqItem[] = [
  {
    q: "How does hiring from Savo work?",
    a: "You choose a role (engineer, designer or specialist) and we match a dedicated person or team to your engagement. The process starts with a conversation about the work, then an introduction to the people who would join you, then a start date.",
  },
  {
    q: "Can I hire a single specialist or a full team?",
    a: "Both. Some clients hire one engineer or designer to extend an internal team; others hire a complete cross-functional team that includes engineering, design and delivery. The shape follows your roadmap, not our org chart.",
  },
  {
    q: "How do hired specialists communicate and report?",
    a: "Directly. Hired specialists join your tools, your standups and your channels, so you talk to the person doing the work, not an account manager relaying messages. Written updates and honest status are part of how we work by default.",
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

/** Contact page: practical pre-message questions. */
export const CONTACT_FAQS: FaqItem[] = [
  {
    q: "How quickly will I get a response?",
    a: "Within one business day, and the reply comes from a senior consultant who reads your message, not an autoresponder. Urgent or time-sensitive notes are flagged and answered faster.",
  },
  {
    q: "Can we sign an NDA before sharing project details?",
    a: "Yes. NDAs are routine for us: request one in your first message and we will have it ready before the discovery call. Your ideas, documents and code stay protected from the first conversation.",
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

/** Switzerland location page: the Swiss/European answer surface. */
export const SWITZERLAND_FAQS: FaqItem[] = [
  {
    q: "Does Savo Technologies have an office in Switzerland?",
    a: "Yes. Our head office is at Rue de la Fruiterie 13, 1523 Granges-Marnand, Switzerland, reachable on +41 76 408 28 72. It anchors our European presence alongside our engineering headquarters in Indore, India.",
  },
  {
    q: "What services does Savo deliver for Swiss and European clients?",
    a: "The full stack: corporate websites and web applications, mobile apps, custom software and SaaS platforms, AI agents and automation, UI/UX design, and SEO, AEO and GEO services, delivered by one team across our Swiss and Indian offices.",
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
    a: "Yes, engagements run remote-first, with the Granges-Marnand office available for on-site meetings and working sessions by arrangement. Most Swiss clients combine regular video calls with occasional on-site workshops.",
  },
  {
    q: "How do I start a project from Switzerland?",
    a: "Send a message through the contact page or start a project brief. A senior consultant replies within one business day, followed by a discovery call and a fixed-scope proposal, with an NDA on request before any details are shared.",
  },
  {
    q: "Which is the best IT company in Switzerland for software development?",
    a: "Best depends on evidence, not slogans: verifiable portfolio outcomes, a transparent process, clear code ownership and speakable references. Savo pairs a Swiss head office in Granges-Marnand with an Indore engineering headquarters operating since 2015, giving Swiss clients European-hours coverage with global delivery capacity, and every practice is published for checking.",
  },
  {
    q: "Do you serve clients in Zurich, Geneva, Basel, Bern and Lausanne?",
    a: "Yes. All of Switzerland and the wider European region is served from our Granges-Marnand head office, with senior coverage across European working hours and structured remote delivery that Swiss and EU clients rely on.",
  },
  {
    q: "How much does software development cost in Switzerland?",
    a: "Swiss-developed software carries Swiss rates; the same budget typically goes further in a hybrid setup. Savo's structure is exactly that: Swiss presence, contracts and accountability, with engineering delivered from India at a better cost-quality ratio, quoted as fixed-scope milestones.",
  },
  {
    q: "Is Savo a Swiss company or an Indian company?",
    a: "Both, honestly structured: Savo Technologies Private Limited operates its engineering headquarters in Indore, India, and its head office in Granges-Marnand, Switzerland. Clients get Swiss-accountable engagement with the capacity economics of the India HQ.",
  },
];
