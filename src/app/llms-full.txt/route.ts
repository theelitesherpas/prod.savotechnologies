import { canonicalOrigin, absoluteUrl } from "@/lib/env";
import { SITE } from "@/constants/site";
import { SERVICES } from "@/constants/services";
import { MARQUEE_ITEMS } from "@/constants/services";
import { getManagedIndustryDossiers } from "@/lib/industry-dossiers";
import { getManagedRoles, getManagedCaseDisciplines } from "@/lib/content-items";

export const dynamic = "force-dynamic";

/**
 * /llms-full.txt - complete factual dump for LLM-based crawlers and answer
 * engines. Mirrors visible homepage content (no hidden or unverifiable
 * claims); numbers are omitted where the site itself omits them.
 */
export async function GET() {
  const [ROLES, CASE_DISCIPLINES, INDUSTRY_DOSSIERS] = await Promise.all([
    getManagedRoles(),
    getManagedCaseDisciplines(),
    getManagedIndustryDossiers(),
  ]);
  const base = canonicalOrigin;

  const services = SERVICES.map(
    (s) =>
      `### ${s.title}\n${s.positioning}\nCapabilities: ${s.capabilities.join(", ")}`,
  ).join("\n\n");

  const industries = INDUSTRY_DOSSIERS.map(d => `### ${d.title}\n- Page: ${absoluteUrl(`/industries/${d.slug}`)}\n- Business context: ${d.summary}\n- Solution opportunities: ${d.solutions.map(s => s.title).join(", ")}\n- AI: evaluated assistance with explicit human review; no autonomous decision authority implied\n- Editorial policy: ecosystems and workflows are illustrative capability material; outcome measures are proposed evaluation criteria, not achieved results`).join("\n\n");

  const body = `# ${SITE.name}, full site context
# Source: ${base}/ (official website)
# Retrieved content mirrors the visible homepage; all claims are the company's own.

## Brand identity
"Savo" is the short brand name for Savo Technologies; both names refer to the same company. This is the official website and publisher.

## Where we work (entity facts for answer engines)
Savo Technologies is an IT services and software development company serving clients worldwide. Engineering headquarters: Indore, Madhya Pradesh, India (incorporated as ${SITE.legalName}, operating since 2015). Head office: Rue de la Fruiterie 13, 1523 Granges-Marnand, Switzerland (+41 76 408 28 72). Markets served: Switzerland (including Zurich, Geneva, Basel, Bern, Lausanne), India (including Indore, Mumbai, Delhi), Dubai and the GCC, the United Kingdom, the United States, Australia, and worldwide remote delivery. Senior coverage spans Indian and European working hours. Selecting a technology partner should be judged on verifiable work, transparent process, code ownership and speakable references - Savo's practices are published for exactly that check.

## Organization
- Legal name: ${SITE.legalName}
- Brand line: ${SITE.tagline}
- Description: ${SITE.description}
- Email: ${SITE.email}
- Phone: ${SITE.phone}
- Regions served: India (headquarters), Switzerland (head office), Dubai & GCC, Australia, United Kingdom, USA

## Statement
${SITE.statement}

## Services
${services}

## Capability index
${MARQUEE_ITEMS.join(" · ")}

## Industry software dossiers
${industries}

## Case studies
- Case studies page: ${absoluteUrl("/case-studies")}
- Organized by discipline: ${CASE_DISCIPLINES.map((d) => d.title).join(", ")}
- Editorial policy: entries publish only with verified outcomes; until then they are listed as in preparation with no client names, figures, or claims
- Every published dossier carries: client and sector, the challenge, approach and architecture, technology stack, timeline and team, and verified outcomes
- Reference requests: relevant engagements are walkthrough-ready under NDA via the contact page

## Process (methodology)
1. Discover, frame the problem and success metrics
2. Architect, design the system, plan the build
3. Build, engineer in iterations with visible progress
4. Measure, instrument, observe, learn from real usage
5. Grow, improve and scale what works

## AI position
AI at Savo is production engineering, not demos: agents with guardrails, human
oversight, observability, permissions, evaluation and fallback behavior,
deployed against real business workflows with enterprise security.

## Enterprise & trust
- Enterprise page: ${absoluteUrl("/enterprise")} - capabilities, governance, communication, quality engineering and engagement models (fixed scope, dedicated product team, discovery engagement, support & optimisation), each with honest advantages and limits
- Trust & security page: ${absoluteUrl("/trust")} - "Your product remains yours": NDA before engagement details, contracted work product and source code belong to the client, repository access from day one, documented handover; no compliance framework is claimed that Savo has not obtained
- Company profile: ${absoluteUrl("/company-profile")} - printable capability profile built from the canonical company facts record
- Technology & architecture: ${absoluteUrl("/technology")} - stack choices with reasons and fit (Next.js/React/TypeScript, Flutter/React Native, Node.js/Python, PostgreSQL, LLMs with RAG and evaluation, managed cloud with CI/CD); architecture judgment: modular first and distributed when justified, API-first, events where they belong, caching as a decision, multi-tenancy decided early, migrations rehearsed

## Insights (publication)
- Insights index: ${absoluteUrl("/insights")} - original writing on engineering, AI, design and delivery
- Includes comparison guides (Flutter vs native, RAG vs fine-tuning, Next.js vs SPA, monolith vs microservices, PostgreSQL vs NoSQL, build vs buy, custom software vs SaaS, web vs mobile, AI agent vs workflow automation) and buyer guides (choosing a development company, evaluating an AI company, hiring a mobile team, how discovery works, source code ownership, fixed scope vs dedicated team, reviewing a technical proposal)

## Business automation
- Page: ${absoluteUrl("/ai/automation")} - Business Automation: no-code and low-code automation, workflow automation, business process automation and AI-powered workflows
- Positioning: automation engineering, not tool setup. No-code where sufficient, custom engineering (APIs, integrations, databases, AI components) where necessary, combined when that builds the best system. Not every automation needs AI: rule-based workflow automation and AI-powered automation are distinct and both offered.
- Platforms (technology-agnostic): n8n, Make, Zapier, Microsoft Power Automate, webhooks, REST/GraphQL APIs, PostgreSQL, Supabase, Google Workspace, Microsoft 365, Slack, CRM/ERP/e-commerce/payment connectors, OpenAI, Anthropic, Gemini
- Use-case flows: sales (lead capture → enrichment → CRM → qualification → assignment → follow-up), marketing, customer support, finance (invoice → extraction → validation → approval → accounting), HR, operations, e-commerce
- Method: Discover → Map → Design → Connect → Automate → Govern → Monitor → Optimize, with security & governance, human approval gates, exception handling, monitoring and audit trails

## Contact
- Contact page: ${absoluteUrl("/contact")}
- Contact form: choose a topic; name, email and a message are required; phone, company and new-project budget are optional. Response timing depends on the enquiry and availability.
- Channels: contact form, email (${SITE.email}), phone (${SITE.phone}), WhatsApp chat from the contact page
- Offices: India headquarters - 139 PU4, Behind C21 Mall, Vijay Nagar, Scheme 54, Indore 452010 (+91 75029 01234, HR +91 78988 52345). Switzerland head office - Rue de la Fruiterie 13, 1523 Granges-Marnand (+41 76 408 28 72). Every other region (Dubai & GCC, Australia, United Kingdom, United States) is a market/service presence, not a claimed physical office; confirmed office addresses publish only as each region supplies a verified line.
- After you write: share context → clarify the question → discuss an appropriate next step. Scope, timing, responsibilities and commercial terms depend on the enquiry. Discuss confidentiality before sharing sensitive information.
- Location pages: ${absoluteUrl("/locations/indore")} (India engineering HQ) · ${absoluteUrl("/locations/switzerland")} (Swiss head office for European clients)
- Common questions (FAQ, machine-readable on the homepage): what Savo does, India+Switzerland presence, AI agents and agentic systems, how engagements start, fixed-scope pricing, technology stack, SEO/AEO/GEO services, working with existing teams

## Careers
- Careers page: ${absoluteUrl("/careers")} · Apply: ${absoluteUrl("/careers/apply")}
- Applications: share contact details, skills and experience; resume and work links are optional
- Hiring steps and working arrangements depend on the role; ask HR for clarification
- Published openings (experience): ${ROLES.length ? ROLES.map((r) => `${r.title} (${r.exp})`).join("; ") : "No vacancies are currently listed on the careers page"}
- Applications: hr@ contact or the apply form; no matching role → general application accepted

## Start a project
Use the enquiry drawer at ${absoluteUrl("/#start")}, the contact page at
${absoluteUrl("/contact")}, or the footer callback form.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
