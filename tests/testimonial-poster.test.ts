import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { persistTestimonialPoster } from "../src/lib/testimonial-poster";
import { TESTIMONIAL_VIDEO_POSTER_SIZE } from "../src/constants/testimonials";

const posterDataUrl = async (width: number, height: number) => {
  const image = await sharp({
    create: { width, height, channels: 3, background: { r: 30, g: 40, b: 50 } },
  }).jpeg().toBuffer();
  return `data:image/jpeg;base64,${image.toString("base64")}`;
};

describe("testimonial video poster crop", () => {
  it("accepts only an exact 1600 × 900 crop and stores a compact WebP", async () => {
    const result = await persistTestimonialPoster(await posterDataUrl(TESTIMONIAL_VIDEO_POSTER_SIZE.width, TESTIMONIAL_VIDEO_POSTER_SIZE.height));
    expect(result).toMatch(/^data:image\/webp;base64,/);
    const buffer = Buffer.from(result!.split(",")[1], "base64");
    expect((await sharp(buffer).metadata())).toMatchObject({ width: 1600, height: 900, format: "webp" });
    expect(buffer.length).toBeLessThanOrEqual(280_000);
  });

  it("rejects an image with the wrong frame size, an unsupported URL and malformed data", async () => {
    expect(await persistTestimonialPoster(await posterDataUrl(640, 360))).toBeNull();
    expect(await persistTestimonialPoster("https://example.test/poster.webp")).toBeNull();
    expect(await persistTestimonialPoster("data:image/gif;base64,AAAA")).toBeNull();
  });

  it("keeps the poster optional but rejects uncropped image paths", async () => {
    expect(await persistTestimonialPoster("")).toBe("");
    expect(await persistTestimonialPoster("/images/approved-poster.webp")).toBeNull();
  });
});
