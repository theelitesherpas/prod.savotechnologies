"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";

const STATUSES = ["planning", "in_progress", "review", "delivered", "paused", "cancelled"] as const;

const projectSchema = z.object({
  clientId: z.string().min(10).max(32),
  title: z.string().trim().min(2).max(140),
  code: z.string().trim().regex(/^[A-Z0-9-]{3,24}$/i, "Code: letters, digits, hyphens (3-24)."),
  status: z.enum(STATUSES),
  progress: z.coerce.number().int().min(0).max(100),
  summary: z.string().trim().max(600).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
});

function toNullableDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function nextCode(): Promise<string> {
  const year = new Date().getFullYear();
  const count = (await prisma!.clientProject.count()) + 1;
  return `SAVO-${year}-${String(count).padStart(3, "0")}`;
}

export async function createProjectAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/projects?e=Database%20unavailable.");

  const parsed = projectSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    code: formData.get("code") || (await nextCode()),
    status: formData.get("status") ?? "in_progress",
    progress: formData.get("progress") ?? 0,
    summary: formData.get("summary") ?? "",
    startDate: formData.get("startDate") ?? "",
    dueDate: formData.get("dueDate") ?? "",
  });
  if (!parsed.success) redirect(`/admin/projects?e=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`);

  const { startDate, dueDate, ...data } = parsed.data;
  try {
    await prisma.clientProject.create({
      data: { ...data, startDate: toNullableDate(startDate), dueDate: toNullableDate(dueDate) },
    });
  } catch {
    redirect("/admin/projects?e=That%20project%20code%20is%20already%20in%20use.");
  }
  await audit(user.id, "project.create", "ClientProject", data.code);
  revalidatePath("/admin/projects");
  redirect("/admin/projects?saved=created");
}

export async function updateProjectAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/projects?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));

  const parsed = projectSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    code: formData.get("code"),
    status: formData.get("status") ?? "in_progress",
    progress: formData.get("progress") ?? 0,
    summary: formData.get("summary") ?? "",
    startDate: formData.get("startDate") ?? "",
    dueDate: formData.get("dueDate") ?? "",
  });
  if (!parsed.success) redirect(`/admin/projects/${id}?e=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`);

  const { startDate, dueDate, ...data } = parsed.data;
  try {
    await prisma.clientProject.update({
      where: { id },
      data: { ...data, startDate: toNullableDate(startDate), dueDate: toNullableDate(dueDate) },
    });
  } catch {
    redirect(`/admin/projects/${id}?e=dup`);
  }
  await audit(user.id, "project.update", "ClientProject", data.code);
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  redirect(`/admin/projects/${id}?saved=1`);
}

export async function addMilestoneAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/projects?e=Database%20unavailable.");
  const projectId = z.string().min(10).max(32).parse(formData.get("projectId"));
  const title = z.string().trim().min(2).max(140).parse(formData.get("title"));
  const dueDate = formData.get("dueDate")?.toString() || "";
  const order = z.coerce.number().int().min(0).max(999).catch(99).parse(formData.get("order") ?? 99);

  await prisma.projectMilestone.create({
    data: { projectId, title, order, dueDate: toNullableDate(dueDate) },
  });
  await audit(user.id, "project.milestoneAdd", "ClientProject", projectId, { title });
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}?saved=milestone`);
}

export async function cycleMilestoneAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!prisma) redirect("/admin/projects?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const projectId = z.string().min(10).max(32).parse(formData.get("projectId"));

  const m = await prisma.projectMilestone.findUnique({ where: { id } });
  if (m) {
    const next = m.status === "pending" ? "in_progress" : m.status === "in_progress" ? "done" : "pending";
    await prisma.projectMilestone.update({ where: { id }, data: { status: next } });
  }
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}?saved=milestone`);
}

export async function deleteMilestoneAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!prisma) redirect("/admin/projects?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const projectId = z.string().min(10).max(32).parse(formData.get("projectId"));

  await prisma.projectMilestone.delete({ where: { id } }).catch(() => undefined);
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}?saved=milestone`);
}

export async function addUpdateAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/projects?e=Database%20unavailable.");
  const projectId = z.string().min(10).max(32).parse(formData.get("projectId"));
  const title = z.string().trim().min(2).max(140).parse(formData.get("title"));
  const body = z.string().trim().max(2000).catch("").parse(formData.get("body") ?? "");

  await prisma.projectUpdate.create({ data: { projectId, title, body } });
  await audit(user.id, "project.updatePost", "ClientProject", projectId, { title });
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}?saved=update`);
}

export async function deleteUpdateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!prisma) redirect("/admin/projects?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const projectId = z.string().min(10).max(32).parse(formData.get("projectId"));

  await prisma.projectUpdate.delete({ where: { id } }).catch(() => undefined);
  revalidatePath(`/admin/projects/${projectId}`);
  redirect(`/admin/projects/${projectId}?saved=update`);
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/projects?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const project = await prisma.clientProject.findUnique({ where: { id } });
  if (!project) redirect("/admin/projects?e=Project%20not%20found.");

  await prisma.clientProject.delete({ where: { id } });
  await audit(user.id, "project.delete", "ClientProject", project.code);
  revalidatePath("/admin/projects");
  redirect("/admin/projects?deleted=1");
}
