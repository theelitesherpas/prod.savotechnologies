import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { resolveVisitor } from "@/lib/livechat/http";
import { getConversationByPublicToken, typingSignal, touchVisitor } from "@/lib/livechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/live-chat/typing — visitor typing signal for the agent inbox.
 * { token, typing: boolean }
 */

export async function POST(req: Request) {
  if (!isJsonRequest(req)) return apiError("Unsupported request format.", 415);
  const visitor = await resolveVisitor(req);
  if (!visitor) return apiError("Unavailable.", 503);
  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const { token, typing } = body.data as { token?: unknown; typing?: unknown };
  if (typeof token !== "string") return apiError("Invalid request.", 400);
  const conv = await getConversationByPublicToken(token, visitor.visitorId);
  if (!conv) return apiError("Not found.", 404);
  typingSignal(conv.id, "visitor", typing === true);
  await touchVisitor(visitor.visitorId);
  return apiOk({});
}
