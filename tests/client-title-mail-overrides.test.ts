import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { emailTemplate: { findUnique: m.find } } }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
import { renderTemplate } from "@/lib/mail";

beforeEach(() => vi.clearAllMocks());
it("uses title + first name in existing override greetings and exposes the full record name", async () => {
  m.find.mockResolvedValue({ subject: "For {{fullName}}", body: "Hello {{name}},\n\nGreeting: {{firstName}}\nClient record: {{fullName}}" });
  const tpl = await renderTemplate("clientWelcome", { name: "Mr. James Miller", email: "test@example.invalid", password: "test-password" });
  expect(tpl!.subject).toBe("For Mr. James Miller");
  expect(tpl!.text).toContain("Hello Mr. James,");
  expect(tpl!.text).toContain("Greeting: Mr. James");
  expect(tpl!.text).toContain("Client record: Mr. James Miller");
});
it("derives greetings from the supplied recipient, never stale sample fullName values", async () => {
  m.find.mockResolvedValue({ subject: "Hello {{name}}", body: "Hello {{name}} / {{fullName}}" });
  const tpl = await renderTemplate("clientWelcome", { name: "Dr. James Miller", fullName: "Someone Else" });
  expect(tpl!.subject).toBe("Hello Dr. James"); expect(tpl!.text).toContain("Dr. James Miller"); expect(tpl!.text).not.toContain("Someone Else");
});
it("preserves natural untitled greetings and escapes title-aware override variables", async () => {
  m.find.mockResolvedValue({ subject: "Client", body: "<p>Hello {{name}}, {{fullName}}</p>" });
  const untitled = await renderTemplate("clientPasswordReset", { name: "James Miller" });
  expect(untitled!.html).toContain("Hello James, James Miller");
  const escaped = await renderTemplate("clientPasswordReset", { name: "Mr. <script>James</script> Miller" });
  expect(escaped!.html).toContain("&lt;script&gt;"); expect(escaped!.html).not.toContain("<script>James");
});
