import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SERVICE_DETAILS } from "../src/constants/services-detail";
import { servicePageDetail } from "../src/sections/services/service-page-content";
import { artForService } from "../src/sections/services/service-art";

describe("service presentation", () => {
  it.each(SERVICE_DETAILS.map(d => [d.slug]))("preserves the canonical %s service and gives it a complete journey", slug => {
    const original = SERVICE_DETAILS.find(d => d.slug === slug)!;
    const detail = servicePageDetail(slug)!;
    expect(detail.slug).toBe(original.slug);
    expect(detail.title).toBe(original.title);
    expect(detail.related).toEqual(original.related);
    expect(detail.industries).toEqual(original.industries);
    expect(detail.deliverables).toHaveLength(6);
    expect(detail.process).toHaveLength(4);
    expect(detail.faqs.length).toBeGreaterThanOrEqual(5);
    expect(new Set(detail.faqs.map(q => q.q)).size).toBe(detail.faqs.length);
    expect(detail.faqs.every(q => q.q && q.a.length > 50)).toBe(true);
    expect(detail.whenNeeded?.length).toBeGreaterThanOrEqual(3);
    expect(detail.architecture?.length).toBeGreaterThan(100);
    expect(detail.afterLaunch).toContain("agreed");
    for (let i = 0; i < 6; i++) expect(["website", "portal", "content", "phone", "workflow", "design"]).toContain(artForService(slug, i));
  });
  it("describes service scope and delivery directly without client-work disclaimers", () => {
    const files = ["src/sections/services/service-explorers.tsx", "src/sections/services/service-interactions.tsx", "src/sections/services/service-detail.tsx", "src/sections/services/service-art.tsx"];
    const copy = files.map(file => readFileSync(file, "utf8")).join("\n");
    expect(copy).not.toMatch(/Illustrative interface, not client work|Illustrative system map\. The final architecture is project-specific|Illustrative concepts - not client project screenshots|illustrative UI/i);
    for (const phrase of ["We shape the architecture around your product", "Plan, build, review and release with your team", "Resources to support the decisions behind your project"]) expect(copy).toContain(phrase);
  });
  it("does not invent a detail for an unknown route", () => expect(servicePageDetail("not-a-service")).toBeUndefined());
  it("keeps web questions and contract boundaries substantive", () => {
    const detail = servicePageDetail("web-development")!;
    expect(detail.faqs).toHaveLength(7);
    expect(detail.faqs.find(q => q.q.includes("SEO"))?.a).toContain("not guaranteed");
    expect(detail.faqs.find(q => q.q.includes("migrate"))?.a).toContain("no migration can guarantee");
    expect(detail.faqs[0].a).toContain("contract");
  });
});
