/**
 * Shared HTTP helpers for the visitor-side live-chat API: cookie handling,
 * visitor resolution and per-visitor rate limiting. The cookie carries an
 * opaque random token (httpOnly); only its SHA-256 is stored.
 */

import { createHash } from "node:crypto";
import { clientIpFromHeaders } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { ensureVisitor, getVisitorIdByToken } from "./service";

export const VISITOR_COOKIE = "savo_vc";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days, returning visitors

export function visitorCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export function ipHash(req: Request): string {
  return createHash("sha256").update(clientIpFromHeaders(req.headers)).digest("hex").slice(0, 24);
}

/**
 * Resolve (or create) the visitor for a request. Returns the visitor id,
 * a fresh token when one had to be created (the caller sets the cookie),
 * or null when the visitor is blocked / DB down.
 */
export async function resolveVisitor(
  req: Request,
): Promise<{ visitorId: string; token: string | null } | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE}=([^;]+)`));
  const token = match?.[1] ?? null;
  if (token) {
    const id = await getVisitorIdByToken(token);
    if (id) return { visitorId: id, token: null };
    if (id === null && match) {
 // Known-bad or unknown token, fall through and issue a fresh one
      // unless the visitor is blocked (getVisitorIdByToken returns null
      // for blocked visitors too, so re-check below via ensureVisitor).
    }
  }
  const created = await ensureVisitor(null, { ipHash: ipHash(req), userAgent: req.headers.get("user-agent") });
  if (!created) return null; // blocked or no DB
  return { visitorId: created.id, token: created.token };
}

/** Throttle visitor actions: bursts allowed, sustained abuse blocked. */
export function visitorRateLimit(visitorId: string, action: string, limit = 30, windowMs = 60_000): boolean {
  return rateLimit(`livechat:${action}:${visitorId}`, limit, windowMs).ok;
}
