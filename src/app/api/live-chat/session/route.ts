import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getLiveChatSettings } from "@/lib/livechat/settings";
import { liveChatOpen, getAgentsOnline } from "@/lib/livechat/availability";
import { getResumableConversation, toSummaryDTO, toMessageDTO } from "@/lib/livechat/service";
import { resolveVisitor, visitorCookieOptions, VISITOR_COOKIE } from "@/lib/livechat/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/live-chat/session — widget bootstrap. Ensures the visitor
 * cookie, reports live-chat availability (business hours + agents online)
 * and restores any resumable conversation (cross-page, cross-visit).
 */

export async function GET(req: Request) {
  const visitor = await resolveVisitor(req);
  if (!visitor) return apiError("Chat is unavailable right now.", 503);

  const settings = await getLiveChatSettings();
  const [open, agents] = await Promise.all([liveChatOpen(settings.businessHours), getAgentsOnline()]);

  let conversation: (ReturnType<typeof toSummaryDTO> & { publicToken?: string }) | null = null;
  let messages: ReturnType<typeof toMessageDTO>[] = [];
  if (prisma) {
    const conv = await getResumableConversation(visitor.visitorId);
    if (conv) {
      conversation = { ...toSummaryDTO(conv), publicToken: conv.publicToken };
      const rows = await prisma.chatMessage.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: "asc" }, take: 200 });
      messages = rows.map(toMessageDTO);
    }
  }

  const res = NextResponse.json(
    {
      ok: true,
      conversation,
      messages,
      availability: {
        liveChatOpen: open,
        agentsOnline: agents.anyActive,
        responseWindowSec: settings.responseWindowSec,
      },
      budgets: settings.budgets,
      phoneRequired: settings.phoneRequired,
    },
    { headers: { "Cache-Control": "no-store" } },
  ) as NextResponse;
  if (visitor.token) res.cookies.set(VISITOR_COOKIE, visitor.token, visitorCookieOptions());
  return res;
}
