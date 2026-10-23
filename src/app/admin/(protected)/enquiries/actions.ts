"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAdminRole } from "@/lib/auth";
import { requireSection, canAccess } from "@/lib/permissions";
import { CAREER_ENQUIRY_WHERE } from "@/lib/admin-enquiries";
import { candidateReturnPath } from "@/lib/hr-candidates";
import { audit } from "@/lib/audit";
import { enquiryStatusSchema } from "@/lib/enquiry-status";
import { logger } from "@/lib/logger";

/**
 * Enquiry inbox mutations. Every action re-authorizes server-side.
 */

const idSchema = z.string().min(10).max(32);

async function requireEnquiryMutation(user: Awaited<ReturnType<typeof requireAdmin>>, form: FormData) {
  if (canAccess(user, "enquiries")) return;
  await requireSection("hr-portal");
  const id = idSchema.safeParse(form.get("id"));
  if (!id.success || !prisma) redirect("/admin/hr-portal?e=Invalid%20candidate");
  const candidate = await prisma.projectEnquiry.findFirst({ where: { AND: [CAREER_ENQUIRY_WHERE, { id: id.data }] }, select: { id: true } });
  if (!candidate) redirect("/admin/hr-portal?e=Candidate%20not%20found");
}
function detailPath(user: Awaited<ReturnType<typeof requireAdmin>>, id: string) {
  return canAccess(user, "hr-portal") ? `/admin/hr-portal/applications/${id}` : `/admin/enquiries/${id}`;
}
function mutationConflict(user: Awaited<ReturnType<typeof requireAdmin>>, id: string, form: FormData): never {
  const params = new URLSearchParams({ e: "This application changed. Reload before saving." });
  if (form.get("returnTo")) params.set("returnTo", candidateReturnPath(form.get("returnTo")));
  redirect(`${detailPath(user, id)}?${params}`);
}
function refreshEnquiries(id: string) {
  for (const path of ["/admin", "/admin/enquiries", "/admin/hr-portal", "/admin/hr-portal/applications", `/admin/enquiries/${id}`, `/admin/hr-portal/applications/${id}`]) revalidatePath(path);
}

export async function updateEnquiryStatusAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireEnquiryMutation(user, formData);
  const parsed = z
    .object({ id: idSchema, status: enquiryStatusSchema })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success || !prisma) redirect("/admin/enquiries?e=invalid");

  const { id, status } = parsed.data;
  const revision = formData.get("revision");
  if (revision && !z.iso.datetime().safeParse(revision).success) redirect("/admin/enquiries?e=invalid");
  const updated = await prisma!.projectEnquiry.updateMany({
    where: { id, ...(revision ? { updatedAt: new Date(String(revision)) } : {}), ...(!canAccess(user, "enquiries") ? CAREER_ENQUIRY_WHERE : {}) },
    data: { status },
  });
  if (updated.count === 0) mutationConflict(user, id, formData);

  await audit(user.id, "enquiry.status", "ProjectEnquiry", id, { to: status });
  logger.info("admin.enquiry.status", { id, status });

  refreshEnquiries(id);
  const backTo = formData.get("backTo");
  const allowedBack = [`/admin/enquiries/${id}`, `/admin/hr-portal/applications/${id}`];
  const target = typeof backTo === "string" && allowedBack.includes(backTo) ? backTo : detailPath(user, id);
  if (status === "new" && target === `/admin/hr-portal/applications/${id}`) {
    const path = candidateReturnPath(formData.get("returnTo"));
    redirect(`${path}${path.includes("?") ? "&" : "?"}unread=1`);
  }
  const params = new URLSearchParams({ saved: "inbox" });
  if (formData.get("returnTo")) params.set("returnTo", candidateReturnPath(formData.get("returnTo")));
  redirect(`${target}?${params}`);
}

export async function saveEnquiryNotesAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireEnquiryMutation(user, formData);
  const parsed = z
    .object({ id: idSchema, notes: z.string().max(4000) })
    .safeParse({ id: formData.get("id"), notes: formData.get("notes") ?? "" });
  if (!parsed.success || !prisma) redirect("/admin/enquiries?e=invalid");

  const { id, notes } = parsed.data;
  const revision = formData.get("revision");
  if (revision && !z.iso.datetime().safeParse(revision).success) redirect("/admin/enquiries?e=invalid");
  const updated = await prisma!.projectEnquiry.updateMany({
    where: { id, ...(revision ? { updatedAt: new Date(String(revision)) } : {}), ...(!canAccess(user, "enquiries") ? CAREER_ENQUIRY_WHERE : {}) },
    data: { adminNotes: notes.trim() || null },
  });
  if (updated.count === 0) mutationConflict(user, id, formData);

  await audit(user.id, "enquiry.notes", "ProjectEnquiry", id);
  refreshEnquiries(id);
  const backTo = formData.get("backTo");
  const target = backTo === `/admin/enquiries/${id}` || backTo === `/admin/hr-portal/applications/${id}` ? backTo : detailPath(user, id);
  const params = new URLSearchParams({ saved: "1" });
  if (formData.get("returnTo")) params.set("returnTo", candidateReturnPath(formData.get("returnTo")));
  redirect(`${target}?${params}`);
}

export async function deleteEnquiryAction(formData: FormData): Promise<void> {
  const user = await requireAdminRole(); // destructive: admin role only
  const parsed = z
    .object({ id: idSchema, confirm: z.literal("DELETE") })
    .safeParse({ id: formData.get("id"), confirm: formData.get("confirm") });
  if (!parsed.success || !prisma) redirect("/admin/enquiries?e=invalid");

  const { id } = parsed.data;
  const revision = formData.get("revision");
  if (revision && !z.iso.datetime().safeParse(revision).success) redirect("/admin/enquiries?e=invalid");
  const deleted = await prisma!.projectEnquiry.deleteMany({ where: { id, ...(revision ? { updatedAt: new Date(String(revision)) } : {}) } });
  if (deleted.count === 0) mutationConflict(user, id, formData);

  await audit(user.id, "enquiry.delete", "ProjectEnquiry", id);
  logger.info("admin.enquiry.delete", { id });

  refreshEnquiries(id);
  const target = formData.get("backTo") === `/admin/hr-portal/applications/${id}` ? candidateReturnPath(formData.get("returnTo")) : "/admin/enquiries";
  redirect(`${target}${target.includes("?") ? "&" : "?"}deleted=1`);
}
