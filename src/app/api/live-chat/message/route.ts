import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { resolveVisitor, visitorCookieOptions, VISITOR_COOKIE, visitorRateLimit } from "@/lib/livechat/http";
import { appendMessage, getConversationByPublicToken, typingSignal, touchVisitor } from "@/lib/livechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/live-chat/message — a visitor message inside an existing
 * conversation (human mode, or a follow-up in AI mode). Body:
 * { token: publicConversationToken, text, typing?: boolean }
 */

export async function POST(req: Request) {
  if (!isJsonRequest(req)) return apiError("Unsupported request format.", 415);
  const visitor = await resolveVisitor(req);
  if (!visitor) return apiError("Chat is unavailable right now.", 503);

  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const { token, text } = body.data as { token?: unknown; text?: unknown };
  if (typeof token !== "string" || typeof text !== "string" || !text.trim()) return apiError("Invalid request.", 400);
  if (text.length > 2000) return apiError("Message too long.", 413);
  if (!visitorRateLimit(visitor.visitorId, "msg", 40, 60_000)) return apiError("You're sending messages very quickly — pause for a moment.", 429);

  const conv = await getConversationByPublicToken(token, visitor.visitorId);
  if (!conv) return apiError("Conversation not found.", 404);

  await appendMessage(conv.id, { type: "visitor", body: text.trim() });
  await touchVisitor(visitor.visitorId);
  typingSignal(conv.id, "visitor", false);

  const res = apiOk({ ok: true });
  if (visitor.token) res.cookies.set(VISITOR_COOKIE, visitor.token, visitorCookieOptions());
  return res;
}
