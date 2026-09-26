"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAdminRole } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { enquiryStatusSchema } from "@/lib/enquiry-status";
import { logger } from "@/lib/logger";

/**
 * Enquiry inbox mutations. Every action re-authorizes server-side.
 */

const idSchema = z.string().min(10).max(32);

export async function updateEnquiryStatusAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("enquiries");
  await requireSection("enquiries");
  const parsed = z
    .object({ id: idSchema, status: enquiryStatusSchema })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success || !prisma) redirect("/admin/enquiries?e=invalid");

  const { id, status } = parsed.data;
  const updated = await prisma!.projectEnquiry.updateMany({
    where: { id },
    data: { status },
  });
  if (updated.count === 0) redirect("/admin/enquiries?e=notfound");

  await audit(user.id, "enquiry.status", "ProjectEnquiry", id, { to: status });
  logger.info("admin.enquiry.status", { id, status });

  const backTo = formData.get("backTo");
  redirect(typeof backTo === "string" && backTo.startsWith("/admin") ? backTo : "/admin/enquiries");
}

export async function saveEnquiryNotesAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("enquiries");
  await requireSection("enquiries");
  const parsed = z
    .object({ id: idSchema, notes: z.string().max(4000) })
    .safeParse({ id: formData.get("id"), notes: formData.get("notes") ?? "" });
  if (!parsed.success || !prisma) redirect("/admin/enquiries?e=invalid");

  const { id, notes } = parsed.data;
  const updated = await prisma!.projectEnquiry.updateMany({
    where: { id },
    data: { adminNotes: notes.trim() || null },
  });
  if (updated.count === 0) redirect("/admin/enquiries?e=notfound");

  await audit(user.id, "enquiry.notes", "ProjectEnquiry", id);
  redirect(`/admin/enquiries/${id}?saved=1`);
}

export async function deleteEnquiryAction(formData: FormData): Promise<void> {
  const user = await requireAdminRole(); // destructive: admin role only
  const parsed = z
    .object({ id: idSchema, confirm: z.literal("DELETE") })
    .safeParse({ id: formData.get("id"), confirm: formData.get("confirm") });
  if (!parsed.success || !prisma) redirect("/admin/enquiries?e=invalid");

  const { id } = parsed.data;
  const deleted = await prisma!.projectEnquiry.deleteMany({ where: { id } });
  if (deleted.count === 0) redirect("/admin/enquiries?e=notfound");

  await audit(user.id, "enquiry.delete", "ProjectEnquiry", id);
  logger.info("admin.enquiry.delete", { id });

  redirect("/admin/enquiries?deleted=1");
}
