import type { ClientProject, Invoice } from "@prisma/client";
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
): InvoiceRecord {
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
    project: invoice.project ?? null,
  };
}
