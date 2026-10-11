import "server-only";
import sharp from "sharp";
import { TESTIMONIAL_VIDEO_POSTER_SIZE } from "@/constants/testimonials";

const MAX_INPUT_BYTES = 500_000;
const MAX_OUTPUT_BYTES = 280_000;

/** Validate and compress a cropped 16:9 testimonial poster for the homepage video frame. */
export async function persistTestimonialPoster(value: unknown): Promise<string | null> {
  if (typeof value !== "string") return null;
  if (!value) return "";

  const match = /^data:image\/(?:jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || value.length > 700_000) return null;

  try {
    const input = Buffer.from(match[1], "base64");
    if (!input.length || input.length > MAX_INPUT_BYTES) return null;
    const image = sharp(input, { limitInputPixels: 2_000_000 });
    const metadata = await image.metadata();
    if (
      metadata.width !== TESTIMONIAL_VIDEO_POSTER_SIZE.width ||
      metadata.height !== TESTIMONIAL_VIDEO_POSTER_SIZE.height ||
      !["jpeg", "webp"].includes(metadata.format ?? "")
    ) return null;

    if (metadata.format === "webp" && input.length <= MAX_OUTPUT_BYTES) return value;
    const output = await image
      .rotate()
      .resize(TESTIMONIAL_VIDEO_POSTER_SIZE.width, TESTIMONIAL_VIDEO_POSTER_SIZE.height, { fit: "cover", position: "centre" })
      .webp({ quality: 76, effort: 5 })
      .toBuffer();
    if (output.length > MAX_OUTPUT_BYTES) return null;
    return `data:image/webp;base64,${output.toString("base64")}`;
  } catch {
    return null;
  }
}
