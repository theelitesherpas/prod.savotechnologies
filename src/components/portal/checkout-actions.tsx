"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutIcon } from "./checkout-ui";
import styles from "./checkout.module.css";

export function CopyValue({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return <span className={styles.copyGroup}><span>{value}</span><button type="button" className={styles.iconButton} aria-label={`Copy ${label}`} onClick={() => {
    void navigator.clipboard?.writeText(value).then(() => setState("copied")).catch(() => setState("failed"));
    if (!navigator.clipboard) setState("failed");
  }}><CheckoutIcon name={state === "copied" ? "check" : "copy"}/></button><span className={styles.copyFeedback} role="status">{state === "copied" ? "Copied" : state === "failed" ? "Select and copy the value" : ""}</span></span>;
}

export function PrintPayment({ label = "Print / save as PDF" }: { label?: string }) {
  return <button type="button" onClick={() => window.print()} className={`${styles.secondary} ${styles.noPrint}`}><CheckoutIcon name="download"/>{label}</button>;
}

/** Bounded refresh only: never retries a payment or turns a query flag into success. */
export function PaymentStatusRefresh() {
  const router = useRouter();
  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => { if (!document.hidden) router.refresh(); if (++count >= 12) clearInterval(interval); }, 5000);
    return () => clearInterval(interval);
  }, [router]);
  return <button className={styles.secondary} type="button" onClick={() => router.refresh()}>Check payment status</button>;
}
