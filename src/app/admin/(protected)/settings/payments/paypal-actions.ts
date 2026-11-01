"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { stepUpVerified, STEP_UP_PURPOSE_PAYMENTS } from "@/lib/step-up";
import { audit } from "@/lib/audit";
import { savePayPalConfig, clearPayPalConfig, getPayPalConfig, recordPayPalVerification } from "@/lib/paypal-config";
import { paypalToken } from "@/lib/paypal";
import { finishPayPalCheckout } from "@/lib/paypal-checkout";
import { z } from "zod";
const back = "/admin/settings/payments";
async function admin() {
  const user = await requireAdmin();
  if (user.role !== "admin") redirect("/admin?denied=Payment%20credentials%20are%20admin-only");
  if (!(await stepUpVerified(user.id, STEP_UP_PURPOSE_PAYMENTS))) redirect(`${back}?e=Email%20verification%20required.`);
  return user;
}
export async function savePayPalConfigAction(form: FormData): Promise<void> {
  const user = await admin();
  const mode = form.get("paypalMode");
  if (mode !== "sandbox" && mode !== "live") redirect(`${back}?e=Choose%20a%20PayPal%20environment.`);
  try {
    await savePayPalConfig({ mode, clientId: String(form.get("paypalClientId") ?? "").trim(), clientSecret: String(form.get("paypalClientSecret") ?? "").trim(), merchantId: String(form.get("paypalMerchantId") ?? "").trim(), webhookId: String(form.get("paypalWebhookId") ?? "").trim(), clearWebhook: form.get("paypalClearWebhook") === "on", adminId: user.id });
  } catch { redirect(`${back}?e=PayPal%20credentials%20were%20not%20saved.%20Check%20the%20fields%20and%20encrypted%20storage.%20Changing%20app%20or%20environment%20requires%20all%20matching%20credentials.`); }
  await audit(user.id, "paypal.config.save", "PayPalGatewayConfig", "paypal", { mode, secretsUpdated: true });
  revalidatePath(back); redirect(`${back}?paypalSaved=1#paypal`);
}
export async function verifyPayPalConfigAction(): Promise<void> {
  const user = await admin(); let ok = false, revision: Date | undefined;
  try { const config = await getPayPalConfig(); if (config) { revision = config.revision; await paypalToken(config); ok = true; } } catch { /* Never echo tokens, secrets or provider response bodies. */ }
  const recorded = await recordPayPalVerification(ok, revision);
  if (ok && !recorded) redirect(`${back}?e=PayPal%20configuration%20changed%20during%20verification.%20Verify%20the%20current%20credentials%20again.#paypal`);
  await audit(user.id, "paypal.config.verify", "PayPalGatewayConfig", "paypal", { ok });
  revalidatePath(back);
  redirect(ok ? `${back}?paypalVerified=1#paypal` : `${back}?e=PayPal%20did%20not%20accept%20the%20connection.%20Check%20the%20matching%20environment%20and%20credentials.#paypal`);
}
export async function reconcilePayPalAction(form: FormData): Promise<void> {
  const user = await admin();
  const id = z.string().uuid().safeParse(form.get("paypalCheckoutId"));
  if (!id.success) redirect(`${back}?e=Invalid%20PayPal%20reference.`);
  const result = await finishPayPalCheckout(id.data, { webhook: true, reconcileOnly: true });
  await audit(user.id, "paypal.reconcile", "PayPalCheckout", id.data, { ok: result.ok });
  revalidatePath(back);
  redirect(`${back}?${result.ok ? "paypalReconciled=1" : "e=PayPal%20confirmation%20still%20needs%20review.%20No%20new%20capture%20was%20requested."}#paypal`);
}
export async function clearPayPalConfigAction(): Promise<void> {
  const user = await admin(); await clearPayPalConfig();
  await audit(user.id, "paypal.config.clear", "PayPalGatewayConfig", "paypal");
  revalidatePath(back); redirect(`${back}?paypalCleared=1#paypal`);
}
