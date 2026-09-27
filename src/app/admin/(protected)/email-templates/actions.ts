"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { sendMail, renderTemplate } from "@/lib/mail";
import { templateEntry } from "@/lib/mail/registry";
import { shell } from "@/lib/mail/templates";
import { bodyToHtml, bodyToText } from "@/lib/mail/registry";

/** Admin actions for the email centre: template overrides + custom sends. */

const templateSchema = z.object({
  key: z.string().min(2).max(60),
  subject: z.string().trim().min(3).max(300),
  body: z.string().trim().min(3).max(20000),
});

const customSchema = z.object({
  to: z.string().trim().email().max(160),
  subject: z.string().trim().min(3).max(300),
  body: z.string().trim().min(3).max(20000),
});

/** Template-based send: pick a registry template, supply its variables;
 *  admin overrides still apply (renderTemplate), dept routing included. */
/** Compose access mirrors the email-centre rule: admins always, editors
 *  when the sending department matches their granted portal section. */
async function requireComposeAccess(dept: "hello" | "hr"): Promise<void> {
  const user = await requireAdmin();
  if (user.role === "admin") return;
  const has = Array.isArray(user.permissions) && (user.permissions as string[]).includes(dept === "hr" ? "employees" : "clients");
  if (has) return;
  redirect(`/admin?denied=${encodeURIComponent(dept === "hr" ? "HR email" : "Client email")}`);
}

const safeBack = (v: FormDataEntryValue | null): string => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/admin") ? s : "/admin/email-compose";
};

export async function sendTemplatedEmailAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const to = z.string().trim().email().max(160).parse(formData.get("to"));
  const key = z.string().min(2).max(60).parse(formData.get("templateKey"));
  const entry = templateEntry(key);
  if (!entry) redirect(`/admin/email-compose?e=${encodeURIComponent("Unknown template.")}`);
  await requireComposeAccess(entry.dept);
  const backTo = safeBack(formData.get("back"));

  const vars: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("var_") && typeof v === "string" && v.trim()) {
      vars[k.slice(4)] = v.trim().slice(0, 500);
    }
  }

  const tpl = await renderTemplate(key, vars, entry.recipient === "customer" ? to : undefined);
  if (!tpl) redirect(`/admin/email-compose?e=${encodeURIComponent("Template render failed.")}`);
  const ok = await sendMail(to, tpl, entry.dept, { templateKey: key, sentBy: user.name });
  await audit(user.id, ok ? "email.templatedSent" : "email.templatedFailed", "Email", to, { template: key });
  redirect(
    ok
      ? `${backTo}${backTo.includes("?") ? "&" : "?"}sent=1`
      : `${backTo}?e=${encodeURIComponent("Send failed - check SMTP settings or try again.")}`,
  );
}

function back(e: string): never {
  redirect(`/admin/email-templates?e=${encodeURIComponent(e)}`);
}

export async function saveTemplateAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("email-templates");
  await requireSection("email-templates");
  if (!prisma) back("Database unavailable.");

  const parsed = templateSchema.safeParse({
    key: formData.get("key"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) back(parsed.error.issues[0]?.message ?? "Check the fields.");
  if (!templateEntry(parsed.data.key)) back("Unknown template.");

  await prisma.emailTemplate.upsert({
    where: { key: parsed.data.key },
    update: { subject: parsed.data.subject, body: parsed.data.body },
    create: { key: parsed.data.key, subject: parsed.data.subject, body: parsed.data.body },
  });
  await audit(user.id, "email.templateSave", "EmailTemplate", parsed.data.key);
  revalidatePath("/admin/email-templates");
  redirect(`/admin/email-templates?k=${encodeURIComponent(parsed.data.key)}&saved=1`);
}

export async function resetTemplateAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("email-templates");
  await requireSection("email-templates");
  if (!prisma) back("Database unavailable.");
  const key = z.string().min(2).max(60).parse(formData.get("key"));
  if (!templateEntry(key)) back("Unknown template.");

  await prisma.emailTemplate.deleteMany({ where: { key } });
  await audit(user.id, "email.templateReset", "EmailTemplate", key);
  revalidatePath("/admin/email-templates");
  redirect(`/admin/email-templates?k=${encodeURIComponent(key)}&reset=1`);
}

/** Compose-and-send: a custom email from the panel, branded shell applied. */
export async function sendCustomEmailAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const dept = z.enum(["hello", "hr"]).catch("hello").parse(formData.get("dept") ?? "hello");
  await requireComposeAccess(dept);
  const backTo = safeBack(formData.get("back"));
  if (!prisma) redirect("/admin/email-compose?e=Database%20unavailable.");

  const parsed = customSchema.safeParse({
    to: formData.get("to"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    redirect(`/admin/email-compose?e=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the fields.")}`);
  }
  const d = parsed.data;

  const ok = await sendMail(
    d.to,
    {
      subject: d.subject,
      html: shell({ preheader: d.subject.slice(0, 120), heading: "", bodyHtml: bodyToHtml(d.body) }),
      text: bodyToText(d.body),
    },
    dept,
    { sentBy: user.name },
  );
  await audit(user.id, ok ? "email.customSent" : "email.customFailed", "Email", d.to, { subject: d.subject });
  // Header-safe redirect: the query string must be fully encoded (a raw
  // em-dash here once crashed the action with ERR_INVALID_CHAR).
  redirect(
    ok
      ? `${backTo}${backTo.includes("?") ? "&" : "?"}sent=1`
      : `${backTo}?e=${encodeURIComponent("Send failed - check SMTP settings or try again.")}`,
  );
}
