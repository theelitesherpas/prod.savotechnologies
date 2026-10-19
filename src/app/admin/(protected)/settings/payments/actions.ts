"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { saveRazorpayConfig, clearRazorpayConfig, recordRazorpayVerification, getRazorpayConfig } from "@/lib/razorpay-config";
import { secretBoxConfigured } from "@/lib/secret-box";
import { sendMail } from "@/lib/mail";
import { stepUpCode } from "@/lib/mail/templates";
import {
  STEP_UP_PURPOSE_PAYMENTS, stepUpVerified, stepUpSendAllowed, createStepUpChallenge,
  discardStepUpChallenge, checkStepUpCode, signStepUpGrant, stepUpCookieName,
  stepUpDestinationEmail,
} from "@/lib/step-up";

/**
 * Payment gateway credential mutations. ADMIN ROLE ONLY — editors with the
 * settings section cannot touch payment credentials — and every mutation,
 * including credential changes, is gated by a fresh email step-up grant.
 * Secrets are encrypted before storage and never appear in redirects,
 * audit metadata or logs.
 */

const BACK = "/admin/settings/payments";
const PURPOSE_LABEL = "payment settings";

function failed(error: unknown): never {
  const message = error instanceof Error && error.message ? error.message : "Check the Razorpay fields.";
  redirect(`${BACK}?e=${encodeURIComponent(message)}`);
}

/** Admin session + role + a CURRENT step-up grant, or a safe redirect. */
async function verifiedAdmin(): Promise<{ id: string; email: string; name: string }> {
  const user = await requireAdmin();
  if (user.role !== "admin") redirect("/admin?denied=Payment%20credentials%20are%20admin-only");
  if (!(await stepUpVerified(user.id, STEP_UP_PURPOSE_PAYMENTS))) {
    failed(new Error("Email verification required. Open the payment settings page and verify with a code first."));
  }
  return user;
}

const keyIdSchema = z.string().trim().regex(/^rzp_(?:test|live)_[A-Za-z0-9]{6,64}$/, "Key ID must look like rzp_test_… or rzp_live_… (copy it from Dashboard → Settings → API Keys).");
const keySecretSchema = z.string().trim().min(16, "Key Secret looks too short — copy the full value.").max(128);
const webhookSecretSchema = z.string().trim().min(16, "Webhook secret looks too short — copy the full value from Dashboard → Settings → Webhooks.").max(128);
const codeSchema = z.string().trim().regex(/^[0-9]{6}$/, "Enter the 6-digit code from the email.");

// ── step-up: send / verify / lock ───────────────────────────────────────

export async function sendStepUpCodeAction(): Promise<void> {
  const user = await requireAdmin();
  if (user.role !== "admin") redirect("/admin?denied=Payment%20credentials%20are%20admin-only");

  if (!stepUpSendAllowed(user.id)) {
    failed(new Error("Too many code requests. Wait a few minutes before requesting another."));
  }
  // Fixed security inbox (STEP_UP_EMAIL) or the signed-in admin's own email.
  // An invalid STEP_UP_EMAIL fails closed here with a clear message.
  const destination = stepUpDestinationEmail() ?? user.email;
  let challenge: { id: string; code: string } | null = null;
  try {
    challenge = await createStepUpChallenge(user.id, STEP_UP_PURPOSE_PAYMENTS, destination);
  } catch {
    failed(new Error("Could not create a verification challenge. Try again."));
  }
  if (!challenge) failed(new Error("Database unavailable. Try again."));

  const sent = await sendMail(destination, stepUpCode(user.name, challenge.code, PURPOSE_LABEL), "hello", { templateKey: "stepUpCode" });
  if (!sent) {
    if (process.env.NODE_ENV === "development") {
      // Local review affordance only: production never runs with NODE_ENV=development,
      // and live deployments deliver by email (no code is ever logged there).
      logger.info("stepup.dev_delivery_fallback", { purpose: STEP_UP_PURPOSE_PAYMENTS, code: challenge.code, to: destination });
    } else {
      await discardStepUpChallenge(challenge.id).catch(() => undefined);
      failed(new Error("Email delivery is not enabled on this deployment, so the code could not be sent. Enable live mail (MAIL_DELIVERY_MODE=live on production) and try again."));
    }
  }
  await audit(user.id, "stepup.send", "StepUpChallenge", STEP_UP_PURPOSE_PAYMENTS);
  redirect(`${BACK}?otp=sent`);
}

export async function verifyStepUpCodeAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  if (user.role !== "admin") redirect("/admin?denied=Payment%20credentials%20are%20admin-only");

  const parsed = codeSchema.safeParse(String(form.get("code") ?? ""));
  if (!parsed.success) redirect(`${BACK}?otp=sent&e=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid code.")}`);

  const result = await checkStepUpCode(user.id, STEP_UP_PURPOSE_PAYMENTS, parsed.data);
  if (!result.ok) {
    const message = result.reason === "expired" ? "That code expired. Request a new one."
      : result.reason === "locked" ? "Too many incorrect attempts. Request a new code."
      : result.reason === "none" ? "No active code. Request a new one."
      : `Incorrect code. ${result.remaining ?? 0} attempt${result.remaining === 1 ? "" : "s"} remaining.`;
    await audit(user.id, "stepup.failed", "StepUpChallenge", STEP_UP_PURPOSE_PAYMENTS, { reason: result.reason });
    redirect(`${BACK}?otp=sent&e=${encodeURIComponent(message)}`);
  }

  const grant = signStepUpGrant(user.id, STEP_UP_PURPOSE_PAYMENTS);
  const store = await cookies();
  store.set(stepUpCookieName(STEP_UP_PURPOSE_PAYMENTS), grant.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: grant.expiresAt,
  });
  await audit(user.id, "stepup.verified", "StepUpChallenge", STEP_UP_PURPOSE_PAYMENTS);
  redirect(BACK);
}

export async function lockStepUpAction(): Promise<void> {
  const user = await requireAdmin();
  if (user.role !== "admin") redirect("/admin?denied=Payment%20credentials%20are%20admin-only");
  const store = await cookies();
  store.delete(stepUpCookieName(STEP_UP_PURPOSE_PAYMENTS));
  await audit(user.id, "stepup.lock", "StepUpChallenge", STEP_UP_PURPOSE_PAYMENTS);
  redirect(`${BACK}?otp=locked`);
}

// ── credential mutations (step-up gated) ────────────────────────────────

export async function saveRazorpayConfigAction(form: FormData): Promise<void> {
  const user = await verifiedAdmin();

  if (!secretBoxConfigured()) {
    failed(new Error("Secret storage is locked: set SECRETS_MASTER_KEY in the server environment (base64, 32 bytes) and restart, then save credentials here."));
  }

  const keyIdParsed = keyIdSchema.safeParse(String(form.get("keyId") ?? ""));
  if (!keyIdParsed.success) failed(new Error(keyIdParsed.error.issues[0]?.message ?? "Invalid Key ID."));
  const keyId = keyIdParsed.data;

  // Blank Key Secret = keep the stored one; the stored secret is never sent back to the browser.
  const keySecretRaw = String(form.get("keySecret") ?? "").trim();
  let keySecret: string | null = null;
  if (keySecretRaw !== "") {
    const parsed = keySecretSchema.safeParse(keySecretRaw);
    if (!parsed.success) failed(new Error(parsed.error.issues[0]?.message ?? "Invalid Key Secret."));
    keySecret = parsed.data;
  }

  // Blank webhook secret = keep; the explicit clear checkbox empties it.
  const webhookRaw = String(form.get("webhookSecret") ?? "").trim();
  const clearWebhook = form.get("clearWebhookSecret") === "on";
  let webhookSecret: string | undefined | null; // undefined = keep, "" = clear, string = new value
  if (clearWebhook) webhookSecret = "";
  else if (webhookRaw === "") webhookSecret = undefined;
  else {
    const parsed = webhookSecretSchema.safeParse(webhookRaw);
    if (!parsed.success) failed(new Error(parsed.error.issues[0]?.message ?? "Invalid webhook secret."));
    webhookSecret = parsed.data;
  }

  try {
    await saveRazorpayConfig({ keyId, keySecret, webhookSecret, adminId: user.id });
  } catch (error) {
    logger.warn("razorpay.config_save_failed", { message: error instanceof Error ? error.message : "unknown" });
    failed(error);
  }

  await audit(user.id, "razorpay.config.save", "PaymentGatewayConfig", "razorpay", {
    mode: keyId.startsWith("rzp_live_") ? "live" : "test",
    keyIdPrefix: keyId.slice(0, 12),
    keySecretUpdated: keySecret != null,
    webhookSecret: clearWebhook ? "cleared" : webhookSecret != null ? "updated" : "kept",
  });
  revalidatePath(BACK);
  redirect(`${BACK}?saved=1`);
}

export async function verifyRazorpayConfigAction(): Promise<void> {
  const user = await verifiedAdmin();

  const config = await getRazorpayConfig();
  if (!config) failed(new Error("Save the Key ID and Key Secret first."));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  let ok = false, detail = "Razorpay accepted the credentials.";
  try {
    const response = await fetch("https://api.razorpay.com/v1/payment_links?count=1", {
      method: "GET",
      headers: { Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}` },
      signal: controller.signal,
      cache: "no-store",
    });
    if (response.ok) ok = true;
    else if (response.status === 401 || response.status === 403) detail = "Razorpay rejected these credentials — check the Key ID/Secret pair and the account's API key status.";
    else detail = `Razorpay returned ${response.status}. Try again in a moment.`;
  } catch {
    detail = "Could not reach Razorpay (network timeout). Try again.";
  } finally {
    clearTimeout(timer);
  }

  await recordRazorpayVerification(ok).catch(() => undefined);
  await audit(user.id, "razorpay.config.verify", "PaymentGatewayConfig", "razorpay", { ok, source: config.source, mode: config.mode });
  revalidatePath(BACK);
  redirect(`${BACK}?${ok ? "verified=1" : `e=${encodeURIComponent(detail)}`}`);
}

export async function clearRazorpayConfigAction(): Promise<void> {
  const user = await verifiedAdmin();
  try {
    const removed = await clearRazorpayConfig();
    await audit(user.id, "razorpay.config.clear", "PaymentGatewayConfig", "razorpay", { removed });
  } catch (error) {
    failed(error);
  }
  revalidatePath(BACK);
  redirect(`${BACK}?cleared=1`);
}
