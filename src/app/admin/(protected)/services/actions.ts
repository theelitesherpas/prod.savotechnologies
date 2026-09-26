"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAdminRole } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { SERVICE_LINKS } from "@/constants/navigation";
import { revalidateManagedContent } from "@/lib/collections";

/**
 * Services collection mutations. Slug is normalized server-side; order is a
 * plain integer (admin UI nudges ±1 via forms, no JS required).
 */

const slugify = (t: string) =>
  t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const serviceSchema = z.object({
  title: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  summary: z.string().trim().max(300).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).max(999),
  featured: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
});

function readServiceForm(formData: FormData) {
  return serviceSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary") ?? "",
    order: formData.get("order") ?? 0,
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
  });
}

export async function createServiceAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  await requireSection("content");
  const parsed = readServiceForm(formData);
  if (!parsed.success) redirect("/admin/services?e=invalid");
  const d = parsed.data;

  try {
    await prisma!.service.create({
      data: {
        title: d.title,
        slug: slugify(d.slug),
        summary: d.summary || "",
        order: d.order,
        featured: !!d.featured,
        active: d.active !== false, // checkbox default-on for creates
      },
    });
  } catch {
    redirect("/admin/services?e=dup");
  }

  await audit(user.id, "service.create", "Service", d.slug);
  await revalidateManagedContent();
  redirect("/admin/services?saved=1");
}

export async function updateServiceAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  await requireSection("content");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const parsed = readServiceForm(formData);
  if (!parsed.success) redirect(`/admin/services/${id}?e=invalid`);
  const d = parsed.data;

  try {
    const updated = await prisma!.service.update({
      where: { id },
      data: {
        title: d.title,
        slug: slugify(d.slug),
        summary: d.summary || "",
        order: d.order,
        featured: !!d.featured,
        active: !!d.active,
      },
    });
    await audit(user.id, "service.update", "Service", updated.slug);
  } catch {
    redirect(`/admin/services/${id}?e=dup`);
  }

  await revalidateManagedContent();
  redirect(`/admin/services/${id}?saved=1`);
}

export async function toggleServiceActiveAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  await requireSection("content");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const active = formData.get("active") === "true";

  const updated = await prisma!.service.update({ where: { id }, data: { active } });
  await audit(user.id, active ? "service.activate" : "service.deactivate", "Service", updated.slug);
  await revalidateManagedContent();
  redirect("/admin/services");
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  const user = await requireAdminRole();
  const id = z.string().min(10).max(32).parse(formData.get("id"));

  const deleted = await prisma!.service.deleteMany({ where: { id } });
  if (deleted.count) await audit(user.id, "service.delete", "Service", id);
  await revalidateManagedContent();
  redirect("/admin/services?deleted=1");
}

/**
 * One-time import: materializes the version-1 service list (constants) into
 * the database so the admin can edit from the known baseline. Existing
 * slugs are refreshed, not duplicated.
 */
export async function importDefaultServicesAction(): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  await requireSection("content");
  let count = 0;

  for (const [i, link] of SERVICE_LINKS.entries()) {
    const slug = link.href.split("/").filter(Boolean).pop() ?? slugify(link.label);
    await prisma!.service.upsert({
      where: { slug },
      create: { slug, title: link.label, summary: "", order: i },
      update: { title: link.label },
    });
    count += 1;
  }

  await audit(user.id, "service.import_defaults", "Service", undefined, { count });
  await revalidateManagedContent();
  revalidatePath("/admin/services");
  redirect(`/admin/services?imported=${count}`);
}
