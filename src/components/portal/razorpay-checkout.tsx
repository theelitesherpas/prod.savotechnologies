"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CheckoutStart, CheckoutVerify } from "@/app/portal/(app)/invoices/[id]/pay/types";
import styles from "./portal.module.css";

/**
 * Razorpay Standard Checkout — the client half. The server creates the
 * order (amounts never come from the browser); this component only opens
 * the hosted checkout for that order and relays Razorpay's signed
 * confirmation back to the server for verification. The success/failure
 * state is ALWAYS derived from the server's verdict — never from the
 * checkout window closing.
 */

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayConstructor = new (options: RazorpayOptions) => { open: () => void; on: (event: string, cb: (payload: unknown) => void) => void };

declare global {
  interface Window { Razorpay?: RazorpayConstructor }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export function RazorpayCheckout({
  invoiceId, invoiceNumber, amountLabel, providerUnavailable, createOrder, verifyPayment,
}: {
  invoiceId: string;
  invoiceNumber: string;
  amountLabel: string;
  providerUnavailable?: boolean;
  /** Server actions passed from the RSC page (codebase pattern). */
  createOrder: (invoiceId: string) => Promise<CheckoutStart>;
  verifyPayment: (input: { invoiceId: string; orderId: string; paymentId: string; signature: string }) => Promise<CheckoutVerify>;
}) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (document.querySelector(`script[src="${CHECKOUT_SRC}"]`)) {
      // Already loaded (e.g. a prior mount): settle asynchronously — never a
      // synchronous setState inside the effect body (cascading renders).
      const settled = setTimeout(() => setScriptReady(true), 0);
      return () => clearTimeout(settled);
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError("Razorpay checkout could not be loaded. Check your connection and retry.");
    document.body.appendChild(script);
  }, []);

  const startPayment = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(null);
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
        description: `Invoice ${start.invoiceNumber}`,
        prefill: { name: start.name, email: start.email },
        theme: { color: "#b82222" },
        handler: (response) => {
          void (async () => {
            const verdict = await verifyPayment({
              invoiceId, orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature,
            });
            if (verdict.ok) router.replace(`/portal/invoices/${invoiceId}/pay?paid=1`);
            else router.replace(`/portal/invoices/${invoiceId}/pay?payError=${encodeURIComponent(verdict.message)}`);
          })();
        },
        modal: {
          ondismiss: () => {
            // Client closed the checkout — stay here, nothing happened.
            setBusy(false); busyRef.current = false;
          },
        },
      });
      checkout.on("payment.failed", () => {
        // Razorpay shows the failure inside the modal; surface context here.
        setError("The payment attempt failed. No amount was recorded — you can retry safely.");
        setBusy(false); busyRef.current = false;
      });
      checkout.open();
    } catch {
      setError("Payment could not be started. Please try again.");
    } finally {
      // The modal stays open after `open()` returns; only release the button
      // when no checkout is in flight (dismiss/failure handlers reset it).
      if (!window.Razorpay) { setBusy(false); busyRef.current = false; }
    }
  }, [invoiceId, router, createOrder, verifyPayment]);

  if (providerUnavailable) {
    return (
      <div className={styles.payNote} role="note">
        Online payment is temporarily unavailable. Please contact us at hello@savotechnologies.com — the invoice details above stay valid.
      </div>
    );
  }

  return (
    <div className={styles.payActionArea}>
      <button type="button" className={styles.payCta} onClick={startPayment} disabled={busy || !scriptReady}>
        {busy ? "Opening checkout…" : scriptReady ? `Pay ${amountLabel} securely` : "Loading secure checkout…"}
      </button>
      <p className={styles.payHint}>
        Opens Razorpay checkout (UPI, cards, netbanking, wallets) for invoice {invoiceNumber}. You return here
        automatically and the status above updates after the payment is verified on our servers.
      </p>
      {error ? <p className={styles.payError} role="alert">{error}</p> : null}
    </div>
  );
}
