import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/env";

/**
 * Crawler policy.
 * - Everything public is crawlable; API endpoints and the admin panel are not.
 * - AI/answer-engine crawlers are explicitly welcomed (AEO/GEO posture) —
 *   they are allowed by default, and stating it documents intent.
 */
export default function robots(): MetadataRoute.Robots {
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

  return {
    rules: [
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
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
