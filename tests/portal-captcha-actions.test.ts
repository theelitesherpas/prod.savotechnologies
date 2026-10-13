import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  clientLogin: vi.fn(),
  employee: vi.fn(),
  employeeSession: vi.fn(),
  verify: vi.fn(),
  cookie: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ set: m.cookie }),
}));
vi.mock("@/lib/client-auth", () => ({
  loginClient: m.clientLogin,
  logoutClient: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    employee: { findUnique: m.employee },
    employeeSession: { create: m.employeeSession },
  },
}));
vi.mock("@/lib/passwords", () => ({
  verifyPassword: m.verify,
  DUMMY_PASSWORD_HASH: "dummy",
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ ok: true }),
  rateCount: () => 0,
  clearRateLimit: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
import { clientLoginAction } from "@/app/portal/actions";
import { employeeLoginAction } from "@/app/(site)/employee-portal/actions";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "site");
  vi.stubEnv("RECAPTCHA_SECRET_KEY", "secret");
  vi.stubGlobal("fetch", vi.fn());
  m.clientLogin.mockResolvedValue({ ok: true });
  m.verify.mockResolvedValue(true);
  m.employee.mockResolvedValue({
    id: "employee",
    employeeCode: "SYNTHETIC",
    status: "active",
    panelUsers: [{ passwordHash: "hash" }],
  });
  m.employeeSession.mockResolvedValue({});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function credentials(token?: string) {
  const data = new FormData();
  data.set("email", "synthetic@example.invalid");
  data.set("password", "synthetic-password");
  if (token) data.set("captchaToken", token);
  return data;
}

describe.each([
  ["client", clientLoginAction],
  ["employee", employeeLoginAction],
] as const)("%s action CAPTCHA boundary", (portal, action) => {
  it("rejects the first unsolved request before credential work or sessions", async () => {
    await expect(action(credentials())).rejects.toThrow(
      "Please complete the human verification.",
    );
    expect(m.clientLogin).not.toHaveBeenCalled();
    expect(m.employee).not.toHaveBeenCalled();
    expect(m.employeeSession).not.toHaveBeenCalled();
    expect(m.cookie).not.toHaveBeenCalled();
  });
  it("rejects a forged token before credential work", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ success: false }));
    await expect(action(credentials("forged-token-12345"))).rejects.toThrow(
      "Please complete the human verification.",
    );
    expect(m.clientLogin).not.toHaveBeenCalled();
    expect(m.employee).not.toHaveBeenCalled();
  });
  it("does not bypass verification when configuration is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "");
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
    await expect(action(credentials())).rejects.toThrow(
      "Verification%20is%20temporarily%20unavailable",
    );
    expect(m.clientLogin).not.toHaveBeenCalled();
    expect(m.employee).not.toHaveBeenCalled();
  });
  it("preserves valid sign-in after actual enforcement reports provider success", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ success: true }));
    await expect(action(credentials("verified-token-12345"))).rejects.toThrow(
      portal === "client"
        ? "REDIRECT:/portal/dashboard"
        : "REDIRECT:/employee-portal/dashboard",
    );
    expect(fetch).toHaveBeenCalledOnce();
    if (portal === "employee") {
      expect(m.employeeSession).toHaveBeenCalledOnce();
      expect(m.cookie).toHaveBeenCalledOnce();
    } else expect(m.clientLogin).toHaveBeenCalledOnce();
  });
});
