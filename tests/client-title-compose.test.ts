import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ user: vi.fn(), find: vi.fn(), render: vi.fn(), send: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { clientUser: { findUnique: m.find } } }));
vi.mock("@/lib/auth", () => ({ requireAdmin: m.user }));
vi.mock("@/lib/permissions", () => ({ requireSection: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn() }));
vi.mock("@/lib/mail", () => ({ renderTemplate: m.render, sendMail: m.send }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { sendTemplatedEmailAction } from "@/app/admin/(protected)/email-templates/actions";
function form() { const f = new FormData(); f.set("to", "james@example.invalid"); f.set("templateKey", "clientWelcome"); f.set("var_name", "Stale sample person"); f.set("var_password", "test-only-password"); return f; }
beforeEach(() => { vi.clearAllMocks(); m.user.mockResolvedValue({ id: "admin", name: "Admin", role: "admin" }); m.find.mockResolvedValue({ name: "James Miller", title: "Mr." }); m.render.mockResolvedValue({ subject: "Test", html: "Test", text: "Test" }); m.send.mockResolvedValue(true); });
it("takes manual client-template names from the registered recipient, not stale samples", async () => {
  await expect(sendTemplatedEmailAction(form())).rejects.toThrow("sent=1");
  expect(m.render).toHaveBeenCalledWith("clientWelcome", expect.objectContaining({ name: "Mr. James Miller" }), undefined);
  expect(m.find).toHaveBeenCalledWith({ where: { email: "james@example.invalid" }, select: { name: true, title: true } });
});
it("checks department authority before looking up the recipient", async () => {
  m.user.mockResolvedValue({ id: "editor", role: "editor", name: "Editor", permissions: ["employees"] });
  await expect(sendTemplatedEmailAction(form())).rejects.toThrow("denied=Client%20email");
  expect(m.find).not.toHaveBeenCalled(); expect(m.send).not.toHaveBeenCalled();
});
