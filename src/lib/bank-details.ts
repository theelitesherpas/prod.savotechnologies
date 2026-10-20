import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Bank transfer details for the pay page's manual payment option.
 * Managed by admins under Settings → Payment gateway (email step-up area)
 * and stored in site_settings; empty fields stay empty — nothing is
 * fabricated. When nothing is configured the pay page falls back to a
 * contact-us note.
 */

export type BankDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  swift: string;
  branch: string;
  instructions: string;
};

const KEYS: Record<keyof BankDetails, string> = {
  bankName: "bank_name",
  accountName: "bank_account_name",
  accountNumber: "bank_account_number",
  ifsc: "bank_ifsc",
  swift: "bank_swift",
  branch: "bank_branch",
  instructions: "bank_instructions",
};

export async function getBankDetails(): Promise<BankDetails | null> {
  if (!prisma) return null;
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: Object.values(KEYS) } } }).catch(() => []);
  const map = new Map(rows.map(r => [r.key, r.value]));
  const details = Object.fromEntries(Object.entries(KEYS).map(([field, key]) => [field, map.get(key)?.trim() ?? ""])) as BankDetails;
  const hasAnything = !!(details.bankName || details.accountName || details.accountNumber || details.ifsc || details.swift);
  return hasAnything ? details : null;
}

export async function saveBankDetails(details: BankDetails): Promise<void> {
  if (!prisma) throw new Error("Database unavailable.");
  const client = prisma;
  await client.$transaction(Object.entries(KEYS).map(([field, key]) =>
    client.siteSetting.upsert({ where: { key }, create: { key, value: details[field as keyof BankDetails] ?? "" }, update: { value: details[field as keyof BankDetails] ?? "" } }),
  ));
}
