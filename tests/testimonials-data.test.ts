import { beforeEach, describe, expect, it, vi } from "vitest";
const { findMany, warn } = vi.hoisted(() => ({ findMany: vi.fn(), warn: vi.fn() }));
vi.mock("../src/lib/prisma", () => ({ prisma: { contentItem: { findMany } } }));
vi.mock("../src/lib/logger", () => ({ logger: { warn } }));
import { getManagedTestimonials } from "../src/lib/content-items";
import { CONTENT_COLLECTIONS } from "../src/lib/content-registry";
import { TESTIMONIAL_VIDEO_POSTER_SIZE } from "../src/constants/testimonials";

describe("Shared Published testimonial media", () => {
  beforeEach(() => { findMany.mockReset(); warn.mockReset(); });
  it("reads only active Published testimonials in managed order", async () => {
    findMany.mockResolvedValue([]);
    await getManagedTestimonials();
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { collection: "testimonials", active: true, contentStatus: "published" }, orderBy: [{ order: "asc" }, { updatedAt: "desc" }] }));
  });
  it("passes through the original approved identity, poster and video URL", async () => {
    findMany.mockResolvedValue([{ data: { quote: "Test-only quote.", name: "Test-only Client", role: "Test-only Role", country: "Test country", photoUrl: "/test-only-photo.webp", videoUrl: "https://media.example.test/test-only.mp4", privateField: "PRIVATE" } }]);
    expect(await getManagedTestimonials()).toEqual([{ quote: "Test-only quote.", name: "Test-only Client", role: "Test-only Role", country: "Test country", photo: "/test-only-photo.webp", video: "https://media.example.test/test-only.mp4" }]);
  });
  it("prefers the new company, location and cropped poster while retaining legacy fallbacks", async () => {
    findMany.mockResolvedValue([{ data: { quote: "Test-only quote.", name: "Test-only Client", companyName: "Test-only Company", location: "Test-only Location", role: "Legacy role", country: "Legacy country", posterImage: "data:image/webp;base64,poster", photoUrl: "/legacy-photo.webp", videoUrl: "https://media.example.test/test-only.mp4" } }]);
    expect(await getManagedTestimonials()).toEqual([{ quote: "Test-only quote.", name: "Test-only Client", role: "Test-only Company", country: "Test-only Location", photo: "data:image/webp;base64,poster", video: "https://media.example.test/test-only.mp4" }]);
  });
  it("exposes the Testimonial videos collection with the homepage's fixed 16:9 crop", () => {
    const collection = CONTENT_COLLECTIONS.testimonials;
    const fields = Object.fromEntries(collection.fields.map(field => [field.name, field]));
    expect(collection.label).toBe("Testimonial videos");
    expect(collection.singular).toBe("testimonial video");
    expect(fields.name.required).toBe(true);
    expect(fields.companyName.required).toBe(true);
    expect(fields.location).toBeDefined();
    expect(fields.videoUrl).toBeDefined();
    expect(fields.posterImage).toMatchObject({ type: "image", targetWidth: TESTIMONIAL_VIDEO_POSTER_SIZE.width, targetHeight: TESTIMONIAL_VIDEO_POSTER_SIZE.height });
    expect(TESTIMONIAL_VIDEO_POSTER_SIZE.width / TESTIMONIAL_VIDEO_POSTER_SIZE.height).toBe(16 / 9);
    expect(fields.role.legacy).toBe(true);
    expect(fields.country.legacy).toBe(true);
    expect(fields.photoUrl.legacy).toBe(true);
  });
  it("keeps optional media optional and excludes unattributable entries", async () => {
    findMany.mockResolvedValue([{ data: { quote: "Test-only quote.", name: "Test-only Client", role: "Test-only Role" } }, { data: { quote: "Test-only quote.", name: "", role: "Role" } }]);
    const items = await getManagedTestimonials();
    expect(items).toHaveLength(1);
    expect(items[0].video).toBeUndefined();
    expect(items[0].photo).toBeUndefined();
  });
  it("does not invent endorsements or videos when unavailable", async () => {
    findMany.mockResolvedValueOnce([]);
    expect(await getManagedTestimonials()).toEqual([]);
    findMany.mockRejectedValueOnce(new Error("Test-only outage"));
    expect(await getManagedTestimonials()).toEqual([]);
    expect(warn).toHaveBeenCalledWith("content_items.db_unavailable", expect.objectContaining({ collection: "testimonials" }));
  });
});
