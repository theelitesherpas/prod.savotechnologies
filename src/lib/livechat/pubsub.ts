/**
 * In-process publish/subscribe bus behind the SSE streams.
 *
 * Channel grammar:
 *   admin       , everything the admin inbox needs (new request, message,
 *                  status change, presence, counts)
 *   conv:{id}   , one conversation, consumed by the visitor's stream
 *                  (agent replies, status changes, typing indicators)
 *
 * Single-instance deployment (VPS + PM2, one `next start`), an in-memory
 * bus is the whole transport. When the platform scales horizontally, swap
 * publish() for Redis pub/sub; the interface stays identical.
 *
 * The bus also carries a small replay buffer per conversation so a stream
 * that reconnects can catch events it missed during the gap (plus the
 * client refetches state on reconnect, the DB is the source of truth).
 */

import type { MessageDTO } from "./types";

export type BusEvent =
  | { type: "message.new"; conversationId: string; message: MessageDTO }
  | {
      type: "status.changed";
      conversationId: string;
      status: string;
      agentName?: string | null;
      note?: string;
      lateAccept?: boolean;
    }
  | { type: "typing"; conversationId: string; who: "visitor" | "agent"; name?: string | null; typing: boolean }
  | { type: "summary.updated"; conversationId: string }
  | { type: "conversation.new"; conversationId: string }
  | { type: "end.requested"; conversationId: string; agentName: string | null }
  | { type: "enquiry.new"; enquiry: { name: string; projectType?: string; source?: string } }
  | { type: "email.new"; email: { fromName: string | null; fromEmail: string; subject: string; dept: string } }
  | { type: "counts.changed" };

type Listener = (event: BusEvent) => void;

const globalForBus = globalThis as unknown as {
  __liveChatBus?: { listeners: Map<string, Set<Listener>>; replay: Map<string, BusEvent[]> };
};

const bus =
  globalForBus.__liveChatBus ??
  (() => {
    const listeners = new Map<string, Set<Listener>>();
    const replay = new Map<string, BusEvent[]>();
    // Periodic replay-buffer trim so long-lived tabs don't grow memory.
    const janitor = setInterval(() => {
      const cutoff = Date.now() - 5 * 60 * 1000;
      for (const [channel, events] of replay) {
        // BusEvent has no timestamp for all variants, cap by length.
        if (events.length > 100) replay.set(channel, events.slice(-50));
      }
      void cutoff;
    }, 60_000);
    // Never hold the process open on this timer alone.
    if (typeof janitor.unref === "function") janitor.unref();
    return { listeners, replay };
  })();

globalForBus.__liveChatBus = bus;

const REPLAY_KEEP = 50;

export function publish(channel: string, event: BusEvent): void {
  const listeners = bus.listeners.get(channel);
  if (listeners) {
    for (const listener of listeners) {
      try {
        listener(event);
      } catch {
        // A broken subscriber never breaks the publisher.
      }
    }
  }
  const replay = bus.replay.get(channel);
  if (replay) {
    replay.push(event);
    if (replay.length > REPLAY_KEEP * 2) bus.replay.set(channel, replay.slice(-REPLAY_KEEP));
  }
}

export function subscribe(channel: string, listener: Listener): () => void {
  let listeners = bus.listeners.get(channel);
  if (!listeners) {
    listeners = new Set();
    bus.listeners.set(channel, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) bus.listeners.delete(channel);
  };
}

/** Events a stream missed before subscribing (oldest first, capped). */
export function replayEvents(channel: string): BusEvent[] {
  return [...(bus.replay.get(channel) ?? [])].slice(-REPLAY_KEEP);
}

/** Fire-and-forget fan-out to both the conversation channel and admins. */
export function publishConversationEvent(conversationId: string, event: BusEvent): void {
  publish(`conv:${conversationId}`, event);
  publish("admin", event);
}
