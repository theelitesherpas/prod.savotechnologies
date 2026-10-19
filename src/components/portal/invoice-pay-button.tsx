import { invoicePaymentLink, paymentProvider } from "@/lib/payment-links";
import styles from "./portal.module.css";
import Link from "next/link";

/**
 * The single Pay-now action used across the portal.
 *
 * - External target (validated manual/legacy provider link): native external
 *   navigation, new tab, noopener/noreferrer/no-referrer — unchanged policy.
 * - Portal target (gateway checkout): internal navigation to the checkout
 *   page, where Standard Checkout runs and returns with a server-verified
 *   status. Never a mutation or an unverified success claim.
 */
export function InvoicePayButton({ invoice }: { invoice: { id: string; number: string; amount: number; status: string; paymentLink?: string | null; payUrl?: string | null; payExternal?: boolean } }) {
  const external = invoicePaymentLink(invoice);
  if (external) {
    const provider = paymentProvider(external);
    return <a className={styles.payButton} href={external} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"
      aria-label={`Pay now for invoice ${invoice.number} via ${provider} (opens in a new tab)`}
      title={`Opens ${provider}. Payment status is updated after confirmation.`}>Pay now</a>;
  }
  if (invoice.payUrl && invoice.payExternal === false) {
    return <Link className={styles.payButton} href={invoice.payUrl}
      aria-label={`Pay invoice ${invoice.number} securely online`}>Pay now</Link>;
  }
  return null;
}
