import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ send: vi.fn(), create: vi.fn(), archive: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: m.create } }));
vi.mock("@/lib/prisma", () => ({ prisma: { sentEmail: { create: m.archive } } }));
vi.mock("@/lib/mail/delivery-policy", () => ({ liveMailAllowed: () => true }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/mail/unsubscribe", () => ({ withSignedUnsubscribe: (tpl: unknown) => tpl }));
const tpl = { subject: "Synthetic HR correspondence", html: "Synthetic", text: "Synthetic" };
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); vi.stubEnv("MAIL_HOST", "127.0.0.1"); vi.stubEnv("MAIL_USER", "hello@example.invalid"); vi.stubEnv("MAIL_FROM", "Synthetic Savo <hello@example.invalid>"); vi.stubEnv("MAIL_HR_USER", "hr@example.invalid"); vi.stubEnv("MAIL_HR_PASS", ""); m.create.mockReturnValue({ sendMail: m.send }); m.send.mockResolvedValue({ accepted: ["synthetic@example.invalid"] }); });
afterEach(() => vi.unstubAllEnvs());
it("never silently falls back to hello for interactive HR composition", async () => {
  const { deliverMail } = await import("@/lib/mail");
  expect(await deliverMail("synthetic@example.invalid", tpl, "hr", { requireDepartment: true })).toEqual({ status: "not_sent", reason: "HR_SMTP_NOT_CONFIGURED", retryable: false });
  expect(m.create).not.toHaveBeenCalled(); expect(m.send).not.toHaveBeenCalled(); expect(m.archive).not.toHaveBeenCalled();
});
it("uses the configured HR transport, HR sender, HR reply mailbox and HR sent folder", async () => {
  vi.stubEnv("MAIL_HR_PASS", "synthetic-not-a-real-mailbox-password");
  const { deliverMail } = await import("@/lib/mail");
  expect((await deliverMail("synthetic@example.invalid", tpl, "hr", { requireDepartment: true, requireAcceptance: true })).status).toBe("accepted");
  expect(m.create.mock.calls[0][0].auth.user).toBe("hr@example.invalid");
  expect(m.send.mock.calls[0][0]).toMatchObject({ from: "Savo Technologies <hr@example.invalid>", replyTo: "hr@reply.savotechnologies.com" });
  expect(m.archive.mock.calls[0][0].data.dept).toBe("hr");
});
it("keeps existing legacy automated-HR fallback behavior outside interactive compose", async () => {
  const { deliverMail } = await import("@/lib/mail");
  expect((await deliverMail("synthetic@example.invalid", tpl, "hr")).status).toBe("accepted");
  expect(m.send.mock.calls[0][0].from).toContain("hello@example.invalid");
});
