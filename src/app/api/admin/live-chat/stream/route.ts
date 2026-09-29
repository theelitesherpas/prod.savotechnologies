import { requireChatAgent } from "@/lib/livechat/admin-guard";
import { subscribe, type BusEvent } from "@/lib/livechat/pubsub";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/live-chat/stream — the admin inbox's real-time channel.
 *  Carries the whole admin bus (new requests, messages across all
 *  conversations, status changes, typing, count refreshes) plus keep-alive
 *  pings that double as the agent's presence heartbeat.
 */

const PING_MS = 25_000;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: Request) {
  const user = await requireChatAgent();
  if (!user) return new Response("unauthorized", { status: 401 });

  // Opening the inbox counts as going online (unless manually away/busy).
  if (prisma) {
    await prisma.agentPresence
      .upsert({
        where: { userId: user.id },
        update: { lastSeenAt: new Date() },
        create: { userId: user.id, status: "online", lastSeenAt: new Date() },
      })
      .catch(() => undefined);
  }

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
          // Consumer gone.
        }
      };

      send("ready", { me: user.id });

      unsubscribe = subscribe("admin", (event: BusEvent) => {
        // Typing signals only matter for open conversations — forward all;
        // the client filters by the thread it has open.
        send(event.type, event);
      });

      ping = setInterval(() => {
        if (closed) return;
        send("ping", { t: Date.now() });
        if (prisma) {
          void prisma.agentPresence
            .update({ where: { userId: user.id }, data: { lastSeenAt: new Date() } })
            .catch(() => undefined);
        }
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
