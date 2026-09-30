"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, hashPassword, hashToken, requireAdminRole, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sanitizePermissions } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { accountEmailSchema, accountPasswordSchema, notifyEmailChanged, propagateAdminName } from "@/lib/admin-account";

/**
 * Panel user management - admin role only. Passwords are bcrypt-hashed
 * (12 rounds) server-side; sessions are destroyed on role change or
 * deletion so revocation is immediate. Name changes propagate to every
 * published surface (chat bylines, assignment records); email changes
 * notify both addresses; password resets revoke the target's sessions
 * (except the acting admin's own current session).
 */

const emailSchema = accountEmailSchema;
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
      employeeId: z.string().trim().optional().or(z.literal("")),
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      permissions: formData.getAll("permissions"),
      employeeId: formData.get("employeeId") ?? "",
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
        employeeId: d.employeeId || null,
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
      employeeId: z.string().trim().optional().or(z.literal("")),
    })
    .safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      role: formData.get("role"),
      permissions: formData.getAll("permissions"),
      employeeId: formData.get("employeeId") ?? "",
    });
  if (!parsed.success) redirect("/admin/users?e=invalid");
  const d = parsed.data;
  if (d.id === admin.id && d.role !== "admin") redirect("/admin/users?e=self");

  const existing = await prisma!.adminUser.findUnique({ where: { id: d.id }, select: { name: true } });
  await prisma!.adminUser.update({
    where: { id: d.id },
    data: {
      name: d.name,
      role: d.role,
      permissions: d.role === "editor" ? sanitizePermissions(d.permissions) : [],
      employeeId: d.employeeId || null,
    },
  });
  // A renamed admin shows the new name everywhere it was published,
  // including historical chat bylines and assignment records.
  if (existing) await propagateAdminName(d.id, existing.name, d.name);
  await audit(admin.id, "user.update", "AdminUser", d.id, { role: d.role, name: existing ? `${existing.name} to ${d.name}` : d.name });
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

/**
 * Change a panel user's sign-in email. Standard flow: admins may set any
 * user's email directly; changing YOUR OWN email requires your current
 * password (re-auth). Both addresses are notified.
 */
export async function updateUserEmailAction(formData: FormData): Promise<void> {
  const admin = await requireAdminRole();
  const parsed = z
    .object({
      id: z.string().min(10).max(32),
      email: accountEmailSchema,
      currentPassword: z.string().max(200).optional(),
    })
    .safeParse({
      id: formData.get("id"),
      email: formData.get("email"),
      currentPassword: formData.get("currentPassword") ?? undefined,
    });
  if (!parsed.success) redirect("/admin/users?e=invalid");
  const d = parsed.data;
  if (!rateLimit(`users-email:${admin.id}`, 10, 15 * 60 * 1000).ok) redirect("/admin/users?e=rate");

  const target = await prisma!.adminUser.findUnique({ where: { id: d.id }, select: { id: true, name: true, email: true, passwordHash: true } });
  if (!target) redirect("/admin/users?e=invalid");

  // Self-service re-auth: you cannot change your own email without your password.
  if (d.id === admin.id) {
    if (!d.currentPassword || !(await verifyPassword(d.currentPassword, target.passwordHash))) {
      redirect("/admin/users?e=wrong-password");
    }
  }
  if (d.email === target.email) redirect("/admin/users?e=same-email");
  const clash = await prisma!.adminUser.findUnique({ where: { email: d.email }, select: { id: true } });
  if (clash) redirect("/admin/users?e=dup");

  await prisma!.adminUser.update({ where: { id: d.id }, data: { email: d.email } });
  notifyEmailChanged(target.name, target.email, d.email);
  await audit(admin.id, "user.email_update", "AdminUser", d.id, { from: target.email, to: d.email, self: d.id === admin.id });
  revalidatePath("/admin/users");
  redirect("/admin/users?saved=email");
}

/**
 * Set a new password for a panel user. Standard flow: admins may reset
 * anyone's password directly; setting YOUR OWN requires your current
 * password. The target's sessions are revoked (everyone must sign in
 * again), except the acting admin's own current session, which stays.
 */
export async function resetUserPasswordAction(formData: FormData): Promise<void> {
  const admin = await requireAdminRole();
  const parsed = z
    .object({
      id: z.string().min(10).max(32),
      newPassword: accountPasswordSchema,
      currentPassword: z.string().max(200).optional(),
    })
    .safeParse({
      id: formData.get("id"),
      newPassword: formData.get("newPassword"),
      currentPassword: formData.get("currentPassword") ?? undefined,
    });
  if (!parsed.success) redirect("/admin/users?e=weak-password");
  const d = parsed.data;
  if (!rateLimit(`users-password:${admin.id}`, 10, 15 * 60 * 1000).ok) redirect("/admin/users?e=rate");

  const target = await prisma!.adminUser.findUnique({ where: { id: d.id }, select: { id: true, passwordHash: true } });
  if (!target) redirect("/admin/users?e=invalid");

  if (d.id === admin.id) {
    if (!d.currentPassword || !(await verifyPassword(d.currentPassword, target.passwordHash))) {
      redirect("/admin/users?e=wrong-password");
    }
  }

  await prisma!.adminUser.update({ where: { id: d.id }, data: { passwordHash: await hashPassword(d.newPassword) } });

  // Revoke the target's sessions. If the admin is resetting their own
  // password, keep the current session (they just proved it's really them).
  if (d.id === admin.id) {
    const store = await cookies();
    const token = store.get(ADMIN_COOKIE)?.value;
    if (token) {
      await prisma!.adminSession.deleteMany({ where: { userId: d.id, NOT: { tokenHash: hashToken(token) } } });
    }
  } else {
    await prisma!.adminSession.deleteMany({ where: { userId: d.id } });
  }

  await audit(admin.id, "user.password_reset", "AdminUser", d.id, { self: d.id === admin.id });
  revalidatePath("/admin/users");
  redirect("/admin/users?saved=password");
}
