import Link from "next/link";
import { PortalIcon, dateLabel } from "./workspace-ui";
import { transactionMoney as money, transactionMethod } from "@/lib/transaction-history";
import styles from "./transactions.module.css";

export type TransactionRow = {
  id: string; invoiceNumber: string; projectTitle: string;
  paymentId: string | null; source: string; method: string | null;
  amount: number; chargedAmount: number | null; currency: string;
  occurredAt: Date | null; pdfHref: string | null;
};

export function TransactionHistory({ transactions }: { transactions: TransactionRow[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table} role="table">
        <caption className={styles.srOnly}>Confirmed invoice payments, newest first. Invoice credit excludes online processing fees.</caption>
        <thead role="rowgroup"><tr role="row">
          <th scope="col" role="columnheader">Transaction</th>
          <th scope="col" role="columnheader">Invoice</th>
          <th scope="col" role="columnheader">Date <span className={styles.zone}>UTC</span></th>
          <th scope="col" role="columnheader" className={styles.money}>Invoice credit</th>
          <th scope="col" role="columnheader" className={styles.money}>Total charged</th>
          <th scope="col" role="columnheader" className={styles.downloadHead}>PDF</th>
        </tr></thead>
        <tbody role="rowgroup">
          {transactions.map(transaction => (
            <tr key={transaction.id} role="row">
              <td role="cell" className={styles.transaction}>
                <span className={styles.reference}>{transaction.paymentId ?? "Payment recorded"}</span>
                <span className={styles.secondary}>{transactionMethod(transaction.source, transaction.method)}</span>
                <span className={styles.confirmed}><PortalIcon name="check" />Confirmed</span>
              </td>
              <td role="cell" className={styles.invoice}>
                <span className={styles.mobileLabel} aria-hidden="true">Invoice</span>
                <span className={styles.invoiceNumber}>{transaction.invoiceNumber}</span>
                {transaction.projectTitle ? <span className={styles.secondary}>{transaction.projectTitle}</span> : null}
              </td>
              <td role="cell" className={styles.date}>
                <span className={styles.mobileLabel} aria-hidden="true">Date · UTC</span>
                {transaction.occurredAt ? <time dateTime={transaction.occurredAt.toISOString()} title={transaction.occurredAt.toUTCString()}>{dateLabel(transaction.occurredAt)}</time> : <span className={styles.secondary}>Not recorded</span>}
              </td>
              <td role="cell" className={`${styles.money} ${styles.credit}`}>
                <span className={styles.mobileLabel} aria-hidden="true">Invoice credit</span>
                <span>{money(transaction.amount, transaction.currency)}</span>
                <span className={styles.secondary}>{transaction.currency}</span>
              </td>
              <td role="cell" className={`${styles.money} ${styles.charged}`}>
                <span className={styles.mobileLabel} aria-hidden="true">Total charged</span>
                {transaction.chargedAmount == null ? <span className={styles.secondary}>Not recorded</span> : <><strong>{money(transaction.chargedAmount, transaction.currency)}</strong><span className={styles.secondary}>{transaction.currency}</span></>}
              </td>
              <td role="cell" className={styles.downloadCell}>
                {transaction.pdfHref ? <a className={styles.pdf} href={transaction.pdfHref} download aria-label={`Download invoice ${transaction.invoiceNumber} as PDF`} title={`Download ${transaction.invoiceNumber} (PDF)`}><PortalIcon name="pdf" /><span>PDF</span><span className={styles.mobileDownload}>Download invoice</span></a> : <span className={styles.unavailable} title="The invoice is no longer available for download.">Unavailable</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TransactionEmpty({ filtered }: { filtered: boolean }) {
  return <section className={styles.empty}>
    <PortalIcon name="transactions" />
    <h2>{filtered ? "No matching transactions." : "No transactions yet."}</h2>
    <p>{filtered ? "Try another invoice, payment reference or project, or clear the filters to see your payment history." : "Confirmed invoice payments will appear here. A bank transfer is added after our team confirms receipt; opening checkout does not record a payment."}</p>
    <Link href={filtered ? "/portal/transactions" : "/portal/invoices"}>{filtered ? "Clear filters" : "View invoices"}<PortalIcon name="arrow" /></Link>
  </section>;
}
