import type { Prisma } from "@prisma/client";
import { parseAdminPage } from "@/lib/admin-pagination";
import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { createMeeting } from "@/lib/meeting/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/meetings - list + optional client directory. */

export async function GET(req: Request) {
  const user = await getAdminUser();
  if (!user) return apiError("Not authorized.", 401);
  if (!canAccess(user, "clients")) return apiError("Not authorized.", 403);
  if (!prisma) return apiError("Database unavailable.", 503);

  const url = new URL(req.url);
  const includeClients = url.searchParams.get("clients") === "1";
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const status = (url.searchParams.get("status") ?? "").slice(0, 40);
  const calendar = url.searchParams.get("calendar") === "1";
  const month = url.searchParams.get("month") ?? "";
  if (calendar && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return apiError("Choose a valid calendar month.", 400);
  const where: Prisma.MeetingWhereInput = { ...(status ? { status } : {}),
    ...(q ? { OR: [{ clientName: { contains: q, mode: "insensitive" } }, { clientCompany: { contains: q, mode: "insensitive" } }, { title: { contains: q, mode: "insensitive" } }, { reference: { contains: q, mode: "insensitive" } }] } : {}),
    ...(calendar ? { AND: [{ OR: [{ confirmedDate: { startsWith: month } }, { confirmedDate: null, preferredDate: { startsWith: month } }] }] } : {}),
  };
  const [total, counts] = await Promise.all([prisma.meeting.count({ where }), prisma.meeting.groupBy({ by: ["status"], _count: { _all: true } })]);
  const paging = parseAdminPage(Object.fromEntries(url.searchParams), total);
  const [meetings, clients] = await Promise.all([
    prisma.meeting.findMany({
      where, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...(calendar ? {} : { take: paging.take, skip: paging.skip }),
      select: {
        id: true, reference: true, clientName: true, clientCompany: true,
        client: { select: { title: true } },
        title: true, meetingType: true, durationMin: true, locationType: true,
        status: true, preferredDate: true, preferredTime: true,
        confirmedDate: true, confirmedTime: true, assignedTo: true, createdAt: true,
      },
    }),
    includeClients
      ? prisma.clientUser.findMany({
          where: { active: true },
          select: { id: true, name: true, title: true, company: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return apiOk({
    meetings: meetings.map(({ client, ...m }) => ({ ...m, clientTitle: client ? client.title : undefined, createdAt: m.createdAt.toISOString() })),
    clients,
    paging: { page: paging.page, pageSize: paging.pageSize, total },
    counts: Object.fromEntries(counts.map(row => [row.status, row._count._all])),
  });
}

/** POST /api/admin/meetings - create a new meeting request. */

export async function POST(req: Request) {
  const user = await getAdminUser();
  if (!user) return apiError("Not authorized.", 401);
  if (!canAccess(user, "clients")) return apiError("Not authorized.", 403);
  if (!isJsonRequest(req)) return apiError("Unsupported format.", 415);

  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) return apiError("Invalid request.", 400);
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
