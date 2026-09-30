import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import {
  confirmMeeting,
  sendInvitation,
  requestReschedule,
  updateMeetingStatus,
  regenerateLink,
  extendExpiration,
  generateICS,
} from "@/lib/meeting/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/meetings/[id] — full detail. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) return apiError("Not authorized.", 401);
  if (!prisma) return apiError("Database unavailable.", 503);
  const { id } = await params;

  const m = await prisma.meeting.findUnique({
    where: { id },
    include: {
      attendees: true,
      activity: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!m) return apiError("Not found.", 404);

  // Opening the detail marks the availability response as read (badge clears).
  if (m.status === "availability_received" && !m.seenAt) {
    await prisma.meeting.update({ where: { id }, data: { seenAt: new Date() } }).catch(() => undefined);
  }

  const ics = generateICS(m);

  return apiOk({
    meeting: {
      ...m,
      tokenPlain: m.tokenPlain,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      expiresAt: m.expiresAt?.toISOString() ?? null,
      confirmedAt: m.confirmedAt?.toISOString() ?? null,
      availableDates: Array.isArray(m.availableDates) ? m.availableDates : [],
      activity: m.activity.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
      ics,
    },
  });
}

/** PUT /api/admin/meetings/[id] — actions: send, confirm, reschedule, complete, cancel, regenerate_link, extend, notes. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) return apiError("Not authorized.", 401);
  if (!isJsonRequest(req)) return apiError("Unsupported format.", 415);
  if (!prisma) return apiError("Database unavailable.", 503);

  const { id } = await params;
  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const d = body.data as Record<string, unknown>;

  switch (d.action) {
    case "send": {
      const r = await sendInvitation(id, user.name);
      return r.ok ? apiOk({}) : apiError(r.error ?? "Failed.", 400);
    }
    case "confirm": {
      const r = await confirmMeeting(id, user.name);
      return r.ok ? apiOk({}) : apiError(r.error ?? "Failed.", 409);
    }
    case "reschedule": {
      const r = await requestReschedule(id, user.name, typeof d.reason === "string" ? d.reason : undefined);
      return r.ok ? apiOk({}) : apiError("Failed.", 400);
    }
    case "complete":
    case "cancel": {
      const status = d.action === "complete" ? "completed" : "cancelled";
      const r = await updateMeetingStatus(id, status, user.name);
      return r.ok ? apiOk({}) : apiError("Failed.", 400);
    }
    case "regenerate_link": {
      const r = await regenerateLink(id, user.name);
      return "token" in r ? apiOk({ token: r.token }) : apiError(r.error, 400);
    }
    case "extend": {
      const days = typeof d.days === "number" ? Math.min(Math.max(d.days, 1), 30) : 7;
      const r = await extendExpiration(id, days, user.name);
      return r.ok ? apiOk({}) : apiError("Failed.", 400);
    }
    case "notes": {
      await prisma.meeting.update({
        where: { id },
        data: { internalNotes: String(d.internalNotes ?? "").slice(0, 4000) },
      });
      return apiOk({});
    }
    default:
      return apiError("Unknown action.", 400);
  }
}
