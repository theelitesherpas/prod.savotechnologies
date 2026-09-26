"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAdminRole } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { INDUSTRY_LINKS } from "@/constants/navigation";
import { revalidateManagedContent } from "@/lib/collections";

const slugify = (t: string) =>
  t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const industrySchema = z.object({
  title: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  summary: z.string().trim().max(300).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).max(999),
  active: z.coerce.boolean().optional(),
});

function readForm(formData: FormData) {
  return industrySchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary") ?? "",
    order: formData.get("order") ?? 0,
    active: formData.get("active") === "on",
  });
}

export async function createIndustryAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  await requireSection("content");
  const parsed = readForm(formData);
  if (!parsed.success) redirect("/admin/industries?e=invalid");
  const d = parsed.data;

  try {
    await prisma!.industry.create({
      data: {
        title: d.title,
        slug: slugify(d.slug),
        summary: d.summary || "",
        order: d.order,
        active: d.active !== false,
      },
    });
  } catch {
    redirect("/admin/industries?e=dup");
  }

  await audit(user.id, "industry.create", "Industry", d.slug);
  await revalidateManagedContent();
  redirect("/admin/industries?saved=1");
}

export async function updateIndustryAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  await requireSection("content");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const parsed = readForm(formData);
  if (!parsed.success) redirect(`/admin/industries/${id}?e=invalid`);
  const d = parsed.data;

  try {
    const updated = await prisma!.industry.update({
      where: { id },
      data: {
        title: d.title,
        slug: slugify(d.slug),
        summary: d.summary || "",
        order: d.order,
        active: !!d.active,
      },
    });
    await audit(user.id, "industry.update", "Industry", updated.slug);
  } catch {
    redirect(`/admin/industries/${id}?e=dup`);
  }

  await revalidateManagedContent();
  redirect(`/admin/industries/${id}?saved=1`);
}

export async function toggleIndustryActiveAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  await requireSection("content");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const active = formData.get("active") === "true";

  const updated = await prisma!.industry.update({ where: { id }, data: { active } });
  await audit(user.id, active ? "industry.activate" : "industry.deactivate", "Industry", updated.slug);
  await revalidateManagedContent();
  redirect("/admin/industries");
}

export async function deleteIndustryAction(formData: FormData): Promise<void> {
  const user = await requireAdminRole();
  const id = z.string().min(10).max(32).parse(formData.get("id"));

  const deleted = await prisma!.industry.deleteMany({ where: { id } });
  if (deleted.count) await audit(user.id, "industry.delete", "Industry", id);
  await revalidateManagedContent();
  redirect("/admin/industries?deleted=1");
}

/** Materialize the version-1 industry list into editable rows. */
export async function importDefaultIndustriesAction(): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  await requireSection("content");
  let count = 0;

  for (const [i, link] of INDUSTRY_LINKS.entries()) {
    const slug = link.href.split("/").filter(Boolean).pop() ?? slugify(link.label);
    await prisma!.industry.upsert({
      where: { slug },
      create: { slug, title: link.label, summary: "", order: i },
      update: { title: link.label },
    });
    count += 1;
  }

  await audit(user.id, "industry.import_defaults", "Industry", undefined, { count });
  await revalidateManagedContent();
  redirect(`/admin/industries?imported=${count}`);
}
