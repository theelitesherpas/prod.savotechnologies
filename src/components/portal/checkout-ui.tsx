import type { ReactNode } from "react";
import Image from "next/image";
import styles from "./checkout.module.css";

/** Reference-pinned checkout: restrained Savo white/ink/red, paired method
 * and amount panels, native controls, then a document-like transfer/receipt.
 * Trust marks describe Razorpay or supported networks, never certify Savo. */
export function CheckoutIcon({ name, className }: { name: "lock" | "bank" | "arrow" | "back" | "check" | "download" | "copy" | "info" | "clock" | "mail"; className?: string }) {
  const paths: Record<typeof name, ReactNode> = {
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    bank: <><path d="m3 9 9-6 9 6M3 10h18M5 10v8m5-8v8m4-8v8m5-8v8M3 21h18"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    back: <path d="M20 12H4m6-6-6 6 6 6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></>,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 5V3H3v13h2"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function RazorpayLogo() {
  return <Image src="/images/payments/razorpay.svg" alt="Razorpay" width={100} height={24} className={styles.razorpayLogo} />;
}

export function PaymentTrust() {
  return <div className={styles.trust}>
    <div className={styles.trustMarks} aria-label="Payment security and supported card networks">
      <div className={styles.encryptedMark}><CheckoutIcon name="lock"/><span>Secure connection<small>HTTPS encryption</small></span></div>
      <a href="https://razorpay.com/docs/security/" target="_blank" rel="noopener noreferrer" className={styles.pciMark} aria-label="PCI DSS information from Razorpay (opens in a new tab)">
        <CheckoutIcon name="lock"/>
        <span>PCI DSS<small>Razorpay security</small></span>
      </a>
      <Image src="/images/payments/visa.svg" alt="Visa" width={49} height={22} className={styles.networkLogo}/>
      <Image src="/images/payments/mastercard.svg" alt="Mastercard" width={44} height={30} className={styles.networkLogo}/>
    </div>
    <p>Online payments are handled by Razorpay. Card authentication is handled by your bank when required. Savo does not collect your card or bank-login details.</p>
  </div>;
}

export function CheckoutHelp({ invoiceNumber }: { invoiceNumber: string }) {
  return <div className={styles.help}>
    <CheckoutIcon name="mail"/>
    <div><strong>Need a hand with this payment?</strong><p><a href={`mailto:hello@savotechnologies.com?subject=${encodeURIComponent(`Payment help: ${invoiceNumber}`)}`}>hello@savotechnologies.com</a><span> · Quote {invoiceNumber}</span></p></div>
  </div>;
}
