import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret, secretBoxConfigured } from "@/lib/secret-box";
export type PayPalConfig = { mode: "sandbox" | "live"; clientId: string; clientSecret: string; merchantId: string; webhookId: string | null; fingerprint: string; verified: boolean; revision?: Date };
export const paypalClientIdSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{20,200}$/, "Enter the full PayPal REST app Client ID.");
export const paypalSecretSchema = z.string().trim().min(16).max(256).regex(/^[\x21-\x7e]+$/, "Enter the complete Client Secret without spaces.");
export const paypalMerchantSchema = z.string().trim().regex(/^[A-Z0-9]{13}$/, "Enter the 13-character PayPal Merchant ID for your Indian business account.");
export const paypalWebhookSchema = z.string().trim().regex(/^[A-Za-z0-9-]{8,128}$/, "Enter the Webhook ID from the same PayPal REST app/environment.");
/** No environment fallback: a corrupt/missing saved row must never silently
 * select another merchant or environment. Secrets are read only server-side. */
export async function getPayPalConfig(): Promise<PayPalConfig | null> {
  if (!prisma) return null;
  const row = await prisma.payPalGatewayConfig.findUnique({ where: { id: "paypal" } });
  if (!row) return null;
  if (row.mode !== "sandbox" && row.mode !== "live") throw new Error("Invalid stored PayPal environment.");
  const clientId = paypalClientIdSchema.parse(decryptSecret(row.clientIdEnc));
  const clientSecret = paypalSecretSchema.parse(decryptSecret(row.clientSecretEnc));
  const merchantId = paypalMerchantSchema.parse(decryptSecret(row.merchantIdEnc));
  const webhookId = row.webhookIdEnc ? paypalWebhookSchema.parse(decryptSecret(row.webhookIdEnc)) : null;
  return { mode: row.mode, clientId, clientSecret, merchantId, webhookId, fingerprint: createHash("sha256").update(`${row.mode}:${clientId}:${merchantId}`).digest("hex"), verified: row.lastVerifyOk === true, revision: row.updatedAt };
}
export async function paypalStatus() {
  const locked = !secretBoxConfigured();
  if (!prisma) return { configured: false, locked, mode: "sandbox" as const, maskedClientId: "", maskedMerchantId: "", hasWebhook: false, verified: false };
  const config = await getPayPalConfig();
  return { configured: !!config, locked, mode: config?.mode ?? "sandbox", maskedClientId: config ? `••••${config.clientId.slice(-4)}` : "", maskedMerchantId: config ? `••••${config.merchantId.slice(-4)}` : "", hasWebhook: !!config?.webhookId, verified: !!config?.verified };
}
export async function savePayPalConfig(input: { mode: "sandbox" | "live"; clientId: string; clientSecret: string; merchantId: string; webhookId: string; clearWebhook: boolean; adminId: string }) {
  if (!prisma || !secretBoxConfigured()) throw new Error("Encrypted secret storage is unavailable.");
  const old = await getPayPalConfig();
  const changed = !!old && (input.mode !== old.mode || (!!input.clientId && input.clientId !== old.clientId) || (!!input.merchantId && input.merchantId !== old.merchantId));
  if (changed && (!input.clientId || !input.clientSecret || !input.merchantId)) throw new Error("When changing app, merchant or environment, provide the matching Client ID, Client Secret and Merchant ID together.");
  const clientId = paypalClientIdSchema.parse(input.clientId || old?.clientId || "");
  const clientSecret = paypalSecretSchema.parse(input.clientSecret || old?.clientSecret || "");
  const merchantId = paypalMerchantSchema.parse(input.merchantId || old?.merchantId || "");
  const webhookId = input.clearWebhook ? null : input.webhookId ? paypalWebhookSchema.parse(input.webhookId) : changed ? null : old?.webhookId ?? null;
  const data = { mode: input.mode, clientIdEnc: encryptSecret(clientId), clientSecretEnc: encryptSecret(clientSecret), merchantIdEnc: encryptSecret(merchantId), webhookIdEnc: webhookId ? encryptSecret(webhookId) : null, updatedBy: input.adminId, lastVerifyOk: null, lastVerifiedAt: null };
  if (old) {
    if (!old.revision) throw new Error("PayPal configuration revision is unavailable.");
    const changed = await prisma.payPalGatewayConfig.updateMany({ where: { id: "paypal", updatedAt: old.revision }, data });
    if (changed.count !== 1) throw new Error("PayPal configuration changed while saving. Refresh before retrying.");
  } else {
    // A concurrent first save must conflict, never silently overwrite another app.
    await prisma.payPalGatewayConfig.create({ data: { id: "paypal", ...data } });
  }
}
export async function recordPayPalVerification(ok: boolean, revision?: Date): Promise<boolean> {
  if (!prisma || !revision) return false;
  const changed = await prisma.payPalGatewayConfig.updateMany({ where: { id: "paypal", updatedAt: revision }, data: { lastVerifyOk: ok, lastVerifiedAt: new Date() } });
  return changed.count === 1;
}
export async function clearPayPalConfig() { if (!prisma) throw new Error("Database unavailable."); await prisma.payPalGatewayConfig.deleteMany({ where: { id: "paypal" } }); }
