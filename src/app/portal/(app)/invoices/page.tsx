import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClientUser } from "@/lib/client-auth";
import { money } from "@/components/portal/ui";
import { invoiceTotals, PortalIcon } from "@/components/portal/workspace-ui";
import { invoiceRecord } from "@/components/portal/records";
import { InvoiceBrowser } from "@/components/portal/record-browsers";
import styles from "@/components/portal/portal.module.css";

export const metadata: Metadata = { title: "Invoices" };
export default async function PortalInvoicesPage() {
  const client = await getClientUser();
  if (!client || !prisma) redirect("/portal");
  const invoices = await prisma.invoice.findMany({
    where: { clientId: client.id, status: { notIn: ["draft"] } },
    orderBy: { issuedAt: "desc" },
    include: {
      project: {
        where: { clientId: client.id },
        select: { code: true, title: true },
      },
    },
  });
  const totals = invoiceTotals(invoices);
  return (
    <div className={styles.content}>
      <header className={styles.pageHeader}>
        <h1>Your invoices.</h1>
        <p>
          Review issued invoices and payment history. Amounts stay in their
          original currency; cancelled invoices are excluded from outstanding
          and paid totals.
        </p>
      </header>
      {totals.length ? (
        <div className={styles.currencyTotals}>
          {totals.map((total) => (
            <section
              className={styles.currencyTotal}
              key={total.currency}
              aria-label={`${total.currency} billing summary`}
            >
              <h2>{total.currency} billing summary</h2>
              <dl>
                <div>
                  <dt>Outstanding</dt>
                  <dd>{money(total.due, total.currency)}</dd>
                </div>
                <div>
                  <dt>Paid to date</dt>
                  <dd>{money(total.paid, total.currency)}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      ) : null}
      <InvoiceBrowser invoices={invoices.map(invoiceRecord)} />
      <div className={styles.helpStrip}>
        <p>Questions about an invoice or payment?</p>
        <a href="mailto:hello@savotechnologies.com" className={styles.textLink}>
          Contact the team
          <PortalIcon name="arrow" />
        </a>
      </div>
    </div>
  );
}
