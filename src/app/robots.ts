import type { MetadataRoute } from "next";
import { absoluteUrl, INDEXABLE } from "@/lib/env";
import { IS_DEMO } from "@/lib/content-mode";

/**
 * Crawler policy.
 *
 * Indexing gate: only the production deployment (NEXT_PUBLIC_INDEXABLE=true
 * AND CONTENT_MODE=production) is crawlable. Every other environment -
 * local dev, Vercel test and preview deployments, and any demo-content
 * build - serves `Disallow: /` so demo staging content can never be
 * indexed or compete with https://savotechnologies.com.
 *
 * - Public marketing routes are crawlable in production; APIs, admin/client/
 *   employee surfaces, token meetings, unsubscribe URLs and unpublished previews
 *   are excluded. Robots rules remain hints, never an authorization boundary.
 * - AI/answer-engine crawlers are explicitly welcomed (AEO/GEO posture),
 *   they are allowed by default, and stating it documents intent.
 */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE || IS_DEMO) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  const aiCrawlers = [
    "GPTBot", // OpenAI
    "OAI-SearchBot", // ChatGPT search
    "ChatGPT-User",
    "ClaudeBot", // Anthropic
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended", // Gemini training
    "Applebot-Extended",
    "CCBot", // Common Crawl
    "Bytespider",
    "cohere-ai",
  ];

  const rules = [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/portal", "/employee-portal", "/meeting/", "/unsubscribe", "/case-studies/preview/", "/insights/preview/"],
    },
    // Answer engines: same public access, explicit.
    {
      userAgent: aiCrawlers,
      allow: "/",
      disallow: ["/api/", "/admin", "/portal", "/employee-portal", "/meeting/", "/unsubscribe", "/case-studies/preview/", "/insights/preview/"],
    },
  ];

  return {
    rules,
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
