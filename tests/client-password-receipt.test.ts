import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ values: new Map<string, string>(), options: new Map<string, Record<string, unknown>>() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => state.values.has(name) ? { value: state.values.get(name)! } : undefined,
    has: (name: string) => state.values.has(name),
    set: (name: string, value: string, options: Record<string, unknown>) => {
      state.values.set(name, value);
      state.options.set(name, options);
    },
  }),
}));
vi.mock("@/lib/auth", () => ({ ADMIN_COOKIE: "savo_admin" }));

import { CLIENT_PASSWORD_RECEIPT_COOKIE, consumeClientPasswordReceipt, hasClientPasswordReceipt, setClientPasswordReceipt } from "@/lib/client-password-receipt";

const password = "TestOnly_ClientPass_49!";
const adminToken = "session-token-with-enough-entropy-for-the-fixture";

afterEach(() => vi.unstubAllEnvs());

beforeEach(() => {
  state.values.clear();
  state.options.clear();
  state.values.set("savo_admin", adminToken);
});

describe("encrypted one-time client password receipts", () => {
  it("keeps the password out of the cookie value and binds a short-lived HttpOnly receipt to the admin session", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await setClientPasswordReceipt("admin-one", "created", password)).toBe(true);
    const value = state.values.get(CLIENT_PASSWORD_RECEIPT_COOKIE)!;
    expect(value).not.toContain(password);
    expect(value.split(".")[0]).toBe("v1");
    expect(state.options.get(CLIENT_PASSWORD_RECEIPT_COOKIE)).toMatchObject({
      httpOnly: true, secure: true, sameSite: "strict", path: "/admin/clients", maxAge: 120,
    });
    expect(await hasClientPasswordReceipt()).toBe(true);
    expect(await consumeClientPasswordReceipt("admin-one")).toEqual({ kind: "created", password });
    expect(state.options.get(CLIENT_PASSWORD_RECEIPT_COOKIE)?.maxAge).toBe(0);
    expect(await consumeClientPasswordReceipt("admin-one")).toBeNull();
  });

  it("does not reveal to another actor or a different admin session and consumes the receipt", async () => {
    await setClientPasswordReceipt("admin-one", "reset", password);
    expect(await consumeClientPasswordReceipt("admin-two")).toBeNull();
    expect(state.options.get(CLIENT_PASSWORD_RECEIPT_COOKIE)?.maxAge).toBe(0);

    await setClientPasswordReceipt("admin-one", "reset", password);
    state.values.set("savo_admin", "a-different-session-token-with-enough-entropy");
    expect(await consumeClientPasswordReceipt("admin-one")).toBeNull();
  });

  it("rejects tampered, malformed and expired payloads", async () => {
    await setClientPasswordReceipt("admin-one", "created", password);
    const parts = state.values.get(CLIENT_PASSWORD_RECEIPT_COOKIE)!.split(".");
    parts[4] = `${parts[4][0] === "A" ? "B" : "A"}${parts[4].slice(1)}`;
    state.values.set(CLIENT_PASSWORD_RECEIPT_COOKIE, parts.join("."));
    expect(await consumeClientPasswordReceipt("admin-one")).toBeNull();

    state.values.set(CLIENT_PASSWORD_RECEIPT_COOKIE, "not-a-receipt");
    expect(await consumeClientPasswordReceipt("admin-one")).toBeNull();

    vi.useFakeTimers();
    try {
      await setClientPasswordReceipt("admin-one", "created", password);
      vi.advanceTimersByTime(121_000);
      expect(await consumeClientPasswordReceipt("admin-one")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
