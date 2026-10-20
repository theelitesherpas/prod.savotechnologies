/** Additive history import, safe to repeat. Does NOT fetch provider records,
 * change invoices, reconcile projects, or send mail. Unknown historical charge,
 * method or date stays unknown. Run after prisma db push, before app startup.
 *   node scripts/backfill-payment-transactions.mjs          # count only
 *   node scripts/backfill-payment-transactions.mjs --apply  # insert missing
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
try {
  if (!process.argv.includes("--apply")) {
    console.log(`Paid invoices available for history import: ${await prisma.invoice.count({ where: { status: "paid" } })}. Use --apply to insert missing records.`);
  } else {
    let cursor, inserted = 0;
    for (;;) {
      const invoices = await prisma.invoice.findMany({
        where: { status: "paid", ...(cursor ? { id: { gt: cursor } } : {}), paymentTransactions: { none: {} } },
        orderBy: { id: "asc" }, take: 250,
        include: { project: { select: { clientId: true, title: true } } },
      });
      if (!invoices.length) break;
      const result = await prisma.paymentTransaction.createMany({ skipDuplicates: true, data: invoices.map(invoice => ({
        recordKey: invoice.razorpayPaymentId ? `payment:${invoice.razorpayPaymentId}` : `invoice:${invoice.id}`,
        clientId: invoice.clientId, invoiceId: invoice.id, invoiceNumber: invoice.number,
        projectTitle: invoice.project?.clientId === invoice.clientId ? invoice.project.title : "",
        amount: invoice.amount, currency: invoice.currency, occurredAt: invoice.paidAt,
        paymentId: invoice.razorpayPaymentId, source: invoice.razorpayPaymentId ? "razorpay" : "legacy",
      })) });
      inserted += result.count;
      cursor = invoices.at(-1).id;
    }
    const remaining = await prisma.invoice.count({ where: { status: "paid", paymentTransactions: { none: {} } } });
    if (remaining) throw new Error(`${remaining} paid invoices still have no history. Review reused payment references before restarting; no existing history was overwritten.`);
    console.log(`Payment history import complete: ${inserted} missing records inserted; existing history unchanged.`);
  }
} finally { await prisma.$disconnect(); }
