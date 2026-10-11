import "server-only";
import { clearRateLimit, rateCount, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const LOGIN_WINDOW = 15 * 60 * 1000;
const LOGIN_FREE = 2;
const loginFailKey = (portal: string, ip: string) => `login-fail:${portal}:${ip}`;

/** Both unset remains the existing optional integration; partial setup must not bypass verification. */
export function captchaConfiguration(): "off" | "ready" | "invalid" {
  const site = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim());
  const secret = Boolean(process.env.RECAPTCHA_SECRET_KEY?.trim());
  return site && secret ? "ready" : !site && !secret ? "off" : "invalid";
}
export function recordLoginFailure(portal: string, ip: string): void { rateLimit(loginFailKey(portal, ip), 20, LOGIN_WINDOW); }
export function clearLoginFailures(portal: string, ip: string): void { clearRateLimit(loginFailKey(portal, ip)); }
export function loginCaptchaRequired(portal: string, ip: string): boolean { return rateCount(loginFailKey(portal, ip), LOGIN_WINDOW) >= LOGIN_FREE; }

export type CaptchaCheck =
  | { ok: true }
  | { ok: false; captchaRequired: true }
  | { ok: false; error: string };

async function verify(required: boolean, token: unknown): Promise<CaptchaCheck> {
  const configuration = captchaConfiguration();
  if (configuration === "invalid") {
    logger.error("captcha.configuration_incomplete");
    return { ok: false, error: "Verification is temporarily unavailable. Please try again later." };
  }
  if (configuration === "off" || !required) return { ok: true };
  if (typeof token !== "string" || token.length < 10 || token.length > 10_000) return { ok: false, captchaRequired: true };
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      // Google does not require remoteip. Do not forward raw visitor IPs here.
      body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY!, response: token }),
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: "Verification could not be completed. Please try again." };
    const json: unknown = await res.json();
    if (json && typeof json === "object" && "success" in json && json.success === true) return { ok: true };
    return { ok: false, captchaRequired: true };
  } catch {
    logger.error("captcha.verification_unavailable");
    return { ok: false, error: "Verification could not be completed. Please try again." };
  }
}

export async function enforceLoginCaptcha(portal: string, ip: string, token: unknown): Promise<CaptchaCheck> {
  return verify(loginCaptchaRequired(portal, ip), token);
}
export async function enforceCaptcha(_ip: string, token: unknown): Promise<CaptchaCheck> {
  // Public lead forms always verify when Google reCAPTCHA is configured.
  return verify(true, token);
}
export function requiredForRequest(): boolean {
  // Public forms display the challenge on every submission flow; portal
  // logins retain their separate failed-attempt threshold.
  return captchaConfiguration() !== "off";
}
