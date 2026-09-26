import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClientUser } from "@/lib/client-auth";
import { InvoiceStatusChip, money } from "@/components/portal/ui";

/** Payments - full billing history with status. */
export default async function PortalInvoicesPage() {
  const client = await getClientUser();
  if (!client) redirect("/portal");
  if (!prisma) redirect("/portal");

  const invoices = await prisma.invoice.findMany({
    where: { clientId: client.id, status: { notIn: ["draft"] } },
    orderBy: { issuedAt: "desc" },
    include: { project: { select: { code: true, title: true } } },
  });

  const totals = invoices.reduce(
    (acc, inv) => {
      const key = inv.status === "paid" ? "paid" : inv.status === "cancelled" ? "cancelled" : "due";
      acc[key] += inv.amount;
      return acc;
    },
    { paid: 0, due: 0, cancelled: 0 } as Record<"paid" | "due" | "cancelled", number>,
  );

  const fmt = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <div className="shell py-12 sm:py-16">
      <header className="mb-10">
        <p className="t-label text-accent">Payments</p>
        <h1 className="t-h2 mt-3">Billing history.</h1>
        <dl className="mt-8 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3">
          <div className="bg-background p-5">
            <dt className="t-label text-muted">Outstanding</dt>
            <dd className="t-h4 tnum mt-2">{money(totals.due, "INR")}</dd>
          </div>
          <div className="bg-background p-5">
            <dt className="t-label text-muted">Paid to date</dt>
            <dd className="t-h4 tnum mt-2">{money(totals.paid, "INR")}</dd>
          </div>
          <div className="bg-background p-5">
            <dt className="t-label text-muted">Invoices</dt>
            <dd className="t-h4 tnum mt-2">{invoices.length}</dd>
          </div>
        </dl>
      </header>

      {invoices.length === 0 ? (
        <p className="t-sm border border-border bg-surface p-6 text-muted">No invoices yet.</p>
      ) : (
        <ul className="divide-y divide-border border border-border bg-surface">
          {invoices.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
              <div className="min-w-0">
                <p className="t-sm font-semibold tnum">{inv.number}</p>
                <p className="t-caption mt-1 text-muted">
                  {inv.project ? `${inv.project.code} · ${inv.project.title} · ` : ""}
                  Issued {fmt(inv.issuedAt)}
                  {inv.dueDate ? ` · due ${fmt(inv.dueDate)}` : ""}
                  {inv.paidAt ? ` · paid ${fmt(inv.paidAt)}` : ""}
                </p>
                {inv.notes ? <p className="t-caption mt-1 text-muted/80">{inv.notes}</p> : null}
              </div>
              <div className="flex items-center gap-4">
                <p className="t-sm font-semibold tnum">{money(inv.amount, inv.currency)}</p>
                <InvoiceStatusChip status={inv.status} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="t-caption mt-8 text-muted">
        Questions about an invoice? <a href="mailto:hello@savotechnologies.com" className="text-foreground underline-offset-4 hover:text-accent hover:underline">hello@savotechnologies.com</a>
      </p>
    </div>
  );
}
