"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { revalidateManagedContent } from "@/lib/collections";

/**
 * Site settings mutations. Stored as key/value rows; public pages read them
 * through getSettings() with constant defaults for missing keys.
 */

const settingsSchema = z.object({
  contactEmail: z.string().trim().email().max(160),
  contactPhone: z
    .string()
    .trim()
    .min(7)
    .max(24)
    .regex(/^[+0-9 ()-]+$/, "Digits, spaces and + ( ) - only."),
});

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const parsed = settingsSchema.safeParse({
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    redirect(`/admin/settings?e=${encodeURIComponent(issue?.message ?? "invalid")}`);
  }

  const { contactEmail, contactPhone } = parsed.data;

  await prisma!.$transaction([
    prisma!.siteSetting.upsert({
      where: { key: "contact_email" },
      create: { key: "contact_email", value: contactEmail },
      update: { value: contactEmail },
    }),
    prisma!.siteSetting.upsert({
      where: { key: "contact_phone" },
      create: { key: "contact_phone", value: contactPhone },
      update: { value: contactPhone },
    }),
  ]);

  await audit(user.id, "settings.update", "SiteSetting", undefined, {
    email: contactEmail,
  });
  await revalidateManagedContent();
  redirect("/admin/settings?saved=1");
}
