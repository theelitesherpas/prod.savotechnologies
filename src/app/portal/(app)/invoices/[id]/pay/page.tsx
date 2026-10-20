import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getClientUser } from "@/lib/client-auth";
import { getRazorpayConfig } from "@/lib/razorpay-config";
import { getBankDetails } from "@/lib/bank-details";
import { checkoutTotals } from "@/lib/payment-fees";
import { invoicePaymentLink } from "@/lib/payment-links";
import { verifiedReceiptPayment } from "@/lib/payment-receipt";
import { fetchRazorpayPayment } from "@/lib/razorpay";
import { PaymentMethodChooser } from "@/components/portal/payment-method-chooser";
import { CheckoutHelp, CheckoutIcon } from "@/components/portal/checkout-ui";
import { CopyValue, PaymentStatusRefresh, PrintPayment } from "@/components/portal/checkout-actions";
import { createRazorpayOrderAction, verifyCheckoutAction } from "./actions";
import styles from "@/components/portal/checkout.module.css";

export const metadata: Metadata = { title: "Pay invoice", robots: { index: false, follow: false } };

/** Reference-pinned Operate surface: paired payment-method / amount panels,
 * bank review → instructions, then a document-style paid receipt. Savo's
 * existing neutral/red portal identity and server-owned payment truth remain.
 * No query flag can make an invoice paid; drafts and foreign IDs stay private. */
export default async function PayInvoicePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; payError?: string }>;
}) {
  const client = await getClientUser();
  if (!client || !prisma) redirect("/portal");
  const { id } = await params;
  const { paid, payError } = await searchParams;
  const invoice = await prisma.invoice.findFirst({
    where: { id, clientId: client.id, status: { in: ["sent", "overdue", "paid", "cancelled"] } },
    include: { project: { where: { clientId: client.id }, select: { code: true, title: true } } },
  });
  if (!invoice) redirect("/portal/invoices");

  const fmtDate = (d: Date | null) => d ? d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }) : "Not recorded";
  const moneyFormat = new Intl.NumberFormat("en-IN", { style: "currency", currency: invoice.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtMoney = (minor: number) => moneyFormat.format(minor / 100);
  const verifiedPaid = invoice.status === "paid";
  const payable = ["sent", "overdue"].includes(invoice.status) && invoice.amount > 0;
  const external = invoicePaymentLink(invoice);
  const gateway = payable && !invoice.paymentLink ? await getRazorpayConfig().catch(() => null) : null;
  const bank = payable && !invoice.paymentLink ? await getBankDetails().catch(() => null) : null;
  const totals = checkoutTotals(invoice);
  // Read only the safe provider facts for an already-paid invoice. Never
  // infer a historic charge using current fee rates, or expose raw payloads.
  const providerPayment = verifiedPaid && invoice.razorpayPaymentId
    ? await fetchRazorpayPayment(invoice.razorpayPaymentId).catch(() => null) : null;
  const receipt = verifiedReceiptPayment(invoice, providerPayment);

  if (verifiedPaid) return <div className={styles.page}>
    <Link className={`${styles.backLink} ${styles.noPrint}`} href="/portal/invoices"><CheckoutIcon name="back"/>All invoices</Link>
    <article className={`${styles.receipt} ${styles.printSheet}`}>
      <div className={styles.documentHeader}><strong>Payment confirmation</strong><span className={styles.paidPill}><CheckoutIcon name="check" className={styles.srOnly}/>Paid in full</span></div>
      <header className={styles.receiptHero}>
        <span className={styles.successMark}><CheckoutIcon name="check"/></span>
        <h1>Payment successful.</h1>
        <p>Thank you, {client.name}. Your payment has been recorded and invoice <strong>{invoice.number}</strong> is paid in full.</p>
        <div className={styles.receiptAmount}><span>{receipt ? "Total payment received" : "Invoice amount paid"}</span><strong>{fmtMoney(receipt?.total ?? invoice.amount)} <small>{invoice.currency}</small></strong></div>
      </header>
      <dl className={styles.metaRows}>
        <div><dt>Invoice</dt><dd>{invoice.number}</dd></div>
        <div><dt>Paid by</dt><dd>{client.name}{client.company ? ` · ${client.company}` : ""}</dd></div>
        <div><dt>Account email</dt><dd>{client.email}</dd></div>
        {invoice.project ? <div><dt>Project</dt><dd>{invoice.project.title}</dd></div> : null}
        <div><dt>Payment date</dt><dd>{fmtDate(invoice.paidAt)}</dd></div>
        {invoice.razorpayPaymentId ? <div><dt>Payment reference</dt><dd><CopyValue value={invoice.razorpayPaymentId} label="payment reference"/></dd></div> : null}
        {invoice.razorpayOrderId ? <div><dt>Order reference</dt><dd>{invoice.razorpayOrderId}</dd></div> : null}
        {receipt?.method ? <div><dt>Payment method</dt><dd>{receipt.method} via Razorpay</dd></div> : null}
        <div><dt>Applied to invoice</dt><dd>{fmtMoney(invoice.amount)}</dd></div>
        {receipt && receipt.extra > 0 ? <div><dt>Processing fees &amp; taxes paid</dt><dd>{fmtMoney(receipt.extra)}</dd></div> : null}
        <div><dt>Outstanding balance</dt><dd>{fmtMoney(0)}</dd></div>
      </dl>
      <div className={styles.notice}><CheckoutIcon name="check"/><div><strong>You’re all set. No further payment is due.</strong><p>This confirmation stays in your portal. Download the updated invoice for your records, or quote the payment reference if you contact our team.</p></div></div>
      <div className={styles.documentActions}><a className={styles.primary} href={`/portal/invoices/${invoice.id}/pdf`} download><CheckoutIcon name="download"/>Download paid invoice</a><PrintPayment label="Print confirmation"/></div>
      <CheckoutHelp invoiceNumber={invoice.number}/>
    </article>
  </div>;

  if (!payable || paid) return <div className={styles.page}>
    <Link className={styles.backLink} href="/portal/invoices"><CheckoutIcon name="back"/>All invoices</Link>
    <section className={styles.resultPanel}>
      <span className={styles.documentIcon}><CheckoutIcon name={payable ? "clock" : "info"}/></span>
      <h1>{payable ? "Checking your payment" : invoice.status === "cancelled" ? "This invoice is cancelled" : "No payment is due"}</h1>
      <p>{payable ? "Your invoice is not yet marked paid. If your bank shows a debit, don’t pay again while we check the confirmation. This page checks for a status update for up to one minute." : "This invoice is not open for payment. Contact our team if you need a replacement or have already sent funds."}</p>
      <dl className={styles.metaRows}><div><dt>Invoice</dt><dd>{invoice.number}</dd></div><div><dt>Invoice amount</dt><dd>{fmtMoney(invoice.amount)} {invoice.currency}</dd></div></dl>
      <div className={styles.resultActions}>{payable ? <PaymentStatusRefresh/> : null}<Link className={styles.secondary} href="/portal/invoices">Back to invoices</Link></div>
      <CheckoutHelp invoiceNumber={invoice.number}/>
    </section>
  </div>;

  const details = <section className={styles.invoiceDetails} aria-labelledby="invoice-details-title">
    <h2 id="invoice-details-title">Invoice details</h2>
    <dl className={styles.metaRows}>
      <div><dt>Billed to</dt><dd>{client.company || client.name}</dd></div>
      {invoice.project ? <div><dt>Project</dt><dd>{invoice.project.title}</dd></div> : null}
      <div><dt>Issued on</dt><dd>{fmtDate(invoice.issuedAt)}</dd></div>
      <div><dt>Due date</dt><dd>{invoice.dueDate ? fmtDate(invoice.dueDate) : "On receipt"}</dd></div>
      <div><dt>Invoice currency</dt><dd>{invoice.currency}</dd></div>
    </dl>
    {invoice.notes ? <p className={styles.notes}>{invoice.notes}</p> : null}
    <a className={styles.backLink} href={`/portal/invoices/${invoice.id}/pdf?view=1`} target="_blank" rel="noopener noreferrer">View invoice PDF<CheckoutIcon name="arrow"/></a>
  </section>;

  return <div className={styles.page}>
    <Link className={styles.backLink} href="/portal/invoices"><CheckoutIcon name="back"/>All invoices</Link>
    <header className={styles.heading}><div><h1>Complete your payment</h1><p>Choose how you’d like to pay invoice {invoice.number}. Review the total before you continue.</p></div><span className={styles.secureLabel}><CheckoutIcon name="lock"/>Secure payment</span></header>
    {payError ? <div className={styles.notice} role="alert"><CheckoutIcon name="info"/><div><strong>We couldn’t confirm your payment.</strong><p>{payError.slice(0, 500)} If you were charged, contact us with your payment reference before trying again.</p></div></div> : null}
    {invoice.paymentLink ? <div className={styles.checkoutGrid}><div>{details}<CheckoutHelp invoiceNumber={invoice.number}/></div><section className={styles.panel}>
      <div className={styles.panelHeading}><h2>Payment summary</h2><span className={styles.currency}>{invoice.currency}</span></div>
      <div className={styles.summaryBody}><div className={styles.invoiceReference}><span>Invoice</span><strong>{invoice.number}</strong></div><div className={styles.total}><span>Invoice amount</span><strong>{fmtMoney(invoice.amount)}</strong></div>
        {external ? <a className={styles.primary} href={external} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Continue to the payment provider<CheckoutIcon name="arrow"/></a> : <p className={styles.inlineError}>The payment link is unavailable. Please contact our team.</p>}
        <p className={styles.actionNote}>This invoice uses a payment link supplied by Savo. You’ll complete payment on the provider’s website. Razorpay checkout is not used for this invoice.</p>
      </div>
    </section></div> : <PaymentMethodChooser
      invoiceId={invoice.id} invoiceNumber={invoice.number} currencyLabel={invoice.currency}
      labels={{ subtotal: fmtMoney(totals.subtotal), fee: fmtMoney(totals.fee), gst: totals.gst > 0 ? fmtMoney(totals.gst) : null, total: fmtMoney(totals.total) }}
      totals={totals} bank={bank} providerUnavailable={!gateway} createOrder={createRazorpayOrderAction} verifyPayment={verifyCheckoutAction} invoiceDetails={details}
    />}
  </div>;
}
