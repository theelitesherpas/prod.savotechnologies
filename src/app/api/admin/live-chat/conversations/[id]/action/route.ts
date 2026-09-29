import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireChatAgent, agentInfo } from "@/lib/livechat/admin-guard";
import {
  acceptConversation,
  assignConversation,
  blockVisitor,
  closeConversation,
  markSpam,
  reopenConversation,
  returnToAi,
  setTags,
  updateConversationFields,
  regenerateSummary,
  markRead,
} from "@/lib/livechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/live-chat/conversations/[id]/action — every agent
 * action in one endpoint: { action, …params }. All authorization is
 * server-side (session + live-chat section); statuses only ever change
 * through the service layer.
 */

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireChatAgent();
  if (!user) return apiError("Not authorized.", 401);
  if (!isJsonRequest(req)) return apiError("Unsupported request format.", 415);
  if (!prisma) return apiError("Unavailable.", 503);

  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const { id } = await params;
  const data = body.data as Record<string, unknown>;
  const agent = agentInfo(user);

  switch (data.action) {
    case "accept": {
      const result = await acceptConversation(id, agent);
      if (!result.ok) return apiError(result.reason === "taken" ? "Another agent just took this conversation." : "Conversation is not waiting.", 409);
      return apiOk({});
    }
    case "assign": {
      // Resolve the target agent's name from the DB — never trust client input.
      const targetId = typeof data.agentId === "string" && data.agentId ? data.agentId : null;
      let targetName: string | null = null;
      if (targetId) {
        const target = await prisma.adminUser.findUnique({ where: { id: targetId }, select: { name: true } });
        if (!target) return apiError("Agent not found.", 404);
        targetName = target.name;
      }
      await assignConversation(id, targetId, targetName, agent);
      return apiOk({});
    }
    case "close":
      await closeConversation(id, agent);
      return apiOk({});
    case "reopen":
      await reopenConversation(id, agent);
      return apiOk({});
    case "priority": {
      const priority = data.priority === "high" || data.priority === "low" ? data.priority : "normal";
      await updateConversationFields(id, { priority }, agent);
      return apiOk({ priority });
    }
    case "lead-status": {
      const status = typeof data.leadStatus === "string" ? data.leadStatus.slice(0, 30) : "new";
      await updateConversationFields(id, { leadStatus: status }, agent);
      return apiOk({ leadStatus: status });
    }
    case "follow-up": {
      const raw = typeof data.followUpAt === "string" ? data.followUpAt : null;
      let followUpAt: Date | null = null;
      if (raw) {
        const d = new Date(raw);
        if (Number.isNaN(d.getTime()) || d.getTime() > Date.now() + 1000 * 60 * 60 * 24 * 365) return apiError("Invalid follow-up date.", 400);
        followUpAt = d;
      }
      await updateConversationFields(id, { followUpAt }, agent);
      return apiOk({ followUpAt: followUpAt?.toISOString() ?? null });
    }
    case "tags": {
      const labels = Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === "string") : [];
      await setTags(id, labels, agent);
      return apiOk({ tags: labels });
    }
    case "regenerate-summary":
      await regenerateSummary(id, agent);
      return apiOk({});
    case "return-to-ai":
      await returnToAi(id, agent);
      return apiOk({});
    case "block-visitor":
      await blockVisitor(id, agent);
      return apiOk({});
    case "spam":
      await markSpam(id, agent);
      return apiOk({});
    case "mark-read":
      await markRead(id, "agent");
      return apiOk({});
    default:
      return apiError("Unknown action.", 400);
  }
}
