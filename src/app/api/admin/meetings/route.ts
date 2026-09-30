import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { createMeeting, generateICS, statusLabel } from "@/lib/meeting/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/meetings — list + optional client directory. */

export async function GET(req: Request) {
  const user = await getAdminUser();
  if (!user) return apiError("Not authorized.", 401);
  if (!prisma) return apiError("Database unavailable.", 503);

  const url = new URL(req.url);
  const includeClients = url.searchParams.get("clients") === "1";

  const [meetings, clients] = await Promise.all([
    prisma.meeting.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, reference: true, clientName: true, clientCompany: true,
        title: true, meetingType: true, durationMin: true, locationType: true,
        status: true, preferredDate: true, preferredTime: true,
        confirmedDate: true, confirmedTime: true, assignedTo: true, createdAt: true,
      },
    }),
    includeClients
      ? prisma.clientUser.findMany({
          where: { active: true },
          select: { id: true, name: true, company: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return apiOk({
    meetings: meetings.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    clients,
  });
}

/** POST /api/admin/meetings — create a new meeting request. */

export async function POST(req: Request) {
  const user = await getAdminUser();
  if (!user) return apiError("Not authorized.", 401);
  if (!isJsonRequest(req)) return apiError("Unsupported format.", 415);

  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const d = body.data as Record<string, unknown>;

  const result = await createMeeting({
    clientId: typeof d.clientId === "string" && d.clientId ? d.clientId : null,
    clientName: String(d.clientName ?? ""),
    clientCompany: String(d.clientCompany ?? ""),
    clientPhone: typeof d.clientPhone === "string" ? d.clientPhone : undefined,
    clientEmail: typeof d.clientEmail === "string" ? d.clientEmail : undefined,
    clientRole: typeof d.clientRole === "string" ? d.clientRole : undefined,
    title: String(d.title ?? ""),
    agenda: String(d.agenda ?? ""),
    meetingType: String(d.meetingType ?? "in_person"),
    durationMin: Number(d.durationMin ?? 60),
    locationType: String(d.locationType ?? "savo_office"),
    locationAddress: typeof d.locationAddress === "string" ? d.locationAddress : undefined,
    meetingUrl: typeof d.meetingUrl === "string" ? d.meetingUrl : undefined,
    notes: typeof d.notes === "string" ? d.notes : undefined,
    availableDates: Array.isArray(d.availableDates) ? (d.availableDates as string[]) : [],
    availableFrom: String(d.availableFrom ?? "10:00"),
    availableTo: String(d.availableTo ?? "18:00"),
    allowSuggest: d.allowSuggest !== false,
    autoConfirm: d.autoConfirm === true,
    expiresDays: typeof d.expiresDays === "number" ? d.expiresDays : 7,
    createdBy: user.id,
    createdByName: user.name,
  });

  if ("error" in result) return apiError(result.error, 400);
  return apiOk({ meeting: result.meeting });
}
