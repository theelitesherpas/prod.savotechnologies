import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, secretBoxConfigured } from "@/lib/secret-box";

/**
 * Razorpay credential resolution for server-side API calls and webhook
 * verification. Two supported sources, in order:
 *
 *   1. The admin-managed row in payment_gateway_configs (secrets encrypted
 *      at rest via lib/secret-box.ts) — the production path.
 *   2. Environment variables (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET /
 *      RAZORPAY_WEBHOOK_SECRET) — convenience for local development and
 *      scripted verification, never mixed with the DB row.
 *
 * Resolved values are cached in-process for a short window so webhook and
 * payment-link calls do not query/decrypt on every request; saving new
 * credentials invalidates the cache immediately.
 */

export type RazorpayMode = "test" | "live";

export type RazorpayConfig = {
  mode: RazorpayMode;
  keyId: string;
  keySecret: string;
  webhookSecret: string | null;
  /** Where the credentials came from, for audit/UI only. */
  source: "database" | "environment";
};

/** Masked, UI-safe metadata. Never contains secret material. */
export type RazorpayStatus = {
  configured: boolean;
  mode: RazorpayMode;
  keyIdMasked: string;
  hasWebhookSecret: boolean;
  source: "database" | "environment";
  lastVerifiedAt: Date | null;
  lastVerifyOk: boolean | null;
  secretBoxConfigured: boolean;
};

const CACHE_TTL_MS = 30_000;

const globalForRazorpay = globalThis as unknown as {
  __savoRazorpayConfigCache?: { value: RazorpayConfig | null; loadedAt: number; epoch: number };
  __savoRazorpayConfigEpoch?: number;
};

/** Bump to invalidate cached credentials across the process. */
function invalidate(): void {
  globalForRazorpay.__savoRazorpayConfigEpoch = (globalForRazorpay.__savoRazorpayConfigEpoch ?? 0) + 1;
}

export function modeFromKeyId(keyId: string): RazorpayMode | null {
  if (keyId.startsWith("rzp_live_")) return "live";
  if (keyId.startsWith("rzp_test_")) return "test";
  return null;
}

function fromEnvironment(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";
  if (!keyId || !keySecret) return null;
  const mode = modeFromKeyId(keyId);
  if (!mode) return null;
  return { mode, keyId, keySecret, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null, source: "environment" };
}

async function fromDatabase(): Promise<RazorpayConfig | null> {
  if (!prisma || !secretBoxConfigured()) return null;
  const row = await prisma.paymentGatewayConfig.findUnique({ where: { gateway: "razorpay" } });
  if (!row) return null;
  // Fail closed: a corrupt/unopenable row surfaces as an operational error,
  // never as "unconfigured" silently falling through to weaker credentials.
  const keySecret = decryptSecret(row.keySecretEnc);
  const webhookSecret = row.webhookSecretEnc ? decryptSecret(row.webhookSecretEnc) : null;
  return { mode: row.mode === "live" ? "live" : "test", keyId: row.keyId, keySecret, webhookSecret, source: "database" };
}

/** Resolve the active Razorpay credentials, or null when not configured. */
export async function getRazorpayConfig(): Promise<RazorpayConfig | null> {
  const epoch = globalForRazorpay.__savoRazorpayConfigEpoch ?? 0;
  const cache = globalForRazorpay.__savoRazorpayConfigCache;
  if (cache && cache.epoch === epoch && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.value;
  let value: RazorpayConfig | null;
  try {
    value = await fromDatabase();
  } catch (error) {
    // Stored credentials exist but cannot be decrypted (key rotation/tamper).
    // Fail closed: never silently fall back to weaker/other credentials while
    // a payment or webhook could be processing against the broken row.
    throw error;
  }
  if (!value) value = fromEnvironment();
  globalForRazorpay.__savoRazorpayConfigCache = { value, loadedAt: Date.now(), epoch };
  return value;
}

function maskKeyId(keyId: string): string {
  if (keyId.length <= 12) return `${keyId.slice(0, 4)}…`;
  return `${keyId.slice(0, 12)}…${keyId.slice(-4)}`;
}

/** Masked status for the admin UI — safe to render, never a secret. */
export async function razorpayStatus(): Promise<RazorpayStatus> {
  const dbRow = prisma && secretBoxConfigured()
    ? await prisma.paymentGatewayConfig.findUnique({ where: { gateway: "razorpay" } }).catch(() => null)
    : null;
  const envConfig = fromEnvironment();
  if (dbRow) {
    return {
      configured: true,
      mode: dbRow.mode === "live" ? "live" : "test",
      keyIdMasked: maskKeyId(dbRow.keyId),
      hasWebhookSecret: !!dbRow.webhookSecretEnc,
      source: "database",
      lastVerifiedAt: dbRow.lastVerifiedAt,
      lastVerifyOk: dbRow.lastVerifyOk,
      secretBoxConfigured: true,
    };
  }
  if (envConfig) {
    return {
      configured: true,
      mode: envConfig.mode,
      keyIdMasked: maskKeyId(envConfig.keyId),
      hasWebhookSecret: !!envConfig.webhookSecret,
      source: "environment",
      lastVerifiedAt: null,
      lastVerifyOk: null,
      secretBoxConfigured: secretBoxConfigured(),
    };
  }
  return {
    configured: false,
    mode: "test",
    keyIdMasked: "",
    hasWebhookSecret: false,
    source: "environment",
    lastVerifiedAt: null,
    lastVerifyOk: null,
    secretBoxConfigured: secretBoxConfigured(),
  };
}

/** Persist credentials from the admin settings action (caller validates). */
export async function saveRazorpayConfig(input: {
  keyId: string;
  keySecret: string | null; // null = keep the existing secret
  webhookSecret: string | null | undefined; // undefined = keep; null not used
  adminId: string;
}): Promise<void> {
  if (!prisma) throw new Error("Database unavailable.");
  const existing = await prisma.paymentGatewayConfig.findUnique({ where: { gateway: "razorpay" } });
  const mode = modeFromKeyId(input.keyId);
  if (!mode) throw new Error("Razorpay Key ID must start with rzp_test_ or rzp_live_.");
  const keySecretEnc = input.keySecret != null ? encryptSecret(input.keySecret) : existing
    ? (() => {
        if (input.keyId !== existing.keyId) throw new Error("Key ID changed — provide its matching Key Secret again.");
        return existing.keySecretEnc;
      })()
    : null;
  if (!keySecretEnc) throw new Error("Provide the Key Secret for this Key ID.");
  let webhookSecretEnc: string | null | undefined = existing?.webhookSecretEnc ?? null;
  if (typeof input.webhookSecret === "string") webhookSecretEnc = input.webhookSecret ? encryptSecret(input.webhookSecret) : null;
  await prisma.paymentGatewayConfig.upsert({
    where: { gateway: "razorpay" },
    create: { gateway: "razorpay", mode, keyId: input.keyId, keySecretEnc, webhookSecretEnc: webhookSecretEnc ?? null, createdBy: input.adminId, updatedBy: input.adminId },
    update: { mode, keyId: input.keyId, keySecretEnc, webhookSecretEnc: webhookSecretEnc ?? null, updatedBy: input.adminId },
  });
  invalidate();
}

/** Remove stored credentials entirely (danger zone). */
export async function clearRazorpayConfig(): Promise<boolean> {
  if (!prisma) throw new Error("Database unavailable.");
  const deleted = await prisma.paymentGatewayConfig.deleteMany({ where: { gateway: "razorpay" } });
  invalidate();
  return deleted.count > 0;
}

/** Record a verification attempt (masked result only). */
export async function recordRazorpayVerification(ok: boolean): Promise<void> {
  if (!prisma) return;
  await prisma.paymentGatewayConfig.updateMany({
    where: { gateway: "razorpay" },
    data: { lastVerifiedAt: new Date(), lastVerifyOk: ok },
  });
  invalidate();
}
