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
 * /llms.txt - the emerging convention for AI/answer engines (AEO/GEO).
 * Plain-text orientation card: who Savo is, what the site offers, where the
 * facts live. Content mirrors visible on-page content only - no claims the
 * site does not make.
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

${SITE.statement}

## Contact
- Email: ${SITE.email}
- Phone: ${SITE.phone}
- Start a project: ${absoluteUrl("/#start")}

## What we do
- Web development, corporate sites, marketing sites, web applications, portals
- Mobile app development, iOS, Android, Flutter, React Native
- AI & intelligent systems: AI agents, generative AI/LLM integration, AI consulting, machine learning
- Custom software & SaaS product engineering
- UI/UX design
- Growth: SEO, digital marketing, analytics

## How we work
- One partner from idea to scale: strategy, design, engineering, and growth under one roof
- Engineering-first process: discover, architect, build, measure, grow
- AI treated as serious engineering, guardrails, human oversight, observability, evaluation

## Key pages
- Home: ${base}/
- Services directory: ${base}/services
- Industries atlas: ${base}/industries
- Hire developers: ${base}/hire
- Start a project: ${base}/start
- AI agents fleet: ${base}/ai-agents
- About: ${base}/about
- Insights: ${base}/insights
- Selected work: ${base}/#work
- AI systems: ${base}/#ai
- Methodology: ${base}/#methodology
- Case studies: ${base}/case-studies
- Careers: ${base}/careers
- Contact: ${base}/contact
- Start a project: ${base}/#start

## Services
${SERVICE_DETAILS.map((s) => `- ${s.title}: ${base}/services/${s.slug}`).join("\n")}

## Industries
${INDUSTRY_DETAILS.map((d) => `- ${d.title}: ${base}/industries${d.id}/`).join("\n")}

## Hire developers
${HIRE_ROLES.map((r) => `- Hire ${r.title}: ${base}/hire/${r.slug}`).join("\n")}

## AI practice
- The agent fleet: ${base}/ai-agents
${AI_SERVICES.map((s) => `- ${s.title}: ${base}/ai/${s.slug}`).join("\n")}

## Insights
${ARTICLES.map((a) => `- ${a.title}: ${base}/insights/${a.slug}`).join("\n")}

## For agents
This is the official website of ${SITE.legalName}, a technology services company.
Full site context: ${base}/llms-full.txt
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
