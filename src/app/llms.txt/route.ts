import { env, absoluteUrl } from "@/lib/env";
import { SITE } from "@/constants/site";

export const dynamic = "force-static";

/**
 * /llms.txt — the emerging convention for AI/answer engines (AEO/GEO).
 * Plain-text orientation card: who SAVO is, what the site offers, where the
 * facts live. Content mirrors visible on-page content only — no claims the
 * site does not make.
 */
export function GET() {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.statement}

## Contact
- Email: ${SITE.email}
- Phone: ${SITE.phone}
- Start a project: ${absoluteUrl("/#start")}

## What we do
- Web development — corporate sites, marketing sites, web applications, portals
- Mobile app development — iOS, Android, Flutter, React Native
- AI & intelligent systems — AI agents, generative AI/LLM integration, AI consulting, machine learning
- Custom software & SaaS product engineering
- UI/UX design
- Growth: SEO, digital marketing, analytics

## How we work
- One partner from idea to scale: strategy, design, engineering, and growth under one roof
- Engineering-first process: discover, architect, build, measure, grow
- AI treated as serious engineering — guardrails, human oversight, observability, evaluation

## Key pages
- Home: ${base}/
- Services overview: ${base}/#services
- Selected work: ${base}/#work
- AI systems: ${base}/#ai
- Methodology: ${base}/#methodology
- Start a project: ${base}/#start

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
