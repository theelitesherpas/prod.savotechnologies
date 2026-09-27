import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/api";
import { logger } from "@/lib/logger";
import { newSession, step, type SalesbotSession } from "@/lib/salesbot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/agents/salesbot/demo - the live SalesBot demo endpoint.
 *
 * Sessions are in-memory (demo scope, 30-minute TTL, capped store) and
 * every turn is deterministic engine logic - intent classification,
 * slot extraction, guarded answers - rate-limited per IP.
 */

const bodySchema = z.object({
  sessionId: z.string().regex(/^[a-zA-Z0-9_-]{6,64}$/).optional(),
  message: z.string().trim().min(1).max(1000),
});

const SESSION_TTL = 30 * 60 * 1000;
const MAX_SESSIONS = 500;

const globalForBot = globalThis as unknown as { __salesbotSessions?: Map<string, SalesbotSession> };
const sessions = globalForBot.__salesbotSessions ?? new Map<string, SalesbotSession>();
globalForBot.__salesbotSessions = sessions;

function gc() {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.updatedAt > SESSION_TTL) sessions.delete(id);
  }
  if (sessions.size > MAX_SESSIONS) {
    const oldest = [...sessions.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt).slice(0, sessions.size - MAX_SESSIONS);
    for (const [id] of oldest) sessions.delete(id);
  }
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limit = rateLimit(`salesbot:${ip}`, 40, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json({ ok: false, error: "Demo limit reached - take a breath and try again in a few minutes." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
    }

    gc();

    let id = parsed.data.sessionId;
    let session = id ? sessions.get(id) : undefined;
    if (!session) {
      id = randomBytes(9).toString("base64url");
      session = newSession(id);
      sessions.set(id, session);
    }

    const result = step(session, parsed.data.message);
    session.stage = result.nextStage;
    session.slots = result.slots;
    session.turns += 1;
    session.transcript.push({ role: "user", text: parsed.data.message }, { role: "bot", text: result.reply });
    session.updatedAt = Date.now();

    logger.info("salesbot.demo_turn", { stage: result.nextStage, intent: result.intent, score: result.leadScore });

    return NextResponse.json({
      ok: true,
      sessionId: id,
      reply: result.reply,
      stage: result.nextStage,
      slots: result.slots,
      suggestions: result.suggestions,
      intent: result.intent,
      leadScore: result.leadScore,
      leadLabel: result.leadLabel,
      brief: result.brief,
    });
  } catch (err) {
    logger.error("salesbot.demo_error", { err: String(err).slice(0, 200) });
    return NextResponse.json({ ok: false, error: "The demo hit an error - please retry." }, { status: 500 });
  }
}
