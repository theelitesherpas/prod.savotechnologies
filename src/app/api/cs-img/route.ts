import { getCaseStudy } from "@/lib/case-studies";
import { resolveCaseImages } from "@/lib/case-study-schema";

/**
 * Case-study image endpoint — serves stored visuals as real, cacheable
 * JPEG responses instead of megabytes of inline data URLs in the HTML.
 *
 * GET /api/cs-img?s=<slug>&k=<slot>&v=<stamp>
 *   k: showcase | cardWide | card | dossierCard | gallery-<i>
 *   v: cache-buster derived from the image bytes (any re-upload changes it)
 *
 * Responses are immutable for a year — the version stamp in the URL is the
 * invalidation: editing an image in the admin produces a new stamp, hence
 * a new URL, hence a fresh download. Unedited images stay in the browser
 * cache across every visit.
 */

export const dynamic = "force-dynamic";

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
  if (!dataUrl?.startsWith("data:image/")) return new Response("Not found", { status: 404 });

  const comma = dataUrl.indexOf(",");
  const bytes = Buffer.from(dataUrl.slice(comma + 1), "base64");
  const mime = dataUrl.slice(5, comma).split(";")[0] || "image/jpeg";

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
