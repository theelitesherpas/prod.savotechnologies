"use server";

import { generateBusinessId, claimBusinessId, rejectManualBusinessId, assertUnchangedReference } from "@/lib/business-ids";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { parseProjectForm, parseAdditionalForm } from "@/lib/project-input";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/project-finance";
import { invoiceMoney } from "@/lib/invoice-document";
import { projectTransaction, reconcileProject, projectEmails, revalidateProjectViews, projectError, type ProjectEmail } from "@/lib/project-service";

const idValue = (form: FormData, key = "id") => z.string().regex(/^[A-Za-z0-9_-]{10,64}$/).parse(form.get(key));
async function operator() { const user = await requireAdmin(); await requireSection("clients"); if (!prisma) redirect("/admin/projects?e=Database%20unavailable."); return user; }
function failed(base: string, error: unknown): never { redirect(`${base}?e=${encodeURIComponent(projectError(error))}`); }
function revision(form: FormData, updatedAt: Date) {
  if (form.get("revision") !== updatedAt.toISOString()) throw new Error("This project changed while you were editing. Refresh before saving.");
}
function event(project: { title: string; client: { name: string; email: string } }, title: string, body: string): ProjectEmail {
  return { key: "projectUpdate", to: project.client.email, vars: { name: project.client.name, project: project.title, title, body } };
}

export async function archiveProjectAction(form: FormData): Promise<void> {
  const user = await operator();
  const id = idValue(form);
  const project = await prisma!.clientProject.findUnique({ where: { id }, select: { id: true, archivedAt: true } });
  if (!project) redirect("/admin/projects?e=Project%20not%20found.");
  if (!project.archivedAt) {
    await prisma!.clientProject.update({ where: { id }, data: { archivedAt: new Date(), updatedAt: new Date() } });
    await audit(user.id, "project.archive", "ClientProject", id);
  }
  revalidateProjectViews(id);
  redirect("/admin/projects?showArchived=1&saved=archived");
}

export async function restoreProjectAction(form: FormData): Promise<void> {
  const user = await operator();
  const id = idValue(form);
  const result = await prisma!.clientProject.updateMany({ where: { id, archivedAt: { not: null } }, data: { archivedAt: null, updatedAt: new Date() } });
  if (!result.count) redirect("/admin/projects?showArchived=1&e=Archived%20project%20not%20found.");
  await audit(user.id, "project.restore", "ClientProject", id);
  revalidateProjectViews(id);
  redirect("/admin/projects?saved=restored");
}

export async function createProjectAction(form: FormData): Promise<void> {
  const user = await operator();
  let id = "", events: ProjectEmail[] = [];
  try {
    rejectManualBusinessId(form.get("businessId"));
    rejectManualBusinessId(form.get("code"));
    const d = parseProjectForm(form);
    const result = await projectTransaction(async tx => {
      if (!(await tx.clientUser.findUnique({ where: { id: d.clientId }, select: { id: true } }))) throw new Error("Choose an existing client.");
      if (d.milestones.some(m => m.id)) throw new Error("New projects cannot reuse existing milestones.");
      const { milestones, budgetMajor, ...core } = d;
      const businessId = await claimBusinessId(form, "PR", user.id, tx) ?? await generateBusinessId("PR", tx);
      const project = await tx.clientProject.create({ data: { ...core, code: businessId, businessId, budget: budgetMajor,
        milestones: { create: milestones.map((m, order) => ({ title: m.title, description: m.description, amount: m.amountMajor, dueDate: m.dueDate, status: m.status, scope: "base", order })) } },
        include: { client: { select: { name: true, email: true } } } });
      await reconcileProject(tx, project.id);
      return { id: project.id, events: [event(project, "Your project plan is ready", `Your project has been created with a base budget of ${invoiceMoney(budgetMajor, core.currency)}. You can review the description, estimated delivery date and milestone allocations in your client portal.`)] };
    });
    id = result.id; events = result.events;
  } catch (error) { failed("/admin/projects/new", error); }
  await audit(user.id, "project.create", "ClientProject", id);
  revalidateProjectViews(id); projectEmails(events); redirect(`/admin/projects/${id}?saved=1`);
}

export async function updateProjectAction(form: FormData): Promise<void> {
  const user = await operator(); const id = idValue(form); let events: ProjectEmail[] = [];
  try {
    const d = parseProjectForm(form);
    events = await projectTransaction(async tx => {
      const current = await tx.clientProject.findUnique({ where: { id }, include: { milestones: true, invoices: true } });
      if (!current) throw new Error("Project not found.");
      revision(form, current.updatedAt);
      rejectManualBusinessId(form.get("businessId"));
      assertUnchangedReference(d.code, current.code);
      if (current.invoices.length && d.clientId !== current.clientId) throw new Error("Client cannot change after invoices have been linked.");
      if (current.budget != null && current.invoices.length && d.currency !== current.currency) throw new Error("Currency cannot change after invoices have been linked.");
      if (current.invoices.some(i => i.status !== "cancelled" && i.currency !== d.currency)) throw new Error("Linked invoice currencies must match the project currency. Correct or unlink conflicting billing records first.");
      if (!(await tx.clientUser.findUnique({ where: { id: d.clientId }, select: { id: true } }))) throw new Error("Choose an existing client.");
      const old = new Set(current.milestones.filter(m => m.scope === "base").map(m => m.id));
      if (d.milestones.some(m => m.id && !old.has(m.id))) throw new Error("A milestone does not belong to this project's base plan.");
      const keep = d.milestones.flatMap(m => m.id ? [m.id] : []);
      const removed = current.milestones.filter(m => m.scope === "base" && !keep.includes(m.id)).map(m => m.id);
      // A billed milestone keeps its invoice history; unlink the invoices first.
      if (current.invoices.some(i => i.milestoneId && removed.includes(i.milestoneId))) throw new Error("A milestone being removed still has linked invoices. Unlink those invoices before removing the milestone.");
      await tx.projectMilestone.deleteMany({ where: { projectId: id, scope: "base", id: { notIn: keep } } });
      for (const [order, m] of d.milestones.entries()) {
        const data = { title: m.title, description: m.description, amount: m.amountMajor, dueDate: m.dueDate, status: m.status, order };
        if (m.id) await tx.projectMilestone.update({ where: { id: m.id, projectId: id, scope: "base" }, data });
        else await tx.projectMilestone.create({ data: { ...data, projectId: id, scope: "base" } });
      }
      const budgetMajor = d.budgetMajor;
      const core = { clientId: d.clientId, title: d.title, code: current.code, summary: d.summary, currency: d.currency, status: d.status, startDate: d.startDate, dueDate: d.dueDate };
      const project = await tx.clientProject.update({ where: { id }, data: { ...core, budget: budgetMajor, completedByPayment: d.status === current.status ? current.completedByPayment : false }, include: { client: { select: { name: true, email: true } } } });
      const automatic = await reconcileProject(tx, id);
      return [event(project, "Your project plan has been updated", `The project details and milestone plan have been updated. Base budget: ${invoiceMoney(budgetMajor, d.currency)}. Review the current scope, dates and delivery progress in your portal.`), ...automatic];
    });
  } catch (error) { failed(`/admin/projects/${id}/edit`, error); }
  await audit(user.id, "project.update", "ClientProject", id);
  revalidateProjectViews(id); projectEmails(events); redirect(`/admin/projects/${id}?saved=1`);
}

export async function cycleMilestoneAction(form: FormData): Promise<void> {
  const user = await operator(); const projectId = idValue(form, "projectId"); const id = idValue(form); let events: ProjectEmail[] = [];
  try {
    events = await projectTransaction(async tx => {
      const project = await tx.clientProject.findUnique({ where: { id: projectId }, include: { client: { select: { name: true, email: true } } } });
      if (!project) throw new Error("Project not found.");
      if (project.status === "cancelled") throw new Error("Reopen the project before changing delivery statuses.");
      const milestone = await tx.projectMilestone.findFirst({ where: { id, projectId } });
      if (!milestone) throw new Error("Milestone not found in this project.");
      const status = z.enum(["pending", "in_progress", "done"]).parse(form.get("status"));
      if (milestone.status === status) return [];
      await tx.projectMilestone.update({ where: { id, projectId }, data: { status } });
      await tx.clientProject.update({ where: { id: projectId }, data: { updatedAt: new Date() } });
      const title = `${milestone.title} — ${status === "done" ? "completed" : status === "in_progress" ? "started" : "returned to upcoming"}`;
      await tx.projectUpdate.create({ data: { projectId, title, body: "Delivery progress has been recalculated from the milestone plan." } });
      const automatic = await reconcileProject(tx, projectId);
      const notification: ProjectEmail = status === "pending" ? event(project, title, "The milestone status has changed. Review your current delivery plan in the client portal.") : { key: "milestoneUpdate", to: project.client.email, vars: { name: project.client.name, project: project.title, milestone: milestone.title, status: status === "done" ? "completed" : "started" } };
      return [notification, ...automatic];
    });
  } catch (error) { failed(`/admin/projects/${projectId}`, error); }
  await audit(user.id, "project.milestoneStatus", "ClientProject", projectId, { milestoneId: id });
  revalidateProjectViews(projectId); projectEmails(events); redirect(`/admin/projects/${projectId}?saved=milestone`);
}

export async function saveAdditionalWorkAction(form: FormData): Promise<void> {
  const user = await operator(); const projectId = idValue(form, "projectId"); let events: ProjectEmail[] = [];
  try {
    const d = parseAdditionalForm(form); const id = form.get("id") ? idValue(form) : null;
    events = await projectTransaction(async tx => {
      const project = await tx.clientProject.findUnique({ where: { id: projectId }, include: { client: { select: { name: true, email: true } } } });
      if (!project) throw new Error("Project not found.");
      revision(form, project.updatedAt);
      if (project.budget == null) throw new Error("Set the base budget and allocate the base milestones before adding paid scope.");
      const data = { title: d.title, description: d.description, amount: d.amountMajor, status: d.status, dueDate: d.dueDate };
      if (id) {
        if (!(await tx.projectMilestone.findFirst({ where: { id, projectId, scope: "additional" } }))) throw new Error("Additional work not found in this project.");
        await tx.projectMilestone.update({ where: { id, projectId, scope: "additional" }, data });
      } else await tx.projectMilestone.create({ data: { ...data, projectId, scope: "additional", order: 999 } });
      // Touch the project even if computed progress/status is unchanged so
      // optimistic editors cannot overwrite an additional-scope change.
      await tx.clientProject.update({ where: { id: projectId }, data: { updatedAt: new Date() } });
      const title = id ? "Additional work updated" : "Additional work added";
      const body = `${d.title}: ${invoiceMoney(d.amountMajor, project.currency)}. ${d.description} Review the additional scope and updated agreed total in your portal.`;
      await tx.projectUpdate.create({ data: { projectId, title, body } });
      return [event(project, title, body), ...await reconcileProject(tx, projectId)];
    });
  } catch (error) { failed(`/admin/projects/${projectId}`, error); }
  await audit(user.id, "project.additionalWork", "ClientProject", projectId);
  revalidateProjectViews(projectId); projectEmails(events); redirect(`/admin/projects/${projectId}?saved=additional`);
}

export async function changeProjectStatusAction(form: FormData): Promise<void> {
  const user = await operator(); const id = idValue(form); let events: ProjectEmail[] = [];
  try {
    const status = z.enum(PROJECT_STATUSES).parse(form.get("status"));
    events = await projectTransaction(async tx => {
      const project = await tx.clientProject.findUnique({ where: { id }, include: { client: { select: { name: true, email: true } } } });
      if (!project) throw new Error("Project not found."); revision(form, project.updatedAt);
      if (project.status === status) return [];
      await tx.clientProject.update({ where: { id }, data: { status, completedByPayment: false } });
      const title = `Project ${PROJECT_STATUS_LABELS[status].toLowerCase()}`;
      const body = `Your delivery lead marked the project ${PROJECT_STATUS_LABELS[status].toLowerCase()}. Milestone progress and invoice payment records are unchanged. Contact us if you need clarification.`;
      await tx.projectUpdate.create({ data: { projectId: id, title, body } });
      return [event(project, title, body)];
    });
  } catch (error) { failed(`/admin/projects/${id}`, error); }
  await audit(user.id, "project.status", "ClientProject", id);
  revalidateProjectViews(id); projectEmails(events); redirect(`/admin/projects/${id}?saved=1`);
}

export async function addUpdateAction(form: FormData): Promise<void> {
  const user = await operator(); const projectId = idValue(form, "projectId"); let events: ProjectEmail[] = [];
  try {
    const title = z.string().trim().min(2).max(140).parse(form.get("title")); const body = z.string().trim().max(2000).parse(form.get("body") ?? "");
    events = await projectTransaction(async tx => {
      const project = await tx.clientProject.findUnique({ where: { id: projectId }, include: { client: { select: { name: true, email: true } } } });
      if (!project) throw new Error("Project not found.");
      await tx.projectUpdate.create({ data: { projectId, title, body } });
      return [event(project, title, body)];
    });
  } catch (error) { failed(`/admin/projects/${projectId}`, error); }
  await audit(user.id, "project.updatePost", "ClientProject", projectId);
  revalidateProjectViews(projectId); projectEmails(events); redirect(`/admin/projects/${projectId}?saved=update`);
}
export async function deleteUpdateAction(form: FormData): Promise<void> {
  const user = await operator(); const projectId = idValue(form, "projectId"); const id = idValue(form);
  await prisma!.projectUpdate.deleteMany({ where: { id, projectId } });
  await audit(user.id, "project.updateDelete", "ClientProject", projectId);
  revalidateProjectViews(projectId); redirect(`/admin/projects/${projectId}?saved=update`);
}
