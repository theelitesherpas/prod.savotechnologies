import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
vi.mock("next/image", () => ({ default: ({ fill, sizes, ...props }: React.ComponentProps<"img"> & { fill?: boolean; sizes?: string }) => { void fill; void sizes; return React.createElement("img", props); } }));
vi.mock("../src/components/shared/start-project-button", () => ({ StartProjectButton: ({ source, label }: { source: string; label: string }) => React.createElement("button", { "data-source": source }, label) }));
import TrustPage, { metadata } from "../src/app/(site)/trust/page";
import { CERTIFICATION_BOUNDARY, CONFIDENTIALITY_ROWS, HANDOVER_ROWS, OWNERSHIP_ROWS, SECURITY_ROWS, TRUST_FAQS } from "../src/sections/trust/trust-content";
import { TrustHero, TrustRatings } from "../src/sections/trust/trust-sections";
import { OwnershipPacket } from "../src/sections/trust/trust-art";
import { THIRD_PARTY_RATINGS } from "../src/constants/recognition";
const render = (element: React.ReactElement) => renderToStaticMarkup(element);
const escaped = (text: string) => render(React.createElement("span", null, text)).slice(6, -7);

describe("Trust in the approved Savo page family", () => {
  it("preserves canonical ownership metadata and a single route marker", () => {
    expect(metadata.alternates).toEqual({ canonical: "/trust" }); expect(metadata.title).toBe("Trust & Security");
    const html = render(TrustPage());expect(html).toContain('data-trust-page="ownership-and-working-practices"');expect((html.match(/<h1 /g) ?? [])).toHaveLength(1);
  });
  it("retains the original chapter order and grey shared close", () => {
    const html = render(TrustPage());const positions = ['id="trust-heading"','id="ownership"','id="confidentiality"','id="security"','id="handover"','id="questions"','data-closing-cta'].map(x => html.indexOf(x));
    expect(positions.every(x => x >= 0)).toBe(true);expect(positions).toEqual([...positions].sort((a,b) => a-b));
  });
  it.each([
    ["ownership", OWNERSHIP_ROWS, 7], ["confidentiality", CONFIDENTIALITY_ROWS, 4], ["security", SECURITY_ROWS, 6], ["handover", HANDOVER_ROWS, 3],
  ] as const)("keeps every original %s record fully rendered", (_name, records, count) => {
    const html = render(TrustPage());expect(records).toHaveLength(count);
    for(const record of records){expect(html).toContain(escaped(record.k));expect(html).toContain(escaped(record.v));}
  });
  it("does not hide core policies behind tabs or disclosures", () => {
    const source = readFileSync("src/sections/trust/trust-sections.tsx", "utf8");const html = render(TrustPage());
    expect(html).not.toContain('type="radio"');expect((html.match(/<details/g) ?? [])).toHaveLength(5);
    expect(source).not.toMatch(/aria-hidden|\bhidden=/);
  });
  it("keeps the original certification boundary conspicuous and engagement terms explicit", () => {
    const html = render(TrustPage());expect(html).toContain('aria-labelledby="certification-heading"');expect(html).toContain(escaped(CERTIFICATION_BOUNDARY));
    expect(html).toContain("Your engagement agreement governs work-product ownership");
    expect(html).toContain("Specific controls and service scope belong in your engagement agreement.");
  });
  it("uses an honest illustrative asset packet, not fake badges or a contract download", () => {
    const html = render(React.createElement(OwnershipPacket));expect(html).toContain("Illustrative asset packet - not a client handover or legal document.");
    expect((html.match(/<li/g) ?? [])).toHaveLength(4);expect(html).toContain("Defined in your agreement.");
    expect(html).not.toMatch(/download=|href=|\d+%|verified badge|certified|<canvas/i);
  });
  it("never fills an empty verified rating registry with sample proof", () => {
    expect(render(React.createElement(TrustRatings, {ratings:[]}))).toBe("");
    if(THIRD_PARTY_RATINGS.length===0)expect(render(TrustPage())).not.toContain('id="ratings-heading"');
  });
  it("retains provided rating values, provenance dates and safe external profile links", () => {
    const fixture={platform:"Test-only profile",rating:"Test-only supplied value",reviewCount:2,href:"https://example.invalid/profile",checkedOn:"2026-10-07"};
    const html=render(React.createElement(TrustRatings,{ratings:[fixture]}));expect(html).toContain(fixture.rating);expect(html).toContain(fixture.platform);expect(html).toContain('rel="noopener noreferrer"');expect(html).toContain('dateTime="2026-10-07"');
    expect(html).not.toContain("application/ld+json");
  });
  it("keeps the original five FAQs in native no-JS disclosures", () => {
    const html=render(TrustPage());expect(TRUST_FAQS).toHaveLength(5);expect((html.match(/<details/g) ?? [])).toHaveLength(5);expect((html.match(/ open=""/g) ?? [])).toHaveLength(1);
    for(const faq of TRUST_FAQS){expect(html).toContain(escaped(faq.q));expect(html).toContain(escaped(faq.a));}
  });
  it("builds schema from the visible FAQ source, without invented proof schema", () => {
    const html=render(TrustPage());const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1]);const faq=graph["@graph"].find((x:{"@type":string})=>x["@type"]==="FAQPage");
    expect(faq.mainEntity.map((x:{name:string;acceptedAnswer:{text:string}})=>({q:x.name,a:x.acceptedAnswer.text}))).toEqual(TRUST_FAQS);
    expect(graph["@graph"].map((x:{"@type":string})=>x["@type"])).toEqual(["WebPage","BreadcrumbList","FAQPage"]);
    expect(JSON.stringify(graph)).not.toMatch(/aggregateRating|"@type":"(?:Certification|Review|Person)"/);
  });
  it("retains the original close action and real supporting routes", () => {
    const html=render(TrustPage());expect(html).toContain('data-source="trust-cta"');expect(html).toContain("Talk to a senior consultant");
    for(const href of ["/enterprise","/insights","/company-profile","/technology","/contact#send"])expect(html).toContain(`href="${href}"`);
    const hero=render(React.createElement(TrustHero));expect(hero).toContain('data-source="trust-hero"');expect(hero).toContain("<noscript>");expect(hero).toContain('href="#ownership"');
  });
  it("accurately describes existing editorial imagery rather than claiming client/staff proof", () => {
    const html=render(TrustPage());expect(existsSync("public/images/studio.webp")).toBe(true);expect(existsSync("public/images/studio.webp.json")).toBe(true);
    expect(html).toContain("Editorial design workspace - not a client project or handover photograph.");
    expect(html).not.toContain("Documentation and handover at Savo");
  });
  it("inherits approved tokens, exact-route pinned chrome and static reduced motion", () => {
    const css=readFileSync("src/sections/trust/trust.module.css","utf8");expect(css).toContain("clamp(1.7rem,3.4vw,2.7rem)");expect(css).toContain("prefers-reduced-motion:reduce");expect(css).toContain("animation:none");
    expect(css).not.toMatch(/infinite|linear-gradient|rotate\(|#f7f5f0|#d9480f/i);expect(readFileSync("src/components/layout/site-header.tsx","utf8")).toContain("/^\\/trust\\/?$/.test(pathname)");
    for(const name of ["trust-sections.tsx","trust-art.tsx","trust-content.ts"])expect(readFileSync(`src/sections/trust/${name}`,"utf8")).not.toMatch(/^["']use client/m);
  });
});
