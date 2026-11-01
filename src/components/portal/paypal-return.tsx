"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { completePayPalCheckoutAction } from "@/app/portal/(app)/invoices/[id]/pay/paypal-actions";
import styles from "./checkout.module.css";
/** GET only renders this screen; the authenticated server action performs a
 * protected POST. Return parameters never directly set paid state. */
export function PayPalReturn({ invoiceId, checkoutId, state, orderId, cancel }: { invoiceId: string; checkoutId: string; state: string; orderId?: string; cancel: boolean }) {
  const router = useRouter(), started = useRef(false), busyRef = useRef(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("Checking PayPal’s confirmation. Do not pay again while this is checked.");
  const check = async () => {
    if (busyRef.current) return; busyRef.current = true; setBusy(true);
    try {
      const result = await completePayPalCheckoutAction({ checkoutId, state, ...(orderId ? { orderId } : {}), cancel });
      if (result.ok && result.status === "completed") { router.replace(`/portal/invoices/${invoiceId}/pay`); router.refresh(); return; }
      setMessage(result.ok ? "PayPal confirmation is still pending. Check again shortly; do not start a second payment." : result.message);
    } catch { setMessage("The confirmation response was lost. Check again or contact Savo before attempting another payment."); }
    finally { busyRef.current = false; setBusy(false); }
  };
  useEffect(() => { if (!started.current) { started.current = true; void check(); } });
  return <section className={styles.resultPanel}><h1>{cancel ? "Check your PayPal checkout" : "Confirming your PayPal payment"}</h1><p role="status">{message}</p><div className={styles.resultActions}><button type="button" disabled={busy} className={styles.primary} onClick={() => void check()}>{busy ? "Checking PayPal…" : "Check PayPal again"}</button><a className={styles.secondary} href={`/portal/invoices/${invoiceId}/pay`}>Back to invoice</a></div></section>;
}
