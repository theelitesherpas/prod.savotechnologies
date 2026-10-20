import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifiedReceiptPayment } from "@/lib/payment-receipt";

const m = vi.hoisted(() => ({ client: vi.fn(), invoice: vi.fn(), gateway: vi.fn(), bank: vi.fn(), payment: vi.fn() }));
vi.mock("@/lib/client-auth", () => ({ getClientUser: m.client }));
vi.mock("@/lib/prisma", () => ({ prisma: { invoice: { findFirst: m.invoice } } }));
vi.mock("@/lib/razorpay-config", () => ({ getRazorpayConfig: m.gateway }));
vi.mock("@/lib/bank-details", () => ({ getBankDetails: m.bank }));
vi.mock("@/lib/razorpay", () => ({ fetchRazorpayPayment: m.payment }));
vi.mock("@/app/portal/(app)/invoices/[id]/pay/actions", () => ({ createRazorpayOrderAction: vi.fn(), verifyCheckoutAction: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (p: string) => { throw Error(`REDIRECT:${p}`); }, useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
import Page from "@/app/portal/(app)/invoices/[id]/pay/page";

const user = { id: "client-1234567", name: "Test Client", email: "test@example.invalid", company: "Test Company" };
const invoice = { id: "invoice-1234567", clientId: user.id, number: "STPLIN12345", amount: 100000, currency: "INR", status: "sent", issuedAt: new Date("2026-10-01T10:00:00Z"), paidAt: null, dueDate: null, notes: "", paymentLink: null, razorpayPaymentId: null, razorpayOrderId: null, project: null };
const render = async (query: Record<string, string> = {}) => renderToStaticMarkup(await Page({ params: Promise.resolve({ id: invoice.id }), searchParams: Promise.resolve(query) }));
beforeEach(() => {
  vi.clearAllMocks();
  m.client.mockResolvedValue(user); m.invoice.mockResolvedValue(invoice); m.gateway.mockResolvedValue({ keyId: "public-key" }); m.bank.mockResolvedValue(null); m.payment.mockResolvedValue(null);
});

describe("checkout page truth and access", () => {
  it("requires a client session and independently scopes by owner and visible status", async () => {
    m.client.mockResolvedValueOnce(null);
    await expect(render()).rejects.toThrow("REDIRECT:/portal"); expect(m.invoice).not.toHaveBeenCalled();
    m.invoice.mockResolvedValueOnce(null);
    await expect(render()).rejects.toThrow("REDIRECT:/portal/invoices");
    expect(m.invoice).toHaveBeenCalledWith(expect.objectContaining({ where: { id: invoice.id, clientId: user.id, status: { in: ["sent", "overdue", "paid", "cancelled"] } } }));
  });
  it("offers two methods, exact totals and attributed trust marks", async () => {
    const html = await render();
    expect(html).toContain("Complete your payment"); expect(html).toContain("Select payment method"); expect(html).toContain("Payment summary");
    expect(html).toContain("Pay Online"); expect(html).toContain("Bank Deposit"); expect(html).toContain("1,023.60");
    expect(html).toContain("Razorpay security"); expect(html).not.toContain("Razorpay certified"); expect(html).toContain('alt="Visa"'); expect(html).not.toContain("Savo is PCI");
    expect(html).toContain("Calculated as 2%"); expect(html).not.toContain("Calculated as 3%");
  });
  it("shows only the 3% fee for international currency", async () => {
    m.invoice.mockResolvedValueOnce({ ...invoice, currency: "USD", amount: 100 });
    const html = await render(); expect(html).toContain("Calculated as 3%"); expect(html).not.toContain("GST on processing fee"); expect(html).not.toContain("Calculated as 2%");
  });
  it("cannot turn a query flag into a success and suppresses a second payment while checking", async () => {
    const html = await render({ paid: "1" }); expect(html).toContain("Checking your payment"); expect(html).not.toContain("Payment successful"); expect(html).not.toContain("Pay Online");
  });
  it("does not render a payment action for paid/cancelled invoices with old provider links", async () => {
    for (const status of ["paid", "cancelled"]) {
      m.invoice.mockResolvedValueOnce({ ...invoice, status, paidAt: status === "paid" ? new Date() : null, paymentLink: "https://rzp.io/i/legacy" });
      const html = await render(); expect(html).not.toContain("Continue to the payment provider"); expect(html).not.toContain("Select payment method");
    }
  });
  it("preserves a valid manual link and rejects an unsafe legacy value", async () => {
    m.invoice.mockResolvedValueOnce({ ...invoice, paymentLink: "https://paypal.me/test/1000" });
    const html = await render(); expect(html).toContain("https://paypal.me/test/1000"); expect(html).not.toContain("Select payment method"); expect(m.gateway).not.toHaveBeenCalled();
    m.invoice.mockResolvedValueOnce({ ...invoice, paymentLink: "javascript:alert(1)" });
    const unsafe = await render(); expect(unsafe).not.toContain("javascript:alert"); expect(unsafe).toContain("payment link is unavailable");
  });
  it("escapes failure messages without double decoding or hiding a confirmed payment", async () => {
    const html = await render({ payError: "<script>bad</script>%ZZ" }); expect(html).toContain("&lt;script&gt;bad"); expect(html).not.toContain("<script>bad");
    m.invoice.mockResolvedValueOnce({ ...invoice, status: "paid", paidAt: new Date() });
    const paid = await render({ payError: "forged failure" }); expect(paid).toContain("Payment successful."); expect(paid).not.toContain("forged failure");
  });
  it("shows the actual captured total/method, never recomputed historic fees, and degrades safely", async () => {
    const paid = { ...invoice, status: "paid", paidAt: new Date("2026-10-02"), razorpayPaymentId: "pay_REAL1234", razorpayOrderId: "order_REAL123" };
    m.invoice.mockResolvedValue(paid); m.payment.mockResolvedValueOnce({ id: "pay_REAL1234", order_id: "order_REAL123", status: "captured", currency: "INR", amount: 104000, method: "card" });
    const html = await render(); expect(html).toContain("1,040.00"); expect(html).toContain("40.00"); expect(html).toContain("Card via Razorpay"); expect(html).toContain("Outstanding balance"); expect(html).not.toContain("1,023.60");
    m.payment.mockRejectedValueOnce(new Error("offline"));
    const fallback = await render(); expect(fallback).toContain("Invoice amount paid"); expect(fallback).not.toContain("Processing fees &amp; taxes paid");
  });
});

describe("receipt display binding", () => {
  const i = { amount: 100, currency: "INR", razorpayPaymentId: "pay_REAL", razorpayOrderId: "order_REAL" };
  const p = { id: "pay_REAL", order_id: "order_REAL", currency: "INR", amount: 104, status: "captured", method: "upi" };
  it("uses only bound, captured, same-currency provider records", () => {
    expect(verifiedReceiptPayment(i, p)).toEqual({ total: 104, extra: 4, method: "UPI" });
    for (const change of [{ id: "pay_OTHER" }, { order_id: "order_OTHER" }, { amount: 99 }, { amount: NaN }, { currency: "USD" }, { status: "authorized" }]) expect(verifiedReceiptPayment(i, { ...p, ...change })).toBeNull();
  });
});
