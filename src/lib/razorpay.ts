import "server-only";
import { getRazorpayConfig } from "@/lib/razorpay-config";
import { logger } from "@/lib/logger";

/**
 * Minimal server-side Razorpay API client (payment links only).
 *
 * - Auth: HTTP Basic with the stored credentials (lib/razorpay-config.ts).
 * - No SDK dependency: plain fetch, 10 s timeout, typed minimal responses.
 * - RAZORPAY_API_BASE exists ONLY for local scripted verification against a
 *   stub server; production never sets it (defaults to api.razorpay.com).
 * - Errors surface the provider's own description when present, and never
 *   include credentials, raw request bodies or URL tokens.
 */

const API_BASE = (process.env.RAZORPAY_API_BASE || "https://api.razorpay.com").replace(/\/$/, "");
const TIMEOUT_MS = 10_000;

export class RazorpayError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "RazorpayError";
  }
}

export type RazorpayLinkEntity = {
  id: string;
  reference_id?: string | null;
  amount?: number;
  currency?: string;
  status?: string;
  short_url?: string;
};

export type RazorpayOrderEntity = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string | null;
  status?: string;
};

export type RazorpayPaymentEntity = {
  id: string;
  order_id?: string | null;
  amount?: number;
  currency?: string;
  status?: string;
  method?: string | null;
  email?: string | null;
  contact?: string | null;
  notes?: Record<string, string> | null;
};

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const config = await getRazorpayConfig();
  if (!config) throw new RazorpayError("Razorpay is not configured. Save the API keys under Settings → Payment gateway.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await response.text();
    let parsed: unknown = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }
    if (!response.ok) {
      const description = parsed && typeof parsed === "object" && "error" in parsed && parsed.error && typeof parsed.error === "object" && "description" in parsed.error && typeof (parsed.error as { description?: unknown }).description === "string"
        ? (parsed.error as { description: string }).description
        : null;
      // 4xx from Razorpay is an actionable outcome, not a retryable fault.
      throw new RazorpayError(description ?? `Razorpay returned ${response.status}.`, response.status);
    }
    return parsed as T;
  } catch (error) {
    if (error instanceof RazorpayError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new RazorpayError("Razorpay did not respond in time. Try again.");
    logger.warn("razorpay.call_failed", { path, message: error instanceof Error ? error.message : "unknown" });
    throw new RazorpayError("Could not reach Razorpay. Try again in a moment.");
  } finally {
    clearTimeout(timer);
  }
}

/** Create a Standard Checkout order on demand (client-initiated payment).
 *  Amounts are integer minor units matching Invoice.amount exactly. */
export async function createRazorpayOrder(input: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderEntity> {
  const entity = await call<RazorpayOrderEntity>("/v1/orders", {
    method: "POST",
    body: { amount: input.amount, currency: input.currency, receipt: input.receipt, ...(input.notes ? { notes: input.notes } : {}) },
  });
  if (!entity?.id || !/^order_/.test(entity.id)) throw new RazorpayError("Razorpay did not return a usable order.");
  return entity;
}

/** Fetch one payment — used for checkout verification and reconciliation. */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentEntity | null> {
  try {
    return await call<RazorpayPaymentEntity>(`/v1/payments/${encodeURIComponent(paymentId)}`);
  } catch (error) {
    if (error instanceof RazorpayError && error.status === 404) return null;
    throw error;
  }
}

/** All payments attempted against one order — the sync/reconciliation view. */
export async function fetchRazorpayOrderPayments(orderId: string): Promise<RazorpayPaymentEntity[]> {
  try {
    const list = await call<{ items?: RazorpayPaymentEntity[] }>(`/v1/orders/${encodeURIComponent(orderId)}/payments`);
    return Array.isArray(list?.items) ? list.items : [];
  } catch (error) {
    if (error instanceof RazorpayError && error.status === 404) return [];
    throw error;
  }
}

/** Create a payment link for one invoice. Amounts are integer minor units,
 *  matching the Invoice.amount column exactly — no rounding ever happens. */
export async function createRazorpayPaymentLink(input: {
  amount: number;
  currency: string;
  referenceId: string;
  description: string;
  customer: { name: string; email: string; contact?: string | null };
}): Promise<{ id: string; shortUrl: string }> {
  const entity = await call<RazorpayLinkEntity>("/v1/payment_links", {
    method: "POST",
    body: {
      amount: input.amount,
      currency: input.currency,
      reference_id: input.referenceId,
      description: input.description,
      customer: { name: input.customer.name, email: input.customer.email, ...(input.customer.contact ? { contact: input.customer.contact } : {}) },
      // Savo sends its own branded invoice email with the Pay now action;
      // Razorpay must not send a second, unbranded notification.
      notify: { sms: false, email: false },
      reminder_enable: false,
      options: { checkout: { name: "Savo Technologies" } },
    },
  });
  if (!entity?.id || !entity.short_url || !/^https:\/\//.test(entity.short_url)) {
    throw new RazorpayError("Razorpay did not return a usable payment link.");
  }
  return { id: entity.id, shortUrl: entity.short_url };
}

/** Fetch a payment link's current status (reconciliation). Null when the
 *  link no longer exists at the provider. */
export async function fetchRazorpayPaymentLink(id: string): Promise<RazorpayLinkEntity | null> {
  try {
    return await call<RazorpayLinkEntity>(`/v1/payment_links/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof RazorpayError && error.status === 404) return null;
    throw error;
  }
}

/** Best-effort cancellation so a stale link can never be paid again. */
export async function cancelRazorpayPaymentLink(id: string): Promise<boolean> {
  try {
    await call(`/v1/payment_links/${encodeURIComponent(id)}/cancel`, { method: "POST" });
    return true;
  } catch (error) {
    logger.warn("razorpay.link_cancel_failed", { linkId: id, message: error instanceof Error ? error.message : "unknown" });
    return false;
  }
}
