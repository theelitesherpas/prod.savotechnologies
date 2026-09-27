"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { revalidateManagedContent } from "@/lib/collections";

/**
 * Site settings mutations. Stored as key/value rows; public pages read them
 * through getSettings() with constant defaults for missing keys.
 */

const metricValue = z
  .string()
  .trim()
  .max(12)
  .regex(/^[0-9][0-9.,+×%xkK\/-]*$/, "Figures like 120+, 45+, 12+, 8+ - digits with optional +, %, × or k.")
  .optional()
  .or(z.literal(""));

const settingsSchema = z.object({
  contactEmail: z.string().trim().email().max(160),
  contactPhone: z
    .string()
    .trim()
    .min(7)
    .max(24)
    .regex(/^[+0-9 ()-]+$/, "Digits, spaces and + ( ) - only."),
  announcement: z.string().trim().max(180).optional().or(z.literal("")),
  metricProjects: metricValue,
  metricClients: metricValue,
  metricIndustries: metricValue,
  metricMarkets: metricValue,
});

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("settings");
  const parsed = settingsSchema.safeParse({
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    announcement: formData.get("announcement") ?? "",
    metricProjects: formData.get("metricProjects") ?? "",
    metricClients: formData.get("metricClients") ?? "",
    metricIndustries: formData.get("metricIndustries") ?? "",
    metricMarkets: formData.get("metricMarkets") ?? "",
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    redirect(`/admin/settings?e=${encodeURIComponent(issue?.message ?? "invalid")}`);
  }

  const { contactEmail, contactPhone, announcement, metricProjects, metricClients, metricIndustries, metricMarkets } = parsed.data;

  const metricRows = [
    ["metric_projects", metricProjects ?? ""],
    ["metric_clients", metricClients ?? ""],
    ["metric_industries", metricIndustries ?? ""],
    ["metric_markets", metricMarkets ?? ""],
  ] as const;

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
    prisma!.siteSetting.upsert({
      where: { key: "announcement" },
      create: { key: "announcement", value: announcement || "" },
      update: { value: announcement || "" },
    }),
    ...metricRows.map(([key, value]) =>
      prisma!.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  ]);

  await audit(user.id, "settings.update", "SiteSetting", undefined, {
    email: contactEmail,
    announcement: announcement ? "set" : "cleared",
  });
  await revalidateManagedContent();
  redirect("/admin/settings?saved=1");
}
