import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { INDUSTRY_DOSSIERS } from "../src/content/industries/dossiers";
import { industryCaseSlots } from "../src/content/industries/relationships";
import { caseStudySchema, type CaseStudy } from "../src/lib/case-study-schema";

vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
vi.mock("next/image", () => ({ default: ({ src, alt }: { src: string; alt: string }) => React.createElement("img", { src, alt }) }));
vi.mock("../src/sections/industries/industry-dossier-art", () => ({ SectorGlyph: () => React.createElement("svg", { "aria-hidden": true }) }));
import { IndustryCaseStudies } from "../src/sections/industries/industry-case-studies";

const care = INDUSTRY_DOSSIERS[0];
const fixture = (slug: string, changes = {}): CaseStudy => ({ ...caseStudySchema.parse({ title: `Testing-only ${slug}`, summary: "A unit-test fixture, never published to the database.", discipline: "web", status: "verified", industrySlugs: ["healthcare"], ...changes }), slug });
const render = (studies: CaseStudy[], sectors = [care]) => renderToStaticMarkup(React.createElement(IndustryCaseStudies, { slots: industryCaseSlots(studies, sectors) }));

describe("Reference-shaped industry case-study collection", () => {
  it.each(INDUSTRY_DOSSIERS.map(d => [d.slug]))("keeps all five sector-specific solution directions available when there is no published case study", slug => {
    const d = INDUSTRY_DOSSIERS.find(d => d.slug === slug)!;
    const slots = industryCaseSlots([], [d]);
    expect(slots).toHaveLength(5);
    expect(slots.every(s => s.kind === "placeholder")).toBe(true);
    slots.forEach((s, i) => {
      expect(s.kind === "placeholder" && s.concept.title).toBe(d.solutions[i].title);
      expect(s.kind === "placeholder" && s.concept.sector).toBe(d.title);
      expect(s).not.toHaveProperty("slug");
    });
  });
  it.each([0, 1, 2, 3, 4, 5, 6])("fills up to five slots with %i eligible records and no fabricated project links", count => {
    const studies = Array.from({ length: count }, (_, i) => fixture(`record-${i}`));
    const slots = industryCaseSlots(studies, [care]);
    expect(slots).toHaveLength(5);
    expect(slots.filter(s => s.kind === "published")).toHaveLength(Math.min(count, 5));
    const html = render(studies);
    expect((html.match(/data-case-kind="published"/g) || []).length).toBe(Math.min(count, 5));
    expect((html.match(/data-case-kind="placeholder"/g) || []).length).toBe(5 - Math.min(count, 5));
    // Real dossier links are repeated in the complete no-JavaScript fallback.
    expect((html.match(/href="\/case-studies\/record-/g) || []).length).toBe(2 * Math.min(count, 5));
    if (count < 5) expect(html).toContain("Solution direction");
    else expect(html).not.toContain("Solution direction");
  });
  it("does not infer sector relevance or treat a demonstration as proof", () => {
    const excluded = [fixture("unrelated", { industrySlugs: ["fintech"] }), fixture("demo", { status: "demo" }), fixture("untagged", { industrySlugs: undefined, industry: "Healthcare" })];
    expect(industryCaseSlots(excluded, [care]).every(s => s.kind === "placeholder")).toBe(true);
    expect(render(excluded)).not.toContain('href="/case-studies/');
  });
  it("de-duplicates multi-sector project records while preserving managed order", () => {
    const study = fixture("shared", { industrySlugs: ["healthcare", "education"] });
    const slots = industryCaseSlots([study, study, fixture("next")], [care, INDUSTRY_DOSSIERS[5]]);
    expect(slots.filter(s => s.kind === "published").map(s => s.kind === "published" && s.study.slug)).toEqual(["shared", "next"]);
  });
  it("connects the published card action to its real dossier and uses its real image", () => {
    const html = render([fixture("published", { images: { card: { dataUrl: "data:image/png;base64,TESTINGONLY", width: 1280, height: 800, alt: "Testing-only project image" } } })]);
    expect(html).toContain('href="/case-studies/published"');
    expect(html).toContain('/api/cs-img?s=published');
    expect(html).toContain('alt="Testing-only project image"');
    expect(html).toContain('aria-label="Read case study: Testing-only published"');
    expect(html).toContain("Published case study");
  });
  it("withholds NDA identity and imagery without inventing a replacement screenshot", () => {
    const html = render([fixture("nda-record", { nda: true, title: "Sensitive title", displayClientName: "Sensitive client", images: { card: { dataUrl: "data:image/png;base64,PRIVATE", width: 1280, height: 800, alt: "Private image" } } })]);
    expect(html).toContain("Confidential project");
    expect(html).toContain("Project imagery withheld");
    expect(html).not.toContain("Sensitive"); expect(html).not.toContain("PRIVATE"); expect(html).not.toContain("/api/cs-img");
    expect(html).toContain('href="/case-studies/nda-record"');
  });
  it("renders each solution direction and its workflow details without dead dossier links", () => {
    const html = render([]);
    expect((html.match(/<details/g) || []).length).toBe(1);
    expect(html).toContain("View solution details"); expect(html).toContain("Solution direction:");
    expect(html).toContain("Workflow"); expect(html).toContain("Goal");
    expect(html).not.toMatch(/<a\b[^>]*href=/); expect(html).toContain('aria-controls=');
    expect((html.match(/data-selected="true"/g) || []).length).toBe(1);
  });
  it("represents public sectors on the hub but never revives absent industry records", () => {
    const slots = industryCaseSlots([], INDUSTRY_DOSSIERS);
    expect(slots.map(s => s.kind === "placeholder" && s.concept.sector)).toEqual(INDUSTRY_DOSSIERS.slice(0, 5).map(d => d.title));
    const html = render([], []);
    expect(html).toContain("Business operations"); expect(html).not.toContain("Healthcare");
    expect((html.match(/data-case-kind="placeholder"/g) || []).length).toBe(5);
  });
  it("uses three slots for a shorter managed solution collection rather than duplicating concepts", () => {
    expect(industryCaseSlots([], [{ ...care, solutions: care.solutions.slice(0, 3) }])).toHaveLength(3);
  });
  it("keeps proof after engineering/delivery and before questions and the closing enquiry", () => {
    const source = readFileSync("src/sections/industries/industry-dossier-pages.tsx", "utf8").split("export function IndustryDossierPage")[1];
    expect(source.indexOf("<DetailDelivery />")).toBeGreaterThan(-1);
    expect(source.indexOf("<DetailDelivery />")).toBeLessThan(source.indexOf("<WorkReading"));
    expect(source.indexOf("<WorkReading")).toBeLessThan(source.indexOf('id="questions"'));
    expect(source.indexOf('id="questions"')).toBeLessThan(source.indexOf("<Closing"));
  });
});
