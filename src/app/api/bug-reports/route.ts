import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, readJsonBody } from "@/lib/api";
import { logger } from "@/lib/logger";
import { publicTelemetryUrl } from "@/lib/telemetry-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/bug-reports - capture errors from the frontend.
 *
 * Called automatically by error boundaries and the 404 page, and by
 * the "report this problem" form shown to users on error screens.
 * Rate-limited per IP; failures are silent (reporting must never
 * break the page further).
 */

const TYPES = new Set(["error", "404", "api_error", "user_report"]);

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limit = rateLimit(`bug-report:${ip}`, 10, 60 * 60 * 1000);
    if (!limit.ok) return new Response(null, { status: 429 });
    if (!prisma) return new Response(null, { status: 204 });

    const parsed = await readJsonBody(req, 64_000);
    if (!parsed.ok || !parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) return new Response(null, { status: 204 });
    const body = parsed.data as Record<string, unknown>;

    const publicUrl = publicTelemetryUrl(body.url);
    // Private pages may expose account/invitation details in stacks or messages.
    // Do not persist their report payload at all.
    if (typeof body.url === "string" && !publicUrl) return new Response(null, { status: 204 });

    const type = typeof body.type === "string" && TYPES.has(body.type) ? body.type : "error";
    const message = typeof body.message === "string" ? body.message.slice(0, 500) : "Unknown error";
    const details = typeof body.details === "string" ? body.details.slice(0, 8000) : null;
    const url = publicUrl?.slice(0, 500) ?? null;
    const referrer = publicTelemetryUrl(body.referrer)?.slice(0, 500) ?? null;
    const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

    // Context: browser, screen, timestamp
    let context: Record<string, unknown> | null = null;
    if (body.context && typeof body.context === "object") {
      const c = body.context as Record<string, unknown>;
      context = {
        screen: typeof c.screen === "string" ? c.screen.slice(0, 50) : undefined,
        language: typeof c.language === "string" ? c.language.slice(0, 10) : undefined,
        timestamp: typeof c.timestamp === "string" ? c.timestamp : undefined,
        userReport: typeof c.userReport === "string" ? c.userReport.slice(0, 2000) : undefined,
      };
    }

    await prisma.bugReport.create({
      data: { type, message, details, url, referrer, userAgent, ...(context ? { context: JSON.parse(JSON.stringify(context)) } : {}) },
    });

    return new Response(null, { status: 201 });
  } catch {
    logger.error("bug-report: capture failed");
    return new Response(null, { status: 204 });
  }
}
