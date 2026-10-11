import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
import SwitzerlandPage, { metadata } from "../src/app/(site)/locations/switzerland/page";
import { COMPANY_FACTS } from "../src/constants/company-facts";
import { OFFICES } from "../src/constants/site";
import { SWITZERLAND_FAQS } from "../src/constants/faqs";
import { buildSwissModel, buildSwissFaqs, buildSwissWorking, swissDescription, swissPublicValue, SWISS_SERVICES, SWISS_ORIGINAL_DESCRIPTION, type SwissFacts, type SwissOfficeRecord } from "../src/sections/switzerland/swiss-content";
import { SwissSurface } from "../src/sections/switzerland/swiss-sections";
const render = (node: React.ReactNode) => renderToStaticMarkup(node);
const escaped = (value: string) => render(React.createElement("span", null, value)).slice(6, -7);
const facts = () => structuredClone(COMPANY_FACTS) as SwissFacts;
const offices = () => structuredClone(OFFICES) as SwissOfficeRecord[];
const fixture = (input = facts(), records = offices()) => { const model = buildSwissModel(input, records); return render(React.createElement(SwissSurface, { model, faqs: buildSwissFaqs(model) })); };
const swiss = (records: SwissOfficeRecord[]) => records.find(item => item.id === "switzerland")!;

describe("Switzerland in the approved location family", () => {
  it("retains the original current public metadata and canonical", () => {
    expect(metadata.title).toBe("Software & AI Development Company in Switzerland");
    expect(metadata.description).toBe(SWISS_ORIGINAL_DESCRIPTION);
    expect(metadata.alternates).toEqual({ canonical: "/locations/switzerland" });
  });
  it("retains all five original chapters and adds useful office details", () => {
    const html = render(SwitzerlandPage());
    expect(html).toContain('data-switzerland-page="head-office-and-engineering"');
    expect(html).toContain("switzerland-v7");
    expect((html.match(/<h1 /g) ?? [])).toHaveLength(1);
    for (const id of ["switzerland", "office", "services", "working", "faq", "start"]) expect(html).toContain(`id="${id}"`);
  });
  it("keeps all six original services and their destinations", () => {
    const html = render(SwitzerlandPage());
    expect(SWISS_SERVICES).toHaveLength(6);
    expect(SWISS_SERVICES.map(item => item.href)).toEqual(["/services/web-development", "/services/mobile-app-development", "/ai-agents", "/services/custom-software-development", "/services/ui-ux-design", "/services"]);
    for (const service of SWISS_SERVICES) { expect(html).toContain(escaped(service.title)); expect(html).toContain(escaped(service.body)); expect(html).toContain(`href="${service.href}"`); }
  });
  it("uses the genuine head-office address, direct line, HQ and public identity", () => {
    const model = buildSwissModel();
    expect(model.address).toBe("Rue de la Fruiterie 13, 1523 Granges-Marnand, Switzerland");
    expect(model.phones).toEqual([{ display: "+41 76 408 28 72", href: "tel:+41764082872" }]);
    expect(model.indoreAddress).toBe(COMPANY_FACTS.headquarters.value);
    expect(model.emailHref).toBe("mailto:hello@savotechnologies.com");
    expect(model.legalName).toBe(COMPANY_FACTS.legalName.value);
  });
  it("requires approval and public visibility, including populated pending values", () => {
    for (const visibility of ["public", "internal"] as const) {
      const input = facts();
      for (const key of ["brandName", "legalName", "headquarters", "operationalOffices", "foundedYear", "email"] as const) input[key] = { ...input[key], value: `PRIVATE-${key}-Indore-Granges-Marnand-Switzerland`, status: visibility === "public" ? "requires-verified-input" : "verified", visibility };
      const html = fixture(input);
      expect(html).not.toContain("PRIVATE-");
      expect(html).toContain("awaiting public confirmation");
      expect(html).not.toMatch(/maps\/search|href="tel:|href="mailto:/);
    }
  });
  it("does not expose internal governance/source details", () => {
    const html = render(SwitzerlandPage());
    expect(html).not.toMatch(/verifiedDate|reviewDate|Savo project ledger|Company communications|Certificate of incorporation/);
  });
  it("rejects demo offices even when demo mode is active", () => {
    const records = offices(); swiss(records).status = "demo";
    const model = buildSwissModel(facts(), records);
    expect(model.address).toBeNull(); expect(model.phones).toEqual([]);
    expect(fixture(facts(), records)).not.toContain("Rue de la Fruiterie");
  });
  it("does not promote a market or private office to a physical head office", () => {
    for (const privateOffice of [false, true]) {
      const records = offices();
      if (privateOffice) swiss(records).visibility = "internal"; else swiss(records).kind = "market";
      expect(buildSwissModel(facts(), records).address).toBeNull();
      expect(fixture(facts(), records)).not.toMatch(/Rue de la Fruiterie|41764082872/);
    }
  });
  it("fails closed when canonical approval, region, record or address disagree", () => {
    const input = facts(); input.operationalOffices = { ...input.operationalOffices, value: "Indore, India only" };
    expect(buildSwissModel(input).address).toBeNull();
    expect(buildSwissModel(facts(), []).address).toBeNull();
    const records = offices(); swiss(records).region = "Dubai";
    expect(buildSwissModel(facts(), records).address).toBeNull();
    swiss(records).region = "Switzerland"; swiss(records).addressLine = "Unconfirmed address in Zurich";
    expect(buildSwissModel(facts(), records).address).toBeNull();
    swiss(records).addressLine = " "; expect(buildSwissModel(facts(), records).mapHref).toBeNull();
  });
  it("does not imply an Indore HQ if the HQ is pending, private or relocated", () => {
    const input = facts(); input.headquarters = { ...input.headquarters, value: "Mumbai, India" };
    const model = buildSwissModel(input); expect(model.indoreAddress).toBeNull();
    expect(buildSwissWorking(model)[1].title).toBe("An agreed engineering arrangement.");
    expect(swissDescription(model)).not.toBe(SWISS_ORIGINAL_DESCRIPTION);
    expect(fixture(input)).not.toContain("Engineering from Indore.");
  });
  it("does not create unsafe or mismatched direct lines", () => {
    const records = offices(); swiss(records).phones = [{ display: "+41 76 408 28 72", e164: "javascript:unsafe" }, { display: "+41 76 408 28 72", e164: "+41764082873" }, { display: "+91 75029 01234", e164: "+917502901234" }];
    expect(buildSwissModel(facts(), records).phones).toEqual([]);
    expect(fixture(facts(), records)).toContain("To be confirmed");
    expect(fixture(facts(), records)).not.toContain('href="tel:');
  });
  it("rejects empty, non-string and unknown-approval values", () => {
    expect(swissPublicValue({ ...COMPANY_FACTS.email, value: 123 })).toBeNull();
    expect(swissPublicValue({ ...COMPANY_FACTS.email, value: " " })).toBeNull();
    expect(swissPublicValue({ ...COMPANY_FACTS.email, status: "unknown" as never })).toBeNull();
    const input = facts(); input.email = { ...input.email, value: "javascript:unsafe" }; input.foundedYear = { ...input.foundedYear, value: "Unknown" };
    expect(buildSwissModel(input).emailHref).toBeNull(); expect(buildSwissModel(input).foundedYear).toBeNull();
  });
  it("keeps pending metadata free of unapproved head-office assertions", () => {
    const input = facts(); input.operationalOffices = { ...input.operationalOffices, status: "requires-verified-input" };
    expect(swissDescription(buildSwissModel(input))).toContain("confirm current Swiss office");
    expect(swissDescription(buildSwissModel(input))).not.toContain("head office is in");
    expect(fixture(input)).not.toContain("Our Swiss<br");
  });
  it("provides encoded address search rather than a fabricated business listing/map", () => {
    const model = buildSwissModel(); const url = new URL(model.mapHref!);
    expect(url.origin).toBe("https://www.google.com"); expect(url.pathname).toBe("/maps/search/");
    expect(url.searchParams.get("query")).toBe(model.address); expect(url.searchParams.get("api")).toBe("1");
    const html = render(SwitzerlandPage()); expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toMatch(/latitude|longitude|openingHours|<iframe|<img|<canvas/);
  });
  it("retains European/Indian communication and engineering topics without promises", () => {
    const model = buildSwissModel(); expect(buildSwissWorking(model)).toHaveLength(2);
    const html = render(SwitzerlandPage()); expect(html).toContain("Europe/Zurich"); expect(html).toContain("CET in winter and CEST in summer"); expect(html).toContain("India Standard Time (UTC+5:30)");
    expect(html).not.toMatch(/engineering bench working while Europe sleeps|keeps timelines short|are answered by the next morning|senior coverage across/);
  });
  it("explains the daylight-saving offset without a fake live office clock", () => {
    const faqs = buildSwissFaqs(buildSwissModel()); expect(faqs[3].a).toContain("4½ hours in winter and 3½ hours in summer");
    expect(faqs[3].a).toContain("next-morning progress or replies are not guaranteed");
  });
  it("retains all ten original questions and all answers server-rendered", () => {
    const faqs = buildSwissFaqs(buildSwissModel()); expect(faqs.map(item => item.q)).toEqual(SWITZERLAND_FAQS.map(item => item.q)); expect(faqs).toHaveLength(10);
    const html = render(SwitzerlandPage()); expect((html.match(/<details/g) ?? [])).toHaveLength(10); expect((html.match(/ open=""/g) ?? [])).toHaveLength(1);
    for (const item of faqs) expect(html).toContain(escaped(item.a));
  });
  it("keeps schema and screen answers identical with original breadcrumb/graph", () => {
    const html = render(SwitzerlandPage()); const graph = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1]);
    expect(graph["@graph"].map((item: { "@type": string }) => item["@type"])).toEqual(["WebPage", "FAQPage"]);
    expect(graph["@graph"][0].breadcrumb.itemListElement.map((item: { name: string }) => item.name)).toEqual(["Home", "Switzerland"]);
    expect(graph["@graph"][1].mainEntity.map((item: { name: string; acceptedAnswer: { text: string } }) => ({ q: item.name, a: item.acceptedAnswer.text }))).toEqual(buildSwissFaqs(buildSwissModel()));
  });
  it("keeps meeting/discovery/NDA/cost/reference topics but qualifies commitments", () => {
    const html = render(SwitzerlandPage());
    for (const value of ["Arrange it with the team before travelling", "any NDA arrangements", "what references may be shared", "does not guarantee savings", "Confirm response timing"]) expect(html).toContain(value);
    expect(html).not.toMatch(/replies within one business day|Most Swiss clients combine|better cost-quality ratio|quoted as fixed-scope milestones/);
  });
  it("does not equate a head office with Swiss incorporation or a Swiss contract", () => {
    const html = render(SwitzerlandPage()); expect(html).toContain("does not establish a separately incorporated Swiss entity");
    expect(html).toContain("Confirm the contracting entity and jurisdiction"); expect(html).not.toMatch(/Both, honestly structured|Swiss presence, contracts and accountability/);
  });
  it("keeps the named city coverage question without inventing five more offices/clients", () => {
    const answer = buildSwissFaqs(buildSwissModel())[7].a;
    for (const city of ["Zurich", "Geneva", "Basel", "Bern", "Lausanne"]) expect(answer).toContain(city);
    expect(answer).toContain("not additional Savo offices or an assertion of existing clients");
  });
  it("uses operation history rather than inferring an incorporation date", () => {
    expect(buildSwissFaqs(buildSwissModel())[6].a).toContain("has operated since 2015");
    expect(render(SwitzerlandPage())).not.toMatch(/incorporated in 2015|Swiss company since 2015/);
  });
  it("retains native detailed-brief/contact/Indore destinations and the shared grey close", () => {
    const html = render(SwitzerlandPage()); expect(html).toContain("data-closing-cta");
    for (const href of ["/start-a-project", "/contact", "/locations/indore"]) expect(html).toContain(`href="${href}"`);
    expect(html).toContain("From Granges-Marnand, Indore or wherever you are");
  });
  it("inherits fonts, rail, targets, focus, reduced motion and exact-route header without new client code", () => {
    const css = readFileSync("src/sections/switzerland/swiss.module.css", "utf8");
    for (const value of ["var(--font-serif)", "var(--font-sans)", "1280px", "#df2525", "#b82222", "#f7f7f7", "min-height:52px", "min-height:44px", "min-height:76px", "prefers-reduced-motion:reduce"]) expect(css).toContain(value);
    expect(css).not.toMatch(/infinite|linear-gradient|#f7f5f0|#d9480f/);
    for (const name of ["swiss-art.tsx", "swiss-content.ts", "swiss-sections.tsx"]) expect(readFileSync(`src/sections/switzerland/${name}`, "utf8")).not.toMatch(/^['"]use client/m);
    expect(readFileSync("src/components/layout/site-header.tsx", "utf8")).toContain("/^\\/locations\\/switzerland\\/?$/.test(pathname)");
  });
});
