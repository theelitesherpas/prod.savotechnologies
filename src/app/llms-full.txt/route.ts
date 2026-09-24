import { env, absoluteUrl } from "@/lib/env";
import { SITE } from "@/constants/site";
import { SERVICES } from "@/constants/services";
import { MARQUEE_ITEMS } from "@/constants/services";
import { INDUSTRIES } from "@/constants/content";

export const dynamic = "force-static";

/**
 * /llms-full.txt — complete factual dump for LLM-based crawlers and answer
 * engines. Mirrors visible homepage content (no hidden or unverifiable
 * claims); numbers are omitted where the site itself omits them.
 */
export function GET() {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  const services = SERVICES.map(
    (s) =>
      `### ${s.title}\n${s.positioning}\nCapabilities: ${s.capabilities.join(", ")}`,
  ).join("\n\n");

  const industries = INDUSTRIES.join(", ");

  const body = `# ${SITE.name} — full site context
# Source: ${base}/ (official website)
# Retrieved content mirrors the visible homepage; all claims are the company's own.

## Organization
- Legal name: ${SITE.legalName}
- Brand line: ${SITE.tagline}
- Description: ${SITE.description}
- Email: ${SITE.email}
- Phone: ${SITE.phone}
- Regions served: India (HQ), USA, Saudi Arabia & GCC, United Kingdom, Australia

## Statement
${SITE.statement}

## Services
${services}

## Capability index
${MARQUEE_ITEMS.join(" · ")}

## Industries served
${industries}

## Process (methodology)
1. Discover — frame the problem and success metrics
2. Architect — design the system, plan the build
3. Build — engineer in iterations with visible progress
4. Measure — instrument, observe, learn from real usage
5. Grow — improve and scale what works

## AI position
AI at SAVO is production engineering, not demos: agents with guardrails, human
oversight, observability, permissions, evaluation and fallback behavior —
deployed against real business workflows with enterprise security.

## Start a project
Use the enquiry drawer at ${absoluteUrl("/#start")} or the footer callback form.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
