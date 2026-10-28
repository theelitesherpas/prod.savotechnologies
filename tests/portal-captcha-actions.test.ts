import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INITIAL_PORTAL_LOGIN } from "@/lib/portal-login-state";

const m = vi.hoisted(() => ({ client: vi.fn(), employee: vi.fn(), session: vi.fn(), verify: vi.fn(), cookie: vi.fn(), dbRate: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ set: m.cookie, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => {
  const db = { clientUser: { findUnique: m.client }, employee: { findUnique: m.employee }, clientSession: { create: m.session }, employeeSession: { create: m.session }, $queryRaw: m.dbRate };
  return { prisma: { ...db, $transaction: async (fn: (tx: unknown) => unknown) => fn(db) } };
});
vi.mock("@/lib/passwords", () => ({ verifyPassword: m.verify, DUMMY_PASSWORD_HASH: "dummy" }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => ({ ok: true }), rateCount: () => 0, clearRateLimit: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
import { clientSignInAction } from "@/app/portal/actions";
import { employeeSignInAction } from "@/app/(site)/employee-portal/actions";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "site");
  vi.stubEnv("RECAPTCHA_SECRET_KEY", "secret");
  vi.stubGlobal("fetch", vi.fn());
  m.dbRate.mockResolvedValue([{ hits: 1 }]);
  m.verify.mockResolvedValue(true);
  m.client.mockResolvedValue({ id: "client", email: "synthetic@example.invalid", active: true, passwordHash: "hash" });
  m.employee.mockResolvedValue({ id: "employee", email: "synthetic@example.invalid", status: "active", panelUsers: [{ passwordHash: "hash" }] });
  m.session.mockResolvedValue({});
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function credentials(token?: string, intent = "password") {
  const data = new FormData();
  data.set("email", "synthetic@example.invalid"); data.set("password", "synthetic-password"); data.set("intent", intent);
  if (token) data.set("captchaToken", token);
  return data;
}

describe.each([["client", clientSignInAction], ["employee", employeeSignInAction]] as const)("%s action CAPTCHA boundary", (portal, action) => {
  it.each(["password", "send-code"])("rejects the first unsolved %s request before account lookup", async (intent) => {
    expect(await action(INITIAL_PORTAL_LOGIN, credentials(undefined, intent))).toMatchObject({ error: "Please complete the human verification." });
    expect(m.client).not.toHaveBeenCalled(); expect(m.employee).not.toHaveBeenCalled(); expect(m.session).not.toHaveBeenCalled(); expect(m.cookie).not.toHaveBeenCalled();
  });
  it("rejects a forged token before credential work", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ success: false }));
    expect((await action(INITIAL_PORTAL_LOGIN, credentials("forged-token-12345"))).error).toContain("human verification");
    expect(m.client).not.toHaveBeenCalled(); expect(m.employee).not.toHaveBeenCalled();
  });
  it("fails closed without configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", ""); vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
    expect((await action(INITIAL_PORTAL_LOGIN, credentials())).error).toContain("temporarily unavailable");
    expect(m.client).not.toHaveBeenCalled(); expect(m.employee).not.toHaveBeenCalled();
  });
  it("preserves valid sign-in after actual enforcement reports provider success", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ success: true }));
    await expect(action(INITIAL_PORTAL_LOGIN, credentials("verified-token-12345"))).rejects.toThrow(portal === "client" ? "REDIRECT:/portal/dashboard" : "REDIRECT:/employee-portal/dashboard");
    expect(fetch).toHaveBeenCalledOnce(); expect(m.session).toHaveBeenCalledOnce(); expect(m.cookie).toHaveBeenCalledOnce();
  });
});
