import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
vi.mock("next/image", () => ({ default: ({ fill, preload, sizes, ...props }: React.ComponentProps<"img"> & { fill?: boolean; preload?: boolean }) => { void fill; void preload; void sizes; return React.createElement("img", props); } }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("../src/components/shared/detail-cta", () => ({ DetailCta: () => React.createElement("section", { "data-closing-cta": true }, "Contextual project action") }));
import { PREVIEW_ARTICLES, findPreviewArticle, previewReadingStats } from "../src/sections/insights/preview-articles";
import PreviewPage, { generateMetadata, generateStaticParams } from "../src/app/(site)/insights/preview/[slug]/page";
const render = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("Full unpublished Insights review pages", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("supplies five substantial original articles with complete information structure", () => {
    expect(PREVIEW_ARTICLES).toHaveLength(5);
    for (const a of PREVIEW_ARTICLES) { expect(previewReadingStats(a).words).toBeGreaterThan(600); expect(a.sections).toHaveLength(5); expect(a.takeaways).toHaveLength(4); expect(a.references).toHaveLength(3); expect(a.related).toHaveLength(2); expect(new Set(a.sections.map(s => s.id)).size).toBe(a.sections.length); expect(a.sections.some(s => !!s.example)).toBe(true); for (const id of a.related) expect(PREVIEW_ARTICLES.some(other => other.id === id && other.id !== a.id)).toBe(true); }
  });
  it("does not expose development review content in production", async () => { vi.stubEnv("NODE_ENV", "production"); expect(findPreviewArticle(PREVIEW_ARTICLES[0].id)).toBeUndefined(); await expect(PreviewPage({ params: Promise.resolve({ slug: PREVIEW_ARTICLES[0].id }) })).rejects.toThrow("NOT_FOUND"); expect(generateStaticParams()).toEqual([]); });
  it("rejects unknown preview paths", async () => { vi.stubEnv("NODE_ENV", "development"); await expect(PreviewPage({ params: Promise.resolve({ slug: "unapproved" }) })).rejects.toThrow("NOT_FOUND"); });
  it("marks every preview noindex with its own canonical, not a false published URL", async () => { vi.stubEnv("NODE_ENV", "development"); const meta = await generateMetadata({ params: Promise.resolve({ slug: PREVIEW_ARTICLES[0].id }) }); expect(meta.robots).toEqual({ index: false, follow: false }); expect(meta.alternates).toEqual({ canonical: "/insights/preview/rag-vs-fine-tuning" }); expect(meta.description).toContain("Unpublished"); });
  it("renders contents, full body, examples, takeaways, further reading and actual related previews", async () => {
    vi.stubEnv("NODE_ENV", "development"); for (const a of PREVIEW_ARTICLES) { const html = render(await PreviewPage({ params: Promise.resolve({ slug: a.id }) })); for (const text of ["Article contents", "Introduction", "Key takeaways", "Further reading", "Awaiting editorial assignment", "Not published", "Unpublished article preview", "Print article preview"]) expect(html).toContain(text); expect(html).not.toMatch(/min read|application\/ld\+json|datePublished|ArticlePosting/); for (const s of a.sections) { expect(html).toContain(`href="#${s.id}"`); expect(html).toContain(`id="${s.id}"`); } expect((html.match(/data-article-sample=/g) ?? [])).toHaveLength(2); }
  });
  it("derives transparent reading estimates from content, not a fabricated duration", () => { for (const a of PREVIEW_ARTICLES) { const stats = previewReadingStats(a); expect(stats.minutes).toBe(Math.ceil(stats.words / 220)); } });
});
