import { describe, expect, it } from "vitest";
import { invoiceReminderStage, reminderClock, shiftInvoiceDay } from "@/lib/reminder-policy";
import { classifyMailFailure } from "@/lib/mail/delivery-result";
import { invoiceReminder, meetingReminder } from "@/lib/mail/reminder-templates";

describe("invoice reminder calendar policy", () => {
  it.each([["2026-11-09", "invoice_before_due"], ["2026-11-10", "invoice_due_today"], ["2026-11-11", "invoice_overdue"]])("due 10 November / %s uses %s", (today, kind) => {
    expect(invoiceReminderStage(new Date("2026-11-10T00:00:00Z"), today)).toEqual({ dueOn: "2026-11-10", scheduledOn: today, kind });
  });
  it.each(["2026-11-08", "2026-11-12", "2027-11-10"])("does not backfill or repeat overdue stages on %s", today => expect(invoiceReminderStage(new Date("2026-11-10"), today)).toBeNull());
  it("handles absent/invalid dates and month/year/leap boundaries", () => {
    expect(invoiceReminderStage(null, "2026-11-10")).toBeNull(); expect(invoiceReminderStage(new Date("invalid"), "2026-11-10")).toBeNull();
    expect(shiftInvoiceDay("2028-03-01", -1)).toBe("2028-02-29"); expect(shiftInvoiceDay("2027-01-01", -1)).toBe("2026-12-31");
    expect(invoiceReminderStage(new Date("2027-01-01"), "2026-12-31")?.kind).toBe("invoice_before_due");
  });
  it("uses India business time at both the 9AM and midnight boundaries", () => {
    expect(reminderClock(new Date("2026-11-10T03:29:59Z"))).toEqual({ today: "2026-11-10", hour: 8 });
    expect(reminderClock(new Date("2026-11-10T03:30:00Z"))).toEqual({ today: "2026-11-10", hour: 9 });
    expect(reminderClock(new Date("2026-11-09T18:30:00Z"))).toEqual({ today: "2026-11-10", hour: 0 });
  });
});

describe("SMTP outcomes and retry safety", () => {
  it("only retries conclusive non-acceptance, never a lost DATA acknowledgement", () => {
    expect(classifyMailFailure({ command: "DATA", code: "ETIMEDOUT" })).toMatchObject({ status: "uncertain" });
    expect(classifyMailFailure(new Error("private SMTP details"))).toMatchObject({ status: "uncertain" });
    expect(classifyMailFailure({ command: "DATA", responseCode: 451 })).toMatchObject({ status: "not_sent", retryable: true });
    expect(classifyMailFailure({ command: "DATA", responseCode: 550 })).toMatchObject({ status: "not_sent", retryable: false });
    expect(classifyMailFailure({ command: "CONN", code: "ECONNECTION" })).toMatchObject({ status: "uncertain" });
    expect(classifyMailFailure({ command: "DATA", code: "ECONNECTION" })).toMatchObject({ status: "uncertain" });
    expect(classifyMailFailure({ command: "QUIT", responseCode: 421 })).toMatchObject({ status: "uncertain" });
    expect(classifyMailFailure({ command: "CONN", code: "ESOCKET", errno: "ECONNREFUSED" })).toMatchObject({ status: "not_sent", retryable: true });
    expect(classifyMailFailure({ code: "EAUTH" })).toMatchObject({ status: "not_sent", retryable: false });
  });
});

describe("client reminder correspondence", () => {
  it.each(["invoice_before_due", "invoice_due_today", "invoice_overdue", "invoice_manual"] as const)("%s preserves name, money, dates and safe payment navigation", kind => {
    const tpl = invoiceReminder({ kind, name: "Mr. James Miller", number: "TEST-100", amount: 12345, currency: "USD", dueDate: new Date("2026-11-10"), status: "sent", paymentLink: "https://evil.invalid/pay" });
    expect(tpl.html).toContain("Hello Mr. James,"); expect(tpl.text).toMatch(/USD\s+123\.45/); expect(tpl.text).toContain("10 Nov 2026");
    expect(tpl.html).not.toContain("evil.invalid"); expect(tpl.text).toContain("No additional fee");
    expect(tpl.subject).toContain("TEST-100");
  });
  it("uses real hosted links only for payable invoices and handles a missing due date honestly", () => {
    const base = { kind: "invoice_manual" as const, name: "James Miller", number: "TEST-100", amount: 10000, currency: "INR", dueDate: null, status: "sent", paymentLink: "https://rzp.io/i/example" };
    expect(invoiceReminder(base).text).toContain("https://rzp.io/i/example"); expect(invoiceReminder(base).text).toContain("Not specified");
    expect(invoiceReminder({ ...base, status: "paid" }).html).not.toContain('href="https://rzp.io');
  });
  it("does not describe an unconfirmed meeting as confirmed and keeps the titled first name", () => {
    const base = { name: "Dr. James Miller", title: "Discussion", reference: "TEST-M", status: "availability_received", date: "10 Nov 2026", time: "10:00 AM", durationMin: 30, location: "Online", link: "https://example.invalid/meeting" };
    expect(meetingReminder(base).text).toContain("Hello Dr. James,"); expect(meetingReminder(base).text).toContain("not a booking confirmation");
    expect(meetingReminder({ ...base, status: "confirmed" }).text).toContain("confirmed meeting");
    expect(meetingReminder({ ...base, status: "awaiting_client", date: null, time: null }).text).toContain("choose a suitable date");
  });
});
