import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getClientUser } from "@/lib/client-auth";
import { getRazorpayConfig } from "@/lib/razorpay-config";
import { money } from "@/components/portal/ui";
import { RazorpayCheckout } from "@/components/portal/razorpay-checkout";
import { createRazorpayOrderAction, verifyCheckoutAction } from "./actions";
import styles from "@/components/portal/portal.module.css";

export const metadata: Metadata = { title: "Pay invoice", robots: { index: false, follow: false } };

/**
 * Portal checkout page — the destination of every gateway Pay now action.
 * Owner-scoped (a session can only ever see its own invoice), payable-only.
 * The success/failure banners after the checkout redirect are derived from
 * the DATABASE (invoice status / stored payment id), never from client-side
 * claims: ?paid=1 only renders a success banner when the invoice is
 * actually recorded as paid server-side.
 */
export default async function PayInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; payError?: string }>;
}) {
  const client = await getClientUser();
  if (!client || !prisma) redirect("/portal");
  const { id } = await params;
  const { paid, payError } = await searchParams;
  const invoice = await prisma.invoice.findFirst({
    where: { id, clientId: client.id },
    include: { project: { where: { clientId: client.id }, select: { code: true, title: true } } },
  });
  if (!invoice) redirect("/portal/invoices");

  const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
  const verifiedPaid = invoice.status === "paid";
  const payable = ["sent", "overdue"].includes(invoice.status) && invoice.amount > 0 && !invoice.paymentLink;
  const gateway = await getRazorpayConfig().catch(() => null);

  return (
    <div className={styles.content}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>{invoice.project ? invoice.project.code : "Invoice"}</p>
        <h1>{verifiedPaid ? "Payment successful." : payable ? "Pay your invoice." : "Invoice."}</h1>
      </header>

      {/* ── Post-redirect banners (server-verified truth) ─────────────── */}
      {paid && verifiedPaid ? (
        <div className={styles.paySuccess} role="status">
          <h2>Payment received — thank you.</h2>
          <p>
            Invoice <strong>{invoice.number}</strong> · <strong>{money(invoice.amount, invoice.currency)}</strong> was paid in full and is
            recorded in your portal. A receipt email is on its way{client.email ? ` to ${client.email}` : ""}.
          </p>
          <dl className={styles.payDetails}>
            <div><dt>Payment reference</dt><dd className="tnum">{invoice.razorpayPaymentId ?? "—"}</dd></div>
            <div><dt>Paid on</dt><dd>{invoice.paidAt ? fmtDate(invoice.paidAt) : fmtDate(new Date())}</dd></div>
            <div><dt>Invoice</dt><dd>{invoice.number}</dd></div>
            <div><dt>Amount</dt><dd>{money(invoice.amount, invoice.currency)}</dd></div>
          </dl>
          <div className={styles.payAfterLinks}>
            <Link href={`/portal/invoices/${invoice.id}/pdf?view=1`} target="_blank" rel="noopener noreferrer">View / print the PDF</Link>
            <Link href="/portal/invoices">Back to your invoices</Link>
          </div>
        </div>
      ) : null}
      {paid && !verifiedPaid ? (
        <div className={styles.payPending} role="status">
          <h2>Payment confirmation is being verified.</h2>
          <p>Your payment is being confirmed with the payment gateway. This page updates automatically once verification
            completes — usually within a minute. Nothing needs to be paid twice; if you were charged, the payment is
            matched to this invoice.</p>
        </div>
      ) : null}
      {payError ? (
        <div className={styles.payFailed} role="alert">
          <h2>Payment not completed.</h2>
          <p>{decodeURIComponent(payError)}</p>
        </div>
      ) : null}

      {/* ── Invoice summary ───────────────────────────────────────────── */}
      <div className={styles.payCard}>
        <div className={styles.paySummaryHead}>
          <div>
            <p className={styles.payNumber}>{invoice.number}</p>
            <p className={styles.payMeta}>
              {invoice.project ? `${invoice.project.title} · ` : ""}Issued {fmtDate(invoice.issuedAt)}
              {invoice.dueDate ? ` · Due ${fmtDate(invoice.dueDate)}` : ""}
            </p>
          </div>
          <p className={styles.payAmount}>{money(invoice.amount, invoice.currency)}</p>
        </div>
        {invoice.notes ? <p className={styles.payNotes}>{invoice.notes}</p> : null}

        {verifiedPaid ? (
          <p className={styles.payNote}>This invoice is already paid in full. Thank you.</p>
        ) : invoice.paymentLink ? (
          <div className={styles.payActionArea}>
            <a className={styles.payCta} href={invoice.paymentLink} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
              Continue to the payment provider
            </a>
            <p className={styles.payHint}>This invoice uses a provider-hosted payment page. Complete the payment there; the status here updates after confirmation by the Savo team.</p>
          </div>
        ) : payable ? (
          <RazorpayCheckout invoiceId={invoice.id} invoiceNumber={invoice.number} amountLabel={money(invoice.amount, invoice.currency)} providerUnavailable={!gateway} createOrder={createRazorpayOrderAction} verifyPayment={verifyCheckoutAction} />
        ) : (
          <p className={styles.payNote}>This invoice is not open for online payment. If this looks wrong, contact us at hello@savotechnologies.com.</p>
        )}
      </div>

      <div className={styles.payFooterNote}>
        <p>Payments are processed by Razorpay. Savo never stores your card, UPI or bank details. If a payment fails, no amount is recorded and you can safely retry.</p>
      </div>
    </div>
  );
}
