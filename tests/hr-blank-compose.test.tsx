import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const m = vi.hoisted(() => ({ user: vi.fn(), send: vi.fn(), render: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/auth", () => ({ requireAdmin: m.user }));
vi.mock("@/lib/permissions", () => ({ requireSection: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: m.audit }));
vi.mock("@/lib/mail", () => ({ sendMail: m.send, renderTemplate: m.render }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { sendCustomEmailAction, sendTemplatedEmailAction } from "@/app/admin/(protected)/email-templates/actions";
import { ComposeForm } from "@/components/admin/compose-form";
function form(dept = "hr") { const f = new FormData(); for (const [k, v] of Object.entries({ dept, to: "synthetic@example.invalid", subject: "Synthetic HR correspondence", body: "Hello,\n\nA synthetic HR message.", back: `/admin/email-compose?dept=${dept}&mode=blank` })) f.set(k, v); return f; }
async function result(action: () => Promise<void>) { try { await action(); throw Error("Missing redirect"); } catch (e) { const value = (e as Error).message; expect(value).toMatch(/^REDIRECT:/); return new URL(value.slice("REDIRECT:".length), "https://example.invalid"); } }
beforeEach(() => { vi.clearAllMocks(); m.user.mockResolvedValue({ id: "synthetic-admin", name: "Synthetic Admin", role: "admin", permissions: [] }); m.send.mockResolvedValue(true); m.render.mockResolvedValue({ subject: "Template", html: "Template", text: "Template" }); });

describe("department-scoped compose interface", () => {
  it.each(["hr", "hello"] as const)("offers both template and blank modes for %s", dept => {
    const html = renderToStaticMarkup(<ComposeForm clients={[]} employees={[]} dept={dept} />);
    expect(html).toContain("From template"); expect(html).toContain("Blank email"); expect(html).toContain(`Send via ${dept}@`);
  });
  it.each(["hr", "hello"] as const)("posts and labels the correct %s mailbox in blank mode", dept => {
    const html = renderToStaticMarkup(<ComposeForm clients={[]} employees={[]} dept={dept} initialMode="blank" />);
    expect(html).toContain(`name="dept" value="${dept}"`); expect(html).toContain(`dept=${dept}&amp;mode=blank`);
    for (const name of ["to", "subject", "body"]) expect(html).toContain(`name="${name}"`);
    expect(html).toContain(`Send via ${dept}@`); expect(html).toContain(`Sends from ${dept}@savotechnologies.com.`);
    expect(html).not.toContain('id="compose-template"');
  });
});

describe("HR custom send authorization, branding and return context", () => {
  it.each(["admin", "editor"])("lets an authorized %s send blank HR correspondence", async role => {
    m.user.mockResolvedValue({ id: "hr-user", name: "HR User", role, permissions: ["employees"] });
    const url = await result(() => sendCustomEmailAction(form()));
    expect(url.searchParams.get("dept")).toBe("hr"); expect(url.searchParams.get("mode")).toBe("blank"); expect(url.searchParams.get("sent")).toBe("1");
    expect(m.send).toHaveBeenCalledWith("synthetic@example.invalid", expect.objectContaining({ subject: "Synthetic HR correspondence", html: expect.stringContaining("People &amp; careers") }), "hr", expect.objectContaining({ requireDepartment: true, requireAcceptance: true }));
    expect(m.audit).toHaveBeenCalledWith("hr-user", "email.customSent", "Email", "synthetic@example.invalid", expect.objectContaining({ dept: "hr" }));
  });
  it.each([["hr", ["clients"]], ["hello", ["employees"]], ["hr", []]])("rejects forged %s sends from an editor with %j", async (dept, permissions) => {
    m.user.mockResolvedValue({ id: "editor", name: "Editor", role: "editor", permissions });
    expect((await result(() => sendCustomEmailAction(form(String(dept))))).searchParams.has("denied")).toBe(true); expect(m.send).not.toHaveBeenCalled();
  });
  it("rejects an invalid explicit department instead of defaulting to hello", async () => {
    await result(() => sendCustomEmailAction(form("finance"))); expect(m.send).not.toHaveBeenCalled();
  });
  it.each([false, true])("retains existing query parameters on SMTP result %s", async ok => {
    m.send.mockResolvedValue(ok); const f = form(); f.set("back", "/admin/email-compose?dept=hr&mode=blank&sent=old&e=old");
    const url = await result(() => sendCustomEmailAction(f));
    expect(url.searchParams.get("dept")).toBe("hr"); expect(url.searchParams.get("mode")).toBe("blank");
    expect(url.searchParams.has("e")).toBe(!ok); expect(url.searchParams.has("sent")).toBe(ok);
  });
  it("preserves the HR blank context on validation errors", async () => {
    const f = form(); f.set("subject", "x"); const url = await result(() => sendCustomEmailAction(f));
    expect(url.searchParams.get("dept")).toBe("hr"); expect(url.searchParams.get("mode")).toBe("blank"); expect(url.searchParams.has("e")).toBe(true); expect(m.send).not.toHaveBeenCalled();
  });
  it.each(["https://evil.invalid", "//evil.invalid", "/administrator", "/admin/../../elsewhere", "/admin\\evil", "/admin\r\nlocation: bad"])("rejects unsafe return target %j", async back => {
    const f = form(); f.set("back", back); const url = await result(() => sendCustomEmailAction(f));
    expect(url.pathname).toBe("/admin/email-compose"); expect(url.searchParams.get("dept")).toBe("hr"); expect(url.searchParams.get("mode")).toBe("blank");
  });
  it("retains the existing mailbox reply return path", async () => {
    const f = form(); f.set("back", "/admin/emails?folder=inbox"); const url = await result(() => sendCustomEmailAction(f));
    expect(url.pathname).toBe("/admin/emails"); expect(url.searchParams.get("folder")).toBe("inbox");
  });
  it("keeps HR template sends in template mode and routes by registry, not forged dept", async () => {
    const f = form("hello"); f.set("templateKey", "applicationAck"); f.delete("back");
    const url = await result(() => sendTemplatedEmailAction(f));
    expect(url.searchParams.get("dept")).toBe("hr"); expect(url.searchParams.get("mode")).toBe("template");
    expect(m.send.mock.calls[0][2]).toBe("hr");
  });
});
