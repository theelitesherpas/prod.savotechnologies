import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Serve a validated, content-addressed site image (admin-uploaded WebP),
 *  e.g. the contact page hero photo stored by /admin/content. */
export async function serveSiteImage(hash: string): Promise<Response> {
  if (!/^[a-f0-9]{64}$/.test(hash)) return new Response("Not found", { status: 404 });

  try {
    const image = await readFile(join(process.cwd(), "public", "uploads", "site", `${hash}.webp`));
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
