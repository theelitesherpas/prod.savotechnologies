import { apiOk, apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireChatAgent } from "@/lib/livechat/admin-guard";
import { toSummaryDTO } from "@/lib/livechat/service";
import { getLiveChatSettings } from "@/lib/livechat/settings";
import { getAgentsOnline, effectivePresence, liveChatOpen } from "@/lib/livechat/availability";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/live-chat/bootstrap — the inbox's single load: the
 * conversation list for a view (+ search), per-view counts, agents with
 * presence, chat settings, availability and today's operational stats.
 */

const VIEW_STATUSES: Record<string, string[]> = {
  inbox: ["waiting_for_agent", "active", "waiting_follow_up", "visitor_left", "pre_chat"],
  waiting: ["waiting_for_agent"],
  active: ["active"],
  unassigned: ["waiting_for_agent", "active", "waiting_follow_up"],
  mine: ["waiting_for_agent", "active", "waiting_follow_up", "visitor_left"],
  followup: ["waiting_follow_up", "visitor_left"],
  ai: ["ai_only", "pre_chat"],
  closed: ["closed", "spam"],
  all: [],
};

export async function GET(req: Request) {
  const user = await requireChatAgent();
  if (!user) return apiError("Not authorized.", 401);
  if (!prisma) return apiError("Live chat is unavailable (no database).", 503);

  const url = new URL(req.url);
  const view = url.searchParams.get("view") ?? "inbox";
  const q = (url.searchParams.get("q") ?? "").trim();
  const agentFilter = url.searchParams.get("agent") ?? "";
  const serviceFilter = url.searchParams.get("service") ?? "";
  const leadFilter = url.searchParams.get("lead") ?? "";

  const statuses = VIEW_STATUSES[view] ?? VIEW_STATUSES.inbox;
  const where: Prisma.ChatConversationWhereInput = {};
  if (statuses.length > 0) where.status = { in: statuses };
  if (view === "unassigned") where.assignedId = null;
  if (view === "mine") where.assignedId = user.id;
  // Follow-up = everything the team owes a reply: timed-out requests,
  // visitors who left, and explicitly scheduled follow-ups.
  const followUpWhere: Prisma.ChatConversationWhereInput | null =
    view === "followup" ? { OR: [{ status: { in: ["waiting_follow_up", "visitor_left"] } }, { followUpAt: { not: null } }] } : null;
  if (agentFilter === "none") where.assignedId = null;
  else if (agentFilter) where.assignedId = agentFilter;
  if (serviceFilter) where.service = serviceFilter;
  if (leadFilter) where.leadStatus = leadFilter;
  if (q) {
    where.OR = [
      { leadName: { contains: q, mode: "insensitive" } },
      { leadEmail: { contains: q, mode: "insensitive" } },
      { leadPhone: { contains: q } },
      { service: { contains: q, mode: "insensitive" } },
      { requirement: { contains: q, mode: "insensitive" } },
      { lastMessagePreview: { contains: q, mode: "insensitive" } },
      { tags: { some: { tag: { label: { contains: q, mode: "insensitive" } } } } },
      { messages: { some: { body: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const settings = await getLiveChatSettings();
  if (followUpWhere) {
    where.AND = [followUpWhere, ...(where.OR ? [{ OR: where.OR }] : [])];
    delete where.OR;
  }

  const [rows, allCounts, agentsRows, agentsOnline, hoursOpen] = await Promise.all([
    prisma.chatConversation.findMany({
      where,
      orderBy: [{ lastMessageAt: "desc" }],
      take: 80,
      include: { visitor: true, assigned: { select: { id: true, name: true } }, tags: { include: { tag: true } } },
    }),
    prisma.chatConversation.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.adminUser.findMany({
      where: { OR: [{ role: "admin" }, { permissions: { not: Prisma.DbNull } }] },
      select: { id: true, name: true, email: true, role: true, permissions: true },
    }),
    getAgentsOnline(),
    liveChatOpen(settings.businessHours),
  ]);

  const statusCount = Object.fromEntries(allCounts.map((c) => [c.status, c._count._all]));
  const [unassignedCount, mineCount, followUpCount] = await Promise.all([
    prisma.chatConversation.count({ where: { status: { in: VIEW_STATUSES.unassigned }, assignedId: null } }),
    prisma.chatConversation.count({ where: { assignedId: user.id, status: { in: VIEW_STATUSES.mine } } }),
    prisma.chatConversation.count({
      where: { OR: [{ status: { in: ["waiting_follow_up", "visitor_left"] } }, { followUpAt: { not: null } }] },
    }),
  ]);

  const presenceRows = await prisma.agentPresence.findMany();  const presenceByUser = new Map(presenceRows.map((p) => [p.userId, p]));
  const agents = agentsRows
    .filter((a) => a.role === "admin" || (Array.isArray(a.permissions) && (a.permissions as unknown[]).includes("live-chat")))
    .map((a) => {
      const p = presenceByUser.get(a.id);
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        presence: p ? effectivePresence(p.status, p.lastSeenAt) : ("offline" as const),
        manual: p?.manual ?? false,
      };
    });

  // Today's operational stats (spec §46).
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [todayRequests, responseRows] = await Promise.all([
    prisma.chatConversation.count({ where: { humanRequestedAt: { gte: startOfDay } } }),
    prisma.chatConversation.findMany({
      where: { acceptedAt: { gte: startOfDay }, firstResponseAt: { not: null } },
      select: { acceptedAt: true, firstResponseAt: true },
    }),
  ]);
  const responseMs = responseRows.map((r) => r.firstResponseAt!.getTime() - r.acceptedAt!.getTime()).filter((ms) => ms >= 0);
  const avgResponseSec = responseMs.length > 0 ? Math.round(responseMs.reduce((a, b) => a + b, 0) / responseMs.length / 1000) : null;

  const conversations = rows.map((c) => ({ ...toSummaryDTO(c), lastMessage: c.lastMessagePreview }));

  return apiOk({
    conversations,
    counts: {
      inbox: (statusCount.waiting_for_agent ?? 0) + (statusCount.active ?? 0) + (statusCount.waiting_follow_up ?? 0) + (statusCount.visitor_left ?? 0),
      waiting: statusCount.waiting_for_agent ?? 0,
      active: statusCount.active ?? 0,
      unassigned: unassignedCount,
      mine: mineCount,
      followup: followUpCount,
      ai: (statusCount.ai_only ?? 0) + (statusCount.pre_chat ?? 0),
      closed: (statusCount.closed ?? 0) + (statusCount.spam ?? 0),
      all: Object.values(statusCount).reduce((a, b) => a + b, 0),
    },
    agents,
    me: { id: user.id, name: user.name },
    settings,
    availability: { liveChatOpen: hoursOpen, agentsOnline: agentsOnline },
    stats: {
      waitingNow: statusCount.waiting_for_agent ?? 0,
      activeNow: statusCount.active ?? 0,
      agentsOnline: agentsOnline.online + agentsOnline.busy,
      unassigned: unassignedCount,
      followUpsPending: followUpCount,
      todayRequests,
      avgResponseSec,
    },
  });
}
