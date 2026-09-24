import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * Admin authentication — server-side sessions.
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
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h workday session
const LOGIN_LIMIT = 8; // attempts per IP per 15min
const BCRYPT_ROUNDS = 12;

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor";
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** bcrypt with constant-time digest comparison (timingSafeEqual). */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const digest = bcrypt.hashSync(password, hash.slice(0, 29) as Parameters<typeof bcrypt.hashSync>[1]);
    const a = Buffer.from(digest);
    const b = Buffer.from(hash);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false; // malformed hash, treat as failed verification, never throw
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Attempt login. Returns the session user and sets the cookie on success.
 * Every outcome (bad email, bad password, rate limit) is logged.
 */
export async function login(
  email: string,
  password: string,
  meta: { ip: string; userAgent?: string | null },
): Promise<{ ok: true; user: AdminSessionUser } | { ok: false; reason: "rate_limited" | "invalid" }> {
  const normalized = email.trim().toLowerCase();

  if (!rateLimit(`admin-login-ip:${meta.ip}`, LOGIN_LIMIT, 15 * 60 * 1000).ok ||
      !rateLimit(`admin-login-email:${normalized}`, LOGIN_LIMIT, 15 * 60 * 1000).ok) {
    logger.warn("admin.login.rate_limited", { ipHashPrefix: hashToken(meta.ip).slice(0, 12) });
    return { ok: false, reason: "rate_limited" };
  }

  const user = prisma
    ? await prisma.adminUser.findUnique({ where: { email: normalized } })
    : null;

  // Always run a bcrypt comparison to keep timing uniform for unknown emails.
  const hash =
    user?.passwordHash ??
    "$2b$12$C6UzMDM.H6dfI/f/IKcEe.zZUL8bMOU9BuiKu0jvV4ZFDXJvWQaOi";
  const valid = await verifyPassword(password, hash);

  if (!user || !valid) {
    logger.warn("admin.login.failed", { emailKnown: !!user });
    return { ok: false, reason: "invalid" };
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma!.adminSession.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
  });
  await prisma!.auditLog.create({
    data: { userId: user.id, action: "auth.login", meta: { userAgent: meta.userAgent ?? null } },
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
    user: { id: user.id, email: user.email, name: user.name, role: user.role as "admin" | "editor" },
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
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token || !prisma) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as "admin" | "editor",
  };
});

/** Guard for admin pages and server actions — throws when not signed in. */
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
