"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { requireSection } from "@/lib/permissions";

export async function markReadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await requireSection("emails");
  if (!prisma) redirect("/admin/emails?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  await prisma!.emailReply.update({ where: { id }, data: { isRead: true } });
  revalidatePath("/admin/emails");
}

export async function markUnreadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await requireSection("emails");
  if (!prisma) redirect("/admin/emails?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  await prisma!.emailReply.update({ where: { id }, data: { isRead: false } });
  revalidatePath("/admin/emails");
}

export async function deleteReplyAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("emails");
  if (!prisma) redirect("/admin/emails?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const reply = await prisma!.emailReply.findUnique({ where: { id } });
  if (!reply) redirect("/admin/emails?e=Not%20found.");
  await prisma!.emailReply.delete({ where: { id } });
  await audit(user.id, "email.replyDeleted", "EmailReply", id, { from: reply.fromEmail, subject: reply.subject.slice(0, 80) });
  revalidatePath("/admin/emails");
}

export async function markAllReadAction(): Promise<void> {
  await requireAdmin();
  await requireSection("emails");
  if (!prisma) redirect("/admin/emails?e=Database%20unavailable.");
  await prisma!.emailReply.updateMany({ where: { isRead: false }, data: { isRead: true } });
  revalidatePath("/admin/emails");
}
