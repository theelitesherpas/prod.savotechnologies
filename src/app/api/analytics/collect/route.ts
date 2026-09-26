import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { clientIp } from "@/lib/api";
import { logger } from "@/lib/logger";
import { lookupGeo } from "@/lib/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/analytics/collect - first-party analytics beacon.
 *
 *  Privacy by design: no raw IP or user agent is ever stored. A daily
 *  salted SHA-256 of (ip + user agent) powers rough unique-visitor
 *  counts and nothing else. Bots are filtered by user agent server-side;
 *  the beacon itself requires JavaScript, which already excludes most
 *  crawlers. Rate-limited per IP; failures are silent by design (analytics
 *  must never break a visitor's session).
 */

const BOT_UA = /(bot|crawler|spider|crawling|headless|lighthouse|phantom|puppeteer|playwright|curl|wget|python-requests|node-fetch)/i;
const DEVICES = new Set(["mobile", "tablet", "desktop"]);
const TYPES = new Set(["pageview", "event"]);

const cap = (v: unknown, n: number): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null;

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    // Generous: one visitor can open many pages and fire many events.
    const limit = rateLimit(`analytics:${ip}`, 120, 60 * 60 * 1000);
    if (!limit.ok) return new Response(null, { status: 429 });
    if (!prisma) return new Response(null, { status: 204 });

    const ua = req.headers.get("user-agent") ?? "";
    if (!ua || BOT_UA.test(ua)) return new Response(null, { status: 204 });

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(null, { status: 204 });
    }

    const type = cap(body.type, 12);
    const path = cap(body.path, 300);
    if (!type || !TYPES.has(type) || !path || !path.startsWith("/")) {
      return new Response(null, { status: 204 });
    }
    // Query strings are stripped - paths only, never PII.
    const cleanPath = ("/" + path.split("?")[0].replace(/^\/+/, "")).slice(0, 300);

    const device = cap(body.device, 10);
    const eventName = cap(body.eventName, 80);
    const referrerFull = cap(body.referrer, 500);
    // Store the referrer without its query string (may contain UPI ids /
    // emails in weird cases) - host + path is all reporting needs.
    const referrer =
      referrerFull && /^https?:\/\//i.test(referrerFull)
        ? (() => {
            try {
              const u = new URL(referrerFull);
              return (u.host + u.pathname).slice(0, 300);
            } catch {
              return null;
            }
          })()
        : null;

    // Daily salted hash → uniques per day, unlinkable across days.
    const day = new Date().toISOString().slice(0, 10);
    const saltBase = env.ENQUIRY_IP_SALT || "dev-salt";
    const visitorHash = createHash("sha256")
      .update(`${saltBase}:${day}:${ip}:${ua}`)
      .digest("hex")
      .slice(0, 32);

    // Browser language (e.g. "en-IN") - coarse, non-identifying.
    const lang = cap(body.lang, 12);
    const meta = lang && /^[a-z]{2}(-[a-zA-Z]{2,4})?$/i.test(lang) ? { lang: lang.slice(0, 8) } : undefined;

    // Geo lookup (cached, non-blocking on failure)
    const geo = await lookupGeo(ip);

    await prisma.analyticsEvent.create({
      data: {
        type,
        path: cleanPath,
        eventName: type === "event" ? eventName : null,
        referrer,
        device: device && DEVICES.has(device) ? device : null,
        visitorHash,
        ...(geo.country ? geo : {}),
        ...(meta ? { meta } : {}),
      },
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    // Analytics must never surface errors to visitors.
    logger.error("analytics collect failed", { err: String(err).slice(0, 200) });
    return new Response(null, { status: 204 });
  }
}
