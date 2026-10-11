import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/env";
import { getManagedIndustryDossiers } from "@/lib/industry-dossiers";
import { SERVICE_DETAILS } from "@/constants/services-detail";
import { getManagedHireRoles, getManagedAiServices, getManagedArticles, getManagedAgents } from "@/lib/content-items";
import { getCaseStudies } from "@/lib/case-studies";

/**
 * Production XML sitemap - canonical, indexable URLs only, always on the
 * canonical origin. Utility pages (client portal login) and admin/API
 * surfaces are excluded by design.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [HIRE_ROLES, AI_SERVICES, ARTICLES, CASE_STUDIES, AGENTS, INDUSTRY_DOSSIERS] = await Promise.all([
    getManagedHireRoles(),
    getManagedAiServices(),
    getManagedArticles(),
    getCaseStudies(),
    getManagedAgents(),
    getManagedIndustryDossiers(),
  ]);
  // Omit lastModified until each source exposes a trustworthy content-update timestamp.
  const page = (url: string, priority: number, changeFrequency: "monthly" | "weekly" = "monthly") => ({
    url: absoluteUrl(url),
    changeFrequency,
    priority,
  });

  return [
    page("/", 1, "weekly"),
    page("/services", 0.9),
    ...SERVICE_DETAILS.map((s) => page(`/services/${s.slug}`, 0.8)),
    page("/ai-agents", 0.9),
    // Published agent roles; only SalesBot has a working conversation demo.
    ...AGENTS.map((a) => page(`/ai-agents/${a.slug}`, 0.8)),
    ...AI_SERVICES.map((s) => page(`/ai/${s.slug}`, 0.8)),
    page("/industries", 0.9),
    ...INDUSTRY_DOSSIERS.map((d) => page(`/industries/${d.slug}`, 0.8)),
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
    // Enterprise buyer track (spec Parts 21–24)
    page("/enterprise", 0.8),
    page("/trust", 0.7),
    page("/company-profile", 0.6),
    page("/technology", 0.7),
    page("/locations/indore", 0.8),
    page("/locations/switzerland", 0.8),
    page("/careers", 0.7, "weekly"),
    page("/start-a-project", 0.8),
    page("/contact", 0.9),
    page("/privacy-policy", 0.2),
    page("/terms-and-conditions", 0.2),
  ];
}
