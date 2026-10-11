import { beforeEach, describe, expect, it, vi } from "vitest";
import { INDUSTRY_DOSSIERS } from "../src/content/industries/dossiers";
import { CONTENT_COLLECTIONS } from "../src/lib/content-registry";
const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn(), admin: vi.fn(), transaction: vi.fn(), require: vi.fn(), section: vi.fn(), revalidate: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { contentItem: { create: mocks.create, update: mocks.update, updateMany: mocks.updateMany, deleteMany: mocks.deleteMany, findMany: mocks.findMany }, adminUser: { findUnique: mocks.admin }, $transaction: mocks.transaction } }));
vi.mock("@/lib/auth", () => ({ requireAdmin: mocks.require, requireAdminRole: mocks.require }));
vi.mock("@/lib/permissions", () => ({ requireSection: mocks.section }));
vi.mock("@/lib/audit", () => ({ audit: mocks.audit }));
vi.mock("@/lib/collections", () => ({ revalidateManagedContent: mocks.revalidate }));
vi.mock("@/lib/content-items", () => ({ importDefaults: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { createItemAction, updateItemAction, toggleItemAction, deleteItemAction, reorderItemsAction } from "../src/app/admin/(protected)/content/actions";
const id = "testindustry1234";
function form(status = "published", data: Record<string, unknown> = INDUSTRY_DOSSIERS[0]) {
  const f = new FormData(); f.set("collection", "industry-dossiers"); f.set("id", id); f.set("contentStatus", status); f.set("active", "on"); f.set("order", "0");
  for (const field of CONTENT_COLLECTIONS["industry-dossiers"].fields) {
    const v = data[field.name]; if (field.type === "boolean") { if (v) f.set(field.name, "on"); }
    else f.set(field.name, ["list", "object-list"].includes(field.type) ? JSON.stringify(v ?? []) : String(v ?? ""));
  }
  return f;
}
beforeEach(() => { vi.clearAllMocks(); mocks.require.mockResolvedValue({ id: "test-admin" }); mocks.admin.mockResolvedValue({ role: "admin" }); mocks.create.mockResolvedValue({ id }); mocks.update.mockResolvedValue({ id }); mocks.deleteMany.mockResolvedValue({ count: 1 }); });
describe("Industry CMS writes with in-memory adapters only", () => {
  it("creates a complete published dossier with authorisation, audit and invalidation", async () => {
    await expect(createItemAction(form())).rejects.toThrow("?saved=created");
    expect(mocks.section).toHaveBeenCalledWith("content");
    const data = mocks.create.mock.calls[0][0].data;
    expect(data.collection).toBe("industry-dossiers"); expect(data.contentStatus).toBe("published"); expect(data.publishedAt).toBeInstanceOf(Date); expect(data.data.solutions).toHaveLength(6);
    expect(mocks.audit).toHaveBeenCalled(); expect(mocks.revalidate).toHaveBeenCalled();
  });
  it("preserves incomplete work as a draft but rejects incomplete publication", async () => {
    const empty = { title: "Incomplete sector", slug: "incomplete", layout: "care" };
    await expect(createItemAction(form("draft", empty))).rejects.toThrow("?saved=created");
    expect(mocks.create.mock.calls[0][0].data.contentStatus).toBe("draft");
    mocks.create.mockClear(); await expect(createItemAction(form("published", empty))).rejects.toThrow("?e=invalid"); expect(mocks.create).not.toHaveBeenCalled();
  });
  it("keeps editor publication requests in review", async () => {
    mocks.admin.mockResolvedValue({ role: "editor" }); await expect(createItemAction(form())).rejects.toThrow("?saved=created"); expect(mocks.create.mock.calls[0][0].data.contentStatus).toBe("review");
  });
  it("updates structured content and retains the existing editor approval boundary", async () => {
    mocks.admin.mockResolvedValue({ role: "editor" }); await expect(updateItemAction(form())).rejects.toThrow("?saved=updated"); expect(mocks.update.mock.calls[0][0].data.contentStatus).toBe("review"); expect(mocks.update.mock.calls[0][0].data.data.aiOpportunities[0].review).toBe(INDUSTRY_DOSSIERS[0].aiOpportunities[0].review);
  });
  it("allows hide, ordered publication and authorised deletion", async () => {
    const f = form(); f.set("active", "false"); await toggleItemAction(f); expect(mocks.update.mock.calls[0][0].data.active).toBe(false);
    f.set("order", JSON.stringify([id])); await reorderItemsAction(f); expect(mocks.updateMany).toHaveBeenCalledWith({ where: { id, collection: "industry-dossiers" }, data: { order: 0 } });
    await expect(deleteItemAction(f)).rejects.toThrow("?saved=deleted"); expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id, collection: "industry-dossiers" } });
  });
  it("does not write when section authorisation fails", async () => {
    mocks.section.mockRejectedValueOnce(new Error("forbidden")); await expect(createItemAction(form())).rejects.toThrow("forbidden"); expect(mocks.create).not.toHaveBeenCalled();
  });
});
