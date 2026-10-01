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

/** PUT /api/admin/meetings/[id] — actions: send, confirm, reschedule, complete, cancel, regenerate_link, extend, notes, edit. */
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
    case "edit": {
      const existing = await prisma.meeting.findUnique({ where: { id } });
      if (!existing) return apiError("Meeting not found.", 404);

      const data: Record<string, unknown> = {};
      // Only update fields that were provided — reference and token stay the same
      if (typeof d.clientName === "string" && d.clientName.trim().length >= 2) data.clientName = d.clientName.trim().slice(0, 120);
      if (typeof d.clientCompany === "string") data.clientCompany = d.clientCompany.slice(0, 160);
      if (typeof d.clientPhone === "string") data.clientPhone = d.clientPhone.slice(0, 32) || null;
      if (typeof d.clientEmail === "string") data.clientEmail = d.clientEmail.toLowerCase().slice(0, 160) || null;
      if (typeof d.clientRole === "string") data.clientRole = d.clientRole.slice(0, 80) || null;
      if (typeof d.title === "string" && d.title.trim().length >= 3) data.title = d.title.trim().slice(0, 200);
      if (typeof d.agenda === "string") data.agenda = d.agenda.slice(0, 2000);
      if (typeof d.meetingType === "string") data.meetingType = d.meetingType;
      if (typeof d.durationMin === "number") data.durationMin = Math.min(Math.max(d.durationMin, 15), 240);
      if (typeof d.locationType === "string") data.locationType = d.locationType;
      if (typeof d.locationAddress === "string") data.locationAddress = d.locationAddress.slice(0, 500) || null;
      if (typeof d.meetingUrl === "string") data.meetingUrl = d.meetingUrl.slice(0, 500) || null;
      if (typeof d.notes === "string") data.notes = d.notes.slice(0, 2000) || null;
      if (Array.isArray(d.availableDates)) data.availableDates = (d.availableDates as string[]).filter((x) => typeof x === "string");
      if (typeof d.availableFrom === "string") data.availableFrom = d.availableFrom;
      if (typeof d.availableTo === "string") data.availableTo = d.availableTo;
      if (typeof d.allowSuggest === "boolean") data.allowSuggest = d.allowSuggest;
      if (typeof d.autoConfirm === "boolean") data.autoConfirm = d.autoConfirm;
      if (typeof d.assignedTo === "string") data.assignedTo = d.assignedTo || null;

      if (Object.keys(data).length === 0) return apiError("No changes to update.", 400);

      await prisma.meeting.update({ where: { id }, data });
      await prisma.meetingActivity.create({
        data: { meetingId: id, type: "meeting_edited", actorName: user.name, meta: { fields: Object.keys(data) } },
      });
      return apiOk({});
    }
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

/** DELETE /api/admin/meetings/[id] — permanently deletes a meeting and all related records. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) return apiError("Not authorized.", 401);
  if (!prisma) return apiError("Database unavailable.", 503);

  const { id } = await params;
  const existing = await prisma.meeting.findUnique({ where: { id }, select: { reference: true } });
  if (!existing) return apiError("Meeting not found.", 404);

  // Cascades delete attendees, activity, and reschedules automatically
  await prisma.meeting.delete({ where: { id } });

  return apiOk({ deleted: existing.reference });
}
