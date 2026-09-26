import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { clientIpFromHeaders } from "@/lib/api";

/**
 * Client-portal authentication - server-side sessions, mirroring the
 * admin auth hardening:
 *
 *   cookie: savo_client = <32-byte random token>  (HttpOnly, SameSite=Lax,
 *           Secure in production)
 *   DB:      client_sessions.token_hash = SHA-256(token)
 *
 * - Hash-only token storage, server-side expiry, per-row revocation.
 * - Login rate-limited per IP and per email; constant-time compares;
 *   failures never reveal which factor failed.
 */

export const CLIENT_COOKIE = "savo_client";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h workday session
const LOGIN_LIMIT = 8; // attempts per IP / per email per 15min
const BCRYPT_ROUNDS = 12;

export type ClientSessionUser = {
  id: string;
  email: string;
  name: string;
  company: string;
};

export function hashClientToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const digest = bcrypt.hashSync(password, hash.slice(0, 29) as Parameters<typeof bcrypt.hashSync>[1]);
    const a = Buffer.from(digest);
    const b = Buffer.from(hash);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function requestIp(): Promise<string> {
  const h = await headers();
  return clientIpFromHeaders(h) === "unknown" ? "local" : clientIpFromHeaders(h);
}

/**
 * Sign a client in. Returns { ok } or { ok: false, error } with a safe
 * message; creates the session cookie on success.
 */
export async function loginClient(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  const ip = await requestIp();

  if (
    !rateLimit(`client-login-ip:${ip}`, LOGIN_LIMIT, 15 * 60 * 1000).ok ||
    !rateLimit(`client-login-email:${normalized}`, LOGIN_LIMIT, 15 * 60 * 1000).ok
  ) {
    return { ok: false, error: "Too many attempts. Please try again in a few minutes." };
  }

  const client = prisma
    ? await prisma.clientUser.findUnique({ where: { email: normalized } }).catch(() => null)
    : null;

  const passwordOk = client ? await verifyPassword(password, client.passwordHash) : false;
  if (!client || !client.active || !passwordOk) {
    logger.warn("client_auth.login_failed", { email: normalized, hasClient: Boolean(client) });
    return { ok: false, error: "Email or password is incorrect." };
  }

  // Fresh session
  const token = randomBytes(32).toString("hex");
  await prisma!.clientSession.create({
    data: {
      clientId: client.id,
      tokenHash: hashClientToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  const store = await cookies();
  store.set(CLIENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  logger.info("client_auth.login", { email: normalized });
  return { ok: true };
}

export async function logoutClient(): Promise<void> {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE)?.value;
  if (token && prisma) {
    await prisma.clientSession
      .deleteMany({ where: { tokenHash: hashClientToken(token) } })
      .catch(() => undefined);
  }
  store.delete(CLIENT_COOKIE);
}

/** Resolve the signed-in client for the current request (cached per render). */
export const getClientUser = cache(async (): Promise<ClientSessionUser | null> => {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE)?.value;
  if (!token || !prisma) return null;

  try {
    const row = await prisma.clientSession.findUnique({
      where: { tokenHash: hashClientToken(token) },
      select: {
        expiresAt: true,
        client: { select: { id: true, email: true, name: true, company: true, active: true } },
      },
    });
    if (!row || row.expiresAt < new Date() || !row.client.active) return null;
    return {
      id: row.client.id,
      email: row.client.email,
      name: row.client.name,
      company: row.client.company,
    };
  } catch {
    return null;
  }
});

/** Generate a readable one-time password for admin-created clients. */
export function generateClientPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(14);
  const body = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${body.slice(0, 10)}P1`;
}
