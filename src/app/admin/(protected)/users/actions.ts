"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sanitizePermissions } from "@/lib/permissions";

/**
 * Panel user management — admin role only. Passwords are bcrypt-hashed
 * (12 rounds) server-side; sessions are destroyed on role change or
 * deletion so revocation is immediate.
 */

const emailSchema = z.string().trim().toLowerCase().email().max(160);
const nameSchema = z.string().trim().min(2).max(80);
const passwordSchema = z
  .string()
  .min(10, "Passwords need at least 10 characters.")
  .max(200);

export async function createUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdminRole();
  const parsed = z
    .object({
      name: nameSchema,
      email: emailSchema,
      password: passwordSchema,
      role: z.enum(["admin", "editor"]),
      permissions: z.array(z.string()).optional(),
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      permissions: formData.getAll("permissions"),
    });
  if (!parsed.success) {
    redirect(`/admin/users?e=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`);
  }
  const d = parsed.data;

  try {
    const created = await prisma!.adminUser.create({
      data: {
        name: d.name,
        email: d.email,
        role: d.role,
        passwordHash: await hashPassword(d.password),
        permissions: d.role === "editor" ? sanitizePermissions(d.permissions) : [],
      },
    });
    await audit(admin.id, "user.create", "AdminUser", created.id, { email: d.email, role: d.role });
  } catch {
    redirect("/admin/users?e=dup");
  }
  revalidatePath("/admin/users");
  redirect("/admin/users?saved=created");
}

export async function updateUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdminRole();
  const parsed = z
    .object({
      id: z.string().min(10).max(32),
      name: nameSchema,
      role: z.enum(["admin", "editor"]),
      permissions: z.array(z.string()).optional(),
    })
    .safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      role: formData.get("role"),
      permissions: formData.getAll("permissions"),
    });
  if (!parsed.success) redirect("/admin/users?e=invalid");
  const d = parsed.data;
  if (d.id === admin.id && d.role !== "admin") redirect("/admin/users?e=self");

  await prisma!.adminUser.update({
    where: { id: d.id },
    data: {
      name: d.name,
      role: d.role,
      permissions: d.role === "editor" ? sanitizePermissions(d.permissions) : [],
    },
  });
  await audit(admin.id, "user.update", "AdminUser", d.id, { role: d.role });
  revalidatePath("/admin/users");
  redirect("/admin/users?saved=updated");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdminRole();
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  if (id === admin.id) redirect("/admin/users?e=self");

  // Sessions cascade on delete; audit logs survive (userId set null).
  const deleted = await prisma!.adminUser.deleteMany({ where: { id } });
  if (deleted.count) await audit(admin.id, "user.delete", "AdminUser", id);
  revalidatePath("/admin/users");
  redirect("/admin/users?saved=deleted");
}
