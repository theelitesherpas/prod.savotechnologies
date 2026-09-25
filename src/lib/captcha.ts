import { rateCount, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/api";
import { logger } from "@/lib/logger";

/**
 * Progressive captcha gate — industry-standard bot defence in layers:
 *
 *   1. honeypot field (bots fail silently)            — always on
 *   2. hard rate limit per IP                          — always on
 *   3. Google reCAPTCHA v2 after N submissions per IP  — this module
 *
 * A visitor may submit freely twice from one IP inside 24 hours; from
 * the third submission the client renders the reCAPTCHA challenge and
 * the server rejects any request without a verified token. Keys come
 * from env (NEXT_PUBLIC_RECAPTCHA_SITE_KEY / RECAPTCHA_SECRET_KEY);
 * with keys unset the gate stays open so a misconfiguration can never
 * lock real customers out — layers 1 and 2 still protect the forms.
 */

const TRACK_WINDOW = 24 * 60 * 60 * 1000;
const FREE_PER_WINDOW = 2;

/** Bucket key for successful submissions from this IP (24h window). */
function trackKey(ip: string): string {
  return `captcha-track:${ip}`;
}

/** Successful submissions recorded for this IP in the window. */
export function submissionsFrom(ip: string): number {
  return rateCount(trackKey(ip), TRACK_WINDOW);
}

/** Record a successful submission (call after the store succeeds). */
export function recordSubmission(ip: string): void {
  rateLimit(trackKey(ip), 1000, TRACK_WINDOW);
}

/** Does this IP need a captcha for its next submission? */
export function captchaRequired(ip: string): boolean {
  return submissionsFrom(ip) >= FREE_PER_WINDOW;
}

export type CaptchaCheck =
  | { ok: true }
  | { ok: false; captchaRequired: true }
  | { ok: false; error: string };

/** Enforce the gate for an incoming submission: when the IP is over the
 *  free allowance, a valid reCAPTCHA token must accompany the request. */
export async function enforceCaptcha(ip: string, token: unknown): Promise<CaptchaCheck> {
  if (!captchaRequired(ip)) return { ok: true };

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    // Keys not configured — fail open (logged); honeypot + rate limits hold.
    logger.warn("captcha: secret not configured, gate skipped", { ip });
    return { ok: true };
  }

  if (typeof token !== "string" || token.length < 10) {
    return { ok: false, captchaRequired: true };
  }

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const json = (await res.json()) as { success?: boolean };
    if (json.success === true) return { ok: true };
    logger.warn("captcha: verification failed", { ip });
    return { ok: false, captchaRequired: true };
  } catch (err) {
    logger.error("captcha: verify error", { err: String(err).slice(0, 150) });
    return { ok: false, error: "Verification could not be completed. Please try again." };
  }
}

/** Convenience: request IP → captcha needed? (for the client check route) */
export function requiredForRequest(req: Request): boolean {
  return captchaRequired(clientIp(req));
}
