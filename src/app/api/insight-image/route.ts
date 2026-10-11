import { serveInsightImage } from "@/lib/insight-image-response";

/** Backwards-compatible delivery for Insight records created before path-based image URLs. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const hash = new URL(request.url).searchParams.get("v") ?? "";
  return serveInsightImage(hash);
}
