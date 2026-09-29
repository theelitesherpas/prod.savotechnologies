import { apiOk, apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireChatAgent } from "@/lib/livechat/admin-guard";
import { getConversationById, toDetailDTO, markRead } from "@/lib/livechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/live-chat/conversations/[id] — full thread + lead context. */

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireChatAgent();
  if (!user) return apiError("Not authorized.", 401);
  if (!prisma) return apiError("Unavailable.", 503);
  const { id } = await params;
  const conv = await getConversationById(id);
  if (!conv) return apiError("Conversation not found.", 404);
  await markRead(conv.id, "agent");
  return apiOk({ conversation: await toDetailDTO(conv) });
}
