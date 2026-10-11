import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "@/lib/passwords";
import { employeeAccessAllowed } from "@/lib/employee-access";
export { hashPassword, verifyPassword };
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * Admin authentication - server-side sessions.
 *
 *   cookie: savo_admin = <32-byte random token>  (HttpOnly, SameSite=Lax,
 *           Secure in production)
 *   DB:      admin_sessions.token_hash = SHA-256(token)
 *
 * - Tokens are unusable if the DB leaks (hash-only storage).
 * - Sessions expire server-side and are revocable row-by-row.
 * - Login is rate-limited per IP and per email; comparisons are
 *   constant-time; failure messages never reveal which factor failed.
 */

export const ADMIN_COOKIE = "savo_admin";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h session
/** Fixed 30-day absolute lifetime, matching the existing remembered cookie. */
const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LOGIN_LIMIT = 8; // attempts per IP per 15min

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor";
  permissions?: unknown;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Attempt login. Returns the session user and sets the cookie on success.
 * Every outcome (bad email, bad password, rate limit) is logged.
 */
export async function login(
  email: string,
  password: string,
  meta: { ip: string; userAgent?: string | null },
  remember = false,
): Promise<{ ok: true; user: AdminSessionUser } | { ok: false; reason: "rate_limited" | "invalid" }> {
  if (typeof email !== "string" || email.length > 160 || typeof password !== "string" || password.length > 200) return { ok: false, reason: "invalid" };
  const normalized = email.trim().toLowerCase();

  if (!rateLimit(`admin-login-ip:${meta.ip}`, LOGIN_LIMIT, 15 * 60 * 1000).ok ||
      !rateLimit(`admin-login-email:${hashToken(normalized)}`, LOGIN_LIMIT, 15 * 60 * 1000).ok) {
    logger.warn("admin.login.rate_limited", { ipHashPrefix: hashToken(meta.ip).slice(0, 12) });
    return { ok: false, reason: "rate_limited" };
  }

  const user = prisma
    ? await prisma.adminUser.findUnique({ where: { email: normalized }, select: {
        id: true, email: true, name: true, role: true, permissions: true, passwordHash: true,
        employeeId: true, employee: { select: { status: true } },
      } })
    : null;

  // Always run a bcrypt comparison to keep timing uniform for unknown emails.
  const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const valid = await verifyPassword(password, hash);

  if (!user || !valid || !["admin", "editor"].includes(user.role) ||
      (user.employeeId && !employeeAccessAllowed(user.employee))) {
    logger.warn("admin.login.failed");
    return { ok: false, reason: "invalid" };
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + (remember ? REMEMBER_TTL_MS : SESSION_TTL_MS));

  await prisma!.adminSession.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
  });
  await prisma!.auditLog.create({
    data: { userId: user.id, action: "auth.login", meta: { userAgent: meta.userAgent ?? null, remember } },
  });

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  logger.info("admin.login.success", { userId: user.id });
  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role as "admin" | "editor", permissions: user.permissions ?? [] },
  };
}

/** Terminate the current session and clear the cookie. */
export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (token && prisma) {
    const deleted = await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
    if (deleted.count > 0) logger.info("admin.logout");
  }
  store.delete(ADMIN_COOKIE);
}

/**
 * Resolve the current admin from the session cookie.
 * `cache()` dedupes per request; returns null when unauthenticated.
 */
export const getAdminUser = cache(async (): Promise<AdminSessionUser | null> => {
  const resolve = await adminSessionRevalidator();
  return resolve();
});

/** Capture this request's credential once; each call reads CURRENT authority.
 * Never use React's request memoization as a long-lived stream auth cache. */
export async function adminSessionRevalidator(): Promise<() => Promise<AdminSessionUser | null>> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const tokenHash = token && token.length <= 256 ? hashToken(token) : null;
  return async () => tokenHash ? resolveAdminSession(tokenHash) : null;
}

async function resolveAdminSession(tokenHash: string): Promise<AdminSessionUser | null> {
  if (!prisma) return null;
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    select: {
      id: true, expiresAt: true, createdAt: true,
      user: { select: { id: true, email: true, name: true, role: true, permissions: true,
        employeeId: true, employee: { select: { status: true } } } },
    },
  });

  if (!session || !["admin", "editor"].includes(session.user.role) ||
      (session.user.employeeId && !employeeAccessAllowed(session.user.employee))) return null;
  if (session.expiresAt.getTime() <= Date.now() || session.createdAt.getTime() + REMEMBER_TTL_MS <= Date.now()) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as "admin" | "editor",
    permissions: session.user.permissions ?? [],
  };
}

/** Guard for admin pages and server actions - throws when not signed in. */
export async function requireAdmin(): Promise<AdminSessionUser> {
  const user = await getAdminUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

/** Stricter guard for destructive/user-management operations. */
export async function requireAdminRole(): Promise<AdminSessionUser> {
  const user = await requireAdmin();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
