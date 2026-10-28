import { createHash } from "node:crypto";
import type { PortalLoginChallenge } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INITIAL_PORTAL_LOGIN, type PortalKind, type PortalLoginState } from "@/lib/portal-login-state";

const m = vi.hoisted(() => ({
  client: vi.fn(), employee: vi.fn(), session: vi.fn(), rate: vi.fn(), verify: vi.fn(), captcha: vi.fn(), mail: vi.fn(), key: vi.fn(),
  create: vi.fn(), find: vi.fn(), update: vi.fn(), remove: vi.fn(), set: vi.fn(), log: vi.fn(),
  cookies: new Map<string, string>(), rows: new Map<string, PortalLoginChallenge>(), sentCode: "",
}));
vi.mock("@/lib/prisma", () => {
  const db = { clientUser: { findUnique: m.client }, employee: { findUnique: m.employee }, clientSession: { create: m.session }, employeeSession: { create: m.session },
    portalLoginChallenge: { create: m.create, findUnique: m.find, updateMany: m.update, deleteMany: m.remove }, $queryRaw: m.rate };
  return { prisma: { ...db, $transaction: async (fn: (tx: unknown) => unknown) => fn(db) } };
});
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: (key: string) => m.cookies.has(key) ? { value: m.cookies.get(key) } : undefined, set: m.set, delete: (key: string) => m.cookies.delete(key) }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@/lib/captcha", () => ({ enforceLoginCaptcha: m.captcha, recordLoginFailure: vi.fn(), clearLoginFailures: vi.fn() }));
vi.mock("@/lib/passwords", () => ({ verifyPassword: m.verify, DUMMY_PASSWORD_HASH: "dummy" }));
vi.mock("@/lib/mail", () => ({ sendMail: m.mail }));
vi.mock("@/lib/secret-box", () => ({ masterKeyBytes: m.key }));
vi.mock("@/lib/logger", () => ({ logger: { info: m.log, warn: m.log, error: m.log } }));
import { handlePortalLogin, portalCodeDigest } from "@/lib/portal-login";

const email = "registered@example.invalid";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
function form(intent = "password", extras: Record<string, string> = {}) {
  const f = new FormData();
  for (const [key, value] of Object.entries({ email, password: "password", captchaToken: "solved", intent, ...extras })) f.set(key, value);
  return f;
}
const submit = (kind: PortalKind, intent: string, extras?: Record<string, string>, previous = INITIAL_PORTAL_LOGIN) => handlePortalLogin(kind, previous, form(intent, extras));
function codeForm(state: PortalLoginState, code = m.sentCode) { return { challengeId: state.challengeId!, code }; }

beforeEach(() => {
  vi.clearAllMocks(); m.cookies.clear(); m.rows.clear(); m.sentCode = "";
  m.client.mockResolvedValue({ id: "client", email, active: true, passwordHash: "hash" });
  m.employee.mockResolvedValue({ id: "employee", email, status: "active", panelUsers: [{ passwordHash: "hash" }] });
  m.session.mockResolvedValue({}); m.rate.mockResolvedValue([{ hits: 1 }]); m.verify.mockResolvedValue(true); m.captcha.mockResolvedValue({ ok: true }); m.key.mockReturnValue(Buffer.alloc(32, 7));
  m.set.mockImplementation((key: string, value: string) => { m.cookies.set(key, value); });
  m.mail.mockImplementation(async (_to, tpl) => { m.sentCode = tpl.text.match(/sign-in code: (\d{6})/)[1]; return true; });
  m.create.mockImplementation(async ({ data }) => { const row = { createdAt: new Date(), consumedAt: null, attempts: 0, ...data }; m.rows.set(row.id, row); return row; });
  m.find.mockImplementation(async ({ where }) => m.rows.has(where.id) ? structuredClone(m.rows.get(where.id)) : null);
  m.remove.mockImplementation(async ({ where }) => ({ count: m.rows.delete(where.id) ? 1 : 0 }));
  m.update.mockImplementation(async ({ where, data }) => {
    const row = m.rows.get(where.id);
    if (!row || row.consumedAt || (where.attempts !== undefined && row.attempts !== where.attempts) || (where.expiresAt && row.expiresAt <= where.expiresAt.gt)) return { count: 0 };
    if (data.attempts) row.attempts += data.attempts.increment;
    if (data.consumedAt) row.consumedAt = data.consumedAt;
    return { count: 1 };
  });
});
afterEach(() => vi.unstubAllEnvs());

describe.each(["client", "employee"] as const)("%s registered-only sign-in", (kind) => {
  const account = () => kind === "client" ? m.client : m.employee;
  it("normalizes email and creates only a hashed, 12-hour session by default", async () => {
    await expect(submit(kind, "password", { email: `  ${email.toUpperCase()}  ` })).rejects.toThrow("REDIRECT:");
    expect(account().mock.calls[0][0].where.email).toBe(email);
    const data = m.session.mock.calls[0][0].data;
    expect(data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(data.expiresAt.getTime() - Date.now()).toBeCloseTo(12 * 3600_000, -3);
    const [name, token, options] = m.set.mock.calls[0];
    expect(name).toBe(`savo_${kind}`); expect(sha(token)).toBe(data.tokenHash);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(options).not.toHaveProperty("maxAge"); expect(options).not.toHaveProperty("expires");
  });
  it("remembers only with explicit opt-in, bounded to 30 days and HTTPS in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(submit(kind, "password", { remember: "on" })).rejects.toThrow("REDIRECT:");
    expect(m.set.mock.calls[0][2]).toMatchObject({ maxAge: 30 * 86400, secure: true });
  });
  it("rejects unknown email with support guidance, performs dummy password work and sends no code", async () => {
    account().mockResolvedValue(null);
    expect((await submit(kind, "password")).error).toContain("not registered");
    expect(m.verify).toHaveBeenCalledWith("password", "dummy");
    expect((await submit(kind, "send-code")).error).toContain("Savo support");
    expect(m.mail).not.toHaveBeenCalled(); expect(m.session).not.toHaveBeenCalled();
  });
  it("rejects disabled/exited accounts for both methods", async () => {
    account().mockResolvedValue(kind === "client" ? { id: "client", email, active: false, passwordHash: "hash" } : { id: "employee", email, status: "exited", panelUsers: [{ passwordHash: "hash" }] });
    expect((await submit(kind, "password")).error).toContain("not enabled");
    expect((await submit(kind, "send-code")).error).toContain("not enabled");
    expect(m.mail).not.toHaveBeenCalled(); expect(m.session).not.toHaveBeenCalled();
  });
  it("requires CAPTCHA before disclosing whether an account exists", async () => {
    m.captcha.mockResolvedValue({ ok: false, captchaRequired: true });
    expect((await submit(kind, "send-code")).error).toContain("human verification");
    expect(account()).not.toHaveBeenCalled();
  });
  it("does not trust previous action state", async () => {
    const forged: PortalLoginState = { stage: "code", email, challengeId: crypto.randomUUID() };
    expect((await submit(kind, "verify-code", codeForm(forged, "123456"), forged)).stage).toBe("credentials");
    expect(m.session).not.toHaveBeenCalled();
  });
  it("delivers a six-digit code only to the stored email and never archives it", async () => {
    const state = await submit(kind, "send-code", { remember: "on", code: "999999" });
    expect(state.stage).toBe("code"); expect(m.sentCode).toMatch(/^\d{6}$/);
    expect(m.mail.mock.calls[0][0]).toBe(email);
    expect(m.mail.mock.calls[0][3]).toEqual({ sensitive: true });
    const row = [...m.rows.values()][0];
    expect(row.codeHash).toBe(portalCodeDigest(kind, row.id, m.sentCode));
    expect(row.emailHash).toBe(sha(email)); expect(row.remember).toBe(true);
    expect(row.codeHash).not.toContain(m.sentCode);
    expect(row.expiresAt.getTime() - row.createdAt.getTime()).toBeCloseTo(600_000, -2);
    expect(m.set.mock.calls[0][2]).toMatchObject({ httpOnly: true, sameSite: "strict", maxAge: 600 });
    expect(JSON.stringify(state)).not.toContain(m.sentCode);
    expect(JSON.stringify(m.log.mock.calls)).not.toContain(email);
    expect(m.session).not.toHaveBeenCalled();
  });
  it("redeems once, keeps server-owned remember choice, rejects replay", async () => {
    const state = await submit(kind, "send-code", { remember: "on" });
    const binding = m.cookies.get(`savo_${kind}_login`)!;
    await expect(submit(kind, "verify-code", { ...codeForm(state), remember: "off" })).rejects.toThrow("REDIRECT:");
    expect(m.session).toHaveBeenCalledOnce(); expect(m.set.mock.calls.at(-1)![2]).toMatchObject({ maxAge: 30 * 86400 });
    m.cookies.set(`savo_${kind}_login`, binding);
    expect((await submit(kind, "verify-code", codeForm(state))).stage).toBe("credentials");
    expect(m.session).toHaveBeenCalledOnce();
  });
  it("rejects cross-browser, cross-portal, email-tampered and unknown challenges", async () => {
    const state = await submit(kind, "send-code");
    const binding = m.cookies.get(`savo_${kind}_login`)!;
    m.cookies.set(`savo_${kind}_login`, "a".repeat(64));
    expect((await submit(kind, "verify-code", codeForm(state))).stage).toBe("credentials");
    m.cookies.set(`savo_${kind}_login`, binding);
    expect((await submit(kind, "verify-code", { ...codeForm(state), email: "different@example.invalid" })).stage).toBe("credentials");
    const other = kind === "client" ? "employee" : "client";
    m.cookies.set(`savo_${other}_login`, binding);
    expect((await submit(other, "verify-code", codeForm(state))).stage).toBe("credentials");
    expect((await submit(kind, "verify-code", { ...codeForm(state), challengeId: crypto.randomUUID() })).stage).toBe("credentials");
    expect(m.session).not.toHaveBeenCalled();
  });
  it("expires at the exact deadline and stops after five incorrect guesses", async () => {
    const state = await submit(kind, "send-code");
    const row = m.rows.get(state.challengeId!)!;
    const wrong = m.sentCode === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) await submit(kind, "verify-code", codeForm(state, wrong));
    expect(row.attempts).toBe(5); expect(row.consumedAt).not.toBeNull();
    expect((await submit(kind, "verify-code", codeForm(state))).stage).toBe("credentials");
    row.consumedAt = null; row.attempts = 0; row.expiresAt = new Date();
    expect((await submit(kind, "verify-code", codeForm(state))).stage).toBe("credentials");
    expect(m.session).not.toHaveBeenCalled();
  });
  it("re-checks current account eligibility and address at redemption", async () => {
    const state = await submit(kind, "send-code");
    account().mockResolvedValue(kind === "client" ? { id: "client", email, active: false } : { id: "employee", email, status: "exited", panelUsers: [{}] });
    expect((await submit(kind, "verify-code", codeForm(state))).error).toBeTruthy();
    expect(m.session).not.toHaveBeenCalled();
  });
  it("invalidates the previous browser code only after successful resend", async () => {
    const state = await submit(kind, "send-code");
    const oldCode = m.sentCode;
    const resent = await submit(kind, "resend-code", codeForm(state));
    expect(resent.challengeId).not.toBe(state.challengeId);
    expect(m.rows.get(state.challengeId!)!.consumedAt).not.toBeNull();
    expect(m.captcha).toHaveBeenCalledOnce();
    expect((await submit(kind, "verify-code", codeForm(state, oldCode))).stage).toBe("credentials");
  });
  it("handles mail failure honestly and removes the undelivered challenge", async () => {
    m.mail.mockResolvedValue(false);
    expect((await submit(kind, "send-code")).error).toContain("couldn’t send");
    expect(m.rows.size).toBe(0); expect(m.set).not.toHaveBeenCalled();
  });
  it("fails closed on persistent limits, storage errors and missing keys", async () => {
    m.rate.mockResolvedValue([]);
    expect((await submit(kind, "password")).error).toContain("Too many"); expect(account()).not.toHaveBeenCalled();
    m.rate.mockRejectedValueOnce(new Error("private DB credential"));
    expect((await submit(kind, "password")).error).toContain("temporarily unavailable");
    m.rate.mockResolvedValue([{ hits: 1 }]); m.key.mockImplementation(() => { throw new Error("missing key"); });
    expect((await submit(kind, "send-code")).error).toContain("temporarily unavailable");
    expect(m.mail).not.toHaveBeenCalled(); expect(m.session).not.toHaveBeenCalled();
    expect(JSON.stringify(m.log.mock.calls)).not.toContain("private DB credential");
  });
});

it("does not enable unlinked employees via OTP", async () => {
  m.employee.mockResolvedValue({ id: "employee", email, status: "active", panelUsers: [] });
  expect((await submit("employee", "send-code")).error).toContain("not enabled");
  expect(m.mail).not.toHaveBeenCalled();
});
it("domain-separates OTP digests by portal, challenge and code", () => {
  const a = portalCodeDigest("client", "a", "123456");
  expect(a).not.toBe(portalCodeDigest("employee", "a", "123456"));
  expect(a).not.toBe(portalCodeDigest("client", "b", "123456"));
  expect(a).not.toBe(portalCodeDigest("client", "a", "654321"));
});
