import { invoicePaymentLink, paymentProvider } from "@/lib/payment-links";
import styles from "./portal.module.css";

/** Native provider navigation, never a mutation or an unverified success callback. */
export function InvoicePayButton({ invoice }: { invoice: { number: string; amount: number; status: string; paymentLink?: string | null } }) {
  const href = invoicePaymentLink(invoice);
  if (!href) return null;
  const provider = paymentProvider(href);
  return <a className={styles.payButton} href={href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
    aria-label={`Pay now for invoice ${invoice.number} via ${provider} (opens in a new tab)`}
    title={`Opens ${provider}. Payment status is updated after confirmation.`}>Pay now</a>;
}
