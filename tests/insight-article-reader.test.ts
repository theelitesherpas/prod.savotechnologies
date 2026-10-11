import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ findFirst: vi.fn(), findMany: vi.fn(), warn: vi.fn() }));
vi.mock("../src/lib/prisma", () => ({ prisma: { contentItem: { findFirst: m.findFirst, findMany: m.findMany } } }));
vi.mock("../src/lib/logger", () => ({ logger: { warn: m.warn } }));

import { getManagedArticle, getManagedArticles } from "../src/lib/content-items";

const row = {
  slug: "test-only-insight", title: "Test-only article",
  data: { cat: "Design", excerpt: "Test-only excerpt.", body: [{ p: "Test-only body." }], image: "/images/studio.webp" },
  publishedAt: new Date("2030-10-01T00:00:00.000Z"),
};

beforeEach(() => vi.clearAllMocks());

describe("published Insight detail reader", () => {
  it("loads a single active Published article for detail and metadata", async () => {
    m.findFirst.mockResolvedValue(row);
    await expect(getManagedArticle(row.slug)).resolves.toMatchObject({
      slug: row.slug, title: row.title, body: [{ p: "Test-only body." }], date: row.publishedAt.toISOString(),
    });
    expect(m.findFirst).toHaveBeenCalledWith({
      where: { collection: "insights", slug: row.slug, active: true, contentStatus: "published" },
      select: { slug: true, title: true, data: true, publishedAt: true },
    });
    expect(m.findMany).not.toHaveBeenCalled();
  });

  it("rejects malformed slugs before querying and keeps list behavior unchanged", async () => {
    await expect(getManagedArticle("../private")).resolves.toBeNull();
    expect(m.findFirst).not.toHaveBeenCalled();
    m.findMany.mockResolvedValue([row]);
    await expect(getManagedArticles()).resolves.toMatchObject([{ slug: row.slug, body: [{ p: "Test-only body." }] }]);
  });
});
