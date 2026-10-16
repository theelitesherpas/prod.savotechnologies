import "server-only";
import type { Prisma } from "@prisma/client";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { renderTemplate, sendMail } from "@/lib/mail";
import { logger } from "@/lib/logger";
import { BusinessIdError, businessTransaction } from "@/lib/business-ids";
import { deliveryProgress, projectFinancials } from "@/lib/project-finance";

export type ProjectEmail = { key: string; to: string; vars: Record<string, string> };
export async function projectTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return businessTransaction(work, "Serializable");
}

/** Called INSIDE the same transaction as every plan, milestone and invoice
 * mutation. Only matching-owner/currency payments count. No zero-budget or
 * partial-invoice completion. Cancellation always wins over payment events. */
export async function reconcileProject(tx: Prisma.TransactionClient, id: string): Promise<ProjectEmail[]> {
  const project = await tx.clientProject.findUnique({ where: { id }, include: { milestones: true, invoices: true, client: { select: { name: true, email: true } } } });
  if (!project) return [];
  const finances = projectFinancials(project, project.milestones, project.invoices.filter(i => i.clientId === project.clientId));
  if (finances.total != null && !Number.isSafeInteger(finances.total)) throw new Error("Project total exceeds the supported limit.");
  const progress = deliveryProgress(project.milestones);
  let status = project.status, completedByPayment = project.completedByPayment;
  if (status !== "cancelled") {
    if (finances.fullyPaid && status !== "delivered") { status = "delivered"; completedByPayment = true; }
    else if (!finances.fullyPaid && completedByPayment) { status = "in_progress"; completedByPayment = false; }
  }
  if (progress !== project.progress || status !== project.status || completedByPayment !== project.completedByPayment) {
    await tx.clientProject.update({ where: { id }, data: { progress, status, completedByPayment, updatedAt: new Date(Math.max(Date.now(), project.updatedAt.getTime() + 1)) } });
  }
  if (status === project.status) return [];
  const title = status === "delivered" ? "Project completed — full payment recorded" : "Project reopened — balance requires review";
  const body = status === "delivered"
    ? "Payments now cover the agreed project total, including additional work, and no issued invoices remain unpaid. The project has been marked completed. Delivery progress still reflects the milestones marked done."
    : "The agreed scope or recorded payments have changed. The project has been reopened; review the current plan and invoice balances in your portal.";
  await tx.projectUpdate.create({ data: { projectId: id, title, body } });
  return [{ key: "projectUpdate", to: project.client.email, vars: { name: project.client.name, project: project.title, title, body } }];
}

/** Schedule only AFTER commit. Next keeps the work alive after redirects;
 * rendering/sending uses the existing suppression, delivery and logging policy. */
export function projectEmails(events: ProjectEmail[]) {
  if (!events.length) return;
  after(async () => {
    for (const event of events) {
      try { const template = await renderTemplate(event.key, event.vars, event.to); if (template) await sendMail(event.to, template, "hello", { templateKey: event.key }); }
      catch { logger.error("project.notification_failed", { templateKey: event.key }); }
    }
  });
}
export function revalidateProjectViews(id?: string) {
  for (const path of ["/admin/projects", "/admin/invoices", "/admin/clients", "/portal/dashboard", "/portal/projects", "/portal/invoices"]) revalidatePath(path);
  if (id) { revalidatePath(`/admin/projects/${id}`); revalidatePath(`/portal/projects/${id}`); }
}
export function projectError(error: unknown) {
  if (error instanceof BusinessIdError) return error.message;
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "P2002") return "A record conflicts with an existing reference. No changes were saved; ask an administrator to review numbering.";
    if (error.code === "P2034") return "Another update is in progress. Refresh and try again.";
    return "The project could not be saved. Refresh and try again.";
  }
  return error instanceof Error ? error.message : "Please check the project fields.";
}
