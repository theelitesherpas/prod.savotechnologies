"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clientAddressSchema, clientAddressInput, CLIENT_ADDRESS_FIELDS } from "@/lib/client-address";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { businessTransaction, generateBusinessId, claimBusinessId, rejectManualBusinessId, BusinessIdError } from "@/lib/business-ids";
import { sendTemplateNow } from "@/lib/mail";
import { hashPassword, generateClientPassword } from "@/lib/client-auth";
import { passwordFitsBcrypt } from "@/lib/passwords";
import { consumeClientPasswordReceipt, setClientPasswordReceipt } from "@/lib/client-password-receipt";

export type ClientPasswordReceiptState =
  | { status: "idle" }
  | { status: "expired" }
  | { status: "revealed"; kind: "created" | "reset"; password: string };

/**
 * Client account mutations (admin). Passwords are generated server-side
 * and shown once after create/reset - never stored in plaintext.
 */

const clientSchema = clientAddressSchema.extend({
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
    ...clientAddressInput(formData),
  });
  if (!parsed.success) redirect(slugError("Check the fields - name and a valid email are required."));

  const submittedPassword = formData.get("password");
  const password = typeof submittedPassword === "string" && submittedPassword.trim()
    ? submittedPassword.trim()
    : generateClientPassword();
  if (password.length < 10 || password.length > 64 || !passwordFitsBcrypt(password)) {
    redirect(slugError("Password must be 10–64 characters and fit the supported password limit."));
  }

  try {
    rejectManualBusinessId(formData.get("businessId"));
    const passwordHash = await hashPassword(password);
    const client = await businessTransaction(async tx => tx.clientUser.create({
      data: { ...clientAddressSchema.parse(parsed.data), name: parsed.data.name, email: parsed.data.email, company: parsed.data.company ?? "", passwordHash, businessId: await claimBusinessId(formData, "CS", user.id, tx) ?? await generateBusinessId("CS", tx) },
    }));
    await audit(user.id, "client.create", "ClientUser", client.email, { businessId: client.businessId });
    sendTemplateNow("clientWelcome", client.email, { name: parsed.data.name, email: client.email, password, clientReference: client.businessId ?? "" });
  } catch (error) {
    if (error instanceof BusinessIdError) redirect(slugError(error.message));
    if (error instanceof Error && error.message.startsWith("Business IDs")) redirect(slugError(error.message));
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") redirect(slugError("That email or reference is already registered. No changes were saved."));
    redirect(slugError("Client could not be created. Please try again; if numbering is unavailable, contact an administrator."));
  }

  await setClientPasswordReceipt(user.id, "created", password);
  revalidatePath("/admin/clients");
  redirect("/admin/clients?created=1");
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
    ...clientAddressInput(formData),
  });
  if (!parsed.success) redirect(`/admin/clients/${id}?e=invalid`);

  try {
    rejectManualBusinessId(formData.get("businessId"));
    await prisma.clientUser.update({
      where: { id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company ?? "",
        active: parsed.data.active,
        // An older form that omits address fields must not erase a saved address.
        ...Object.fromEntries(CLIENT_ADDRESS_FIELDS.filter(field => formData.has(field)).map(field => [field, parsed.data[field]])),
      },
    });
  } catch {
    redirect(`/admin/clients/${id}?e=dup`);
  }
  await audit(user.id, "client.update", "ClientUser", parsed.data.email);
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  revalidatePath("/portal", "layout");
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
  const passwordHash = await hashPassword(password);
  try {
    await prisma.$transaction([
      prisma.clientUser.update({ where: { id }, data: { passwordHash } }),
      prisma.clientSession.deleteMany({ where: { clientId: id } }),
    ]);
  } catch {
    redirect(slugError("Password reset failed; no changes were applied."));
  }
  await audit(user.id, "client.passwordReset", "ClientUser", client.email);
  sendTemplateNow("clientPasswordReset", client.email, { name: client.name, password });
  await setClientPasswordReceipt(user.id, "reset", password);

  redirect("/admin/clients?reset=1");
}

export async function revealClientPasswordReceiptAction(
  _previousState: ClientPasswordReceiptState,
  _formData: FormData,
): Promise<ClientPasswordReceiptState> {
  void _previousState;
  void _formData;
  const user = await requireAdmin();
  await requireSection("clients");
  const receipt = await consumeClientPasswordReceipt(user.id);
  return receipt ? { status: "revealed", ...receipt } : { status: "expired" };
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
