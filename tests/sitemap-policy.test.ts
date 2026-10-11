import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ absoluteUrl: (path: string) => `https://example.test${path}` }));
vi.mock("@/lib/content-items", () => ({
  getManagedHireRoles: async () => [], getManagedAiServices: async () => [], getManagedArticles: async () => [], getManagedAgents: async () => [],
}));
vi.mock("@/lib/case-studies", () => ({ getCaseStudies: async () => [] }));
vi.mock("@/lib/industry-dossiers", () => ({ getManagedIndustryDossiers: async () => [] }));

import sitemap from "@/app/sitemap";

describe("sitemap publication facts", () => {
  it("does not claim that every route changed at request/build time", async () => {
    const rows = await sitemap();
    expect(rows.length).toBeGreaterThan(10);
    expect(rows.every((row) => row.lastModified === undefined)).toBe(true);
    expect(rows.every((row) => row.url.startsWith("https://example.test/"))).toBe(true);
  });

  it("invalidates the generated sitemap after a managed-content mutation", () => {
    expect(readFileSync("src/lib/collections.ts", "utf8")).toContain('revalidatePath("/sitemap.xml")');
  });

  it("omits token, portal, unsubscribe and preview routes", async () => {
    const urls = (await sitemap()).map((row) => row.url);
    for (const privatePath of ["/meeting/", "/portal", "/employee-portal", "/unsubscribe", "/insights/preview/", "/case-studies/preview/"]) {
      expect(urls.some((url) => url.includes(privatePath))).toBe(false);
    }
  });
});
