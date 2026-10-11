import "server-only";
import { subscribe, type BusEvent } from "./pubsub";

export const STREAM_LIMITS = {
  total: 128, admin: 6, visitor: 4,
  lifetimeMs: 15 * 60_000, pingMs: 15_000, authorityTimeoutMs: 5_000,
  frames: 64, bytes: 128 * 1024, frameBytes: 16 * 1024,
} as const;

const globals = globalThis as unknown as {
  __savoStreamQuotasV1?: { total: number; keys: Map<string, number> };
};
const quotas = globals.__savoStreamQuotasV1 ??= { total: 0, keys: new Map() };

export const STREAM_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "private, no-store, no-transform",
  "X-Accel-Buffering": "no", "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer", Connection: "keep-alive",
};

/** A response timeout is not cancellation of the underlying DB query. */
export async function readStreamAuthority<T>(read: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      read(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Error("STREAM_AUTH_TIMEOUT")), STREAM_LIMITS.authorityTimeoutMs); }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

function lease(key: string, limit: number): (() => void) | null {
  if (key.length > 256 || quotas.total >= STREAM_LIMITS.total || (quotas.keys.get(key) ?? 0) >= limit) return null;
  quotas.total++;
  quotas.keys.set(key, (quotas.keys.get(key) ?? 0) + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true; quotas.total--;
    const left = (quotas.keys.get(key) ?? 1) - 1;
    if (left) quotas.keys.set(key, left); else quotas.keys.delete(key);
  };
}

/** Fresh authority before every bounded event batch and idle heartbeat.
 * Events never inherit the opener's stale grants. Slow consumers/revalidation
 * failures close instead of building an unbounded promise or byte queue. */
export function openAuthorizedStream<T>(options: {
  request: Request; key: string; kind: "admin" | "visitor"; channel: string;
  validate: () => Promise<T | null>;
  ready: (context: T) => unknown;
  filter: (context: T, event: BusEvent) => boolean;
  heartbeat?: (context: T) => Promise<void>;
  replay?: BusEvent[];
}): Response {
  if (options.request.signal.aborted) return new Response(null, { status: 204, headers: STREAM_HEADERS });
  const release = lease(options.key, STREAM_LIMITS[options.kind]);
  if (!release) return new Response("stream capacity reached", { status: 429, headers: { ...STREAM_HEADERS, "Retry-After": "5" } });

  const encoder = new TextEncoder();
  type Pending = { event?: BusEvent; frame?: Uint8Array; kind: "ready" | "ping" | "event"; bytes: number };
  let queue: Pending[] = [];
  let pendingBytes = 0, pendingFrames = 0;
  let closed = false, running = false;
  let controller: ReadableStreamDefaultController<Uint8Array>;
  let unsubscribe: (() => void) | undefined;
  let ping: ReturnType<typeof setInterval> | undefined;
  let lifetime: ReturnType<typeof setTimeout> | undefined;

  const close = () => {
    if (closed) return;
    closed = true; queue = []; pendingBytes = 0; pendingFrames = 0;
    unsubscribe?.(); if (ping) clearInterval(ping); if (lifetime) clearTimeout(lifetime);
    options.request.signal.removeEventListener("abort", close);
    release();
    try { controller?.close(); } catch { /* already cancelled */ }
  };
  const encode = (name: string, data: unknown) => encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
  const write = (frame: Uint8Array) => {
    if (closed) return;
    if (frame.byteLength > STREAM_LIMITS.frameBytes || frame.byteLength > (controller.desiredSize ?? 0)) { close(); return; }
    try { controller.enqueue(frame); } catch { close(); }
  };
  const drain = async () => {
    if (running || closed) return;
    running = true;
    try {
      while (queue.length && !closed) {
        const batch = queue.splice(0);
        const context = await readStreamAuthority(options.validate);
        if (closed) return;
        if (!context) { close(); return; }
        for (const item of batch) {
          if (closed) return;
          if (item.kind !== "event") {
            if (options.heartbeat) await readStreamAuthority(() => options.heartbeat!(context));
            if (closed) return;
            write(item.kind === "ready" ? encode("ready", options.ready(context)) : encode("ping", { t: Date.now() }));
          } else if (item.event && options.filter(context, item.event)) write(item.frame!);
          pendingBytes -= item.bytes; pendingFrames--;
        }
      }
    } catch { close(); } finally { running = false; }
  };
  const push = (item: Pending) => {
    if (closed) return;
    if (pendingFrames >= STREAM_LIMITS.frames || pendingBytes + item.bytes > STREAM_LIMITS.bytes || item.bytes > STREAM_LIMITS.frameBytes) { close(); return; }
    pendingFrames++; pendingBytes += item.bytes; queue.push(item);
    void drain();
  };
  const event = (evt: BusEvent) => {
    if (closed) return;
    try {
      const frame = encode(evt.type, evt);
      push({ kind: "event", event: evt, frame, bytes: frame.byteLength });
    } catch { close(); }
  };
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
      options.request.signal.addEventListener("abort", close, { once: true });
      if (options.request.signal.aborted) { close(); return; }
      unsubscribe = subscribe(options.channel, event);
      ping = setInterval(() => push({ kind: "ping", bytes: 64 }), STREAM_LIMITS.pingMs);
      lifetime = setTimeout(close, STREAM_LIMITS.lifetimeMs);
      push({ kind: "ready", bytes: 256 });
      for (const evt of options.replay ?? []) event(evt);
    },
    cancel: close,
  }, { highWaterMark: STREAM_LIMITS.bytes, size: chunk => chunk.byteLength });
  return new Response(stream, { headers: STREAM_HEADERS });
}
