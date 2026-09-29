import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/env";
import { INDUSTRY_DETAILS } from "@/constants/industry-details";
import { SERVICE_DETAILS } from "@/constants/services-detail";
import { getManagedHireRoles, getManagedAiServices, getManagedArticles } from "@/lib/content-items";
import { getCaseStudies } from "@/lib/case-studies";

/**
 * Production XML sitemap - canonical, indexable URLs only, always on the
 * canonical origin. Utility pages (client portal login) and admin/API
 * surfaces are excluded by design.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [HIRE_ROLES, AI_SERVICES, ARTICLES, CASE_STUDIES] = await Promise.all([
    getManagedHireRoles(),
    getManagedAiServices(),
    getManagedArticles(),
    getCaseStudies(),
  ]);
  const now = new Date();
  const page = (url: string, priority: number, changeFrequency: "monthly" | "weekly" = "monthly") => ({
    url: absoluteUrl(url),
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page("/", 1, "weekly"),
    page("/services", 0.9),
    ...SERVICE_DETAILS.map((s) => page(`/services/${s.slug}`, 0.8)),
    page("/ai-agents", 0.9),
    // Agent detail chapters with live demos
    ...["salesbot"].map((s) => page(`/ai-agents/${s}`, 0.8)),
    ...AI_SERVICES.map((s) => page(`/ai/${s.slug}`, 0.8)),
    page("/industries", 0.9),
    ...INDUSTRY_DETAILS.map((d) => page(`/industries/${d.id}`, 0.8)),
    page("/case-studies", 0.8, "weekly"),
    // Verified engagements only - demo dossiers never enter the sitemap.
    ...CASE_STUDIES.filter((s) => s.status === "verified").map((s) =>
      page(`/case-studies/${s.slug}`, 0.7),
    ),
    page("/hire", 0.8),
    ...HIRE_ROLES.map((r) => page(`/hire/${r.slug}`, 0.7)),
    page("/insights", 0.7, "weekly"),
    ...ARTICLES.map((a) => page(`/insights/${a.slug}`, 0.6)),
    page("/about", 0.7),
    page("/locations/indore", 0.8),
    page("/locations/switzerland", 0.8),
    page("/careers", 0.7, "weekly"),
    page("/start", 0.8),
    page("/contact", 0.9),
    page("/privacy-policy", 0.2),
    page("/terms-and-conditions", 0.2),
  ];
}
