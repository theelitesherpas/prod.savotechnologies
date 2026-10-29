/** Opt-in LOCAL PostgreSQL integration, fake mail transport only.
 * Run through scripts/verify-reminders.mjs, which provisions a disposable DB.
 * Direct opt-in also requires a generated disposable reminder database name.
 */
import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ db: null as PrismaClient | null, deliver: vi.fn(), render: vi.fn(), live: true }));
vi.mock("@/lib/prisma", async () => { const { PrismaClient } = await import("@prisma/client"); m.db = new PrismaClient(); return { prisma: m.db }; });
vi.mock("@/lib/mail", () => ({ deliverMail: m.deliver, renderTemplate: m.render, sendMailNow: vi.fn() }));
vi.mock("@/lib/mail/delivery-policy", () => ({ liveMailAllowed: () => m.live }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
import { runInvoiceReminders, sendManualInvoiceReminder } from "@/lib/invoice-reminders";
import { sendManualMeetingReminder } from "@/lib/meeting/reminders";
import { templateEntry } from "@/lib/mail/registry";
import * as delivery from "@/lib/reminder-delivery";

const enabled = process.env.REMINDER_DB_TESTS === "1";
const now = new Date("2026-11-10T03:30:00Z");
const tag = `reminder-test-${randomBytes(7).toString("hex")}`;
let clientId = "", sequence = 0;
const db = () => m.db!;
const ledger = () => db().reminderDelivery.findMany({ where: { OR: [{ invoice: { clientId } }, { meeting: { clientId } }] } });
async function invoice(data: object = {}) {
  return db().invoice.create({ data: { clientId, number: `${tag}-${++sequence}`, amount: 250000, currency: "INR", status: "sent", issuedAt: new Date("2026-10-01"), dueDate: new Date("2026-11-10"), ...data } });
}
async function meeting(data: object = {}) {
  const token = randomBytes(32).toString("base64url");
  return db().meeting.create({ data: { clientId, reference: `${tag}-${++sequence}`, clientName: "James Miller", clientEmail: `${tag}@example.invalid`, title: "Synthetic reminder meeting", tokenPlain: token, tokenHash: createHash("sha256").update(token).digest("hex"), createdBy: "synthetic-local-review", status: "awaiting_client", expiresAt: new Date("2026-12-01"), ...data } });
}

describe.skipIf(!enabled)("durable reminders against local PostgreSQL", () => {
  beforeAll(async () => {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL!).hostname)) throw new Error("Local database only");
    if (!/^savo_reminders_(verify|test)_[a-f0-9]{12}$/.test(decodeURIComponent(new URL(process.env.DATABASE_URL!).pathname.slice(1)))) throw new Error("Disposable reminder test database only. Run scripts/verify-reminders.mjs.");
    if (process.env.MAIL_DELIVERY_MODE === "live") throw new Error("Live mail forbidden in local integration tests");
    clientId = (await db().clientUser.create({ data: { name: "James Miller", title: "Mr.", email: `${tag}@example.invalid`, passwordHash: "synthetic-not-a-login-password" } })).id;
  });
  beforeEach(async () => {
    vi.clearAllMocks(); vi.stubEnv("INVOICE_REMINDERS_ENABLED", "true"); m.live = true;
    m.deliver.mockResolvedValue({ status: "accepted" });
    m.render.mockImplementation(async (key: string, vars: Record<string, string>) => templateEntry(key)!.default(vars));
    await db().clientUser.update({ where: { id: clientId }, data: { active: true } });
  });
  afterEach(async () => { await db().invoice.deleteMany({ where: { clientId } }); await db().meeting.deleteMany({ where: { clientId } }); vi.unstubAllEnvs(); });
  afterAll(async () => { if (clientId) await db().clientUser.deleteMany({ where: { id: clientId } }); await db().$disconnect(); });

  it("sends exactly three stages for the due date, without changing invoice status", async () => {
    const i = await invoice();
    for (const date of ["2026-11-09", "2026-11-10", "2026-11-11"]) {
      const time = new Date(`${date}T03:30:00Z`);
      expect((await runInvoiceReminders({ apply: true, now: time })).sent).toBe(1);
      expect((await runInvoiceReminders({ apply: true, now: time })).sent).toBe(0);
    }
    expect((await runInvoiceReminders({ apply: true, now: new Date("2026-11-12T03:30:00Z") })).sent).toBe(0);
    expect(m.deliver).toHaveBeenCalledTimes(3);
    expect((await ledger()).map(r => r.kind).sort()).toEqual(["invoice_before_due", "invoice_due_today", "invoice_overdue"].sort());
    expect((await db().invoice.findUnique({ where: { id: i.id } }))!.status).toBe("sent");
    for (const args of m.deliver.mock.calls) { expect(args[0]).toBe(`${tag}@example.invalid`); expect(args[1].text).toContain("Hello Mr. James,"); expect(args[3]).toMatchObject({ requireAcceptance: true }); }
  });
  it("deduplicates racing workers using actual row locks and unique ledger keys", async () => {
    await invoice({ dueDate: new Date("2026-11-09") }); await invoice(); await invoice({ dueDate: new Date("2026-11-11") });
    const reports = await Promise.all([runInvoiceReminders({ apply: true, now }), runInvoiceReminders({ apply: true, now })]);
    expect(reports.reduce((n, r) => n + r.sent, 0)).toBe(3); expect(m.deliver).toHaveBeenCalledTimes(3);
    expect((await ledger()).every(r => r.status === "sent" && r.attempts === 1)).toBe(true);
  });
  it("excludes paid/cancelled/draft/zero/no-date/future-issued/old-overdue invoices and confirmed payment history", async () => {
    for (const status of ["paid", "cancelled", "draft"]) await invoice({ status });
    await invoice({ amount: 0 }); await invoice({ dueDate: null }); await invoice({ paidAt: now });
    await invoice({ dueDate: new Date("2026-11-08") }); await invoice({ issuedAt: new Date("2026-11-11") });
    const paid = await invoice();
    await db().paymentTransaction.create({ data: { recordKey: `${tag}-${paid.id}`, clientId, invoiceId: paid.id, invoiceNumber: paid.number, amount: paid.amount, currency: paid.currency, source: "legacy" } });
    expect((await runInvoiceReminders({ apply: true, now })).sent).toBe(0); expect(m.deliver).not.toHaveBeenCalled();
  });
  it("does not emit a second automatic nudge on the same day after a due-date edit", async () => {
    const i = await invoice();
    await runInvoiceReminders({ apply: true, now });
    await db().invoice.update({ where: { id: i.id }, data: { dueDate: new Date("2026-11-11") } });
    expect((await runInvoiceReminders({ apply: true, now })).sent).toBe(0);
    expect(m.deliver).toHaveBeenCalledTimes(1);
    expect((await ledger()).find(r => r.kind === "invoice_before_due")!.errorCode).toBe("REMINDER_ALREADY_SENT_TODAY");
  });
  it("quarantines a worker's abandoned in-flight claim instead of replaying it", async () => {
    const i = await invoice();
    await db().reminderDelivery.create({ data: { invoiceId: i.id, dedupeKey: `${i.id}:2026-11-10:invoice_due_today`, kind: "invoice_due_today", dueOn: "2026-11-10", scheduledOn: "2026-11-10", status: "sending", attempts: 1, claimedAt: new Date(now.getTime() - 16 * 60_000), claimToken: "synthetic", messageId: `<${tag}-${i.id}@example.invalid>` } });
    expect((await runInvoiceReminders({ apply: true, now })).sent).toBe(0);
    expect(m.deliver).not.toHaveBeenCalled(); expect((await ledger())[0].status).toBe("uncertain");
  });
  it("does not email inactive clients", async () => {
    await invoice(); await db().clientUser.update({ where: { id: clientId }, data: { active: false } });
    expect((await runInvoiceReminders({ apply: true, now })).sent).toBe(0);
  });
  it("gates delivery before 9 AM, in disabled previews, and supports read-only dry-run", async () => {
    await invoice();
    expect((await runInvoiceReminders({ apply: true, now: new Date("2026-11-10T03:29:59Z") })).status).toBe("before_send_hour");
    m.live = false; expect((await runInvoiceReminders({ apply: true, now })).status).toBe("disabled");
    expect((await runInvoiceReminders({ now })).eligible).toBe(1);
    expect(await ledger()).toHaveLength(0); expect(m.deliver).not.toHaveBeenCalled();
  });
  it("rechecks payment/recipient changes after template rendering", async () => {
    const i = await invoice();
    m.render.mockImplementationOnce(async () => { await db().invoice.update({ where: { id: i.id }, data: { status: "paid", paidAt: now } }); return { subject: "Test", html: "Test", text: "Test" }; });
    expect((await runInvoiceReminders({ apply: true, now })).sent).toBe(0); expect(m.deliver).not.toHaveBeenCalled(); expect((await ledger())[0].status).toBe("skipped");
  });
  it("retries explicit temporary rejection at most three times and never before cooldown", async () => {
    await invoice(); m.deliver.mockResolvedValue({ status: "not_sent", retryable: true, reason: "SMTP_REJECTED" });
    await runInvoiceReminders({ apply: true, now }); await runInvoiceReminders({ apply: true, now }); expect(m.deliver).toHaveBeenCalledTimes(1);
    await runInvoiceReminders({ apply: true, now: new Date(now.getTime() + 3600_000) });
    await runInvoiceReminders({ apply: true, now: new Date(now.getTime() + 7200_000) });
    await runInvoiceReminders({ apply: true, now: new Date(now.getTime() + 10800_000) });
    expect(m.deliver).toHaveBeenCalledTimes(3); expect((await ledger())[0]).toMatchObject({ attempts: 3, status: "failed" });
  });
  it("quarantines ambiguous SMTP outcomes without automatic replay", async () => {
    const i = await invoice(); m.deliver.mockResolvedValue({ status: "uncertain", reason: "SMTP_CONFIRMATION_UNKNOWN" });
    await runInvoiceReminders({ apply: true, now }); await runInvoiceReminders({ apply: true, now: new Date(now.getTime() + 3600_000) });
    expect(m.deliver).toHaveBeenCalledTimes(1); expect((await ledger())[0].status).toBe("uncertain");
    expect((await sendManualInvoiceReminder(i.id, i.updatedAt.toISOString(), "Test Admin", now)).ok).toBe(false);
  });
  it("expires yesterday's retry rather than catching it up alongside today's stage", async () => {
    await invoice(); m.deliver.mockResolvedValueOnce({ status: "not_sent", retryable: true, reason: "SMTP_REJECTED" });
    await runInvoiceReminders({ apply: true, now: new Date("2026-11-09T03:30:00Z") });
    await runInvoiceReminders({ apply: true, now });
    expect((await ledger()).find(r => r.kind === "invoice_before_due")!.status).toBe("skipped");
    expect((await ledger()).find(r => r.kind === "invoice_due_today")!.status).toBe("sent");
  });
  it("supports a manual invoice reminder, blocks double-clicks, and suppresses today's automatic duplicate", async () => {
    const i = await invoice();
    const results = await Promise.all([sendManualInvoiceReminder(i.id, i.updatedAt.toISOString(), "Test Admin", now), sendManualInvoiceReminder(i.id, i.updatedAt.toISOString(), "Test Admin", now)]);
    expect(results.filter(r => r.ok)).toHaveLength(1); expect(m.deliver).toHaveBeenCalledTimes(1);
    expect((await runInvoiceReminders({ apply: true, now })).sent).toBe(0); expect(m.deliver).toHaveBeenCalledTimes(1);
    expect((await db().invoice.findUnique({ where: { id: i.id } }))!.updatedAt).toEqual(i.updatedAt);
  });
  it("does not race a scheduled reminder against an in-flight manual SMTP send", async () => {
    const i = await invoice();
    let release!: () => void;
    m.deliver.mockImplementationOnce(() => new Promise(resolve => { release = () => resolve({ status: "accepted" }); }));
    const manual = sendManualInvoiceReminder(i.id, i.updatedAt.toISOString(), "Admin", now);
    try {
      await vi.waitFor(() => expect(m.deliver).toHaveBeenCalledTimes(1));
      expect((await runInvoiceReminders({ apply: true, now })).sent).toBe(0);
      expect(m.deliver).toHaveBeenCalledTimes(1);
    } finally { release?.(); await manual; }
    expect((await runInvoiceReminders({ apply: true, now })).sent).toBe(0);
  });
  it("fails closed when an invoice changes between the initial revision check and claim", async () => {
    const i = await invoice();
    const original = delivery.claimReminder;
    const spy = vi.spyOn(delivery, "claimReminder").mockImplementationOnce(async (...args) => {
      await db().invoice.update({ where: { id: i.id }, data: { amount: i.amount + 100, updatedAt: new Date(i.updatedAt.getTime() + 1000) } });
      return original(...args);
    });
    try {
      expect((await sendManualInvoiceReminder(i.id, i.updatedAt.toISOString(), "Admin", now)).ok).toBe(false);
      expect(m.deliver).not.toHaveBeenCalled(); expect((await ledger())[0].status).toBe("skipped");
    } finally { spy.mockRestore(); }
  });
  it("requires a current invoice revision and permits a manual invoice without a due date", async () => {
    const i = await invoice({ dueDate: null });
    expect((await sendManualInvoiceReminder(i.id, "stale", "Admin", now)).ok).toBe(false);
    expect((await sendManualInvoiceReminder(i.id, i.updatedAt.toISOString(), "Admin", now)).ok).toBe(true);
    expect(m.deliver.mock.calls[0][1].text).toContain("Not specified");
  });
  it("sends meeting reminders without confirming/rescheduling or rotating the invitation", async () => {
    const m1 = await meeting();
    const result = await sendManualMeetingReminder(m1.id, m1.updatedAt.toISOString(), "Test Admin", now);
    expect(result.ok).toBe(true); expect(m.deliver.mock.calls[0][1].text).toContain("Hello Mr. James,");
    expect((await sendManualMeetingReminder(m1.id, m1.updatedAt.toISOString(), "Test Admin", now)).ok).toBe(false);
    const saved = await db().meeting.findUnique({ where: { id: m1.id } });
    expect(saved!.status).toBe(m1.status); expect(saved!.tokenHash).toBe(m1.tokenHash); expect(saved!.updatedAt).toEqual(m1.updatedAt);
    expect(await db().meetingActivity.count({ where: { meetingId: m1.id, type: "reminder_email_sent" } })).toBe(1);
  });
  it("uses the newly requested date rather than an old confirmation during rescheduling", async () => {
    const row = await meeting({ status: "availability_received", confirmedDate: "2026-11-09", confirmedTime: "10:00", preferredDate: "2026-11-12", preferredTime: "14:00" });
    expect((await sendManualMeetingReminder(row.id, row.updatedAt.toISOString(), "Admin", now)).ok).toBe(true);
    expect(m.deliver.mock.calls[0][1].text).toContain("12 Nov 2026");
    expect(m.deliver.mock.calls[0][1].text).toContain("not a booking confirmation");
  });
  it("rejects completed/cancelled/draft/expired/past meetings and stale revisions", async () => {
    for (const status of ["completed", "cancelled", "draft", "trash"]) { const row = await meeting({ status }); expect((await sendManualMeetingReminder(row.id, row.updatedAt.toISOString(), "Admin", now)).ok).toBe(false); }
    for (const change of [{ expiresAt: new Date(now.getTime() - 1) }, { status: "confirmed", confirmedDate: "2026-11-09", confirmedTime: "10:00" }, { clientEmail: null }]) {
      const row = await meeting(change); expect((await sendManualMeetingReminder(row.id, row.updatedAt.toISOString(), "Admin", now)).ok).toBe(false);
    }
    const valid = await meeting(); expect((await sendManualMeetingReminder(valid.id, "stale", "Admin", now)).ok).toBe(false);
    expect(m.deliver).not.toHaveBeenCalled();
  });
});
