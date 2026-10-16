/** Same labelled optional field in both invoice create and edit forms. */
export function InvoicePaymentField({ value }: { value?: string | null }) {
  return <div className="sm:col-span-2">
    <label className="adm-label mb-1.5 block" htmlFor="invoice-payment-link">Payment link (optional)</label>
    <input id="invoice-payment-link" name="paymentLink" type="url" maxLength={2048} defaultValue={value ?? ""} placeholder="https://rzp.io/i/your-invoice-link" className="adm-input w-full" aria-describedby="invoice-payment-help"/>
    <p id="invoice-payment-help" className="mt-2 text-xs leading-relaxed text-muted">Invoice-specific HTTPS link from PayPal, Razorpay, Stripe or a configured provider. Verify payee, amount and currency. Shown only while unpaid/overdue. Leave blank for no payment button. Clicking never records payment.</p>
    {value ? <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted"><input type="checkbox" name="paymentLinkConfirmed" value="yes" className="mt-0.5"/>If changing the client, amount or currency: I verified the existing provider link matches the updated invoice. Otherwise replace or clear the link.</label> : null}
  </div>;
}
