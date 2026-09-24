import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/env";
import { INDUSTRY_DETAILS } from "@/constants/industry-details";
import { SERVICE_DETAILS } from "@/constants/services-detail";
import { HIRE_ROLES } from "@/constants/hire";
import { AI_SERVICES } from "@/constants/ai-services";
import { ARTICLES } from "@/constants/resources";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (url: string, priority: number, changeFrequency: "monthly" | "weekly" = "monthly") => ({
    url: absoluteUrl(url),
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page("/", 1),
    page("/contact", 0.9),
    page("/careers", 0.8, "weekly"),
    page("/industries", 0.9),
    ...INDUSTRY_DETAILS.map((d) => page(`/industries/${d.id}`, 0.8)),
    page("/services", 0.9),
    ...SERVICE_DETAILS.map((s) => page(`/services/${s.slug}`, 0.8)),
    page("/hire", 0.9),
    ...HIRE_ROLES.map((r) => page(`/hire/${r.slug}`, 0.8)),
    page("/start", 0.9),
    page("/ai-agents", 0.9),
    ...AI_SERVICES.map((s) => page(`/ai/${s.slug}`, 0.8)),
    page("/about", 0.7),
    page("/resources", 0.7),
    ...ARTICLES.map((a) => page(`/resources/${a.slug}`, 0.6)),
    page("/portal", 0.4),
    page("/case-studies", 0.8),
  ];
}
