import { beforeEach, describe, expect, it, vi } from "vitest";
import { portalLoginCode } from "@/lib/mail/portal-login-code";
const m = vi.hoisted(() => ({ send: vi.fn(), archive: vi.fn(), log: vi.fn(), transport: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: m.transport } }));
vi.mock("@/lib/prisma", () => ({ prisma: { sentEmail: { create: m.archive } } }));
vi.mock("@/lib/logger", () => ({ logger: { info: m.log, warn: m.log, error: m.log } }));
vi.mock("@/lib/mail/delivery-policy", () => ({ liveMailAllowed: () => true }));
vi.mock("@/lib/mail/unsubscribe", () => ({ withSignedUnsubscribe: (tpl: unknown) => tpl }));
vi.stubEnv("MAIL_HOST", "smtp.example.invalid");
import { sendMail } from "@/lib/mail";

beforeEach(() => {
  vi.clearAllMocks(); m.transport.mockReturnValue({ sendMail: m.send }); m.send.mockResolvedValue({ accepted: ["synthetic@example.invalid"] });
});
describe("portal security email", () => {
  it.each(["client", "employee"] as const)("renders purpose-specific %s mail without exposing code in subject", (kind) => {
    const tpl = portalLoginCode(kind, "012345");
    expect(tpl.subject).toContain(`${kind} portal`); expect(tpl.subject).not.toContain("012345");
    expect(tpl.text).toContain("012345"); expect(tpl.text).toContain("10 minutes"); expect(tpl.text).toContain("Never share");
    expect(tpl.html).toContain("0 1 2 3 4 5"); expect(tpl.html).not.toContain("admin session");
  });
  it("does not archive authentication codes or log message content", async () => {
    expect(await sendMail("synthetic@example.invalid", portalLoginCode("client", "012345"), "hello", { sensitive: true })).toBe(true);
    expect(m.archive).not.toHaveBeenCalled();
    expect(JSON.stringify(m.log.mock.calls)).not.toMatch(/012345|synthetic@example/);
    expect(m.transport).toHaveBeenCalledWith(expect.objectContaining({ requireTLS: true, socketTimeout: 20000 }));
  });
  it("requires actual SMTP recipient acceptance", async () => {
    m.send.mockResolvedValue({ accepted: [], rejected: ["synthetic@example.invalid"] });
    expect(await sendMail("synthetic@example.invalid", portalLoginCode("client", "012345"), "hello", { sensitive: true })).toBe(false);
    expect(m.archive).not.toHaveBeenCalled();
  });
});
