import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
vi.mock("next/image", () => ({ default: (props: React.ComponentProps<"img">) => React.createElement("img", props) }));
vi.mock("../src/components/shared/start-project-button", () => ({ StartProjectButton: ({ source, label }: { source: string; label: string }) => React.createElement("button", { "data-source": source }, label) }));
import TechnologyPage, { metadata } from "../src/app/(site)/technology/page";
import { ARCHITECTURE_JUDGMENT, TECHNOLOGY_FAQS, TECHNOLOGY_STACK } from "../src/sections/technology/technology-content";
import { TechnologyArchitecture, TechnologyHero, TechnologyQuestions, TechnologyStack } from "../src/sections/technology/technology-sections";
import { TechnologyAssembly } from "../src/sections/technology/technology-art";
const render = (element: React.ReactElement) => renderToStaticMarkup(element);
const escaped = (text: string) => render(React.createElement("span", null, text)).slice(6, -7);

describe("Technology in the current Savo identity", () => {
  it("preserves canonical metadata and a single clear route marker", () => {
    expect(metadata.alternates).toEqual({ canonical: "/technology" });
    expect(metadata.title).toBe("Technology & Architecture");
    expect(render(TechnologyPage())).toContain('data-technology-page="stack-and-judgment"');
  });
  it("orders offer, stack, architecture, questions and the original shared close", () => {
    const html = render(TechnologyPage());
    const positions = ['id="tech-heading"', 'id="stack"', 'id="architecture"', 'id="questions"', "data-closing-cta"].map(value => html.indexOf(value));
    expect(positions.every(value => value >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect((html.match(/<h1 /g) ?? [])).toHaveLength(1);
  });
  it("retains the six original technology families with complete reasoning", () => {
    expect(TECHNOLOGY_STACK.map(x => x.family)).toEqual(["Frontend", "Mobile", "Backend", "Data", "AI", "Cloud & DevOps"]);
    const html = render(React.createElement(TechnologyStack));
    for (const family of TECHNOLOGY_STACK) {
      expect(html).toContain(escaped(family.why));
      expect(html).toContain(escaped(family.where));
      expect(family.tools.map(x => x.name).join(" · ")).toBe(family.picks);
    }
  });
  it("uses native six-way radios, one initial choice and complete server-rendered panels", () => {
    const html = render(React.createElement(TechnologyStack));
    expect((html.match(/type="radio"/g) ?? [])).toHaveLength(6);
    expect((html.match(/checked=""/g) ?? [])).toHaveLength(1);
    expect((html.match(/<article /g) ?? [])).toHaveLength(6);
    for (const family of TECHNOLOGY_STACK) {
      expect(html).toContain(`aria-controls="stack-${family.id}"`);
      expect(html).toContain(`id="stack-${family.id}"`);
      expect(html).toContain(`aria-labelledby="stack-${family.id}-heading"`);
    }
    expect(html).not.toContain('role="tab"');
  });
  it.each(TECHNOLOGY_STACK.map(x => [x.id]))("provides a native CSS selection and static fallback for %s", id => {
    const css = readFileSync("src/sections/technology/technology.module.css", "utf8");
    expect(css).toContain(`input[value="${id}"]:checked`);
    expect(css).toContain(`.stackPanel[data-family="${id}"]`);
    expect(css).toContain("@supports not selector(:has(input:checked))");
  });
  it("reuses only local technology logos that exist, with no extra vendor choices", () => {
    for (const family of TECHNOLOGY_STACK) for (const tool of family.tools) if (tool.logo) expect(existsSync(`public/images/technology/${tool.logo}.svg`)).toBe(true);
    expect(TECHNOLOGY_STACK.find(x => x.id === "ai")!.tools.every(x => !x.logo)).toBe(true);
    expect(TECHNOLOGY_STACK.find(x => x.id === "cloud")!.tools.every(x => !x.logo)).toBe(true);
  });
  it("keeps all six architecture principles visible rather than making a card or tab grid", () => {
    const html = render(React.createElement(TechnologyArchitecture));
    expect(ARCHITECTURE_JUDGMENT).toHaveLength(6);
    for (const item of ARCHITECTURE_JUDGMENT) {
      expect(html).toContain(escaped(item.k)); expect(html).toContain(escaped(item.v));
    }
    expect(html).not.toContain("<details");
    expect(html).toContain('href="/case-studies"'); expect(html).toContain('href="/ai-agents"');
  });
  it("labels the illustration honestly without invented proof, metrics or client interfaces", () => {
    const html = render(React.createElement(TechnologyAssembly));
    expect(html).toContain("Illustrative system - not a client deployment or a fixed stack.");
    expect(html).not.toMatch(/production ready|certified|client result|\d+%|<canvas/i);
    expect(html).toContain("AI, where it fits");
  });
  it("renders all eleven original FAQs with native keyboard/no-JS disclosures", () => {
    const html = render(React.createElement(TechnologyQuestions));
    expect(TECHNOLOGY_FAQS).toHaveLength(11);
    expect((html.match(/<details/g) ?? [])).toHaveLength(11);
    expect((html.match(/ open=""/g) ?? [])).toHaveLength(1);
    for (const item of TECHNOLOGY_FAQS) { expect(html).toContain(escaped(item.q)); expect(html).toContain(escaped(item.a)); }
  });
  it("uses the same FAQ source for schema and visible content", () => {
    const html = render(TechnologyPage());
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1]);
    const faq = graph["@graph"].find((x: { "@type": string }) => x["@type"] === "FAQPage");
    expect(faq.mainEntity.map((x: { name: string; acceptedAnswer: { text: string } }) => ({ q: x.name, a: x.acceptedAnswer.text }))).toEqual(TECHNOLOGY_FAQS);
    expect(JSON.stringify(graph)).not.toMatch(/aggregateRating|Review|certified|client deployment/);
  });
  it("keeps the original modal action/source and provides a real no-JS contact path", () => {
    const html = render(TechnologyPage());
    expect(html).toContain('data-source="technology-cta"'); expect(html).toContain("Ask an engineer");
    const hero = render(React.createElement(TechnologyHero));
    expect(hero).toContain('data-source="technology-hero"'); expect(hero).toContain("<noscript>"); expect(hero).toContain('href="/contact#send"');
    expect(hero).not.toMatch(/Technology &amp; architecture<\/p>|t-label|photo|<canvas/);
  });
  it("inherits the approved scale and palette, static motion and exact-route header guard", () => {
    const css = readFileSync("src/sections/technology/technology.module.css", "utf8");
    expect(css).toContain("clamp(1.7rem,3.4vw,2.7rem)"); expect(css).toContain("prefers-reduced-motion:reduce"); expect(css).toContain("animation:none");
    expect(css).not.toMatch(/infinite|linear-gradient|rotate\(|#f7f5f0|#d9480f/i);
    expect(readFileSync("src/components/layout/site-header.tsx", "utf8")).toContain("/^\\/technology\\/?$/.test(pathname)");
    for (const file of ["technology-sections.tsx", "technology-art.tsx", "technology-content.ts"]) expect(readFileSync(`src/sections/technology/${file}`, "utf8")).not.toMatch(/^["']use client/m);
  });
});
