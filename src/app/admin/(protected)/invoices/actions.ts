"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";

const CURRENCIES = ["INR", "USD", "CHF", "EUR", "GBP", "AED"] as const;
const STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"] as const;

const invoiceSchema = z.object({
  clientId: z.string().min(10).max(32),
  projectId: z.string().optional().or(z.literal("")),
  number: z.string().trim().min(3).max(32),
  /** Major units in the form (e.g. 2500.50) → stored as minor units. */
  amountMajor: z.coerce.number().min(0).max(100_000_000),
  currency: z.enum(CURRENCIES),
  status: z.enum(STATUSES),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  issuedAt: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  paidAt: z.string().optional().or(z.literal("")),
});

function parseDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function nextNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = (await prisma!.invoice.count()) + 1;
  return `INV-${year}-${String(count).padStart(3, "0")}`;
}

export async function createInvoiceAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/invoices?e=Database%20unavailable.");

  const parsed = invoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    projectId: formData.get("projectId") || "",
    number: formData.get("number") || (await nextNumber()),
    amountMajor: formData.get("amountMajor") ?? 0,
    currency: formData.get("currency") ?? "INR",
    status: formData.get("status") ?? "sent",
    notes: formData.get("notes") ?? "",
    issuedAt: formData.get("issuedAt") ?? "",
    dueDate: formData.get("dueDate") ?? "",
    paidAt: formData.get("paidAt") ?? "",
  });
  if (!parsed.success) redirect(`/admin/invoices?e=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`);

  const d = parsed.data;
  const amount = Math.round(d.amountMajor * 100);
  try {
    await prisma.invoice.create({
      data: {
        clientId: d.clientId,
        projectId: d.projectId || null,
        number: d.number,
        amount,
        currency: d.currency,
        status: d.status,
        notes: d.notes ?? "",
        issuedAt: parseDate(d.issuedAt) ?? new Date(),
        dueDate: parseDate(d.dueDate),
        paidAt: d.status === "paid" ? (parseDate(d.paidAt) ?? new Date()) : parseDate(d.paidAt),
      },
    });
  } catch {
    redirect("/admin/invoices?e=That%20invoice%20number%20is%20already%20in%20use.");
  }
  await audit(user.id, "invoice.create", "Invoice", d.number, { amount, currency: d.currency });
  revalidatePath("/admin/invoices");
  redirect("/admin/invoices?saved=created");
}

export async function updateInvoiceAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/invoices?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));

  const parsed = invoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    projectId: formData.get("projectId") || "",
    number: formData.get("number"),
    amountMajor: formData.get("amountMajor") ?? 0,
    currency: formData.get("currency") ?? "INR",
    status: formData.get("status") ?? "sent",
    notes: formData.get("notes") ?? "",
    issuedAt: formData.get("issuedAt") ?? "",
    dueDate: formData.get("dueDate") ?? "",
    paidAt: formData.get("paidAt") ?? "",
  });
  if (!parsed.success) redirect(`/admin/invoices/${id}?e=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`);

  const d = parsed.data;
  try {
    await prisma.invoice.update({
      where: { id },
      data: {
        clientId: d.clientId,
        projectId: d.projectId || null,
        number: d.number,
        amount: Math.round(d.amountMajor * 100),
        currency: d.currency,
        status: d.status,
        notes: d.notes ?? "",
        issuedAt: parseDate(d.issuedAt) ?? new Date(),
        dueDate: parseDate(d.dueDate),
        paidAt: d.status === "paid" ? (parseDate(d.paidAt) ?? new Date()) : parseDate(d.paidAt),
      },
    });
  } catch {
    redirect(`/admin/invoices/${id}?e=dup`);
  }
  await audit(user.id, "invoice.update", "Invoice", d.number);
  revalidatePath("/admin/invoices");
  redirect("/admin/invoices?saved=1");
}

export async function markInvoicePaidAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/invoices?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));

  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (inv) {
    await prisma.invoice.update({ where: { id }, data: { status: "paid", paidAt: new Date() } });
    await audit(user.id, "invoice.markPaid", "Invoice", inv.number);
  }
  revalidatePath("/admin/invoices");
  redirect("/admin/invoices?saved=paid");
}

export async function deleteInvoiceAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/invoices?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));

  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (inv) {
    await prisma.invoice.delete({ where: { id } });
    await audit(user.id, "invoice.delete", "Invoice", inv.number);
  }
  revalidatePath("/admin/invoices");
  redirect("/admin/invoices?deleted=1");
}
