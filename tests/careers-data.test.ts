import { beforeEach, describe, expect, it, vi } from "vitest";
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/prisma", () => ({ prisma: { contentItem: { findMany } } }));
vi.mock("../src/lib/logger", () => ({ logger: { warn: vi.fn() } }));
import { getManagedRoles } from "../src/lib/content-items";

describe("Published careers authority", () => {
  beforeEach(() => findMany.mockReset());
  it("returns no vacancies for an empty collection", async () => { findMany.mockResolvedValue([]); expect(await getManagedRoles()).toEqual([]); });
  it("fails closed instead of publishing sample jobs on an outage", async () => { findMany.mockRejectedValueOnce(new Error("test outage")); expect(await getManagedRoles()).toEqual([]); });
  it("only queries active Published records", async () => { findMany.mockResolvedValue([]); await getManagedRoles(); expect(findMany.mock.calls[0][0].where).toEqual({ collection: "careers", active: true, contentStatus: "published" }); });
  it("keeps the managed title and responsibilities authoritative", async () => { findMany.mockResolvedValue([{ title: "Test platform role", data: { track: "Test focus", cat: "ops", blurb: "Test-only published description", duties: ["Test-only duty"], brings: ["Test-only skill"] } }]); const roles = await getManagedRoles(); expect(roles).toHaveLength(1); expect(roles[0].title).toBe("Test platform role"); expect(roles[0].duties).toEqual(["Test-only duty"]); });
  it("uses actual Date and cached epoch timestamps for publication dates", async () => {
    findMany.mockResolvedValueOnce([{ title: "Test role", publishedAt: new Date("2026-10-06T08:00:00Z"), data: { blurb: "Test-only description" } }]);
    expect((await getManagedRoles())[0].datePosted).toBe("2026-10-06");
    findMany.mockResolvedValueOnce([{ title: "Cached role", publishedAt: "1789524135", data: { blurb: "Test-only description" } }]);
    expect((await getManagedRoles())[0].datePosted).toBe(new Date(1789524135 * 1000).toISOString().slice(0, 10));
  });
  it("does not present a blank published record as a vacancy", async () => { findMany.mockResolvedValue([{ title: "", data: {} }, { title: "Incomplete test role", data: { blurb: "" } }]); expect(await getManagedRoles()).toEqual([]); });
});
