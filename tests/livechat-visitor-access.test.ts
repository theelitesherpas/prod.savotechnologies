import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ ensure: vi.fn(), access: vi.fn(), ip: vi.fn() }));
vi.mock("@/lib/livechat/service", () => ({ ensureVisitor: m.ensure, getVisitorAccessByToken: m.access }));
vi.mock("@/lib/api", () => ({ clientIpFromHeaders: m.ip }));

import { resolveVisitor, VISITOR_COOKIE } from "@/lib/livechat/http";

const request = (cookie?: string) => new Request("https://example.test/api/live-chat/session", {
  headers: cookie ? { cookie } : {},
});

beforeEach(() => {
  vi.clearAllMocks();
  m.ip.mockReturnValue("203.0.113.7");
  m.ensure.mockResolvedValue({ id: "new-visitor", token: "fresh-token", created: true });
});

describe("visitor identity resolution", () => {
  it("reuses a known, unblocked visitor without issuing another identity", async () => {
    m.access.mockResolvedValue({ id: "visitor-one", blocked: false });
    await expect(resolveVisitor(request(`${VISITOR_COOKIE}=opaque-token`))).resolves.toEqual({ visitorId: "visitor-one", token: null });
    expect(m.access).toHaveBeenCalledWith("opaque-token");
    expect(m.ensure).not.toHaveBeenCalled();
  });

  it("fails closed for a known blocked visitor rather than silently minting a bypass identity", async () => {
    m.access.mockResolvedValue({ id: "blocked-visitor", blocked: true });
    await expect(resolveVisitor(request(`${VISITOR_COOKIE}=blocked-token`))).resolves.toBeNull();
    expect(m.ensure).not.toHaveBeenCalled();
  });

  it("issues a fresh visitor only when there is no known valid identity", async () => {
    m.access.mockResolvedValue(null);
    await expect(resolveVisitor(request(`${VISITOR_COOKIE}=unknown-token`))).resolves.toEqual({ visitorId: "new-visitor", token: "fresh-token" });
    expect(m.ensure).toHaveBeenCalledWith(null, expect.objectContaining({ userAgent: null }));
  });

  it("does not hash or look up an oversized attacker-controlled cookie", async () => {
    m.access.mockResolvedValue(null);
    await resolveVisitor(request(`${VISITOR_COOKIE}=${"x".repeat(129)}`));
    expect(m.access).not.toHaveBeenCalled();
    expect(m.ensure).toHaveBeenCalledTimes(1);
  });
});
