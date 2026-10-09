import { logger } from "@/lib/logger";

/**
 * Always-on Google reCAPTCHA v2 gate - industry-standard bot defence in layers:
 *
 *   1. honeypot field (bots fail silently)                     - always on
 *   2. hard rate limit per IP                                  - always on
 *   3. Google reCAPTCHA v2 on EVERY submission                 - this module
 *
 * Every public form submission and every login attempt must carry a
 * verified reCAPTCHA token - there is no free allowance. Keys come from
 * env (NEXT_PUBLIC_RECAPTCHA_SITE_KEY / RECAPTCHA_SECRET_KEY).
 *
 * With the secret unset the gate fails OPEN (loudly logged) so a missing
 * env var can never lock real customers out of a deployment - layers 1
 * and 2 still protect the forms. Production (savotechnologies.com) must
 * always configure real keys; see docs/CAPTCHA.md.
 *
 * Verification also enforces a hostname allowlist: a token is only
 * accepted when it was solved on a domain we own (derived from
 * NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_CANONICAL_ORIGIN, or the explicit
 * RECAPTCHA_ALLOWED_HOSTNAMES override). This blocks attackers from
 * hosting our public site key on their own page, having it solved there
 * and replaying the token against our API.
 */

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const VERIFY_TIMEOUT_MS = 10_000;
const MIN_TOKEN_LENGTH = 10;

export type CaptchaCheck =
  | { ok: true }
  | { ok: false; captchaRequired: true }
  | { ok: false; error: string };

/** Is the server side of the gate configured? */
export function captchaConfigured(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY);
}

/** Hostnames a solved token is allowed to originate from.
 *  An explicit RECAPTCHA_ALLOWED_HOSTNAMES override REPLACES the whole
 *  policy (strict mode for unusual deployments); otherwise the policy
 *  is derived from the configured site origins plus local dev hosts. */
function allowedHostnames(): Set<string> {
  const override = process.env.RECAPTCHA_ALLOWED_HOSTNAMES;
  if (override) {
    const hosts = new Set<string>();
    for (const h of override.split(",")) {
      const host = h.trim().toLowerCase();
      if (host) hosts.add(host);
    }
    return hosts;
  }

  const hosts = new Set<string>(["localhost", "127.0.0.1", "testkey.google.com"]);
  for (const raw of [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_CANONICAL_ORIGIN]) {
    if (!raw) continue;
    try {
      const host = new URL(raw).hostname.toLowerCase();
      if (!host) continue;
      hosts.add(host);
      // Cover both apex and www serving variants.
      if (host.startsWith("www.")) hosts.add(host.slice(4));
      else hosts.add(`www.${host}`);
    } catch {
      // Ignore malformed env values - the gate stays permissive on hosts.
    }
  }
  return hosts;
}

/** Shared core: verify a token with Google and enforce our host policy. */
async function verifyToken(ip: string, token: string, context: string): Promise<CaptchaCheck> {
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY ?? "", response: token, remoteip: ip }),
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    const json = (await res.json()) as { success?: boolean; hostname?: string };
    if (json.success !== true) {
      logger.warn("captcha: verification failed", { context, ip });
      return { ok: false, captchaRequired: true };
    }
    if (typeof json.hostname === "string" && json.hostname) {
      const host = json.hostname.toLowerCase();
      if (!allowedHostnames().has(host)) {
        logger.warn("captcha: hostname not allowed", { context, ip, host });
        return { ok: false, captchaRequired: true };
      }
    }
    return { ok: true };
  } catch (err) {
    logger.error("captcha: verify error", { context, err: String(err).slice(0, 150) });
    return { ok: false, error: "Verification could not be completed. Please try again." };
  }
}

/** Validate the raw token shape before talking to Google. */
function tokenProblem(token: unknown): boolean {
  return typeof token !== "string" || token.length < MIN_TOKEN_LENGTH;
}

/** Unconfigured-secret path: fail open, but say so loudly every time. */
function failOpen(context: string): CaptchaCheck {
  logger.warn("captcha: secret not configured, gate skipped", { context });
  return { ok: true };
}

/**
 * Enforce the gate for an incoming public submission.
 * A valid reCAPTCHA token is REQUIRED on every request whenever the
 * secret is configured - there is no free allowance.
 */
export async function enforceCaptcha(ip: string, token: unknown): Promise<CaptchaCheck> {
  if (!captchaConfigured()) return failOpen("submission");
  if (tokenProblem(token)) return { ok: false, captchaRequired: true };
  return verifyToken(ip, token as string, "submission");
}

/**
 * Enforce the gate for a login attempt (admin, employee and client
 * portals). Same always-on contract: every attempt must be verified.
 */
export async function enforceLoginCaptcha(
  portal: string,
  ip: string,
  token: unknown,
): Promise<CaptchaCheck> {
  if (!captchaConfigured()) return failOpen(`login:${portal}`);
  if (tokenProblem(token)) return { ok: false, captchaRequired: true };
  return verifyToken(ip, token as string, `login:${portal}`);
}

/** Convenience for the client check route: does this deployment gate forms? */
export function requiredForRequest(): boolean {
  return captchaConfigured();
}
