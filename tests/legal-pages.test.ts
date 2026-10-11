import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import baseline from "./fixtures/legal-documents.json";
import { CANONICAL_ORIGIN, SITE } from "../src/constants/site";
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
import PrivacyPolicyPage, { metadata as privacyMetadata } from "../src/app/(site)/privacy-policy/page";
import TermsPage, { metadata as termsMetadata } from "../src/app/(site)/terms-and-conditions/page";
import { legalSectionId } from "../src/sections/legal/legal-document";

const text = (html: string) => html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const documents = [
  { kind: "privacy" as const, path: "/privacy-policy", Page: PrivacyPolicyPage, metadata: privacyMetadata },
  { kind: "terms" as const, path: "/terms-and-conditions", Page: TermsPage, metadata: termsMetadata },
];

describe.each(documents)("$kind legal reading page", ({ kind, path, Page, metadata }) => {
  const render = () => renderToStaticMarkup(React.createElement(Page));
  it("preserves every original heading and paragraph verbatim, including review notes", () => {
    const html = render();
    const chapters = [...html.matchAll(/<section\b[^>]*data-legal-chapter(?:="[^"]*")?[^>]*>([\s\S]*?)<\/section>/g)];
    expect(chapters).toHaveLength(baseline[kind].sections.length);
    expect(chapters.map(chapter => ({ title: text(chapter[1].match(/<h2[^>]*>([\s\S]*?)<\/h2>/)![1]), body: [...chapter[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(p => text(p[1])) }))).toEqual(baseline[kind].sections);
    const intro = html.match(/<header[^>]*>([\s\S]*?)<\/header>/)![1];
    expect(text(intro.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)![1])).toBe(baseline[kind].heading);
    expect(text(intro.match(/<p[^>]*>([\s\S]*?)<\/p>/)![1])).toBe(baseline[kind].lead);
  });
  it("makes every chapter directly reachable and keeps mobile contents native", () => {
    const html = render();
    for (const section of baseline[kind].sections) {
      const id = legalSectionId(kind, section.title);
      expect(html).toContain(`href="#${id}"`);
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain(`aria-labelledby="${id}-heading"`);
    }
    expect(html).toContain("<details");
    expect(html).toMatch(/<summary[^>]*>On this page/);
    expect(html).toContain(`href="#${kind}-heading"`);
    expect(html).toContain('aria-label="Legal documents"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/privacy-policy"');
    expect(html).toContain('href="/terms-and-conditions"');
    expect(html).not.toContain("<main");
    expect(readFileSync("src/sections/legal/legal-document.tsx", "utf8")).not.toContain('"use client"');
  });
  it("retains canonical SEO and turns existing contact text into accurate links", () => {
    const html = render();
    expect(metadata.alternates).toEqual({ canonical: path });
    expect(metadata.robots).toEqual({ index: true, follow: true });
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
    expect(schema["@type"]).toBe("WebPage");
    expect(schema.url).toBe(`${CANONICAL_ORIGIN}${path}`);
    expect(html).toContain(`href="mailto:${SITE.email}"`);
    expect(html).toContain(`href="tel:${SITE.phoneE164}"`);
  });
});

describe("Shared legal presentation", () => {
  it("renders the confirmed governing-law and jurisdiction clause", () => {
    const html = renderToStaticMarkup(React.createElement(TermsPage));
    expect(html).toContain("Governing Law and Jurisdiction");
    expect(html).toContain("These Terms shall be governed by and interpreted in accordance with the laws of India.");
    expect(html).toContain("exclusive jurisdiction of the competent courts located in Indore, Madhya Pradesh, India");
    expect(html).toContain("separate written agreement signed by both parties");
    expect(html).not.toContain("[Company to confirm before production launch.]");
  });
  it("uses scoped brand typography, a readable measure, native anchors and responsive contents", () => {
    const css = readFileSync("src/sections/legal/legal-document.module.css", "utf8");
    for (const rule of ["--background: #fff", "--accent: #df2525", "font-family: var(--font-serif)", "font-family: var(--font-sans)", "max-width: 72ch", "scroll-margin-top:", "position: sticky", "min-height: 44px", "prefers-reduced-motion: reduce", "@media print"]) expect(css).toContain(rule);
    expect(css).not.toMatch(/linear-gradient|backdrop-filter|animation:|infinite/);
    const header = readFileSync("src/components/layout/site-header.tsx", "utf8");
    expect(header).toContain('const isLegalPage = /^\\/(?:privacy-policy|terms-and-conditions)\\/?$/.test(pathname);');
    expect(header).toContain("|| isServiceDetail || isLegalPage");
    expect(header).toContain('href="/start-a-project"');
    expect(header).not.toContain("if (isHome) openProject({ source }); else openEnquiry(source);");
  });
  it("uses stable unique document-prefixed anchors", () => {
    expect(legalSectionId("privacy", "Information we collect")).toBe("privacy-information-we-collect");
    expect(legalSectionId("terms", "Contact")).not.toBe(legalSectionId("privacy", "Contact"));
  });
});
