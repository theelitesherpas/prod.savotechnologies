import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { resolveVisitor, visitorCookieOptions, VISITOR_COOKIE, visitorRateLimit } from "@/lib/livechat/http";
import { ensureAiConversation, visitorAsk } from "@/lib/livechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/live-chat/ask — one visitor turn in the Savo AI conversation.
 * Persists both sides of the thread server-side (the AI answer itself is
 * deterministic site-truth; the client renders the rich entry by id).
 * Detects human-handoff intent and steers the pre-chat flow.
 */

export async function POST(req: Request) {
  if (!isJsonRequest(req)) return apiError("Unsupported request format.", 415);
  const visitor = await resolveVisitor(req);
  if (!visitor) return apiError("Chat is unavailable right now.", 503);

  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const text = typeof (body.data as { text?: unknown }).text === "string" ? ((body.data as { text: string }).text ?? "").trim() : "";
  if (!text) return apiError("Ask something first.", 400);
  if (text.length > 2000) return apiError("Message too long.", 413);
  if (!visitorRateLimit(visitor.visitorId, "ask", 30, 60_000)) return apiError("You're sending messages very quickly — pause for a moment.", 429);

  const pageContextRaw = (body.data as { pageContext?: unknown }).pageContext;
  const pageContext =
    pageContextRaw && typeof pageContextRaw === "object"
      ? (pageContextRaw as { landingPage?: string; currentPage?: string; referrer?: string; utm?: Record<string, string> })
      : null;

  const conversation = await ensureAiConversation(visitor.visitorId, pageContext);
  const result = await visitorAsk(conversation.id, text);
  if (!result) return apiError("Chat is unavailable right now.", 503);

  const res = apiOk({ conversationToken: conversation.publicToken, result });
  if (visitor.token) res.cookies.set(VISITOR_COOKIE, visitor.token, visitorCookieOptions());
  return res;
}
