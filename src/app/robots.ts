import type { MetadataRoute } from "next";
import { absoluteUrl, INDEXABLE } from "@/lib/env";

/**
 * Crawler policy.
 *
 * Indexing gate: only the production deployment (NEXT_PUBLIC_INDEXABLE=true)
 * is crawlable. Every other environment — local dev, Vercel test and preview
 * deployments — serves `Disallow: /` so testing URLs can never compete with
 * https://savotechnologies.com.
 *
 * - Everything public is crawlable in production; API endpoints and the
 *   admin panel are not (they are also protected by auth — robots.txt is a
 *   policy hint, never a security boundary).
 * - AI/answer-engine crawlers are explicitly welcomed (AEO/GEO posture),
 *   they are allowed by default, and stating it documents intent.
 */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) {
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
      disallow: ["/api/", "/admin"],
    },
    // Answer engines: same public access, explicit.
    {
      userAgent: aiCrawlers,
      allow: "/",
      disallow: ["/api/", "/admin"],
    },
  ];

  return {
    rules,
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
