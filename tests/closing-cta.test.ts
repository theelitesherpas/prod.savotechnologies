import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi, beforeEach } from "vitest";

const { enquiry, project, analytics } = vi.hoisted(() => ({ enquiry: vi.fn(), project: vi.fn(), analytics: vi.fn() }));
vi.mock("../src/components/shared/enquiry-dialog", () => ({ useEnquiry: () => ({ open: enquiry }) }));
vi.mock("../src/components/shared/project-lead-modal", () => ({ useProjectModal: () => ({ open: project }) }));
vi.mock("../src/lib/analytics", () => ({ track: analytics }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
import { ClosingCta } from "../src/components/shared/closing-cta";
import { FinalCTA } from "../src/sections/home/final-cta";
import { DetailCta } from "../src/components/shared/detail-cta";
import { CaseStudiesCta } from "../src/sections/case-studies/closing-cta";

const sources = [
  "src/sections/home/final-cta.tsx",
  "src/components/shared/detail-cta.tsx",
  "src/sections/case-studies/closing-cta.tsx",
  "src/sections/services/service-detail.tsx",
  "src/sections/ai/ai-pages.tsx",
  "src/sections/hire/hire-pages.tsx",
  "src/sections/hire/hire-hub.tsx",
  "src/sections/industries/industry-dossier-pages.tsx",
  "src/app/(site)/enterprise/page.tsx",
  "src/app/(site)/trust/page.tsx",
  "src/app/(site)/technology/page.tsx",
];
function click(element: React.ReactElement) {
  (element.props as { onClick: () => void }).onClick();
}
function controls(element: React.ReactElement) {
  return React.Children.toArray((element.props as { children: React.ReactNode }).children) as React.ReactElement[];
}

beforeEach(() => vi.clearAllMocks());
describe("Consistent light closing section", () => {
  it("keeps the semantic heading, anchor, copy-first order and caller-owned controls", () => {
    const html = renderToStaticMarkup(ClosingCta({ id: "industry-start", headingId: "sector-close", title: "Managed heading", description: "Managed description", children: [React.createElement("button", { key: "project", type: "button" }, "Discuss your project"), React.createElement("a", { key: "contact", href: "/contact" }, "Contact Savo")] }));
    expect(html).toContain('id="industry-start"'); expect(html).toContain('aria-labelledby="sector-close"');
    expect(html).toContain('<h2 id="sector-close">Managed heading</h2>');
    expect(html.indexOf("Managed description")).toBeLessThan(html.indexOf("Discuss your project"));
    expect(html).toContain('href="/contact"'); expect((html.match(/data-closing-cta/g) || []).length).toBe(1);
  });
  it("supports existing linked descriptions and a single specialised action without adding controls", () => {
    const html = renderToStaticMarkup(ClosingCta({ headingId: "trust-close", title: "Security questionnaire", description: React.createElement("a", { href: "/enterprise" }, "Enterprise information"), children: React.createElement("button", { type: "button" }, "Talk to a senior consultant") }));
    expect(html).toContain('href="/enterprise"'); expect((html.match(/<button/g) || []).length).toBe(1);
  });
  it.each(sources)("uses the same visual component in %s", path => {
    const source = readFileSync(path, "utf8");
    expect(source).toContain('from "@/components/shared/closing-cta"'); expect(source).toContain("<ClosingCta");
  });
  it("uses a light neutral ground, shared responsive rail, readable type and static reduced motion", () => {
    const css = readFileSync("src/components/shared/closing-cta.module.css", "utf8");
    expect(css).toContain("background:#f7f7f7"); expect(css).toContain("width:min(1280px,calc(100% - 64px))");
    expect(css).toContain("clamp(1.7rem,3.4vw,2.7rem)"); expect(css).toContain("justify-self:end");
    expect(css).toContain("max-width:899px"); expect(css).toContain("width:calc(100% - 40px)");
    expect(css).toContain("min-height:52px"); expect(css).toContain("min-height:44px");
    expect(css).toContain("prefers-reduced-motion:reduce"); expect(css).toContain("transition:none");
    expect(css.split(".rail")[0]).not.toContain("background:#000");
    expect(css).not.toMatch(/linear-gradient|animation:/);
  });
  it("preserves homepage project-popup routing and analytics, with the secondary enquiry drawer", () => {
    const buttons = controls(FinalCTA()); click(buttons[0]);
    expect(project).toHaveBeenCalledWith({ source: "final-cta" });
    expect(analytics).toHaveBeenCalledWith("start_project_click", { location: "final-cta" });
    expect(enquiry).not.toHaveBeenCalled(); click(buttons[1]);
    expect(enquiry).toHaveBeenCalledWith("final-cta-talk");
  });
  it("preserves parameterised detail enquiry sources and secondary drawer routing", () => {
    const buttons = controls(DetailCta({ headingId: "detail-close", heading: "Heading", lead: "Lead", location: "about-cta" }));
    click(buttons[0]); expect(enquiry).toHaveBeenCalledWith("about-cta");
    expect(analytics).toHaveBeenCalledWith("start_project_click", { location: "about-cta" });
    click(buttons[1]); expect(enquiry).toHaveBeenCalledWith("about-cta-talk");
  });
  it("retains a configured secondary URL instead of substituting a drawer", () => {
    const buttons = controls(DetailCta({ headingId: "detail-close", heading: "Heading", lead: "Lead", location: "detail", secondaryHref: "/contact", secondaryLabel: "Contact Savo" }));
    expect((buttons[1].props as { href: string }).href).toBe("/contact"); expect(enquiry).not.toHaveBeenCalled();
  });
  it("preserves both case-study enquiry sources", () => {
    const buttons = controls(CaseStudiesCta()); click(buttons[0]); click(buttons[1]);
    expect(enquiry).toHaveBeenCalledWith("case-studies-cta"); expect(enquiry).toHaveBeenCalledWith("case-studies-cta-talk");
  });
});
