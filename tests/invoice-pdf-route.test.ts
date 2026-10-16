import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ user: vi.fn(), find: vi.fn(), render: vi.fn(), limit: vi.fn() }));
vi.mock("@/lib/client-auth", () => ({ getClientUser: m.user }));
vi.mock("@/lib/prisma", () => ({ prisma: { invoice: { findFirst: m.find } } }));
vi.mock("@/lib/invoice-pdf", () => ({ renderInvoicePdf: m.render }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: m.limit }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
import { GET } from "@/app/portal/(app)/invoices/[id]/pdf/route";

const client = { id: "client-123456", name: "Test Client", company: "Example", email: "test@example.invalid" };
const record = { number: "INV-2026-001", amount: 250050, currency: "INR", status: "sent", notes: "Example", issuedAt: new Date("2026-10-10"), dueDate: null, paidAt: null, project: null };
const get = (query = "", id = "invoice-123456") => GET(new Request(`https://example.invalid/portal/invoices/${id}/pdf${query}`), { params: Promise.resolve({ id }) });
beforeEach(() => {
  vi.resetAllMocks(); m.user.mockResolvedValue(client); m.find.mockResolvedValue(record);
  m.limit.mockReturnValue({ ok: true }); m.render.mockResolvedValue(new TextEncoder().encode("%PDF-1.7\nexample"));
});
describe("private client invoice PDF endpoint", () => {
  it("rejects unauthenticated requests before querying or rendering", async () => {
    m.user.mockResolvedValue(null); const res = await get();
    expect(res.status).toBe(401); expect(m.find).not.toHaveBeenCalled(); expect(m.render).not.toHaveBeenCalled();
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
  it("scopes both the invoice and project to the current client and excludes drafts", async () => {
    await get(); const query = m.find.mock.calls[0][0];
    expect(query.where).toEqual({ id: "invoice-123456", clientId: client.id, status: { in: ["sent", "paid", "overdue", "cancelled"] } });
    expect(query.select.project).toEqual({ where: { clientId: client.id }, select: { code: true, title: true } });
    expect(query.select).not.toHaveProperty("client");
  });
  it.each(["other client's invoice", "draft", "unknown invoice"])("returns the same private 404 for %s", async () => {
    m.find.mockResolvedValue(null); const res = await get();
    expect(res.status).toBe(404); expect(await res.json()).toEqual({ error: "Invoice not found." });
    expect(m.render).not.toHaveBeenCalled(); expect(res.headers.get("cache-control")).toContain("no-store");
  });
  it.each(["sent", "paid", "overdue", "cancelled"])("downloads %s records with financial values and status unchanged", async status => {
    m.find.mockResolvedValue({ ...record, status }); const res = await get();
    expect(res.status).toBe(200); expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="Savo-Invoice-INV-2026-001.pdf"');
    expect(res.headers.get("cache-control")).toContain("private, no-store");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-robots-tag")).toContain("noindex");
    expect(m.render).toHaveBeenCalledWith({ ...record, status, client: { name: client.name, email: client.email, company: client.company, businessId: null } });
    expect(new TextDecoder().decode(await res.arrayBuffer())).toMatch(/^%PDF-/);
  });
  it("opens the identical PDF inline for native viewing and printing", async () => {
    const res = await get("?view=1"); expect(res.headers.get("content-disposition")).toMatch(/^inline;/);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });
  it("uses a header-safe filename even for unusual stored numbers", async () => {
    m.find.mockResolvedValue({ ...record, number: '../evil\r\nX-Injected: yes"' }); const res = await get();
    expect(res.status).toBe(200); expect(res.headers.get("content-disposition")).not.toMatch(/[\r\n]/);
    expect(res.headers.get("x-injected")).toBe(null);
  });
  it("rejects malformed IDs without querying the database", async () => {
    const res = await get("", "../bad"); expect(res.status).toBe(404); expect(m.find).not.toHaveBeenCalled();
  });
  it("bounds repeated generation and provides recovery instead of changing invoices", async () => {
    m.limit.mockReturnValue({ ok: false }); const res = await get(); expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("60"); expect(m.find).not.toHaveBeenCalled();
  });
  it("does not expose storage or renderer exceptions", async () => {
    m.render.mockRejectedValue(new Error("secret backend connection details")); const res = await get();
    expect(res.status).toBe(503); expect(await res.text()).not.toContain("secret");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});
