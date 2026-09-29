import { resolveVisitor } from "@/lib/livechat/http";
import { getConversationByPublicToken, getResumableConversation, touchVisitor } from "@/lib/livechat/service";
import { subscribe, replayEvents, type BusEvent } from "@/lib/livechat/pubsub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/live-chat/stream?token=… — the visitor's real-time channel
 * (Server-Sent Events). Delivers agent messages, status changes (accepted,
 * timeout, closed), agent typing indicators and keep-alive pings that
 * double as the visitor heartbeat (online/idle/disconnected in admin).
 *
 * Reconnection: the browser's EventSource retries automatically; on
 * (re)connect the client refetches /session so the DB — never the stream —
 * is the source of truth. A short replay buffer covers the gap.
 */

const PING_MS = 25_000;

export async function GET(req: Request) {
  const visitor = await resolveVisitor(req);
  if (!visitor) return new Response("unavailable", { status: 503 });

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const conversation = token
    ? await getConversationByPublicToken(token, visitor.visitorId)
    : await getResumableConversation(visitor.visitorId);
  if (!conversation) return new Response("no conversation", { status: 404 });

  const conversationId = conversation.id;
  const channel = `conv:${conversationId}`;
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let ping: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Consumer gone — the cancel path cleans up.
        }
      };

      send("ready", { conversationId, status: conversation.status, mode: conversation.mode });
      for (const event of replayEvents(channel)) send(event.type, event);

      unsubscribe = subscribe(channel, (event: BusEvent) => send(event.type, event));

      // Pings keep proxies from timing the connection out and double as
      // the visitor heartbeat for the admin presence dot.
      ping = setInterval(() => {
        if (closed) return;
        send("ping", { t: Date.now() });
        void touchVisitor(visitor.visitorId);
      }, PING_MS);
    },
    cancel() {
      closed = true;
      unsubscribe?.();
      if (ping) clearInterval(ping);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
