import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { ENGAGEMENTS, REVIEW_PACKETS, ENTERPRISE_FAQS, VENDOR_QUESTIONS } from "../src/sections/enterprise/enterprise-content";
import { COMPANY_FACTS } from "../src/constants/company-facts";
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
vi.mock("../src/components/shared/enquiry-dialog", () => ({ useEnquiry: () => ({ open: vi.fn() }) }));
vi.mock("../src/components/shared/start-project-button", () => ({ StartProjectButton: ({ source, label }: { source: string; label: string }) => React.createElement("button", { "data-source": source }, label) }));
import { EngagementStudio, ReviewDesk } from "../src/sections/enterprise/enterprise-studios";
import { EnterpriseHero, EnterpriseVendorReview } from "../src/sections/enterprise/enterprise-sections";
import { InitiativeArt } from "../src/sections/enterprise/enterprise-art";
const render = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("Enterprise buyer decision guide", () => {
  it("keeps four distinct working arrangements with meaningful limits", () => {
    expect(ENGAGEMENTS.map(x => x.id)).toEqual(["discovery", "fixed-scope", "product-team", "support"]);
    expect(new Set(ENGAGEMENTS.map(x => x.tradeoff)).size).toBe(4);
    for (const item of ENGAGEMENTS) { expect(item.agree).toHaveLength(2); expect(item.summary.length).toBeGreaterThan(60); }
  });
  it("renders complete manual engagement content with only one initial panel", () => {
    const html = render(React.createElement(EngagementStudio));
    expect((html.match(/type="radio"/g) || []).length).toBe(4);
    expect((html.match(/hidden=""/g) || []).length).toBe(3);
    expect((html.match(/checked=""/g) || []).length).toBe(1);
    expect((html.match(/aria-controls=/g) || []).length).toBe(4);
    expect(html).toContain("<noscript>"); expect(html).toContain("not a fixed package");
    for (const item of ENGAGEMENTS) expect(html).toContain(item.shape.replaceAll("&", "&amp;"));
  });
  it.each(ENGAGEMENTS.map(x => [x.id]))("keeps the %s agreement and limits in the complete DOM", id => {
    const item = ENGAGEMENTS.find(x => x.id === id)!;
    const html = render(React.createElement(EngagementStudio));
    expect(html).toContain(item.tradeoff); expect(html).toContain(item.output);
  });
  it("renders three explicit review stages, not a claimed live portal", () => {
    const html = render(React.createElement(ReviewDesk));
    expect((html.match(/type="radio"/g) || []).length).toBe(3);
    expect((html.match(/hidden=""/g) || []).length).toBe(2);
    expect(html).toContain("Illustrative review pack - not a live project or portal.");
    for (const item of REVIEW_PACKETS) expect(html).toContain(item.document.replaceAll("&", "&amp;"));
  });
  it.each(REVIEW_PACKETS.map(x => [x.id]))("gives %s review concrete questions and a real related route", id => {
    const item = REVIEW_PACKETS.find(x => x.id === id)!;
    expect(item.rows).toHaveLength(3); expect(item.detail.length).toBeGreaterThan(100);
    expect(["/services/product-engineering", "/technology", "/trust"]).toContain(item.link);
  });
  it("shows only canonical company identity facts and collapsed procurement detail", () => {
    const html = render(React.createElement(EnterpriseVendorReview));
    expect(html).toContain(COMPANY_FACTS.legalName.value); expect(html).toContain(COMPANY_FACTS.headquarters.value);
    expect((html.match(/<details/g) || []).length).toBe(4); expect(html).not.toContain(" open=");
    expect(html).not.toMatch(/Included on engagements|References.*under NDA|team.webp/);
    for (const item of VENDOR_QUESTIONS) expect(html).toContain(`href="${item.href}"`);
  });
  it("makes the offer and real project-modal action visible without an eyebrow or fake staff image", () => {
    const html = render(React.createElement(EnterpriseHero));
    expect(html).toContain("Complex software."); expect(html).toContain("Clear ownership.");
    expect(html).toContain('data-source="enterprise-hero"'); expect(html).toContain("Discuss your initiative");
    expect(html).toContain('href="#models"'); expect(html).not.toContain("<img");
    expect(render(React.createElement(InitiativeArt))).toContain("Illustrative coordination");
  });
  it("keeps the existing close source, canonical SEO and single-source visible FAQ/schema", () => {
    const source = readFileSync("src/app/(site)/enterprise/page.tsx", "utf8");
    expect(source).toContain('canonical: "/enterprise"'); expect(source).toContain("ENTERPRISE_FAQS.map");
    expect(source).toContain('<ClosingCta'); expect(source).toContain('source="enterprise-cta"');
    expect(source).not.toContain("aggregateRating"); expect(ENTERPRISE_FAQS).toHaveLength(4);
    expect(new Set(ENTERPRISE_FAQS.map(x => x.q)).size).toBe(4);
  });
  it("does not assert staff, prices, guaranteed outputs, certifications or reference availability", () => {
    const text = JSON.stringify([ENGAGEMENTS, REVIEW_PACKETS, VENDOR_QUESTIONS, ENTERPRISE_FAQS]);
    expect(text).not.toMatch(/ISO.?27001 certified|SOC.?2 certified|we guarantee|guaranteed (?:price|output|delivery)|included on all engagements|references are available|\d+%/i);
    expect(ENGAGEMENTS[2].tradeoff).toContain("not a guarantee"); expect(ENGAGEMENTS[3].tradeoff).toContain("not assumed");
  });
  it("isolates presentation and preserves static reduced-motion and scoped chrome", () => {
    const css = readFileSync("src/sections/enterprise/enterprise.module.css", "utf8");
    expect(css).toContain("prefers-reduced-motion:reduce"); expect(css).toContain("animation:none");
    expect(css).not.toMatch(/infinite|rotate\(|linear-gradient/);
    expect(readFileSync("src/components/layout/site-header.tsx", "utf8")).toContain("/^\\/enterprise\\/?$/");
    expect(readFileSync("src/components/shared/ask-savo-bar.tsx", "utf8")).toContain("data-compact-assistant={true}");
    expect(readFileSync("src/components/shared/ask-savo-bar.module.css", "utf8")).not.toContain("data-service-assistant");
  });
});
