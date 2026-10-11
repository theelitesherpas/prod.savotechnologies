import { serveInsightImage } from "@/lib/insight-image-response";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  return serveInsightImage(hash);
}
