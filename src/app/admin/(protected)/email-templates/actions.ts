"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientFullName } from "@/lib/client-name";
import { requireAdmin } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { sendMail, renderTemplate } from "@/lib/mail";
import { templateEntry } from "@/lib/mail/registry";
import { shell } from "@/lib/mail/templates";
import { attachmentsFromForm } from "@/lib/mail/attachments";
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
  const has = user.role === "editor" && Array.isArray(user.permissions) && (user.permissions as string[]).includes(dept === "hr" ? "employees" : "clients");
  if (has) return;
  redirect(`/admin?denied=${encodeURIComponent(dept === "hr" ? "HR email" : "Client email")}`);
}

const safeBack = (v: FormDataEntryValue | null, fallback = "/admin/email-compose"): string => {
  if (typeof v !== "string" || !v.startsWith("/admin") || /[\\\\\r\n]/.test(v)) return fallback;
  try {
    const url = new URL(v, "https://admin.invalid");
    if (url.origin !== "https://admin.invalid" || (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/"))) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
};
const composeBack = (dept: "hello" | "hr", mode: "template" | "blank") => `/admin/email-compose?dept=${dept}&mode=${mode}`;
function composeResult(backTo: string, key: "sent" | "e", value: string): string {
  const url = new URL(backTo, "https://admin.invalid");
  url.searchParams.delete("sent"); url.searchParams.delete("e");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function sendTemplatedEmailAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const to = z.string().trim().email().max(160).parse(formData.get("to"));
  const key = z.string().min(2).max(60).parse(formData.get("templateKey"));
  const entry = templateEntry(key);
  if (!entry) redirect(`/admin/email-compose?e=${encodeURIComponent("Unknown template.")}`);
  await requireComposeAccess(entry.dept);
  const backTo = safeBack(formData.get("back"), composeBack(entry.dept, "template"));
  if (formData.getAll("attachments").some(v => typeof v === "string" || v.size > 0)) redirect(composeResult(backTo, "e", "Use Blank email to send attachments."));

  const vars: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("var_") && typeof v === "string" && v.trim()) {
      vars[k.slice(4)] = v.trim().slice(0, 500);
    }
  }

  // A selected registered client, not stale sample variables in the composer,
  // is authoritative for their name and optional honorific.
  if (entry.recipient === "client" && prisma) {
    const client = await prisma.clientUser.findUnique({ where: { email: to.toLowerCase() }, select: { name: true, title: true } });
    if (client) vars.name = clientFullName(client.name, client.title);
  }
  const tpl = await renderTemplate(key, vars, entry.recipient === "customer" ? to : undefined);
  if (!tpl) redirect(composeResult(backTo, "e", "Template render failed."));
  const ok = await sendMail(to, tpl, entry.dept, { templateKey: key, sentBy: user.name, requireDepartment: true, requireAcceptance: true });
  await audit(user.id, ok ? "email.templatedSent" : "email.templatedFailed", "Email", to, { template: key });
  redirect(ok ? composeResult(backTo, "sent", "1") : composeResult(backTo, "e", "Send failed - check SMTP settings or try again."));
}

function back(e: string): never {
  redirect(`/admin/email-templates?e=${encodeURIComponent(e)}`);
}

export async function saveTemplateAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
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
  const selectedDept = z.enum(["hello", "hr"]).safeParse(formData.get("dept") ?? "hello");
  if (!selectedDept.success) redirect("/admin?denied=Invalid%20email%20department");
  const dept = selectedDept.data;
  await requireComposeAccess(dept);
  const backTo = safeBack(formData.get("back"), composeBack(dept, "blank"));
  if (!prisma) redirect(composeResult(backTo, "e", "Database unavailable."));

  const parsed = customSchema.safeParse({
    to: formData.get("to"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    redirect(composeResult(backTo, "e", parsed.error.issues[0]?.message ?? "Check the fields."));
  }
  const d = parsed.data;
  let attachments: Awaited<ReturnType<typeof attachmentsFromForm>>;
  try { attachments = await attachmentsFromForm(formData); }
  catch (error) { redirect(composeResult(backTo, "e", error instanceof Error ? error.message : "Check the attachment files.")); }

  const ok = await sendMail(
    d.to,
    {
      subject: d.subject,
      html: shell({ preheader: d.subject.slice(0, 120), heading: d.subject, bodyHtml: bodyToHtml(d.body), dept }),
      text: bodyToText(d.body),
    },
    dept,
    { sentBy: user.name, requireDepartment: true, requireAcceptance: true, ...(attachments.length ? { attachments } : {}) },
  );
  await audit(user.id, ok ? "email.customSent" : "email.customFailed", "Email", d.to, { subject: d.subject, dept, attachmentCount: attachments.length, attachmentBytes: attachments.reduce((n, a) => n + a.size, 0) });
  // Encode result text once and preserve the department/mode on both outcomes.
  redirect(ok ? composeResult(backTo, "sent", "1") : composeResult(backTo, "e", "Send not confirmed. Check Sent and your mailbox before retrying, then review SMTP settings."));
}
