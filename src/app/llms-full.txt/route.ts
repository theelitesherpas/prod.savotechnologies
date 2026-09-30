import { canonicalOrigin, absoluteUrl } from "@/lib/env";
import { SITE } from "@/constants/site";
import { SERVICES } from "@/constants/services";
import { MARQUEE_ITEMS } from "@/constants/services";
import { INDUSTRIES } from "@/constants/content";
import { getManagedRoles, getManagedCaseDisciplines } from "@/lib/content-items";

export const dynamic = "force-static";

/**
 * /llms-full.txt - complete factual dump for LLM-based crawlers and answer
 * engines. Mirrors visible homepage content (no hidden or unverifiable
 * claims); numbers are omitted where the site itself omits them.
 */
export async function GET() {
  const [ROLES, CASE_DISCIPLINES] = await Promise.all([
    getManagedRoles(),
    getManagedCaseDisciplines(),
  ]);
  const base = canonicalOrigin;

  const services = SERVICES.map(
    (s) =>
      `### ${s.title}\n${s.positioning}\nCapabilities: ${s.capabilities.join(", ")}`,
  ).join("\n\n");

  const industries = INDUSTRIES.join(", ");

  const body = `# ${SITE.name}, full site context
# Source: ${base}/ (official website)
# Retrieved content mirrors the visible homepage; all claims are the company's own.

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

## Industries served
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

## Business automation
- Page: ${absoluteUrl("/ai/automation")} - Business Automation: no-code and low-code automation, workflow automation, business process automation and AI-powered workflows
- Positioning: automation engineering, not tool setup. No-code where sufficient, custom engineering (APIs, integrations, databases, AI components) where necessary, combined when that builds the best system. Not every automation needs AI: rule-based workflow automation and AI-powered automation are distinct and both offered.
- Platforms (technology-agnostic): n8n, Make, Zapier, Microsoft Power Automate, webhooks, REST/GraphQL APIs, PostgreSQL, Supabase, Google Workspace, Microsoft 365, Slack, CRM/ERP/e-commerce/payment connectors, OpenAI, Anthropic, Gemini
- Use-case flows: sales (lead capture → enrichment → CRM → qualification → assignment → follow-up), marketing, customer support, finance (invoice → extraction → validation → approval → accounting), HR, operations, e-commerce
- Method: Discover → Map → Design → Connect → Automate → Govern → Monitor → Optimize, with security & governance, human approval gates, exception handling, monitoring and audit trails

## Contact
- Contact page: ${absoluteUrl("/contact")}
- Response promise: first reply within one business day; every message reaches a human
- Channels: contact form, email (${SITE.email}), phone (${SITE.phone}), WhatsApp chat from the contact page
- Offices: India headquarters - 139 PU4, Behind C21 Mall, Vijay Nagar, Scheme 54, Indore 452010 (+91 75029 01234, HR +91 78988 52345). Switzerland head office - Rue de la Fruiterie 13, 1523 Granges-Marnand (+41 76 408 28 72). Every other region (Dubai & GCC, Australia, United Kingdom, United States) is a market/service presence, not a claimed physical office; confirmed office addresses publish only as each region supplies a verified line.
- After you write: senior consultant replies → discovery call → fixed-scope proposal (NDA on request)
- Location pages: ${absoluteUrl("/locations/indore")} (India engineering HQ) · ${absoluteUrl("/locations/switzerland")} (Swiss head office for European clients)
- Common questions (FAQ, machine-readable on the homepage): what Savo does, India+Switzerland presence, AI agents and agentic systems, how engagements start, fixed-scope pricing, technology stack, SEO/AEO/GEO services, working with existing teams

## Careers
- Careers page: ${absoluteUrl("/careers")} · Apply: ${absoluteUrl("/careers/apply")}
- Hiring promise: engineer-read applications, personal reply within two business days, four steps to a written offer (technical conversation, meet the team)
- Work model: full time, office-first from the Indore headquarters with hybrid options, INR salaries
- Open roles (experience): ${ROLES.map((r) => `${r.title} (${r.exp})`).join("; ")}
- Applications: hr@ contact or the apply form; no matching role → general application accepted

## Start a project
Use the enquiry drawer at ${absoluteUrl("/#start")}, the contact page at
${absoluteUrl("/contact")}, or the footer callback form.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
