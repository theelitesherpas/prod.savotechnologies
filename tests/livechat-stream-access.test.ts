import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  cookie: "original-cookie", sessionRow: null as unknown, conversation: null as unknown,
  sessions: vi.fn(), conversations: vi.fn(), presence: vi.fn(), touch: vi.fn(), createVisitor: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  adminSession: { findUnique: m.sessions, delete: vi.fn(async () => ({})) },
  agentPresence: { upsert: m.presence }, chatConversation: { findFirst: m.conversations },
  chatVisitor: { create: m.createVisitor },
} }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: m.cookie }) }) }));
vi.mock("@/lib/livechat/http", () => ({ VISITOR_COOKIE: "savo_vc" }));
vi.mock("@/lib/livechat/service", () => ({ touchVisitor: m.touch }));
vi.mock("@/lib/passwords", () => ({ hashPassword: vi.fn(), verifyPassword: vi.fn(), DUMMY_PASSWORD_HASH: "dummy" }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), info: vi.fn() } }));
vi.mock("react", async original => ({ ...await original<typeof import("react")>(), cache: <T>(fn: T) => fn }));

import { GET as adminStream } from "@/app/api/admin/live-chat/stream/route";
import { GET as visitorStream } from "@/app/api/live-chat/stream/route";
import { adminSessionRevalidator, hashToken } from "@/lib/auth";
import { openAuthorizedStream, STREAM_LIMITS } from "@/lib/livechat/authorized-stream";
import { publish, type BusEvent } from "@/lib/livechat/pubsub";

const aborts: AbortController[] = [];
const flush = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
function request(visitor = false, token = "public-token") {
  const abort = new AbortController(); aborts.push(abort);
  return new Request(`https://example.test/api/${visitor ? "" : "admin/"}live-chat/stream?token=${token}`, {
    signal: abort.signal, headers: visitor ? { cookie: "savo_vc=visitor-cookie" } : {},
  });
}
function session(permissions = ["live-chat", "emails", "enquiries"]) {
  return { id: "session", expiresAt: new Date(Date.now() + 86400000), createdAt: new Date(), user: {
    id: "operator", name: "Operator", email: "operator@example.test", role: "editor", permissions, employeeId: null, employee: null,
  } };
}
const decoder = new TextDecoder();
async function ready(response: Response) {
  const reader = response.body!.getReader();
  const first = await reader.read(); expect(decoder.decode(first.value)).toContain("event: ready"); return reader;
}
const message = (conversationId = "conversation", body = "message") => ({ type: "message.new", conversationId, message: {
  id: "message-id", body, type: "agent", senderName: "Agent", createdAt: "2026-01-01T00:00:00Z",
} }) as BusEvent;
beforeEach(() => {
  vi.clearAllMocks(); m.cookie = "original-cookie"; m.sessionRow = session();
  m.conversation = { id: "conversation", visitorId: "visitor", status: "active", mode: "human" };
  m.sessions.mockImplementation(async () => m.sessionRow);
  m.conversations.mockImplementation(async () => m.conversation);
  m.presence.mockResolvedValue({}); m.touch.mockResolvedValue(undefined);
});
afterEach(async () => { for (const abort of aborts.splice(0)) abort.abort(); await flush(); vi.useRealTimers(); });

describe("live authority and event audience", () => {
  it("binds revalidation to the original hashed credential, without cookie/request cache reuse", async () => {
    const resolve = await adminSessionRevalidator(); m.cookie = "different-cookie";
    await resolve(); await resolve();
    expect(m.sessions).toHaveBeenCalledTimes(2);
    for (const [query] of m.sessions.mock.calls) expect(query.where.tokenHash).toBe(hashToken("original-cookie"));
    expect(JSON.stringify(m.sessions.mock.calls)).not.toContain("original-cookie");
  });
  it("denies an opener without a current session before presence/subscription", async () => {
    m.sessionRow = null; expect((await adminStream(request())).status).toBe(401); expect(m.presence).not.toHaveBeenCalled();
  });
  it("denies a non-chat opener even with notification grants", async () => {
    m.sessionRow = session(["emails", "enquiries"]); expect((await adminStream(request())).status).toBe(401); expect(m.presence).not.toHaveBeenCalled();
  });
  it("retains ready/frame contracts and private, noncached stream headers", async () => {
    const response = await adminStream(request()); const reader = await ready(response);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    publish("admin", message()); expect(decoder.decode((await reader.read()).value)).toContain("message.new");
    expect(m.presence.mock.calls[0][0].update).not.toHaveProperty("status"); await reader.cancel();
  });
  it("removing just an email grant blocks the next PII event but preserves chat", async () => {
    const reader = await ready(await adminStream(request())); m.sessionRow = session(["live-chat"]);
    publish("admin", { type: "email.new", email: { fromName: "PRIVATE_EMAIL_SENTINEL", fromEmail: "private@example.test", subject: "Private", dept: "hr" } });
    await flush(); publish("admin", message());
    const text = decoder.decode((await reader.read()).value); expect(text).toContain("message.new"); expect(text).not.toContain("PRIVATE_EMAIL_SENTINEL");
    await reader.cancel();
  });
  it.each(["deleted", "expired", "exited", "unlinked", "unknown-role", "chat-revoked"])("%s authority closes an already-open admin stream before its next event", async kind => {
    const reader = await ready(await adminStream(request()));
    const row = session();
    if (kind === "deleted") m.sessionRow = null;
    else {
      if (kind === "expired") row.expiresAt = new Date();
      if (kind === "chat-revoked") row.user.permissions = ["emails"];
      if (kind === "unknown-role") row.user.role = "unexpected";
      if (kind === "exited" || kind === "unlinked") Object.assign(row.user, { employeeId: "employee", employee: kind === "exited" ? { status: "exited" } : null });
      m.sessionRow = row;
    }
    publish("admin", message("conversation", "REVOKED_PRIVATE_SENTINEL"));
    expect(await reader.read()).toEqual({ value: undefined, done: true });
  });
  it("idle streams revalidate on the next heartbeat and stop presence after revocation", async () => {
    vi.useFakeTimers(); const reader = await ready(await adminStream(request())); const writes = m.presence.mock.calls.length;
    m.sessionRow = null; await vi.advanceTimersByTimeAsync(STREAM_LIMITS.pingMs);
    expect(await reader.read()).toEqual({ value: undefined, done: true }); expect(m.presence).toHaveBeenCalledTimes(writes);
  });
  it("visitor stream uses existing identity and SQL ownership/block predicates, without minting visitors", async () => {
    const reader = await ready(await visitorStream(request(true)));
    for (const [query] of m.conversations.mock.calls) {
      expect(query.where.visitor).toEqual({ tokenHash: hashToken("visitor-cookie"), blocked: false });
      expect(query.where.publicToken).toBe("public-token"); expect(query.select).toEqual({ id: true, visitorId: true, status: true, mode: true });
    }
    expect(m.createVisitor).not.toHaveBeenCalled(); await reader.cancel();
  });
  it("anonymous visitor stream performs no lookup or visitor creation", async () => {
    expect((await visitorStream(new Request("https://example.test/api/live-chat/stream"))).status).toBe(401);
    expect(m.conversations).not.toHaveBeenCalled(); expect(m.createVisitor).not.toHaveBeenCalled();
  });
  it("foreign/blocked/deleted conversation cannot open or remain streaming", async () => {
    const reader = await ready(await visitorStream(request(true))); m.conversation = null;
    publish("conv:conversation", message("conversation", "BLOCKED_PRIVATE_SENTINEL"));
    expect(await reader.read()).toEqual({ value: undefined, done: true });
    expect((await visitorStream(request(true))).status).toBe(404);
    expect(m.createVisitor).not.toHaveBeenCalled();
  });
  it("visitor channel never forwards a mismatched conversation or admin notification", async () => {
    const reader = await ready(await visitorStream(request(true)));
    publish("conv:conversation", message("other", "FOREIGN_PRIVATE_SENTINEL"));
    publish("conv:conversation", { type: "enquiry.new", enquiry: { name: "SALES_PRIVATE_SENTINEL" } });
    await flush(); publish("conv:conversation", message());
    const text = decoder.decode((await reader.read()).value); expect(text).toContain("message.new"); expect(text).not.toContain("PRIVATE_SENTINEL"); await reader.cancel();
  });
  it("storage failure yields retryable startup failure rather than fake stream success", async () => {
    m.sessions.mockRejectedValue(Error("PRIVATE_DATABASE_DETAILS")); const response = await adminStream(request());
    expect(response.status).toBe(503); expect(await response.text()).not.toContain("PRIVATE_DATABASE_DETAILS");
  });
});

describe("bounded stream resources", () => {
  function generic(key: string, validate = async () => ({ active: true })) {
    return openAuthorizedStream({ request: request(), key, kind: "admin", channel: "bounds", validate, ready: () => ({}), filter: () => true });
  }
  it("six streams/operator, independent operators, and released slots after abort/cancel", async () => {
    const streams = Array.from({ length: STREAM_LIMITS.admin }, () => generic("quota-operator"));
    expect(generic("quota-operator").status).toBe(429); expect(generic("another-operator").status).toBe(200);
    await streams[0].body!.cancel(); expect(generic("quota-operator").status).toBe(200);
  });
  it("four visitor streams/identity", () => {
    const options = { kind: "visitor" as const, key: "visitor:quota", channel: "bounds", validate: async () => ({}), ready: () => ({}), filter: () => true };
    for (let i = 0; i < STREAM_LIMITS.visitor; i++) expect(openAuthorizedStream({ ...options, request: request() }).status).toBe(200);
    expect(openAuthorizedStream({ ...options, request: request() }).status).toBe(429);
  });
  it("128 active streams is a hard process-wide cap without evicting existing protection", async () => {
    for (let i = 0; i < STREAM_LIMITS.total; i++) expect(generic(`total-${i}`).status).toBe(200);
    expect(generic("one-too-many").status).toBe(429);
    aborts[0].abort(); await flush(); expect(generic("recovered").status).toBe(200);
  });
  it("pre-aborted requests never allocate a stream", () => {
    const req = request(); aborts.at(-1)!.abort();
    expect(openAuthorizedStream({ request: req, key: "aborted", kind: "admin", channel: "bounds", validate: async () => ({}), ready: () => ({}), filter: () => true }).status).toBe(204);
  });
  it("15-minute absolute lifetime releases subscriptions and timers", async () => {
    vi.useFakeTimers(); const reader = await ready(generic("lifetime"));
    await vi.advanceTimersByTimeAsync(STREAM_LIMITS.lifetimeMs);
    let done = false; while (!done) done = (await reader.read()).done;
    expect(generic("lifetime").status).toBe(200);
  });
  it("a hung authority read times out, closes and releases its quota", async () => {
    vi.useFakeTimers(); let hold = false;
    const validate = vi.fn(() => hold ? new Promise<{ active: boolean }>(() => {}) : Promise.resolve({ active: true }));
    const reader = await ready(generic("hung", validate)); hold = true;
    publish("bounds", message()); await vi.advanceTimersByTimeAsync(STREAM_LIMITS.authorityTimeoutMs);
    expect(await reader.read()).toEqual({ value: undefined, done: true });
    expect(generic("hung").status).toBe(200);
  });
  it("held validation has one in-flight batch and a hard frame-count ceiling", async () => {
    let resolve!: (v: { active: boolean }) => void;
    const validate = vi.fn(() => new Promise<{ active: boolean }>(r => { resolve = r; }));
    const response = generic("frames", validate); const reader = response.body!.getReader();
    for (let i = 0; i < STREAM_LIMITS.frames; i++) publish("bounds", message());
    expect(validate).toHaveBeenCalledOnce(); expect(await reader.read()).toEqual({ value: undefined, done: true });
    resolve({ active: true }); await flush();
  });
  it("oversized frames fail closed without retaining or delivering their payload", async () => {
    const reader = await ready(generic("oversized")); publish("bounds", message("conversation", "x".repeat(STREAM_LIMITS.frameBytes)));
    expect(await reader.read()).toEqual({ value: undefined, done: true });
  });
  it("slow consumers cannot grow the stream byte buffer indefinitely", async () => {
    const reader = await ready(generic("slow"));
    for (let i = 0; i < 40; i++) { publish("bounds", message("conversation", "x".repeat(5000))); await flush(); }
    let bytes = 0; for (;;) { const frame = await reader.read(); if (frame.done) break; bytes += frame.value.byteLength; }
    expect(bytes).toBeLessThanOrEqual(STREAM_LIMITS.bytes);
  });
  it("request abort prevents all later subscription events and heartbeats", async () => {
    vi.useFakeTimers(); const response = await adminStream(request()); const reader = await ready(response);
    const writes = m.presence.mock.calls.length; aborts.at(-1)!.abort(); publish("admin", message());
    await vi.advanceTimersByTimeAsync(STREAM_LIMITS.pingMs * 2);
    expect(await reader.read()).toEqual({ value: undefined, done: true }); expect(m.presence).toHaveBeenCalledTimes(writes);
  });
});
