import { invoiceMoney } from "@/lib/invoice-document";
import type { InvoiceItem } from "@/lib/billing-items";
import styles from "./billing-breakdown.module.css";

export function BillingBreakdown({ items, currency }: { items: InvoiceItem[]; currency: string }) {
  if (!items.length) return null;
  return <dl className={styles.list} aria-label="Tasks and pricing">{items.map((item, index) => <div key={index}><dt>{item.description}</dt><dd>{invoiceMoney(item.amount, currency)}</dd></div>)}</dl>;
}
