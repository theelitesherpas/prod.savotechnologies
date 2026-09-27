import { canonicalOrigin, absoluteUrl } from "@/lib/env";
import { SITE } from "@/constants/site";
import { SERVICE_DETAILS } from "@/constants/services-detail";
import { INDUSTRY_DETAILS } from "@/constants/industry-details";
import {
  getManagedHireRoles,
  getManagedAiServices,
  getManagedArticles,
} from "@/lib/content-items";

export const dynamic = "force-static";

/**
 * /llms.txt - the emerging convention for AI/answer engines (AEO/GEO),
 * following the llmstxt.org recommendation: Markdown with an H1, a
 * blockquote summary and link lists where every entry is a proper
 * Markdown link `[Label](url)` with a short description. Content mirrors
 * visible on-page content only - no claims the site does not make.
 */
export async function GET() {
  const [HIRE_ROLES, AI_SERVICES, ARTICLES] = await Promise.all([
    getManagedHireRoles(),
    getManagedAiServices(),
    getManagedArticles(),
  ]);
  const base = canonicalOrigin;

  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.statement} Official site: [${base}](${base}). Full site context for agents: [llms-full.txt](${base}/llms-full.txt).

## Contact
- [Start a project](${absoluteUrl("/#start")}): enquiry form, senior consultant reply within one business day
- [Contact page](${base}/contact): form, direct channels, response expectations
- Email: ${SITE.email}
- Phone: ${SITE.phone}

## What we do
- Web development: corporate sites, marketing sites, web applications, portals
- Mobile app development: iOS, Android, Flutter, React Native
- AI & intelligent systems: AI agents, generative AI/LLM integration, AI consulting, machine learning
- Custom software & SaaS product engineering
- UI/UX design
- Growth: SEO, digital marketing, analytics

## How we work
- One partner from idea to scale: strategy, design, engineering, and growth under one roof
- Engineering-first process: discover, architect, build, measure, grow
- AI treated as serious engineering: guardrails, human oversight, observability, evaluation

## Key pages
- [Home](${base}/)
- [Services directory](${base}/services): the full service catalogue with engagement models
- [Industries atlas](${base}/industries): ten sector chapters with landscape, solutions and flows
- [Case studies](${base}/case-studies): the dossier, filed by discipline, published with verified outcomes
- [Hire developers](${base}/hire): dedicated developer engagements by role
- [AI agents fleet](${base}/ai-agents): the agent fleet and what each agent delivers
- [AI systems practice](${base}/ai/ai-agents)
- [Insights](${base}/insights): field notes on engineering, AI, design and delivery
- [About](${base}/about)
- [Careers](${base}/careers)
- [Contact](${base}/contact)
- [Start a project](${base}/start)

## Services
${SERVICE_DETAILS.map((s) => `- [${s.title}](${base}/services/${s.slug}): ${s.tagline.replace(/\.$/, "")}`).join("\n")}

## Industries
${INDUSTRY_DETAILS.map((d) => `- [${d.title}](${base}/industries${d.id}/): ${d.tagline.replace(/\.$/, "")}`).join("\n")}

## Hire developers
${HIRE_ROLES.map((r) => `- [Hire ${r.title}](${base}/hire/${r.slug}): ${r.short}`).join("\n")}

## AI practice
- [The agent fleet](${base}/ai-agents): deployable agents and their deliverables\n- [Savo SalesBot](${base}/ai-agents/salesbot): the AI sales agent, with a live interactive demo (qualification, lead scoring, CRM handoff brief)
${AI_SERVICES.map((s) => `- [${s.title}](${base}/ai/${s.slug}): ${s.tagline.replace(/\.$/, "")}`).join("\n")}

## Insights
${ARTICLES.map((a) => `- [${a.title}](${base}/insights/${a.slug}): ${a.excerpt}`).join("\n")}

## For agents
This is the official website of ${SITE.legalName}, a technology services company.
Case studies publish only with client-verified outcomes; records marked as
design concepts are fictional demo content. Crawl policy: [robots.txt](${base}/robots.txt).
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
