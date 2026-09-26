import { timingSafeEqual } from "node:crypto";
import { unsubscribeSig } from "@/lib/mail/templates";

/** One-click unsubscribe endpoint - Gmail/Outlook POST here directly
 *  (List-Unsubscribe-Post: One-Click). GET redirects humans to the
 *  confirmation page. HMAC-signed so the list can't be enumerated. */

function paramsFrom(url: URL): { email: string; sig: string } | null {
  const email = url.searchParams.get("email")?.toLowerCase().trim() ?? "";
  const sig = url.searchParams.get("sig") ?? "";
  if (!email || !sig || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  return { email, sig };
}

/** Constant-time signature comparison. */
function sigValid(email: string, sig: string): boolean {
  const expected = unsubscribeSig(email);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request): Promise<Response> {
  const { prisma } = await import("@/lib/prisma");
  const parsed = paramsFrom(new URL(req.url));
  if (!parsed || !sigValid(parsed.email, parsed.sig)) {
    return new Response("Invalid link", { status: 400 });
  }
  if (prisma) {
    await prisma.mailSuppress
      .upsert({
        where: { email: parsed.email },
        update: {},
        create: { email: parsed.email, reason: "one-click" },
      })
      .catch(() => undefined);
  }
  return new Response(null, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const parsed = paramsFrom(url);
  if (!parsed || !sigValid(parsed.email, parsed.sig)) {
    return new Response("Invalid link", { status: 400 });
  }
  // Humans land on the branded confirmation page (same URL, /unsubscribe).
  return Response.redirect(url.origin + `/unsubscribe?${url.searchParams.toString()}`, 302);
}
