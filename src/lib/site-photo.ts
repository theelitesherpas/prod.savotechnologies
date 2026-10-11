import "server-only";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Shared persistence for admin-managed site photos (contact hero, about
 * hero, …). A crop-tool data URL is validated against the exact target
 * dimensions, re-encoded as a quality-laddered WebP within budget, and
 * stored content-addressed under public/uploads/site/<sha256>.webp -
 * served immutable from /api/site-img/<hash>, so every re-upload is a new
 * URL and stale caches are impossible (same pipeline as insight covers).
 */

const STORED_PATH = /^\/api\/site-img\/[a-f0-9]{64}$/;
const CODED_PATH = /^\/images\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g|avif)$/i;

/** A currently stored (already validated) or coded local image path. */
export function isAllowedStoredPhoto(value: string): boolean {
  if (!value.includes("..") && STORED_PATH.test(value)) return true;
  return !value.includes("..") && CODED_PATH.test(value);
}

/** Persist a crop-tool data URL as a content-addressed site WebP.
 *  Returns the /api/site-img/<hash> path, or null when the payload fails
 *  validation (wrong dimensions, oversized, undecodable). */
export async function persistSitePhoto(
  value: string,
  targetWidth: number,
  targetHeight: number,
): Promise<string | null> {
  const match = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return null;

  try {
    const input = Buffer.from(match[1], "base64");
    if (!input.length || input.length > 500_000) return null;
    const metadata = await sharp(input, { limitInputPixels: 1_500_000 }).metadata();
    if (
      metadata.width !== targetWidth ||
      metadata.height !== targetHeight ||
      !["jpeg", "png", "webp"].includes(metadata.format ?? "")
    ) {
      return null;
    }

    let output: Buffer | null = null;
    for (const quality of [78, 70, 62, 54, 46]) {
      output = await sharp(input)
        .rotate()
        .webp({ quality, effort: 5 })
        .toBuffer();
      if (output.length <= 200_000) break;
    }
    if (!output || output.length > 320_000) return null;

    const hash = createHash("sha256").update(output).digest("hex");
    const relativePath = `/api/site-img/${hash}`;
    const directory = join(process.cwd(), "public", "uploads", "site");
    await mkdir(directory, { recursive: true });
    try {
      await writeFile(join(directory, `${hash}.webp`), output, { flag: "wx" });
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "EEXIST")) return null;
    }
    return relativePath;
  } catch {
    return null;
  }
}
