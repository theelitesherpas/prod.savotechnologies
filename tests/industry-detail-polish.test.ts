import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { INDUSTRY_DOSSIERS } from "../src/content/industries/dossiers";

vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
vi.mock("next/image", () => ({ default: ({ src, alt }: { src: string; alt: string }) => React.createElement("img", { src, alt }) }));
vi.mock("../src/sections/industries/industry-dossier-interactions", () => ({ IndustryAction: ({ children, subject, solution }: { children: React.ReactNode; subject: string; solution: string }) => React.createElement("button", { "data-subject": subject, "data-solution": solution }, children) }));
import { ProductStudio, ReviewStudio, SectorRoles } from "../src/sections/industries/industry-detail-studio";
import { DetailContext, DetailConnections, DetailEngineering, DetailDelivery } from "../src/sections/industries/industry-detail-sections";
import styles from "../src/sections/industries/industry-detail-polish.module.css";
const render = (element: React.ReactElement) => renderToStaticMarkup(element);

describe("Clearer, isolated industry details", () => {
  it.each(INDUSTRY_DOSSIERS.map(d => [d.slug]))("keeps the complete managed %s content in progressive, non-wireframe sections", slug => {
    const d = INDUSTRY_DOSSIERS.find(d => d.slug === slug)!;
    const context = render(React.createElement(DetailContext, { dossier: d }));
    expect(context).toContain(d.ecosystemTitle.replaceAll("&", "&amp;"));
    expect((context.match(/<details/g) || []).length).toBe(d.challenges.length + 1);
    expect(context).not.toContain(" open="); expect(context).toContain("The people, places and operating context shape every product decision.");
    const products = render(React.createElement(ProductStudio, { dossier: d, services: [] }));
    expect((products.match(/type="radio"/g) || []).length).toBe(d.solutions.length);
    expect((products.match(/hidden=""/g) || []).length).toBe(d.solutions.length - 1);
    expect(products).not.toContain("→"); expect(products).toContain("Workflow focus");
    expect(products.split(`class="${styles.productEmblem}"`).length - 1).toBe(d.solutions.length);
    expect(products).toContain(`<div class="${styles.productEmblem}"><div class="${styles.visualDisc}"></div><svg`);
    for (const solution of d.solutions) expect(products).toContain(solution.title.replaceAll("&", "&amp;"));
    const ai = render(React.createElement(ReviewStudio, { opportunities: d.aiOpportunities }));
    expect((ai.match(/type="radio"/g) || []).length).toBe(d.aiOpportunities.length);
    expect((ai.match(/hidden=""/g) || []).length).toBe(d.aiOpportunities.length - 1);
    expect(ai).toContain("Human review stays here");
    for (const opportunity of d.aiOpportunities) expect(ai).toContain(opportunity.review.replaceAll("&", "&amp;").replaceAll("'", "&#x27;"));
    const engineering = render(React.createElement(DetailEngineering, { dossier: d }));
    expect((engineering.match(/<details/g) || []).length).toBe(d.safeguards.length + d.outcomes.length + 1);
    expect(engineering).toContain("not achieved results"); expect(engineering).not.toContain(" open=");
  });
  it("preserves the six manually explainable roles without connection-path artwork", () => {
    const d = INDUSTRY_DOSSIERS[0];
    const html = render(React.createElement(SectorRoles, { nodes: d.ecosystemNodes, core: d.ecosystemCore, kind: d.layout }));
    expect((html.match(/aria-pressed=/g) || []).length).toBe(6);
    expect(html).toContain('aria-live="polite"'); expect(html).toContain("Choose a role to see its responsibility in the system.");
    const source = readFileSync("src/sections/industries/industry-detail-studio.tsx", "utf8");
    expect(source).not.toContain("EcosystemPaths"); expect(source).not.toContain("DossierArrow");
  });
  it("keeps hero rings concentric and product circles coupled to proportional sector symbols", () => {
    const css = readFileSync("src/sections/industries/industry-detail-polish.module.css", "utf8");
    expect(css).toMatch(/\.roleShape::after \{[^}]*inset:12px/);
    expect(css).toMatch(/\.roleShape > svg \{[^}]*width:52%[^}]*height:52%/);
    expect(css).toMatch(/\.productEmblem \{[^}]*aspect-ratio:1[^}]*flex:none/);
    expect(css).toMatch(/\.visualDisc \{[^}]*inset:0/);
    expect(css).toMatch(/\.productEmblem > svg \{[^}]*width:66\.666667%[^}]*height:66\.666667%/);
    expect(css).toContain(".productEmblem { width:166px; }");
    expect(css).not.toMatch(/inset:-18px|right:-36px|\.productVisual > svg/);
  });
  it("renders actual canonical capability links and editorial related-sector imagery", () => {
    const html = render(React.createElement(DetailConnections, { services: [{ slug: "custom-software-development", title: "Managed service label" }], industries: [INDUSTRY_DOSSIERS[5]] }));
    expect(html).toContain('href="/services/custom-software-development"'); expect(html).toContain("Managed service label");
    expect(html).toContain('href="/industries/education"'); expect(html).toContain('src="/images/sectors/education-hero.webp"');
    expect(render(React.createElement(DetailConnections, { services: [], industries: [] }))).toBe("");
  });
  it("keeps delivery understandable without an arrow diagram", () => {
    const html = render(React.createElement(DetailDelivery));
    expect((html.match(/<li/g) || []).length).toBe(4); expect(html).toContain("Prepare handover");
    expect((html.match(/<svg/g) || []).length).toBe(1); // Native disclosure icon, not a process diagram.
    expect(readFileSync("src/sections/industries/industry-detail-sections.tsx", "utf8")).not.toContain("DeliveryDrawing");
  });
  it("leaves the hub renderer and approved case-study component outside the new detail scope", () => {
    const source = readFileSync("src/sections/industries/industry-dossier-pages.tsx", "utf8");
    const hub = source.split("export function IndustriesDossierHub")[1].split("export function IndustryDossierPage")[0];
    expect(hub).not.toContain("DetailContext"); expect(hub).not.toContain("SectorRoles");
    const detail = source.split("export function IndustryDossierPage")[1];
    expect(detail).toContain("v.detailPage"); expect(detail).toContain("<WorkReading"); expect(detail).toContain("<Closing");
    expect(detail).not.toContain("aiPath"); expect(detail).not.toContain("integrationMap");
  });
});
