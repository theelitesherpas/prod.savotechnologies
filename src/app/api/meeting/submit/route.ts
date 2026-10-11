import { apiOk, apiError, isJsonRequest, clientIp, readJsonBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { submitAvailability } from "@/lib/meeting/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/meeting/submit - public endpoint for client availability. */

export async function POST(req: Request) {
  if (!isJsonRequest(req)) return apiError("Unsupported format.", 415);

  const ipLimit = rateLimit(`meeting-submit:ip:${clientIp(req)}`, 20, 60 * 60 * 1000);
  if (!ipLimit.ok) {
    return apiError("Too many submissions. Please try again later.", 429, {
      "Retry-After": String(ipLimit.retryAfterSeconds),
    });
  }

  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const d = body.data as Record<string, unknown>;

  const token = typeof d.token === "string" ? d.token : "";
  if (!token) return apiError("Missing token.", 400);

  // Rate limit per token to prevent spam
  const tokenLimit = rateLimit(`meeting-submit:token:${token.slice(0, 64)}`, 5, 10 * 60 * 1000);
  if (!tokenLimit.ok) {
    return apiError("Too many submissions. Please try again in a few minutes.", 429, {
      "Retry-After": String(tokenLimit.retryAfterSeconds),
    });
  }

  const result = await submitAvailability({
    token,
    preferredDate: String(d.preferredDate ?? ""),
    preferredTime: String(d.preferredTime ?? ""),
    altDate: typeof d.altDate === "string" ? d.altDate : undefined,
    altTime: typeof d.altTime === "string" ? d.altTime : undefined,
    locationPreference: typeof d.locationPreference === "string" ? d.locationPreference : undefined,
    clientAddress: typeof d.clientAddress === "string" ? d.clientAddress : undefined,
    attendeeCount: typeof d.attendeeCount === "number" && Number.isFinite(d.attendeeCount) ? d.attendeeCount : 1,
    additionalAttendees: Array.isArray(d.additionalAttendees)
      ? d.additionalAttendees
          .filter((attendee): attendee is Record<string, unknown> => !!attendee && typeof attendee === "object" && !Array.isArray(attendee))
          .slice(0, 10)
          .map((attendee) => ({
            name: typeof attendee.name === "string" ? attendee.name.slice(0, 120) : "",
            email: typeof attendee.email === "string" ? attendee.email.slice(0, 160) : undefined,
            role: typeof attendee.role === "string" ? attendee.role.slice(0, 80) : undefined,
          }))
      : [],
    clientNotes: typeof d.clientNotes === "string" ? d.clientNotes.slice(0, 2000) : undefined,
    specialReqs: typeof d.specialReqs === "string" ? d.specialReqs.slice(0, 1000) : undefined,
  });

  return result.ok ? apiOk({ reference: result.reference }) : apiError(result.error ?? "Failed.", 400);
}
