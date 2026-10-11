import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Serve a validated, content-addressed Insights WebP cover. */
export async function serveInsightImage(hash: string): Promise<Response> {
  if (!/^[a-f0-9]{64}$/.test(hash)) return new Response("Not found", { status: 404 });

  try {
    const image = await readFile(join(process.cwd(), "public", "uploads", "insights", `${hash}.webp`));
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(image.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
