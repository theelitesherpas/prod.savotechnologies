import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { resolveVisitor } from "@/lib/livechat/http";
import { getConversationByPublicToken, endConversationByVisitor, getResumableConversation } from "@/lib/livechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/live-chat/end — the visitor ends the conversation. The thread
 * closes (agent keeps the record); the widget returns to the fresh
 * Ask Savo AI / Talk to a Human choice. { token? } — without a token the
 * visitor's resumable conversation is ended.
 */

export async function POST(req: Request) {
  if (!isJsonRequest(req)) return apiError("Unsupported request format.", 415);
  const visitor = await resolveVisitor(req);
  if (!visitor) return apiError("Unavailable.", 503);
  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const token = (body.data as { token?: unknown }).token;

  const conv =
    typeof token === "string"
      ? await getConversationByPublicToken(token, visitor.visitorId)
      : await getResumableConversation(visitor.visitorId);
  if (conv) await endConversationByVisitor(conv.id);
  return apiOk({ ended: !!conv });
}
