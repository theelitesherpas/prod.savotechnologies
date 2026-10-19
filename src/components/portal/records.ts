import type { ClientProject, Invoice } from "@prisma/client";
import { invoicePaymentLink } from "@/lib/payment-links";
import { invoicePayTarget } from "@/lib/payment-targets";
import type { ProjectRecord, InvoiceRecord } from "./workspace-ui";

/** Only the client-visible record fields cross the interactive boundary. */
export function projectRecord(project: ClientProject): ProjectRecord {
  return {
    id: project.id,
    code: project.code,
    title: project.title,
    summary: project.summary,
    status: project.status,
    progress: project.progress,
    dueDate: project.dueDate?.toISOString() ?? null,
    updatedAt: project.updatedAt.toISOString(),
  };
}
export function invoiceRecord(
  invoice: Invoice & { project?: { code: string; title: string } | null },
  gatewayConfigured = false,
): InvoiceRecord {
  const target = invoicePayTarget(invoice, gatewayConfigured);
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    amount: invoice.amount,
    currency: invoice.currency,
    issuedAt: invoice.issuedAt.toISOString(),
    dueDate: invoice.dueDate?.toISOString() ?? null,
    paidAt: invoice.paidAt?.toISOString() ?? null,
    notes: invoice.notes,
    paymentLink: invoicePaymentLink(invoice),
    payUrl: target ? target.url : null,
    payExternal: target ? target.external : undefined,
    project: invoice.project ?? null,
  };
}
