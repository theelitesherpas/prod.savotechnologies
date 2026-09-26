"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function markReadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!prisma) redirect("/admin/emails?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  await prisma!.emailReply.update({ where: { id }, data: { isRead: true } });
  revalidatePath("/admin/emails");
}

export async function markAllReadAction(): Promise<void> {
  await requireAdmin();
  if (!prisma) redirect("/admin/emails?e=Database%20unavailable.");
  await prisma!.emailReply.updateMany({ where: { isRead: false }, data: { isRead: true } });
  revalidatePath("/admin/emails");
}
