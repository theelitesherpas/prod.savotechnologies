import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ admin: vi.fn(), section: vi.fn(), invoice: vi.fn(), meeting: vi.fn(), can: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/auth", () => ({ requireAdmin: m.admin, getAdminUser: m.admin }));
vi.mock("@/lib/permissions", () => ({ requireSection: m.section, canAccess: m.can }));
vi.mock("@/lib/invoice-reminders", () => ({ sendManualInvoiceReminder: m.invoice }));
vi.mock("@/lib/meeting/reminders", () => ({ sendManualMeetingReminder: m.meeting }));
vi.mock("@/lib/project-service", () => ({ revalidateProjectViews: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: m.audit }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
import { sendInvoiceReminderAction } from "@/app/admin/(protected)/invoices/actions";
import { PUT } from "@/app/api/admin/meetings/[id]/route";
const revision = "2026-11-10T00:00:00.000Z";
function invoiceForm() { const form = new FormData(); form.set("id", "synthetic-invoice-id"); form.set("revision", revision); return form; }
function meetingRequest(data: object = { action: "remind", revision }) { return new Request("http://localhost/api/admin/meetings/synthetic-meeting", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
const params = { params: Promise.resolve({ id: "synthetic-meeting" }) };
beforeEach(() => { vi.clearAllMocks(); m.admin.mockResolvedValue({ id: "admin", name: "Synthetic Admin", role: "admin" }); m.section.mockResolvedValue(undefined); m.can.mockReturnValue(true); m.invoice.mockResolvedValue({ ok: true, message: "Accepted", deliveryId: "delivery" }); m.meeting.mockResolvedValue({ ok: true, message: "Accepted" }); });
it("guards invoice reminders with the existing client-section authority and current revision", async () => { expect(await sendInvoiceReminderAction(invoiceForm())).toMatchObject({ ok: true }); expect(m.section).toHaveBeenCalledWith("clients"); expect(m.invoice).toHaveBeenCalledWith("synthetic-invoice-id", revision, "Synthetic Admin"); expect(m.audit).toHaveBeenCalledWith("admin", "invoice.reminder_sent", "Invoice", "synthetic-invoice-id", { deliveryId: "delivery" }); });
it("does not send invoice reminders on denied access or forged form input", async () => { m.section.mockRejectedValueOnce(new Error("DENIED")); await expect(sendInvoiceReminderAction(invoiceForm())).rejects.toThrow("DENIED"); expect(m.invoice).not.toHaveBeenCalled(); const form = invoiceForm(); form.set("revision", "forged"); expect((await sendInvoiceReminderAction(form)).ok).toBe(false); expect(m.invoice).not.toHaveBeenCalled(); });
it("does not audit an invoice reminder as sent if delivery failed", async () => { m.invoice.mockResolvedValue({ ok: false, message: "Delivery failed" }); expect((await sendInvoiceReminderAction(invoiceForm())).ok).toBe(false); expect(m.audit).not.toHaveBeenCalled(); });
it("requires authentication and client permissions for meeting reminders", async () => { m.admin.mockResolvedValueOnce(null); expect((await PUT(meetingRequest(), params)).status).toBe(401); m.can.mockReturnValue(false); expect((await PUT(meetingRequest(), params)).status).toBe(403); expect(m.meeting).not.toHaveBeenCalled(); });
it("awaits and reports actual meeting reminder results, with no optimistic sent claim", async () => { const good = await PUT(meetingRequest(), params); expect(good.status).toBe(200); expect(await good.json()).toMatchObject({ message: "Accepted" }); expect(m.meeting).toHaveBeenCalledWith("synthetic-meeting", revision, "Synthetic Admin"); m.meeting.mockResolvedValue({ ok: false, message: "Cooldown" }); const bad = await PUT(meetingRequest(), params); expect(bad.status).toBe(409); expect(await bad.json()).toMatchObject({ error: "Cooldown" }); });
it("requires a valid meeting revision", async () => { expect((await PUT(meetingRequest({ action: "remind" }), params)).status).toBe(400); expect(m.meeting).not.toHaveBeenCalled(); });
