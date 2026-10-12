import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@/lib/mail", () => ({ sendMailNow: mocks.send }));
vi.mock("@/lib/prisma", () => ({ prisma: null }));
vi.mock("@/lib/auth", () => ({ verifyPassword: vi.fn() }));
import { notifyEmailChanged } from "@/lib/admin-account";

beforeEach(() => mocks.send.mockReset());
describe("separately authored account notifications", () => {
  it("uses the shared shell for both addresses without changing recipients or plain-text copy", () => {
    notifyEmailChanged("A & B <script>", "old@example.invalid", "new@example.invalid");
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.send.mock.calls.map(call => call[0])).toEqual(["old@example.invalid", "new@example.invalid"]);
    for (const [, mail] of mocks.send.mock.calls) {
      expect(mail.subject).toBe("Your Savo admin sign-in email was changed");
      expect(mail.html).toContain("Savo v7 correspondence");
      expect(mail.html).toContain("A &amp; B &lt;script&gt;");
      expect(mail.html).not.toContain("<script>");
      expect(mail.text).toContain("If this wasn't expected, contact your administrator immediately.");
    }
  });
});
