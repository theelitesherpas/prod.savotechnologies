"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CheckoutStart, CheckoutVerify } from "@/app/portal/(app)/invoices/[id]/pay/types";
import type { BankDetails } from "@/lib/bank-details";
import { CheckoutHelp, CheckoutIcon, PaymentTrust, RazorpayLogo } from "./checkout-ui";
import { CopyValue, PrintPayment } from "./checkout-actions";
import styles from "./checkout.module.css";

/** Operate / reference-pinned: methods on the left, an exact amount review on
 * the right. Bank confirmation reveals instructions, never records payment.
 * The existing owner-scoped server actions remain the only money boundary. */
type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = {
  key: string; order_id: string; amount: number; currency: string; name: string; description: string;
  prefill?: { name?: string; email?: string }; theme?: { color?: string };
  handler: (response: RazorpayResponse) => void; modal?: { ondismiss?: () => void };
};
type RazorpayConstructor = new (options: RazorpayOptions) => { open: () => void; on: (event: string, cb: () => void) => void };
declare global { interface Window { Razorpay?: RazorpayConstructor } }
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let checkoutScript: Promise<void> | null = null;

/** Shared, bounded loader. Remounts reuse it; failed loads can really retry. */
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScript) return checkoutScript;
  checkoutScript = new Promise<void>((resolve, reject) => {
    const script = document.querySelector<HTMLScriptElement>("script[data-rzp-checkout]") ?? document.createElement("script");
    const cleanup = () => { clearTimeout(timer); script.removeEventListener("load", ready); script.removeEventListener("error", fail); };
    const fail = () => { cleanup(); script.remove(); reject(new Error("Checkout could not load. Check your connection and try again.")); };
    const ready = () => { if (!window.Razorpay) { fail(); return; } cleanup(); resolve(); };
    script.addEventListener("load", ready);
    script.addEventListener("error", fail);
    const timer = setTimeout(fail, 15000);
    if (!script.isConnected) { script.src = CHECKOUT_SRC; script.async = true; script.dataset.rzpCheckout = "1"; document.body.appendChild(script); }
  }).catch(error => { checkoutScript = null; throw error; });
  return checkoutScript;
}

function FeeInfo({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <span className={styles.feeInfoWrap}>
    <button type="button" className={styles.infoButton} aria-label={`About this fee: ${text}`} aria-expanded={open} aria-describedby={open ? id : undefined}
      onClick={() => setOpen(v => !v)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } }}><CheckoutIcon name="info"/></button>
    {open ? <span id={id} role="tooltip" className={styles.feePopup}>{text}</span> : null}
  </span>;
}

export function PaymentMethodChooser({ invoiceId, invoiceNumber, currencyLabel, labels, totals, bank, providerUnavailable, createOrder, verifyPayment, invoiceDetails }: {
  invoiceId: string; invoiceNumber: string; currencyLabel: string;
  labels: { subtotal: string; fee: string; gst: string | null; total: string };
  totals: { subtotal: number; feeRate: number; fee: number; gstRate: number; gst: number; total: number; domestic: boolean };
  bank: BankDetails | null; providerUnavailable?: boolean; invoiceDetails?: ReactNode;
  createOrder: (invoiceId: string) => Promise<CheckoutStart>;
  verifyPayment: (input: { invoiceId: string; orderId: string; paymentId: string; signature: string }) => Promise<CheckoutVerify>;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<"online" | "bank">("online");
  const [instructions, setInstructions] = useState(false);
  const [scriptState, setScriptState] = useState<"loading" | "ready" | "failed">("loading");
  const [busy, setBusy] = useState<"starting" | "verifying" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const confirming = useRef(false);
  const instructionHeading = useRef<HTMLHeadingElement>(null);
  const bankReady = !!(bank?.accountName && bank?.accountNumber && bank?.bankName && (currencyLabel === "INR" ? bank?.ifsc : bank?.swift));

  useEffect(() => {
    if (providerUnavailable) return;
    let active = true;
    void loadCheckout().then(() => { if (active) setScriptState("ready"); }).catch(() => { if (active) setScriptState("failed"); });
    return () => { active = false; };
  }, [providerUnavailable]);
  useEffect(() => { if (instructions) { instructionHeading.current?.focus(); instructionHeading.current?.scrollIntoView({ block: "start" }); } }, [instructions]);

  const retryScript = () => {
    setScriptState("loading");
    void loadCheckout().then(() => setScriptState("ready")).catch(() => setScriptState("failed"));
  };
  const startPayment = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy("starting"); setError(null);
    const release = () => { inFlight.current = false; setBusy(null); };
    try {
      const start = await createOrder(invoiceId);
      if (!start.ok) { setError(start.message); release(); return; }
      if (!window.Razorpay) { setScriptState("failed"); release(); return; }
      const checkout = new window.Razorpay({
        key: start.keyId, order_id: start.orderId, amount: start.amount, currency: start.currency,
        name: "Savo Technologies", description: `Invoice ${start.invoiceNumber}`, prefill: { name: start.name, email: start.email }, theme: { color: "#b82222" },
        handler: response => {
          confirming.current = true;
          setBusy("verifying");
          void (async () => {
            try {
              const verdict = await verifyPayment({ invoiceId, orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature });
              router.replace(`/portal/invoices/${invoiceId}/pay?${verdict.ok ? "paid=1" : `payError=${encodeURIComponent(verdict.message)}`}`);
            } catch {
              // A lost response is not evidence of failure: webhook confirmation may arrive.
              router.replace(`/portal/invoices/${invoiceId}/pay?paid=1`);
            }
          })();
        },
        modal: { ondismiss: () => { if (inFlight.current && !confirming.current) release(); } },
      });
      checkout.on("payment.failed", () => { setError("The payment attempt was not completed. If your bank shows a debit, check the invoice status or contact us before trying again."); release(); });
      checkout.open();
    } catch { setError("We couldn’t open checkout. Please try again, or choose bank deposit."); release(); }
  };

  if (instructions && bank && bankReady) {
    return <section className={`${styles.instructionSheet} ${styles.printSheet}`} aria-labelledby="bank-instructions-title">
      <div className={styles.documentHeader}><span className={styles.documentIcon}><CheckoutIcon name="bank"/></span><span className={styles.pendingPill}>Awaiting your transfer</span></div>
      <h1 id="bank-instructions-title" ref={instructionHeading} tabIndex={-1}>Your bank deposit instructions</h1>
      <p className={styles.lead}>Transfer <strong>{labels.subtotal} {currencyLabel}</strong> using the details below. Include your invoice reference so we can match the payment to your account.</p>
      <div className={styles.referenceBlock}><div><span>Payment reference</span><CopyValue value={invoiceNumber} label="payment reference"/></div><CheckoutIcon name="info"/><p>Use this exact reference in your bank’s transfer description.</p></div>
      <h3>Beneficiary details</h3>
      <dl className={styles.bankDetails}>
        {([
          ["Account name", bank.accountName], ["Account number", bank.accountNumber], ["Bank name", bank.bankName],
          ["Branch", bank.branch], ["IFSC", bank.ifsc], ["SWIFT / BIC", bank.swift],
        ] as const).filter(([, value]) => !!value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd><CopyValue value={value} label={label}/></dd></div>)}
        <div><dt>Transfer amount</dt><dd>{labels.subtotal} {currencyLabel}</dd></div>
      </dl>
      {bank.instructions ? <p className={styles.bankNote}>{bank.instructions}</p> : null}
      <div className={styles.notice}><CheckoutIcon name="clock"/><div><strong>This is not a payment confirmation.</strong><p>Your invoice stays unpaid until Savo verifies receipt of funds. We do not add online-processing fees to bank deposits; your bank may apply transfer charges. Send in {currencyLabel}; contact us before transferring if your bank cannot send that currency.</p></div></div>
      <div className={styles.documentActions}>
        <PrintPayment/>
        <a className={styles.primary} href={`mailto:hello@savotechnologies.com?subject=${encodeURIComponent(`Bank transfer: ${invoiceNumber}`)}&body=${encodeURIComponent(`Invoice: ${invoiceNumber}\nAmount: ${labels.subtotal} ${currencyLabel}\nTransfer / UTR reference:\nTransfer date:\n`)}`}><CheckoutIcon name="mail"/>Send transfer reference</a>
      </div>
      <button type="button" className={`${styles.backLink} ${styles.noPrint}`} onClick={() => { setInstructions(false); setMethod("bank"); }}><CheckoutIcon name="back"/>Change payment method</button>
    </section>;
  }

  return <div className={styles.checkoutGrid}>
    <div className={styles.methodColumn}>
      <section className={styles.panel} aria-labelledby="payment-method-title">
        <div className={styles.panelHeading}><h2 id="payment-method-title">Select payment method</h2><span>Two ways to pay</span></div>
        <fieldset className={styles.methodList} disabled={!!busy}><legend className={styles.srOnly}>Payment method</legend>
          <label className={`${styles.methodOption} ${method === "online" ? styles.selected : ""}`}>
            <span className={styles.methodTop}><input type="radio" name="payment-method" value="online" checked={method === "online"} onChange={() => { setMethod("online"); setError(null); }}/><span className={styles.methodName}>Pay Online</span><RazorpayLogo/></span>
            <span className={styles.methodDescription}>Cards, UPI, netbanking and wallets</span><span className={styles.methodDetail}>Pay securely and get an instant confirmation after verification.</span>
          </label>
          <label className={`${styles.methodOption} ${method === "bank" ? styles.selected : ""}`}>
            <span className={styles.methodTop}><input type="radio" name="payment-method" value="bank" checked={method === "bank"} onChange={() => { setMethod("bank"); setError(null); }}/><span className={styles.methodName}>Bank Deposit</span><CheckoutIcon name="bank" className={styles.bankIcon}/></span>
            <span className={styles.methodDescription}>{currencyLabel === "INR" ? "NEFT, RTGS or IMPS" : "International bank transfer"}</span><span className={styles.methodDetail}>Transfer directly to our bank. Confirmed manually after receipt.</span>
          </label>
        </fieldset>
        {method === "bank" ? <div className={styles.methodExplanation}><CheckoutIcon name="info"/><p>{bankReady ? "Review the amount, then continue to receive our bank details and your invoice reference. No payment is taken on this page." : "Bank transfer details are available on request. Contact our team before sending funds; we’ll confirm the correct account and transfer currency."}</p></div> : null}
      </section>
      {invoiceDetails}
      <CheckoutHelp invoiceNumber={invoiceNumber}/>
    </div>
    <section className={`${styles.panel} ${styles.summary}`} aria-labelledby="payment-summary-title">
      <div className={styles.panelHeading}><h2 id="payment-summary-title">Payment summary</h2><span className={styles.currency}>{currencyLabel}</span></div>
      <div className={styles.summaryBody}>
        <div className={styles.invoiceReference}><span>Invoice</span><strong>{invoiceNumber}</strong></div>
        <dl className={styles.feeRows}>
          <div><dt>Subtotal</dt><dd>{labels.subtotal}</dd></div>
          {method === "online" ? <>
            <div><dt>Processing fee <FeeInfo text={`Calculated as ${Math.round(totals.feeRate * 100)}% of the invoice amount.`}/></dt><dd>{labels.fee}</dd></div>
            {labels.gst ? <div><dt>GST on processing fee <FeeInfo text={`GST is charged at ${Math.round(totals.gstRate * 100)}% on the processing fee.`}/></dt><dd>{labels.gst}</dd></div> : null}
          </> : <div><dt>Online processing fee</dt><dd>Not applicable</dd></div>}
        </dl>
        <div className={styles.total}><span>{method === "online" ? "Total to pay" : "Amount to transfer"}<small>{method === "online" ? "Including applicable fees" : "Invoice amount only"}</small></span><strong>{method === "online" ? labels.total : labels.subtotal}<small>{currencyLabel}</small></strong></div>
        {method === "online" ? <>
          <button type="button" className={styles.primary} onClick={() => void startPayment()} disabled={!!busy || scriptState !== "ready" || providerUnavailable}>
            <CheckoutIcon name="lock"/>{busy === "verifying" ? "Verifying your payment…" : busy ? "Opening checkout…" : scriptState === "loading" ? "Loading secure checkout…" : scriptState === "failed" ? "Checkout unavailable" : `Pay ${labels.total} securely`}<CheckoutIcon name="arrow"/>
          </button>
          {scriptState === "failed" ? <div className={styles.inlineError} role="alert">Checkout couldn’t load. <button type="button" onClick={retryScript}>Try loading again</button> or choose Bank Deposit.</div> : null}
          {providerUnavailable ? <p className={styles.inlineError}>Online payment is temporarily unavailable. Choose Bank Deposit or contact our team.</p> : null}
          <p className={styles.actionNote}>You’ll return here after checkout. Your invoice is marked paid only after we verify the payment.</p>
        </> : <>
          {bankReady ? <button type="button" className={styles.primary} onClick={() => setInstructions(true)}>Get bank deposit instructions<CheckoutIcon name="arrow"/></button> : <a className={styles.primary} href={`mailto:hello@savotechnologies.com?subject=${encodeURIComponent(`Bank details for ${invoiceNumber}`)}`}>Request bank details<CheckoutIcon name="arrow"/></a>}
          <p className={styles.actionNote}>No charge is made by continuing. Bank deposits are verified by our team before the invoice is marked paid.</p>
        </>}
        {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}
        <PaymentTrust/>
      </div>
    </section>
  </div>;
}
