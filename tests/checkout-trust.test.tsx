import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PaymentTrust, PayPalLogo } from "@/components/portal/checkout-ui";
it("renders the local official PayPal logo with an accessible name", () => {
 const html = renderToStaticMarkup(<PayPalLogo/>); expect(html).toContain('alt="PayPal"'); expect(html).toContain('/images/payments/paypal.svg');
});
it("attributes PayPal security to PayPal and qualifies supported card funding", () => {
 const html = renderToStaticMarkup(<PaymentTrust provider="paypal"/>);
 for (const text of ["Secure connection", "HTTPS encryption", "PayPal security information", "digital-wallet/security-and-protection", 'alt="Visa"', 'alt="Mastercard"', "full card details", "checkout eligibility"]) expect(html).toContain(text);
 expect(html).not.toContain("PCI DSS"); expect(html).not.toContain("Razorpay security"); expect(html).not.toContain("handled by Razorpay");
});
it("preserves the existing attributed Razorpay security section", () => {
 const html = renderToStaticMarkup(<PaymentTrust provider="razorpay"/>); expect(html).toContain("PCI DSS"); expect(html).toContain("Razorpay security"); expect(html).toContain("https://razorpay.com/docs/security/"); expect(html).not.toContain("PayPal security information");
});
it("does not imply bank transfers use PayPal or card networks", () => {
 const html = renderToStaticMarkup(<PaymentTrust provider="bank"/>); expect(html).toContain("confirmed by Savo after funds arrive"); expect(html).not.toContain('alt="Visa"'); expect(html).not.toContain("PayPal");
});
