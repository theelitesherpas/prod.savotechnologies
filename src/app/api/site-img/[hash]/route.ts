import { serveSiteImage } from "@/lib/site-image-response";

/**
 * Site image endpoint: serves admin-uploaded, content-addressed WebPs
 * (contact page hero, …). The hash is derived from the image bytes, so any
 * re-upload produces a new URL — responses are immutable for a year.
 */
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  return serveSiteImage(hash);
}
