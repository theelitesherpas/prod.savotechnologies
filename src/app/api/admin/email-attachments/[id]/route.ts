import { getAdminUser } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { MAX_ATTACHMENT_BYTES } from "@/lib/mail/attachment-rules.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail = (status: number) => new Response(null, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
 const user = await getAdminUser(); if (!user) return fail(401);
 if (!canAccess(user, "emails")) return fail(403);
 const { id } = await params; if (!/^[A-Za-z0-9_-]{20,64}$/.test(id)) return fail(404);
 if (!prisma) return fail(503);
 try {
  const file = await prisma.emailAttachment.findUnique({ where: { id } });
  if (!file) return fail(404);
  if (file.size > MAX_ATTACHMENT_BYTES || file.size !== file.data.byteLength) return fail(503);
  const filename = encodeURIComponent(file.filename).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return new Response(new Uint8Array(file.data).buffer, { headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="attachment"; filename*=UTF-8''${filename}`, "Content-Length": String(file.size), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox; default-src 'none'; frame-ancestors 'none'", "Referrer-Policy": "no-referrer" } });
 } catch { return fail(503); }
}
