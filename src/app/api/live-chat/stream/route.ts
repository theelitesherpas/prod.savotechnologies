import { createHash } from "node:crypto";
import { VISITOR_COOKIE } from "@/lib/livechat/http";
import { prisma } from "@/lib/prisma";
import { touchVisitor } from "@/lib/livechat/service";
import { replayEvents } from "@/lib/livechat/pubsub";
import { openAuthorizedStream, readStreamAuthority, STREAM_HEADERS } from "@/lib/livechat/authorized-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Existing cookie + owned conversation only: a stream never creates visitors.
 * Reconnect continues to refetch /session; streaming is not durable delivery. */
export async function GET(req: Request) {
  const cookie = (req.headers.get("cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE}=([^;]+)`))?.[1];
  if (!cookie || cookie.length > 256) return new Response("unauthorized", { status: 401, headers: STREAM_HEADERS });
  const tokenHash = createHash("sha256").update(cookie).digest("hex");
  const token = new URL(req.url).searchParams.get("token");
  if (token && token.length > 128) return new Response("invalid token", { status: 400, headers: STREAM_HEADERS });
  if (!prisma) return new Response("unavailable", { status: 503, headers: STREAM_HEADERS });
  const db = prisma;
  const visitor = { tokenHash, blocked: false };
  const select = { id: true, visitorId: true, status: true, mode: true } as const;
  try {
    const conversation = await readStreamAuthority(() => db.chatConversation.findFirst({
      where: {
        visitor,
        ...(token ? { publicToken: token } : { status: { in: ["ai_only", "pre_chat", "waiting_for_agent", "active", "waiting_follow_up"] } }),
      },
      orderBy: { lastMessageAt: "desc" }, select,
    }));
    if (!conversation) return new Response("no conversation", { status: 404, headers: STREAM_HEADERS });
    const channel = `conv:${conversation.id}`;
    const validate = () => db.chatConversation.findFirst({
      where: { id: conversation.id, visitorId: conversation.visitorId, visitor, ...(token ? { publicToken: token } : {}) }, select,
    });
    return openAuthorizedStream({
      request: req, kind: "visitor", key: `visitor:${conversation.visitorId}`, channel,
      validate, ready: row => ({ conversationId: row.id, status: row.status, mode: row.mode }),
      filter: (_, event) => "conversationId" in event && event.conversationId === conversation.id,
      heartbeat: async row => { await touchVisitor(row.visitorId); },
      replay: replayEvents(channel),
    });
  } catch {
    return new Response("unavailable", { status: 503, headers: STREAM_HEADERS });
  }
}
