import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { resolveVisitor } from "@/lib/livechat/http";
import { getConversationByPublicToken, respondToEndRequest } from "@/lib/livechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/live-chat/end-request — the visitor's answer to an agent's
 * "shall we end the chat?" request. { token, accept: boolean }
 */

export async function POST(req: Request) {
  if (!isJsonRequest(req)) return apiError("Unsupported request format.", 415);
  const visitor = await resolveVisitor(req);
  if (!visitor) return apiError("Unavailable.", 503);
  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const { token, accept } = body.data as { token?: unknown; accept?: unknown };
  if (typeof token !== "string" || typeof accept !== "boolean") return apiError("Invalid request.", 400);
  const conv = await getConversationByPublicToken(token, visitor.visitorId);
  if (!conv) return apiError("Conversation not found.", 404);
  await respondToEndRequest(conv.id, accept);
  return apiOk({ ended: accept });
}
