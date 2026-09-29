import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { requireChatAgent } from "@/lib/livechat/admin-guard";
import { getLiveChatSettings, saveLiveChatSettings } from "@/lib/livechat/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET/POST /api/admin/live-chat/settings — business hours, budgets,
 *  quick replies, phone requirement, response window. Admin-only edits. */

export async function GET() {
  const user = await requireChatAgent();
  if (!user) return apiError("Not authorized.", 401);
  return apiOk({ settings: await getLiveChatSettings() });
}

export async function POST(req: Request) {
  const user = await requireChatAgent();
  if (!user) return apiError("Not authorized.", 401);
  if (user.role !== "admin") return apiError("Only administrators can change live-chat settings.", 403);
  if (!isJsonRequest(req)) return apiError("Unsupported request format.", 415);
  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const settings = await saveLiveChatSettings(body.data as Record<string, unknown>);
  return apiOk({ settings });
}
