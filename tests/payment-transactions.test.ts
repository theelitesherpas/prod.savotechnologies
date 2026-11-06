import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Invoice, Prisma } from "@prisma/client";
import { recordPaymentTransaction } from "@/lib/payment-transactions";
import { transactionFilters, transactionWhere, transactionPageHref, transactionMethod } from "@/lib/transaction-history";

const history = { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() };
const project = { findFirst: vi.fn() };
const tx = { paymentTransaction: history, clientProject: project } as unknown as Prisma.TransactionClient;
const invoice = { id: "invoice-1", clientId: "client-1", number: "STPLIN05151", projectId: "project-1", amount: 100000, currency: "INR", paidAt: new Date("2026-10-20T10:00:00Z") } as Invoice;
beforeEach(() => { vi.resetAllMocks(); history.findUnique.mockResolvedValue(null); history.findFirst.mockResolvedValue(null); project.findFirst.mockResolvedValue({ title: "Website delivery" }); });

describe("confirmed payment history", () => {
  it("snapshots manual confirmations without inventing bank method or online fees", async () => {
    await recordPaymentTransaction(tx, invoice);
    expect(history.create).toHaveBeenCalledWith({ data: expect.objectContaining({ recordKey: "invoice:invoice-1", clientId: "client-1", invoiceNumber: "STPLIN05151", amount: 100000, currency: "INR", occurredAt: invoice.paidAt, projectTitle: "Website delivery", paymentId: null, source: "manual" }) });
    expect(history.create.mock.calls[0][0].data).not.toHaveProperty("chargedAmount");
    expect(history.create.mock.calls[0][0].data).not.toHaveProperty("method");
    expect(project.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "project-1", clientId: "client-1" } }));
  });
  it("records actual verified provider totals and method, including fee", async () => {
    await recordPaymentTransaction(tx, invoice, { paymentId: "pay_A", chargedAmount: 102360, method: "upi" }, "razorpay");
    expect(history.create).toHaveBeenCalledWith({ data: expect.objectContaining({ recordKey: "payment:pay_A", paymentId: "pay_A", chargedAmount: 102360, method: "upi", amount: 100000, source: "razorpay" }) });
  });
  it("enriches a retry without changing existing money, owner, invoice, or date snapshots", async () => {
    history.findUnique.mockResolvedValue({ id: "history-1", clientId: invoice.clientId, invoiceId: invoice.id, chargedAmount: 102360, method: "upi" });
    await recordPaymentTransaction(tx, { ...invoice, amount: 90000 }, { paymentId: "pay_A", chargedAmount: 93000, method: "card" }, "razorpay");
    expect(history.create).not.toHaveBeenCalled();
    expect(history.update).toHaveBeenCalledWith({ where: { id: "history-1" }, data: {} });
  });
  it("fills missing evidence on historical captures without recalculating a fee", async () => {
    history.findUnique.mockResolvedValue({ id: "history-1", clientId: invoice.clientId, invoiceId: invoice.id, chargedAmount: null, method: null });
    await recordPaymentTransaction(tx, invoice, { paymentId: "pay_A", chargedAmount: 102360, method: "upi" }, "razorpay");
    expect(history.update).toHaveBeenCalledWith({ where: { id: "history-1" }, data: { chargedAmount: 102360, method: "upi" } });
  });
  it("joins a later webhook to the existing manual confirmation instead of duplicating it", async () => {
    history.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "history-1", clientId: invoice.clientId, invoiceId: invoice.id });
    await recordPaymentTransaction(tx, invoice, { paymentId: "pay_A", chargedAmount: 102360 }, "razorpay");
    expect(history.create).not.toHaveBeenCalled();
    expect(history.update).toHaveBeenCalledWith({ where: { id: "history-1" }, data: { recordKey: "payment:pay_A", paymentId: "pay_A", source: "razorpay", chargedAmount: 102360 } });
  });
  it("retains separate real gateway payment IDs rather than overwriting the first capture", async () => {
    history.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "first-capture" });
    await recordPaymentTransaction(tx, invoice, { paymentId: "pay_A", chargedAmount: 102360 }, "razorpay");
    await recordPaymentTransaction(tx, invoice, { paymentId: "pay_B", chargedAmount: 102360 }, "razorpay");
    expect(history.create.mock.calls.map(call => call[0].data.recordKey)).toEqual(["payment:pay_A", "payment:pay_B"]);
    expect(history.create.mock.calls.map(call => call[0].data.amount)).toEqual([100000, 0]);
    expect(history.create.mock.calls[1][0].data.chargedAmount).toBe(102360);
  });
  it("does not create another row when an admin reconfirms a gateway payment", async () => {
    history.findFirst.mockResolvedValue({ id: "existing" });
    await recordPaymentTransaction(tx, invoice);
    expect(history.create).not.toHaveBeenCalled();
  });
  it("refuses to rebind a payment to another owner or invoice", async () => {
    history.findUnique.mockResolvedValue({ id: "history-1", clientId: "other-client", invoiceId: invoice.id });
    await expect(recordPaymentTransaction(tx, invoice, { paymentId: "pay_A" }, "razorpay")).rejects.toThrow("already bound");
    expect(history.update).not.toHaveBeenCalled();
    expect(history.create).not.toHaveBeenCalled();
  });
  it.each([NaN, 0, -1, 1.2, 99999])("does not turn an invalid/missing actual charge (%s) into a fabricated total", async chargedAmount => {
    await recordPaymentTransaction(tx, invoice, { paymentId: "pay_A", chargedAmount }, "razorpay");
    expect(history.create.mock.calls[0][0].data).not.toHaveProperty("chargedAmount");
  });
});

describe("owner-scoped transaction filters", () => {
  it("bounds URL inputs and never accepts owner IDs", () => {
    expect(transactionFilters({ q: "x".repeat(1000), page: "-1", source: "evil", currency: "usd" })).toEqual({ q: "x".repeat(160), page: 1, source: "all", currency: "all" });
    expect(transactionFilters({ q: ["a", "b"], page: "2e99" }).q).toBe("");
    expect(transactionFilters({ page: "100000000" }).page).toBe(1000000);
    const where = transactionWhere("real-client", transactionFilters({ clientId: "other-client", q: "100% invoice", currency: "INR", source: "recorded" }));
    expect(where).toMatchObject({ clientId: "real-client", currency: "INR", source: { in: ["manual", "legacy"] }, OR: expect.any(Array) });
    expect((where.OR as object[]).every(condition => !("clientId" in condition))).toBe(true);
  });
  it("preserves filters in pagination links and maps only known payment methods", () => {
    const filters = transactionFilters({ q: "Project & 100%", currency: "USD", source: "razorpay" });
    expect(transactionPageHref(filters, 2)).toBe("/portal/transactions?q=Project+%26+100%25&source=razorpay&currency=USD&page=2");
    expect(transactionPageHref(transactionFilters({}), 1)).toBe("/portal/transactions");
    expect(transactionMethod("manual", null)).toBe("Manually confirmed");
    expect(transactionMethod("razorpay", "upi")).toBe("Razorpay · UPI");
    expect(transactionMethod("razorpay", "evil content")).toBe("Razorpay");
  });
});
