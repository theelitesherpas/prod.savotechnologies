import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_COLLECTIONS } from "../src/lib/content-registry";
const mocks = vi.hoisted(() => ({
  create: vi.fn(), update: vi.fn(), admin: vi.fn(), require: vi.fn(), section: vi.fn(), audit: vi.fn(), revalidate: vi.fn(), poster: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { contentItem: { create: mocks.create, update: mocks.update }, adminUser: { findUnique: mocks.admin } } }));
vi.mock("@/lib/auth", () => ({ requireAdmin: mocks.require }));
vi.mock("@/lib/permissions", () => ({ requireSection: mocks.section }));
vi.mock("@/lib/audit", () => ({ audit: mocks.audit }));
vi.mock("@/lib/collections", () => ({ revalidateManagedContent: mocks.revalidate }));
vi.mock("@/lib/content-items", () => ({ importDefaults: vi.fn() }));
vi.mock("@/lib/testimonial-poster", () => ({ persistTestimonialPoster: mocks.poster }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { createItemAction, updateItemAction } from "../src/app/admin/(protected)/content/actions";

const id = "testimonialvideo123";
function form(values: Record<string, string> = {}) {
  const data = { name: "Test-only Client", companyName: "Test-only Company", location: "Test-only Location", videoUrl: "https://media.example.test/test-only.mp4", posterImage: "data:image/webp;base64,AAAA", quote: "Test-only approved quote.", role: "Legacy role", country: "Legacy country", photoUrl: "https://media.example.test/old-poster.jpg", ...values };
  const formData = new FormData();
  formData.set("collection", "testimonials");
  formData.set("id", id);
  formData.set("contentStatus", "published");
  formData.set("active", "on");
  formData.set("order", "0");
  for (const field of CONTENT_COLLECTIONS.testimonials.fields) formData.set(field.name, data[field.name as keyof typeof data] ?? "");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.require.mockResolvedValue({ id: "test-admin" });
  mocks.admin.mockResolvedValue({ role: "admin", employee: null });
  mocks.create.mockResolvedValue({ id });
  mocks.update.mockResolvedValue({ id });
  mocks.poster.mockImplementation(async (value: unknown) => value);
});

describe("testimonial video content actions", () => {
  it("creates an approved video entry with the normalized 16:9 poster and new identity fields", async () => {
    mocks.poster.mockResolvedValueOnce("data:image/webp;base64,compressed");
    await expect(createItemAction(form())).rejects.toThrow("redirect:/admin/content/testimonials?saved=created");
    expect(mocks.section).toHaveBeenCalledWith("content");
    const saved = mocks.create.mock.calls[0][0].data;
    expect(saved.collection).toBe("testimonials");
    expect(saved.data).toMatchObject({ name: "Test-only Client", companyName: "Test-only Company", location: "Test-only Location", videoUrl: "https://media.example.test/test-only.mp4", posterImage: "data:image/webp;base64,compressed", quote: "Test-only approved quote.", role: "Legacy role", country: "Legacy country", photoUrl: "https://media.example.test/old-poster.jpg" });
    expect(saved.contentStatus).toBe("published");
  });

  it("rejects an invalid poster before either create or update writes", async () => {
    mocks.poster.mockResolvedValue(null);
    await expect(createItemAction(form())).rejects.toThrow("redirect:/admin/content/testimonials/new?e=invalid");
    expect(mocks.create).not.toHaveBeenCalled();
    await expect(updateItemAction(form())).rejects.toThrow(`redirect:/admin/content/testimonials/${id}?e=invalid`);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
