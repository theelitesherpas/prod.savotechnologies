import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Standardized API responses.
 * Success: { ok: true, ...data }  ·  Failure: { ok: false, error }
 * Errors never leak internals — details go to the structured log only.
 */

export function apiOk<T extends Record<string, unknown>>(data?: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function apiError(error: string, status = 400, headers?: HeadersInit) {
  return NextResponse.json({ ok: false, error }, { status, headers });
}

/** Reject mutations without a JSON content type (CSRF hardening + parser guard). */
export function isJsonRequest(req: Request): boolean {
  return (req.headers.get("content-type") ?? "").includes("application/json");
}

/** First hop of x-forwarded-for, falling back to x-real-ip. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Parse and size-limit a JSON body. Returns a discriminated result so
 * handlers stay flat and error responses stay consistent.
 */
export async function readJsonBody(
  req: Request,
  maxBytes = 4_000,
): Promise<{ ok: true; data: unknown } | { ok: false }> {
  try {
    const text = await req.text();
    if (text.length > maxBytes) return { ok: false };
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

/**
 * Cross-origin protection for state-changing requests: when a browser sends
 * Origin it must match the request host. Absent Origin (curl, server-to-
 * server) is allowed — SameSite cookies cover the browser CSRF vector.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const host = req.headers.get("host");
    return !!host && originHost === host;
  } catch {
    return false;
  }
}

/**
 * Wrap a route handler with uniform failure handling: unexpected errors are
 * logged with context and returned as an opaque 500.
 */
export function withErrorHandling(
  event: string,
  handler: (req: Request) => Promise<Response>,
) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (err) {
      logger.error(event, {
        message: err instanceof Error ? err.message : "unknown",
      });
      return apiError("Something went wrong. Please try again shortly.", 500);
    }
  };
}
