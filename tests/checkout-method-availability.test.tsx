import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
import { PaymentMethodChooser } from "@/components/portal/payment-method-chooser";
const common = { invoiceId: "synthetic-invoice", invoiceNumber: "TEST-001", currencyLabel: "USD", labels: { subtotal: "$100.00", fee: "$3.00", gst: null, total: "$103.00" }, totals: { subtotal: 10000, feeRate: 0.03, fee: 300, gstRate: 0, gst: 0, total: 10300, domestic: false }, bank: null, providerUnavailable: true, paypal: { available: false, reason: "Local preview", mode: "live" as const }, createOrder: vi.fn(), verifyPayment: vi.fn(), createPayPal: vi.fn() };
it("preserves Razorpay-first wording and original fee total when both providers are visible", () => {
 const html = renderToStaticMarkup(<PaymentMethodChooser {...common}/>); expect(html).toContain('checked="" value="online"'); expect(html).toContain("Cards, UPI, Netbanking and Wallets"); expect(html).toContain("$103.00"); expect(html.indexOf('value="online"')).toBeLessThan(html.indexOf('value="paypal"'));
});
it("selects PayPal without an invisible Razorpay method or fee when Razorpay is off", () => {
 const html = renderToStaticMarkup(<PaymentMethodChooser {...common} razorpayVisible={false}/>); expect(html).toContain('checked="" value="paypal"'); expect(html).not.toContain('value="online"'); expect(html).not.toContain("Razorpay security"); expect(html).not.toContain("$103.00"); expect(html).toContain("Paid by Savo"); expect(html).toContain("Two ways to pay");
});
it("selects bank and omits both gateways and their trust marks when both are off", () => {
 const html = renderToStaticMarkup(<PaymentMethodChooser {...common} razorpayVisible={false} paypalVisible={false}/>); expect(html).toContain('checked="" value="bank"'); expect(html).not.toContain('value="paypal"'); expect(html).not.toContain('value="online"'); expect(html).not.toContain('alt="PayPal"'); expect(html).not.toContain('alt="Razorpay"'); expect(html).toContain("One way to pay"); expect(html).toContain("Request bank details");
});
it("hides disabled PayPal without changing Razorpay's fee", () => {
 const html = renderToStaticMarkup(<PaymentMethodChooser {...common} paypalVisible={false}/>); expect(html).not.toContain('value="paypal"'); expect(html).toContain("$103.00"); expect(html).toContain("Calculated as 3%");
});
