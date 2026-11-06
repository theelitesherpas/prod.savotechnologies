import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClientUser } from "@/lib/client-auth";
import { CLIENT_INVOICE_STATUSES } from "@/lib/invoice-document";
import { TRANSACTIONS_PER_PAGE, transactionFilters, transactionWhere, transactionPageHref } from "@/lib/transaction-history";
import { TransactionEmpty, TransactionHistory } from "@/components/portal/transaction-history";
import { PortalIcon } from "@/components/portal/workspace-ui";
import workspace from "@/components/portal/portal.module.css";
import styles from "@/components/portal/transactions.module.css";

export const metadata: Metadata = { title: "Transactions", robots: { index: false, follow: false } };

/** Operate: extend the existing white/gray/red workspace, not a second app.
 * A stable, aligned ledger is the primary surface; original currency and
 * immutable payment facts lead. Native GET filters and bounded pagination;
 * each row offers the invoice PDF. Mobile reflows rows without hiding facts. */
export default async function PortalTransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const client = await getClientUser();
  if (!client || !prisma) redirect("/portal");
  const filters = transactionFilters(await searchParams);
  const where = transactionWhere(client.id, filters);
  const [total, currencies] = await Promise.all([
    prisma.paymentTransaction.count({ where }),
    prisma.paymentTransaction.findMany({ where: { clientId: client.id }, distinct: ["currency"], select: { currency: true }, orderBy: { currency: "asc" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / TRANSACTIONS_PER_PAGE));
  const page = Math.min(filters.page, pages);
  const transactions = await prisma.paymentTransaction.findMany({
    where, take: TRANSACTIONS_PER_PAGE, skip: (page - 1) * TRANSACTIONS_PER_PAGE,
    orderBy: [{ occurredAt: { sort: "desc", nulls: "last" } }, { recordedAt: "desc" }, { id: "desc" }],
    include: { invoice: { select: { id: true, clientId: true, status: true } } },
  });
  const filtered = !!filters.q || filters.currency !== "all" || filters.source !== "all";
  return <div className={workspace.content}>
    <header className={workspace.pageHeader}>
      <h1>Transactions.</h1>
      <p>Your confirmed invoice payments, in one place. Find a payment reference, review the amount and download the linked invoice.</p>
    </header>
    <form action="/portal/transactions" method="get" className={styles.filters} aria-label="Filter transactions" key={`${filters.q}:${filters.source}:${filters.currency}`}>
      <div className={styles.search}><label htmlFor="transaction-search">Search transactions</label><input type="search" name="q" id="transaction-search" defaultValue={filters.q} maxLength={160} placeholder="Invoice, payment reference or project" /></div>
      <div><label htmlFor="transaction-source">Payment source</label><select name="source" id="transaction-source" defaultValue={filters.source}><option value="all">All payments</option><option value="razorpay">Razorpay</option><option value="recorded">Manually recorded</option></select></div>
      <div><label htmlFor="transaction-currency">Currency</label><select name="currency" id="transaction-currency" defaultValue={filters.currency}><option value="all">All</option>{!currencies.some(row => row.currency === filters.currency) && filters.currency !== "all" ? <option value={filters.currency}>{filters.currency}</option> : null}{currencies.map(row => <option key={row.currency} value={row.currency}>{row.currency}</option>)}</select></div>
      <button type="submit">Apply filters</button>
    </form>
    <div className={styles.results}>
      <p role="status">{total ? `Showing ${(page - 1) * TRANSACTIONS_PER_PAGE + 1}–${Math.min(page * TRANSACTIONS_PER_PAGE, total)} of ${total} ${total === 1 ? "transaction" : "transactions"}` : "0 transactions"}</p>
      {filtered ? <Link href="/portal/transactions">Clear filters</Link> : <span>Newest first</span>}
    </div>
    {transactions.length ? <>
      <TransactionHistory transactions={transactions.map(transaction => ({ ...transaction,
        pdfHref: transaction.invoice?.clientId === client.id && CLIENT_INVOICE_STATUSES.includes(transaction.invoice.status as typeof CLIENT_INVOICE_STATUSES[number]) ? `/portal/invoices/${transaction.invoice.id}/pdf` : null,
      }))} />
      <p className={styles.note}>Invoice credit excludes online processing fees. Total charged is shown only when recorded by Razorpay; missing historical charges are not estimated. Amounts remain in their original currency.</p>
      {pages > 1 ? <nav className={styles.pagination} aria-label="Transaction pages">
        {page > 1 ? <Link href={transactionPageHref(filters, page - 1)} rel="prev"><PortalIcon name="back" />Previous</Link> : <span aria-disabled="true">Previous</span>}
        <span>Page {page} of {pages}</span>
        {page < pages ? <Link href={transactionPageHref(filters, page + 1)} rel="next">Next<PortalIcon name="arrow" /></Link> : <span aria-disabled="true">Next</span>}
      </nav> : null}
    </> : <TransactionEmpty filtered={filtered} />}
    <div className={workspace.helpStrip}><p>Can’t find a payment? Transfers appear after confirmation.</p><a href="mailto:hello@savotechnologies.com" className={workspace.textLink}>Contact the team<PortalIcon name="arrow" /></a></div>
  </div>;
}
