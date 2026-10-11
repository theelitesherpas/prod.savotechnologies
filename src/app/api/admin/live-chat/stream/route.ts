import { adminSessionRevalidator } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { canReceiveAdminEvent } from "@/lib/livechat/admin-guard";
import { openAuthorizedStream, readStreamAuthority, STREAM_HEADERS } from "@/lib/livechat/authorized-stream";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Current session/lifecycle/grants, not the opener's cached actor. */
export async function GET(req: Request) {
  try {
    const resolve = await adminSessionRevalidator();
    const validate = async () => {
      const user = await resolve();
      return user && canAccess(user, "live-chat") ? user : null;
    };
    const user = await readStreamAuthority(validate);
    if (!user) return new Response("unauthorized", { status: 401, headers: STREAM_HEADERS });
    return openAuthorizedStream({
      request: req, kind: "admin", key: `admin:${user.id}`, channel: "admin",
      validate, ready: actor => ({ me: actor.id }), filter: canReceiveAdminEvent,
      heartbeat: async actor => {
        if (!prisma) throw Error("STREAM_STORAGE_UNAVAILABLE");
        // Preserve a manually chosen away/busy status; update only presence time.
        await prisma.agentPresence.upsert({
          where: { userId: actor.id }, update: { lastSeenAt: new Date() },
          create: { userId: actor.id, status: "online", lastSeenAt: new Date() },
        });
      },
    });
  } catch {
    return new Response("unavailable", { status: 503, headers: STREAM_HEADERS });
  }
}
