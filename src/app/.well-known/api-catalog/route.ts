import { canonicalOrigin, absoluteUrl } from "@/lib/env";

export const dynamic = "force-static";

/**
 * /.well-known/api-catalog - extensionless variant of api-catalog.json
 * (some scanners probe the bare path). Same document.
 */
export async function GET() {
  const base = canonicalOrigin;
  const body = {
    name: "Savo Technologies — public web services",
    description:
      "Agent-facing endpoints of savotechnologies.com: content manifests, structured data and content negotiation. All are public and unauthenticated; no keys or registration are required.",
    docs: absoluteUrl("/llms.txt"),
    contact: "hello@savotechnologies.com",
    apis: [
      {
        name: "llms.txt",
        url: absoluteUrl("/llms.txt"),
        format: "text/markdown",
        description:
          "Curated Markdown manifest of the site: services, industries, hire roles, AI practice and insights, with links and descriptions.",
      },
      {
        name: "llms-full.txt",
        url: absoluteUrl("/llms-full.txt"),
        format: "text/markdown",
        description: "The full site context for AI agents — complete page content in Markdown.",
      },
      {
        name: "Markdown negotiation",
        url: base + "/",
        format: "text/markdown",
        description:
          "Any public page returns a clean Markdown rendering when requested with 'Accept: text/markdown'. Browsers receive normal HTML.",
      },
      {
        name: "sitemap.xml",
        url: absoluteUrl("/sitemap.xml"),
        format: "application/xml",
        description: "Canonical, indexable URL set (pages, services, industries, verified case studies).",
      },
      {
        name: "robots.txt",
        url: absoluteUrl("/robots.txt"),
        format: "text/plain",
        description: "Crawler policy: AI and answer-engine crawlers are explicitly welcomed.",
      },
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
