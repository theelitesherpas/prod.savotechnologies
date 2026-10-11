import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ findFirst: vi.fn(), findMany: vi.fn(), warn: vi.fn() }));
vi.mock("../src/lib/prisma", () => ({ prisma: { contentItem: { findFirst: m.findFirst, findMany: m.findMany } } }));
vi.mock("../src/lib/logger", () => ({ logger: { warn: m.warn } }));

import { getCaseStudies, getCaseStudy } from "../src/lib/case-studies";

const record = { title: "Test-only case study", discipline: "web" };

beforeEach(() => vi.clearAllMocks());

describe("published case-study reader", () => {
  it("loads one public detail by its validated slug rather than materializing every image-bearing record", async () => {
    m.findFirst.mockResolvedValue({ slug: "test-only-project", data: record });
    const result = await getCaseStudy("test-only-project");
    expect(result).toMatchObject({ slug: "test-only-project", title: record.title, status: "verified" });
    expect(m.findFirst).toHaveBeenCalledWith({
      where: { collection: "case-studies", slug: "test-only-project", active: true, contentStatus: "published" },
      select: { slug: true, data: true },
    });
    expect(m.findMany).not.toHaveBeenCalled();
  });

  it("rejects malformed slugs and does not expose drafts or absent records", async () => {
    await expect(getCaseStudy("../private")).resolves.toBeNull();
    expect(m.findFirst).not.toHaveBeenCalled();
    m.findFirst.mockResolvedValue(null);
    await expect(getCaseStudy("not-published")).resolves.toBeNull();
    expect(m.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ active: true, contentStatus: "published" }),
    }));
  });

  it("reads image-heavy records without persisting oversized JSON in Next's Data Cache", async () => {
    m.findMany.mockResolvedValue([{ slug: "large-study", data: { ...record, unusedPayload: "x".repeat(2 * 1024 * 1024 + 1) } }]);
    await expect(getCaseStudies()).resolves.toMatchObject([{ slug: "large-study", title: record.title, status: "verified" }]);
  });

  it("preserves the published listing contract and drops invalid rows", async () => {
    m.findMany.mockResolvedValue([
      { slug: "valid-study", data: record },
      { slug: "../invalid", data: record },
      { slug: "invalid-shape", data: { title: "missing discipline" } },
    ]);
    await expect(getCaseStudies()).resolves.toMatchObject([{ slug: "valid-study", status: "verified" }]);
    expect(m.warn).toHaveBeenCalledTimes(2);
  });
});
