"use client";

import { useEffect, useState } from "react";
import type { CheckoutStart, CheckoutVerify } from "@/app/portal/(app)/invoices/[id]/pay/types";
import styles from "./portal.module.css";

/**
 * PayPal-style payment method chooser for the portal pay page.
 *
 *   ● Pay Online (default) — Razorpay checkout with a transparent fee
 *     breakdown: subtotal, processing fee (2% INR / 3% others) and GST
 *     (18% on the fee, INR only). The gateway order is created for the
 *     TOTAL; verification and webhook reconciliation expect exactly it.
 *   ○ Bank Deposit — the company's bank transfer details; the invoice
 *     amount only (no online fees), recorded by the Savo team after the
 *     transfer is confirmed.
 *
 * Server actions arrive as props (codebase pattern); amounts and fee
 * figures arrive precomputed from the server — the browser never decides
 * money.
 */

type RazorpayHandlerResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = {
  key: string; order_id: string; amount: number; currency: string; name: string; description: string;
  prefill?: { name?: string; email?: string }; theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void; modal?: { ondismiss?: () => void };
};
type RazorpayConstructor = new (options: RazorpayOptions) => { open: () => void; on: (event: string, cb: (payload: unknown) => void) => void };

declare global { interface Window { Razorpay?: RazorpayConstructor } }

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function RazorpayMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 116 24" role="img" aria-label="Razorpay" fill="none">
      <path d="M10.6 3 4.4 21h4.3l1.3-4.1h5L12.8 21h4.4L23.4 3h-4.3l-4.4 13.4h-4.6L14.9 3h-4.3Z" fill="#02042b"/>
      <path d="m13.6 12.6 3.6-11h4.2l-6.1 18.7-1.7-7.7Z" fill="#3395ff"/>
      <text x="27" y="17" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="13.5" fill="#02042b">Razorpay</text>
    </svg>
  );
}

function FeeInfo({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={styles.feeInfoWrap}>
      <button type="button" className={styles.feeInfoButton} aria-label={`About this fee: ${text}`}
        aria-expanded={open} onClick={() => setOpen(v => !v)} onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="10" cy="10" r="8.2" /><path d="M10 9v5" /><circle cx="10" cy="6.3" r="0.4" fill="currentColor" stroke="none" />
        </svg>
      </button>
      {open ? <span role="tooltip" className={styles.feePopup}>{text}</span> : null}
    </span>
  );
}

function BankMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" role="img" aria-label="Bank" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 12 4l9 5.5" /><path d="M5 10v9" /><path d="M9.7 10v9" /><path d="M14.3 10v9" /><path d="M19 10v9" /><path d="M3 20h18" />
    </svg>
  );
}

export function PaymentMethodChooser({
  invoiceId, invoiceNumber, currencyLabel, labels, totals, bank, providerUnavailable,
  createOrder, verifyPayment,
}: {
  invoiceId: string;
  invoiceNumber: string;
  currencyLabel: string;
  /** Preformatted money strings from the server (never functions across the boundary). */
  labels: { subtotal: string; fee: string; gst: string | null; total: string };
  totals: { subtotal: number; feeRate: number; fee: number; gstRate: number; gst: number; total: number; domestic: boolean };
  bank: {
    bankName: string; accountName: string; accountNumber: string; ifsc: string; swift: string; branch: string; instructions: string;
  } | null;
  providerUnavailable?: boolean;
  createOrder: (invoiceId: string) => Promise<CheckoutStart>;
  verifyPayment: (input: { invoiceId: string; orderId: string; paymentId: string; signature: string }) => Promise<CheckoutVerify>;
}) {
  const [method, setMethod] = useState<"online" | "bank">("online");
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Primary loader: start fetching checkout.js the moment the chooser mounts
  // (Pay Online is the default selection — waiting for a radio click would
  // leave the button in "Loading…" forever). setState only fires from the
  // async load/error callbacks, never synchronously in the effect body.
  useEffect(() => {
    if (providerUnavailable) return;
    const markReady = () => setScriptReady(true);
    const markFailed = () => setError("Razorpay checkout could not be loaded. Check your connection and retry.");
    const existing = document.querySelector<HTMLScriptElement>("script[data-rzp-checkout]");
    if (existing) {
      if (window.Razorpay) {
        const settled = setTimeout(markReady, 0); // already loaded on a prior mount
        return () => clearTimeout(settled);
      }
      existing.addEventListener("load", markReady);  // still in flight
      existing.addEventListener("error", markFailed);
      return () => { existing.removeEventListener("load", markReady); existing.removeEventListener("error", markFailed); };
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.dataset.rzpCheckout = "1";
    script.addEventListener("load", markReady);
    script.addEventListener("error", markFailed);
    document.body.appendChild(script);
    return () => { script.removeEventListener("load", markReady); script.removeEventListener("error", markFailed); };
  }, [providerUnavailable]);

  // Retry path only (e.g. after a failed load); the mount effect above is the
  // primary loader.
  const loadScript = () => {
    if (scriptReady || typeof document === "undefined") return;
    if (document.querySelector("script[data-rzp-checkout]")) {
      if (window.Razorpay) setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.dataset.rzpCheckout = "1";
    script.addEventListener("load", () => setScriptReady(true));
    script.addEventListener("error", () => setError("Razorpay checkout could not be loaded. Check your connection and retry."));
    document.body.appendChild(script);
  };

  const startPayment = async () => {
    setBusy(true); setError(null);
    try {
      const start = await createOrder(invoiceId);
      if (!start.ok) { setError(start.message); return; }
      if (!window.Razorpay) { setError("Razorpay checkout is still loading — try again in a second."); return; }
      const checkout = new window.Razorpay({
        key: start.keyId,
        order_id: start.orderId,
        amount: start.amount,
        currency: start.currency,
        name: "Savo Technologies",
        description: `Invoice ${start.invoiceNumber}${start.amount > totals.subtotal ? " (incl. processing fee)" : ""}`,
        prefill: { name: start.name, email: start.email },
        theme: { color: "#b82222" },
        handler: (response) => {
          void (async () => {
            const verdict = await verifyPayment({ invoiceId, orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature });
            const url = verdict.ok
              ? `/portal/invoices/${invoiceId}/pay?paid=1`
              : `/portal/invoices/${invoiceId}/pay?payError=${encodeURIComponent(verdict.message)}`;
            window.location.assign(url);
          })();
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.on("payment.failed", () => {
        setError("The payment attempt failed. No amount was recorded — you can retry safely.");
        setBusy(false);
      });
      checkout.open();
    } catch {
      setError("Payment could not be started. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className={styles.methodCard} role="radiogroup" aria-label="Payment method">
      <div className={`${styles.methodOption} ${method === "online" ? styles.methodActive : ""}`}>
        <label className={styles.methodLabel}>
          <input type="radio" name="payment-method" value="online" checked={method === "online"}
            onChange={() => setMethod("online")} onClick={loadScript} disabled={providerUnavailable} />
          <RazorpayMark className={styles.methodLogoOnline} />
          <span className={styles.methodName}>Pay Online</span>
          <span className={styles.methodSub}>Cards · UPI · Netbanking · Wallets</span>
        </label>
        {method === "online" ? (
          <div className={styles.methodBody}>
            {providerUnavailable ? (
              <p className={styles.payError}>Online payment is temporarily unavailable. Choose Bank Deposit below, or contact us at hello@savotechnologies.com.</p>
            ) : (
              <>
                <dl className={styles.feeRows}>
                  <div><dt>Subtotal</dt><dd>{labels.subtotal}</dd></div>
                  <div>
                    <dt>Processing fee <FeeInfo text="Calculated as 2% of the invoice amount for INR payments and 3% for all other currencies." /></dt>
                    <dd>{labels.fee}</dd>
                  </div>
                  {labels.gst ? (
                    <div>
                      <dt>GST on processing fee <FeeInfo text="GST is charged at 18% on the processing fee and applies to domestic (INR) payments only." /></dt>
                      <dd>{labels.gst}</dd>
                    </div>
                  ) : null}
                  <div className={styles.feeTotal}><dt>Total to pay ({currencyLabel})</dt><dd>{labels.total}</dd></div>
                </dl>
                <button type="button" className={styles.payCta} onClick={() => { loadScript(); void startPayment(); }} disabled={busy || !scriptReady}>
                  {busy ? "Opening checkout…" : scriptReady ? `Pay ${labels.total} securely` : "Loading secure checkout…"}
                </button>
                <p className={styles.payHint}>
                  Opens Razorpay checkout for invoice {invoiceNumber}. You return here automatically and the status updates
                  once the payment is verified on our servers. Failed attempts record nothing and can be retried safely.
                </p>
                {error ? <p className={styles.payError} role="alert">{error}</p> : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className={`${styles.methodOption} ${method === "bank" ? styles.methodActive : ""}`}>
        <label className={styles.methodLabel}>
          <input type="radio" name="payment-method" value="bank" checked={method === "bank"} onChange={() => setMethod("bank")} />
          <BankMark className={styles.methodLogoBank} />
          <span className={styles.methodName}>Bank Deposit</span>
          <span className={styles.methodSub}>NEFT · RTGS · IMPS · Wire transfer</span>
        </label>
        {method === "bank" ? (
          <div className={styles.methodBody}>
            <dl className={styles.bankRows}>
              <div className={styles.feeTotal}><dt>Amount to transfer ({currencyLabel})</dt><dd>{labels.subtotal}</dd></div>
            </dl>
            {bank && (bank.accountNumber || bank.ifsc || bank.swift) ? (
              <>
                <dl className={styles.bankRows}>
                  {bank.accountName ? <div><dt>Account name</dt><dd>{bank.accountName}</dd></div> : null}
                  {bank.bankName ? <div><dt>Bank</dt><dd>{bank.bankName}</dd></div> : null}
                  {bank.accountNumber ? <div><dt>Account number</dt><dd className="tnum">{bank.accountNumber}</dd></div> : null}
                  {bank.ifsc ? <div><dt>IFSC</dt><dd className="tnum">{bank.ifsc}</dd></div> : null}
                  {bank.swift ? <div><dt>SWIFT / BIC</dt><dd className="tnum">{bank.swift}</dd></div> : null}
                  {bank.branch ? <div><dt>Branch</dt><dd>{bank.branch}</dd></div> : null}
                </dl>
                <p className={styles.payHint}>
                  {bank.instructions || `Transfer the invoice amount and include ${invoiceNumber} in the payment reference. Your invoice is marked paid after our team confirms the transfer — usually within one business day.`}
                </p>
              </>
            ) : (
              <p className={styles.payHint}>
                Bank transfer details are available on request. Write to hello@savotechnologies.com with invoice {invoiceNumber}
                and we will share our account details and confirm your transfer.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
