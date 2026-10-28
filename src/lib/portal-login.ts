import "server-only";
import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { clientFullName } from "@/lib/client-name";
import { clientIpFromHeaders } from "@/lib/api";
import { enforceLoginCaptcha, clearLoginFailures, recordLoginFailure } from "@/lib/captcha";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/passwords";
import { employeeAccessAllowed } from "@/lib/employee-access";
import { masterKeyBytes } from "@/lib/secret-box";
import { sendMail } from "@/lib/mail";
import { portalLoginCode } from "@/lib/mail/portal-login-code";
import { logger } from "@/lib/logger";
import type { PortalKind, PortalLoginState } from "./portal-login-state";

const CODE_TTL = 10 * 60_000;
const WINDOW = 15 * 60_000;
const MAX_ATTEMPTS = 5;
const EMAIL = z.string().trim().toLowerCase().max(120).email();
const UUID = z.string().uuid();
const NOT_REGISTERED = "This email is not registered for this portal. Please contact Savo support for access.";
const UNAVAILABLE = "Sign-in is temporarily unavailable. Please try again or contact Savo support.";
const LIMITED = "Too many attempts. Please wait 15 minutes before trying again.";
type Db = Prisma.TransactionClient;
type Account = { id: string; email: string; displayName?: string; enabled: boolean; passwordHash: string | null };
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const challengeCookie = (kind: PortalKind) => `savo_${kind}_login`;
const sessionCookie = (kind: PortalKind) => `savo_${kind}`;
const errorState = (error: string): PortalLoginState => ({ stage: "credentials", error });

/** Domain-separated keyed digest: DB disclosure cannot brute-force six digits. */
export function portalCodeDigest(kind: PortalKind, id: string, code: string): string {
  return createHmac("sha256", masterKeyBytes()).update(`portal-login:v1:${kind}:${id}:${code}`).digest("hex");
}
function equal(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** A single atomic PostgreSQL statement enforces the limit across all workers.
 * The WHERE clause prevents an over-limit request from extending the window. */
export async function portalRateAllowed(scope: string, identity: string, limit: number, windowMs = WINDOW): Promise<boolean> {
  if (!prisma) return false;
  const key = `portal:${scope}:${sha(identity)}`;
  const rows = await prisma.$queryRaw<{ hits: number }[]>`
    INSERT INTO portal_auth_throttles (key, hits, expires_at)
    VALUES (${key}, 1, CURRENT_TIMESTAMP + ${windowMs} * INTERVAL '1 millisecond')
    ON CONFLICT (key) DO UPDATE SET
      hits = CASE WHEN portal_auth_throttles.expires_at <= CURRENT_TIMESTAMP THEN 1 ELSE portal_auth_throttles.hits + 1 END,
      expires_at = CASE WHEN portal_auth_throttles.expires_at <= CURRENT_TIMESTAMP
        THEN CURRENT_TIMESTAMP + ${windowMs} * INTERVAL '1 millisecond' ELSE portal_auth_throttles.expires_at END
    WHERE portal_auth_throttles.expires_at <= CURRENT_TIMESTAMP OR portal_auth_throttles.hits < ${limit}
    RETURNING hits
  `;
  return rows.length === 1;
}

async function accountFor(db: Db, kind: PortalKind, where: { email: string } | { id: string }): Promise<Account | null> {
  if (kind === "client") {
    const row = await db.clientUser.findUnique({ where, select: { id: true, email: true, name: true, title: true, active: true, passwordHash: true } });
    return row && { id: row.id, email: row.email, displayName: clientFullName(row.name ?? "", row.title), enabled: row.active, passwordHash: row.passwordHash };
  }
  const row = await db.employee.findUnique({ where, select: {
    id: true, email: true, status: true, panelUsers: { take: 1, select: { passwordHash: true } },
  } });
  // Preserve HR provisioning/linked-account authority. OTP never grants admin access.
  return row && { id: row.id, email: row.email,
    enabled: employeeAccessAllowed(row) && row.panelUsers.length > 0,
    passwordHash: row.panelUsers[0]?.passwordHash ?? null };
}

async function insertSession(db: Db, kind: PortalKind, accountId: string, remember: boolean) {
  const token = randomBytes(32).toString("hex");
  const ttl = remember ? 30 * 86400_000 : 12 * 3600_000;
  const expiresAt = new Date(Date.now() + ttl);
  const data = { tokenHash: sha(token), expiresAt };
  if (kind === "client") await db.clientSession.create({ data: { ...data, clientId: accountId } });
  else await db.employeeSession.create({ data: { ...data, employeeId: accountId } });
  return { token, ttl, remember };
}
async function setSession(kind: PortalKind, session: Awaited<ReturnType<typeof insertSession>>) {
  const jar = await cookies();
  jar.set(sessionCookie(kind), session.token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
    // Unchecked = browser-session cookie, with a 12-hour server-side ceiling.
    ...(session.remember ? { maxAge: session.ttl / 1000 } : {}),
  });
  jar.delete(challengeCookie(kind));
}

type Challenge = Prisma.PortalLoginChallengeGetPayload<Record<string, never>>;
function codeState(row: Challenge, email: string, error?: string): PortalLoginState {
  return { stage: "code", email, challengeId: row.id,
    resendAt: row.createdAt.getTime() + 60_000, expiresAt: row.expiresAt.getTime(), ...(error ? { error } : {}) };
}
async function boundChallenge(kind: PortalKind, form: FormData): Promise<Challenge | null> {
  if (!prisma) return null;
  const id = UUID.safeParse(form.get("challengeId"));
  const email = EMAIL.safeParse(form.get("email"));
  const binding = (await cookies()).get(challengeCookie(kind))?.value;
  if (!id.success || !email.success || !binding || !/^[a-f0-9]{64}$/.test(binding)) return null;
  const row = await prisma.portalLoginChallenge.findUnique({ where: { id: id.data } });
  if (!row || row.kind !== kind || !equal(row.bindingHash, sha(binding)) || !equal(row.emailHash, sha(email.data))) return null;
  return row;
}

/** Returns only display state. Neither previous action state nor hidden inputs
 * confer authority; every code requires its HttpOnly browser binding and DB row. */
export async function handlePortalLogin(kind: PortalKind, _previous: PortalLoginState, form: FormData): Promise<PortalLoginState> {
  let success = false;
  try {
    if (!prisma) return errorState(UNAVAILABLE);
    const ip = clientIpFromHeaders(await headers());
    const intent = form.get("intent");
    if (!["password", "send-code", "verify-code", "resend-code"].includes(String(intent))) return errorState("Choose a sign-in method and try again.");
    const email = EMAIL.safeParse(form.get("email"));
    if (!email.success) return errorState("Enter a valid registered email address.");
    const verifying = intent === "verify-code";
    if (!await portalRateAllowed(`${verifying ? "verify" : "login"}:ip`, ip, verifying ? 30 : 20)) return errorState(LIMITED);

    if (verifying || intent === "resend-code") {
      const row = await boundChallenge(kind, form);
      if (!row || row.consumedAt || row.expiresAt.getTime() <= Date.now() || row.attempts >= MAX_ATTEMPTS) {
        return errorState("This code has expired or is no longer available. Request a new code to continue.");
      }
      if (verifying) {
        const code = form.get("code");
        if (typeof code !== "string" || !/^\d{6}$/.test(code)) return codeState(row, email.data, "Enter the 6-digit code from your email.");
        const correct = equal(row.codeHash, portalCodeDigest(kind, row.id, code));
        // Compare-and-swap: concurrent guesses/replays cannot exceed five
        // attempts or mint a second session from the same challenge.
        const session = await prisma.$transaction(async (tx) => {
          const changed = await tx.portalLoginChallenge.updateMany({ where: {
            id: row.id, attempts: row.attempts, consumedAt: null, expiresAt: { gt: new Date() },
          }, data: { attempts: { increment: 1 }, ...((correct || row.attempts + 1 >= MAX_ATTEMPTS) ? { consumedAt: new Date() } : {}) } });
          if (changed.count !== 1 || !correct) return null;
          const current = await accountFor(tx, kind, { id: row.accountId });
          if (!current?.enabled || !equal(sha(current.email.toLowerCase()), row.emailHash)) return null;
          return insertSession(tx, kind, current.id, row.remember);
        });
        if (!session) {
          recordLoginFailure(kind, ip);
          if (row.attempts + 1 >= MAX_ATTEMPTS) return errorState("Too many incorrect codes. Request a new code after a short wait.");
          return codeState(row, email.data, "The code is incorrect or no longer valid. Check your latest email and try again.");
        }
        await setSession(kind, session);
        clearLoginFailures(kind, ip);
        logger.info("portal_auth.otp_success", { kind });
        success = true;
      } else {
        // Browser possession permits resend without another CAPTCHA, but all
        // persistent send quotas/cooldowns still apply; remember is server-owned.
        return await sendCode(kind, email.data, ip, row.remember, row);
      }
    } else {
      if (!await portalRateAllowed(`${kind}:login:email`, email.data, 8)) return errorState(LIMITED);
      const cap = await enforceLoginCaptcha(kind, ip, form.get("captchaToken"));
      if (!cap.ok) return errorState("error" in cap ? cap.error : "Please complete the human verification.");
      const account = await accountFor(prisma, kind, { email: email.data });
      const remember = form.get("remember") === "on";
      if (intent === "send-code") {
        if (!account) return errorState(NOT_REGISTERED);
        if (!account.enabled) return errorState("Access to this portal is not enabled for this email. Please contact Savo support.");
        return await sendCode(kind, email.data, ip, remember);
      }
      const password = form.get("password");
      if (typeof password !== "string" || !password.length || password.length > 128) return errorState("Enter your password, or choose email OTP to sign in without one.");
      const valid = await verifyPassword(password, account?.passwordHash || DUMMY_PASSWORD_HASH);
      if (!account) { recordLoginFailure(kind, ip); return errorState(NOT_REGISTERED); }
      if (!account.enabled || !valid) {
        recordLoginFailure(kind, ip);
        return errorState("The email or password is incorrect, or portal access is not enabled. Try email OTP or contact Savo support.");
      }
      const session = await prisma.$transaction(async (tx) => {
        const current = await accountFor(tx, kind, { id: account.id });
        if (!current?.enabled || current.email !== account.email || current.passwordHash !== account.passwordHash) return null;
        return insertSession(tx, kind, current.id, remember);
      });
      if (!session) return errorState("Your account details changed. Please sign in again.");
      await setSession(kind, session);
      clearLoginFailures(kind, ip);
      logger.info("portal_auth.password_success", { kind });
      success = true;
    }
  } catch {
    // Fail closed on database, key, provider or session failure. Never log
    // credentials, addresses, bindings, OTPs or raw exception payloads.
    logger.error("portal_auth.unavailable", { kind });
    return errorState(UNAVAILABLE);
  }
  // Keep Next's redirect exception outside the operational-error catch.
  if (success) redirect(kind === "client" ? "/portal/dashboard" : "/employee-portal/dashboard");
  return errorState(UNAVAILABLE);
}

async function sendCode(kind: PortalKind, email: string, ip: string, remember: boolean, previous?: Challenge): Promise<PortalLoginState> {
  if (!prisma) return errorState(UNAVAILABLE);
  const fail = (message: string) => previous ? codeState(previous, email, message) : errorState(message);
  // Across both portal types: one delivery per email per minute, at most three
  // per 15 minutes. Requests cannot reset an existing code's guessing budget.
  if (!await portalRateAllowed("send:ip", ip, 10)) return fail(LIMITED);
  if (!await portalRateAllowed("send:cooldown", email, 1, 60_000)) return fail("Please wait a minute before requesting another code.");
  if (!await portalRateAllowed("send:email", email, 3)) return fail(LIMITED);
  const account = await accountFor(prisma, kind, { email });
  if (!account?.enabled) return errorState("Portal access is not available. Please contact Savo support.");
  const id = randomUUID();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const binding = randomBytes(32).toString("hex");
  const codeHash = portalCodeDigest(kind, id, code);
  const row = await prisma.portalLoginChallenge.create({ data: {
    id, kind, accountId: account.id, emailHash: sha(email), bindingHash: sha(binding),
    codeHash, remember, expiresAt: new Date(Date.now() + CODE_TTL),
  } });
  const sent = await sendMail(account.email, portalLoginCode(kind, code, account.displayName), kind === "employee" ? "hr" : "hello", { sensitive: true });
  if (!sent) {
    await prisma.portalLoginChallenge.deleteMany({ where: { id } });
    return fail("We couldn’t send your code. Please try again shortly, use your password, or contact Savo support.");
  }
  // Only replace a working challenge once delivery has succeeded.
  if (previous) await prisma.portalLoginChallenge.updateMany({ where: { id: previous.id, consumedAt: null }, data: { consumedAt: new Date() } });
  const jar = await cookies();
  jar.set(challengeCookie(kind), binding, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: CODE_TTL / 1000 });
  return codeState(row, email);
}
