import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireChatAgent } from "@/lib/livechat/admin-guard";
import { publish } from "@/lib/livechat/pubsub";
import { PRESENCE_STATUSES } from "@/lib/livechat/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/live-chat/presence — manual presence switch + heartbeat.
 * { status: online | busy | away | offline }
 */

export async function POST(req: Request) {
  const user = await requireChatAgent();
  if (!user) return apiError("Not authorized.", 401);
  if (!isJsonRequest(req)) return apiError("Unsupported request format.", 415);
  if (!prisma) return apiError("Unavailable.", 503);

  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const status = (body.data as { status?: unknown }).status;
  if (typeof status !== "string" || !PRESENCE_STATUSES.includes(status as never)) return apiError("Unknown status.", 400);

  await prisma.agentPresence.upsert({
    where: { userId: user.id },
    update: { status, manual: status !== "offline", lastSeenAt: new Date() },
    create: { userId: user.id, status, manual: status !== "offline", lastSeenAt: new Date() },
  });
  publish("admin", { type: "counts.changed" });
  return apiOk({ status });
}
