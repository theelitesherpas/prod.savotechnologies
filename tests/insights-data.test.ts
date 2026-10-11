import { beforeEach, describe, expect, it, vi } from "vitest";
const { findMany, warn } = vi.hoisted(() => ({ findMany: vi.fn(), warn: vi.fn() }));
vi.mock("../src/lib/prisma", () => ({ prisma: { contentItem: { findMany } } }));
vi.mock("../src/lib/logger", () => ({ logger: { warn } }));
import { getManagedArticles } from "../src/lib/content-items";
const row = { slug: "test-note", title: "Test-only managed article", publishedAt: new Date("2026-10-06T08:00:00Z"), data: { cat: "AI", image: "/images/studio.webp", excerpt: "A test-only summary.", body: [{ p: "Test-only article body." }], date: "Invented legacy date", privateField: "PRIVATE" } };
describe("Insights publication authority", () => {
  beforeEach(() => { findMany.mockReset(); warn.mockReset(); });
  it("does not publish constants for an empty collection", async () => { findMany.mockResolvedValue([]); expect(await getManagedArticles()).toEqual([]); });
  it("fails closed during a DB outage", async () => { findMany.mockRejectedValueOnce(new Error("test outage")); expect(await getManagedArticles()).toEqual([]); expect(warn).toHaveBeenCalledWith("content_items.db_unavailable", expect.objectContaining({ collection: "insights" })); });
  it("queries only active Published records", async () => { findMany.mockResolvedValue([]); await getManagedArticles(); expect(findMany.mock.calls[0][0].where).toEqual({ collection: "insights", active: true, contentStatus: "published" }); });
  it("uses managed content and actual publication dates without exposing legacy dates or reading time", async () => { findMany.mockResolvedValue([row]); const articles = await getManagedArticles(); expect(articles).toHaveLength(1); expect(articles[0].date).toBe("2026-10-06T08:00:00.000Z"); expect(articles[0]).not.toHaveProperty("time"); expect(articles[0].title).toBe(row.title); expect(JSON.stringify(articles)).not.toMatch(/PRIVATE|Invented legacy date/); });
  it("normalizes ISO and epoch publication dates returned from the Data Cache", async () => {
    findMany.mockResolvedValueOnce([{ ...row, publishedAt: "2026-10-06T08:00:00.000Z" }]);
    expect((await getManagedArticles())[0].date).toBe("2026-10-06T08:00:00.000Z");
    findMany.mockResolvedValueOnce([{ ...row, publishedAt: "1789524135" }]);
    expect((await getManagedArticles())[0].date).toBe(new Date(1789524135 * 1000).toISOString());
  });
  it("ignores invalid cached publication dates without crashing the route", async () => { findMany.mockResolvedValue([{ ...row, publishedAt: "not-a-date" }]); expect((await getManagedArticles())[0].date).toBe(""); });
  it("does not invent a timestamp or author when missing", async () => { findMany.mockResolvedValue([{ ...row, publishedAt: null }]); const a = (await getManagedArticles())[0]; expect(a.date).toBe(""); expect(a).not.toHaveProperty("authorName"); });
  it("keeps legacy reading-time values out of public article data while preserving authors and industry associations", async () => { findMany.mockResolvedValue([{ ...row, data: { ...row.data, authorName: "Test-only Author", time: "7 min read", industrySlugs: ["healthcare"] } }]); const article = (await getManagedArticles())[0]; expect(article).toMatchObject({ authorName: "Test-only Author", industrySlugs: ["healthcare"] }); expect(article).not.toHaveProperty("time"); });
  it("excludes incomplete or invalid-route records", async () => { findMany.mockResolvedValue([{ ...row, title: " " }, { ...row, slug: "../secret" }, { ...row, data: { ...row.data, body: [{ p: "" }] } }, { ...row, data: { ...row.data, excerpt: "" } }]); expect(await getManagedArticles()).toEqual([]); });
  it("sanitises body blocks without unsafe arbitrary values", async () => { findMany.mockResolvedValue([{ ...row, data: { ...row.data, body: [null, {}, { h: 10 }, { p: "Paragraph", privateField: "PRIVATE" }, { li: ["Bullet", 42, null, " "] }, { html: "<p>Rich <strong>formatting</strong><script>unsafe()</script></p>" }, { h: "Heading" }] } }]); expect((await getManagedArticles())[0].body).toEqual([{ p: "Paragraph" }, { li: ["Bullet"] }, { html: "<p>Rich <strong>formatting</strong></p>" }, { h: "Heading" }]); });
  it("normalizes existing uploaded-image URLs to query-free paths for Next Image", async () => { const hash = "c".repeat(64); findMany.mockResolvedValue([{ ...row, data: { ...row.data, image: `/api/insight-image?v=${hash}` } }]); expect((await getManagedArticles())[0].image).toBe(`/api/insight-image/${hash}`); });
  it("allows local editorial images, not external/traversal sources", async () => { for (const image of ["https://unapproved.test/image.jpg", "/images/../../private.png", "//unapproved.test/image.jpg", "/images/photo.jpg?script=1"]) { findMany.mockResolvedValue([{ ...row, data: { ...row.data, image } }]); expect((await getManagedArticles())[0].image).toBe("/images/architecture.webp"); } });
});
