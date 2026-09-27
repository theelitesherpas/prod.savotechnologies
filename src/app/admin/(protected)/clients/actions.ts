"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { sendTemplateNow } from "@/lib/mail";
import { hashPassword, generateClientPassword } from "@/lib/client-auth";

/**
 * Client account mutations (admin). Passwords are generated server-side
 * and shown once after create/reset - never stored in plaintext.
 */

const clientSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  active: z.boolean(),
});

function slugError(e: string) {
  return `/admin/clients?e=${encodeURIComponent(e)}`;
}

export async function createClientAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("clients");
  if (!prisma) redirect(slugError("Database unavailable."));

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") ?? "",
    active: true,
  });
  if (!parsed.success) redirect(slugError("Check the fields - name and a valid email are required."));

  const password = formData.get("password")?.toString().trim() || generateClientPassword();
  if (password.length < 10) redirect(slugError("Password must be at least 10 characters."));

  try {
    const client = await prisma.clientUser.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company ?? "",
        passwordHash: await hashPassword(password),
      },
    });
    await audit(user.id, "client.create", "ClientUser", client.email);
    sendTemplateNow("clientWelcome", client.email, { name: parsed.data.name, email: client.email, password });
  } catch {
    redirect(slugError("That email is already registered."));
  }

  revalidatePath("/admin/clients");
  redirect(`/admin/clients?created=1&pw=${encodeURIComponent(password)}`);
}

export async function updateClientAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("clients");
  if (!prisma) redirect(slugError("Database unavailable."));
  const id = z.string().min(10).max(32).parse(formData.get("id"));

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") ?? "",
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) redirect(`/admin/clients/${id}?e=invalid`);

  try {
    await prisma.clientUser.update({
      where: { id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company ?? "",
        active: parsed.data.active,
      },
    });
  } catch {
    redirect(`/admin/clients/${id}?e=dup`);
  }
  await audit(user.id, "client.update", "ClientUser", parsed.data.email);
  revalidatePath("/admin/clients");
  redirect("/admin/clients?saved=1");
}

export async function resetClientPasswordAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("clients");
  if (!prisma) redirect(slugError("Database unavailable."));
  const id = z.string().min(10).max(32).parse(formData.get("id"));

  const client = await prisma.clientUser.findUnique({ where: { id } });
  if (!client) redirect(slugError("Client not found."));

  const password = generateClientPassword();
  await prisma.clientUser.update({ where: { id }, data: { passwordHash: await hashPassword(password) } });
  // Revoke existing sessions on reset
  await prisma.clientSession.deleteMany({ where: { clientId: id } }).catch(() => undefined);
  await audit(user.id, "client.passwordReset", "ClientUser", client.email);
  sendTemplateNow("clientPasswordReset", client.email, { name: client.name, password });

  redirect(`/admin/clients?reset=1&pw=${encodeURIComponent(password)}`);
}

export async function deleteClientAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("clients");
  if (!prisma) redirect(slugError("Database unavailable."));
  const id = z.string().min(10).max(32).parse(formData.get("id"));

  const client = await prisma.clientUser.findUnique({ where: { id }, include: { projects: { select: { code: true } } } });
  if (!client) redirect(slugError("Client not found."));

  await prisma.clientUser.delete({ where: { id } });
  await audit(user.id, "client.delete", "ClientUser", client.email, { projects: client.projects.length });

  revalidatePath("/admin/clients");
  redirect("/admin/clients?deleted=1");
}
