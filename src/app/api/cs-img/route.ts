import { getCaseStudy } from "@/lib/case-studies";
import { resolveCaseImages } from "@/lib/case-study-schema";

/**
 * Case-study image endpoint: serves stored visuals as real, cacheable
 * JPEG responses instead of megabytes of inline data URLs in the HTML.
 *
 * GET /api/cs-img?s=<slug>&k=<slot>&v=<stamp>
 *   k: showcase | cardWide | card | dossierCard | gallery-<i>
 *   v: cache-buster derived from the image bytes (any re-upload changes it)
 *
 * Responses are immutable for a year: the version stamp in the URL is the
 * invalidation: editing an image in the admin produces a new stamp, hence
 * a new URL, hence a fresh download. Unedited images stay in the browser
 * cache across every visit.
 */

export const dynamic = "force-dynamic";

function hasRasterSignature(mime: string, bytes: Buffer): boolean {
  if (mime === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/gif") return bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6));
  if (mime === "image/webp") return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (mime === "image/avif") return bytes.length >= 12 && bytes.toString("ascii", 4, 8) === "ftyp" && ["avif", "avis"].includes(bytes.toString("ascii", 8, 12));
  return false;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("s") ?? "";
  const key = url.searchParams.get("k") ?? "";
  if (!slug || !key || !/^[a-z0-9-]{1,80}$/.test(slug) || !/^[a-zA-Z0-9-]{1,20}$/.test(key)) {
    return new Response("Bad request", { status: 400 });
  }

  const study = await getCaseStudy(slug);
  if (!study) return new Response("Not found", { status: 404 });

  let dataUrl: string | undefined;
  if (key.startsWith("gallery-")) {
    const idx = Number(key.slice(8));
    dataUrl = Number.isInteger(idx) ? study.gallery?.[idx]?.dataUrl : undefined;
  } else if (key === "showcase" || key === "cardWide" || key === "card" || key === "dossierCard") {
    dataUrl = resolveCaseImages(study)[key]?.dataUrl;
  }
  // Only passive raster formats may be served on the site's origin. SVG can
  // contain active content and must never inherit the public site's origin.
  const match = dataUrl?.match(/^data:image\/(jpeg|png|webp|gif|avif);base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) return new Response("Not found", { status: 404 });

  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.byteLength || bytes.toString("base64").replace(/=+$/, "") !== match[2].replace(/=+$/, "")) {
    return new Response("Not found", { status: 404 });
  }
  const mime = `image/${match[1].toLowerCase()}`;
  if (!hasRasterSignature(mime, bytes)) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
