import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { masterKeyBytes } from "@/lib/secret-box";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Step-up email verification (sudo mode) for the admin panel's most
 * sensitive surfaces — currently the Razorpay credential page.
 *
 * Flow: an admin requests a 6-digit code → it is emailed to the SIGNED-IN
 * ADMIN'S OWN account address → entering it grants a short-lived,
 * purpose-scoped, HMAC-signed cookie. Every guarded page AND server action
 * re-checks the grant; pages render nothing sensitive before it.
 *
 * - Codes: crypto-random 6 digits, 10-minute expiry, max 5 attempts,
 *   single use. Only an HMAC-SHA256 digest (keyed with SECRETS_MASTER_KEY)
 *   is stored, so a database leak alone cannot reveal or brute-force codes.
 * - Grants: HttpOnly cookie, 30 minutes, bound to user + purpose +
 *   expiry, verified with a constant-time comparison. Not a session — the
 *   admin session itself must still be valid.
 * - Send rate limit: 3 codes per admin per 10 minutes (process-local).
 */

export const STEP_UP_PURPOSE_PAYMENTS = "payments-settings";

const CODE_TTL_MS = 10 * 60 * 1000;
export const STEP_UP_GRANT_TTL_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const SEND_LIMIT = 3;
const SEND_WINDOW_MS = 10 * 60 * 1000;

function digest(purpose: string, code: string): string {
  return createHmac("sha256", masterKeyBytes()).update(`stepup:${purpose}:${code}`).digest("hex");
}

function grantSignature(userId: string, purpose: string, expiresMs: number): string {
  return createHmac("sha256", masterKeyBytes()).update(`grant:${userId}:${purpose}:${expiresMs}`).digest("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8"), bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Cryptographically random 6-digit code, zero-padded. */
export function generateStepUpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Hash a code for storage. Input validation happens before hashing. */
export function hashCodeForStorage(purpose: string, code: string): string {
  return digest(purpose, code);
}

export function stepUpCookieName(purpose: string): string {
  return `savo_stepup_${purpose.replace(/[^a-z0-9-]/gi, "")}`;
}

/** Mint the signed grant token for a freshly verified admin. */
export function signStepUpGrant(userId: string, purpose: string, ttlMs = STEP_UP_GRANT_TTL_MS): { token: string; expiresAt: Date } {
  const expiresMs = Date.now() + ttlMs;
  return { token: `${expiresMs}.${grantSignature(userId, purpose, expiresMs)}`, expiresAt: new Date(expiresMs) };
}

/** Verify a grant token against the current user + purpose + time. */
export function verifyStepUpGrantToken(token: string | undefined, userId: string, purpose: string): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expiresMs = Number(token.slice(0, dot));
  if (!Number.isSafeInteger(expiresMs) || expiresMs < Date.now() || expiresMs > Date.now() + STEP_UP_GRANT_TTL_MS + 60_000) return false;
  return constantTimeEqual(token.slice(dot + 1), grantSignature(userId, purpose, expiresMs));
}

/** Whether the CURRENT request carries a valid step-up grant. */
export async function stepUpVerified(userId: string, purpose: string): Promise<boolean> {
  const store = await cookies();
  return verifyStepUpGrantToken(store.get(stepUpCookieName(purpose))?.value, userId, purpose);
}

/** Create a new challenge (invalidating any active one) and return the code. */
export async function createStepUpChallenge(userId: string, purpose: string, emailTo: string): Promise<{ id: string; code: string } | null> {
  if (!prisma) return null;
  await prisma.stepUpChallenge.updateMany({ where: { userId, purpose, consumedAt: null }, data: { consumedAt: new Date() } });
  const code = generateStepUpCode();
  const row = await prisma.stepUpChallenge.create({
    data: { userId, purpose, codeHash: hashCodeForStorage(purpose, code), emailTo, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });
  return { id: row.id, code };
}

/** Remove a challenge outright (e.g. mail delivery failed — no dangling code). */
export async function discardStepUpChallenge(id: string): Promise<void> {
  if (!prisma) return;
  await prisma.stepUpChallenge.deleteMany({ where: { id } });
}

export type StepUpCheck =
  | { ok: true }
  | { ok: false; reason: "none" | "expired" | "wrong" | "locked"; remaining?: number };

/** Attempt to consume a challenge with the submitted code. */
export async function checkStepUpCode(userId: string, purpose: string, code: string): Promise<StepUpCheck> {
  if (!prisma) return { ok: false, reason: "none" };
  const client = prisma;
  const challenge = await client.stepUpChallenge.findFirst({ where: { userId, purpose, consumedAt: null }, orderBy: { createdAt: "desc" } });
  if (!challenge) return { ok: false, reason: "none" };
  const consume = () => client.stepUpChallenge.updateMany({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
  if (challenge.expiresAt.getTime() < Date.now()) {
    await consume();
    return { ok: false, reason: "expired" };
  }
  if (constantTimeEqual(digest(purpose, code), challenge.codeHash)) {
    await consume();
    return { ok: true };
  }
  const attempts = challenge.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    await consume(); // burn the challenge — too many guesses
    return { ok: false, reason: "locked" };
  }
  await client.stepUpChallenge.update({ where: { id: challenge.id }, data: { attempts } });
  return { ok: false, reason: "wrong", remaining: MAX_ATTEMPTS - attempts };
}

/** Send-throttle for code requests. */
export function stepUpSendAllowed(userId: string): boolean {
  return rateLimit(`stepup:send:${userId}`, SEND_LIMIT, SEND_WINDOW_MS).ok;
}

/** Fixed security inbox for step-up codes (STEP_UP_EMAIL). When set,
 *  codes for every admin go to this address instead of the signed-in
 *  admin's own account email — single-owner operations. Validated
 *  strictly at read time; an invalid value fails closed at send time
 *  rather than silently falling back. */
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+$/;
export function stepUpDestinationEmail(): string | null {
  const raw = process.env.STEP_UP_EMAIL?.trim() ?? "";
  if (!raw) return null;
  if (raw.length > 160 || !EMAIL_RE.test(raw)) {
    throw new Error("STEP_UP_EMAIL is set but is not a valid email address — fix or unset it in the server environment.");
  }
  return raw.toLowerCase();
}

/** Inbox display mask: first character + domain, nothing in between. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "your registered email";
  return `${email.slice(0, 1)}•••${email.slice(at)}`;
}
