import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { requireChatAgent, agentInfo } from "@/lib/livechat/admin-guard";
import { agentMessage, getConversationById, internalNote, typingSignal } from "@/lib/livechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/live-chat/conversations/[id]/message — agent sends a
 * chat reply or an internal note, or toggles the agent typing signal.
 * { body } | { note: body } | { typing: boolean }
 */

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireChatAgent();
  if (!user) return apiError("Not authorized.", 401);
  if (!isJsonRequest(req)) return apiError("Unsupported request format.", 415);

  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const { id } = await params;
  const data = body.data as Record<string, unknown>;
  const agent = agentInfo(user);

  const conv = await getConversationById(id);
  if (!conv) return apiError("Conversation not found.", 404);

  if (typeof data.typing === "boolean") {
    typingSignal(id, "agent", data.typing, user.name);
    return apiOk({});
  }

  const text = typeof data.body === "string" ? data.body.trim() : "";
  if (!text) return apiError("Write a message first.", 400);
  if (text.length > 4000) return apiError("Message too long.", 413);

  const result = data.note === true ? await internalNote(id, agent, text) : await agentMessage(id, agent, text);
  if ("error" in result && typeof result.error === "string") return apiError(result.error, 400);
  return apiOk({ message: result });
}
