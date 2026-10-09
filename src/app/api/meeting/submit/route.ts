import { apiOk, apiError, isJsonRequest, clientIp, readJsonBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { enforceCaptcha } from "@/lib/captcha";
import { submitAvailability } from "@/lib/meeting/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/meeting/submit — public endpoint for client availability. */

export async function POST(req: Request) {
  if (!isJsonRequest(req)) return apiError("Unsupported format.", 415);

  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const d = body.data as Record<string, unknown>;

  // Always-on captcha: every submission must carry a verified token.
  const cap = await enforceCaptcha(clientIp(req), d.captchaToken);
  if (!cap.ok) {
    if ("captchaRequired" in cap) {
      return apiError("Please complete the human verification and try again.", 400);
    }
    return apiError(cap.error, 400);
  }

  const token = typeof d.token === "string" ? d.token : "";
  if (!token) return apiError("Missing token.", 400);

  // Rate limit per token to prevent spam
  if (!rateLimit(`meeting-submit:${token.slice(0, 16)}`, 5, 10 * 60 * 1000).ok) {
    return apiError("Too many submissions. Please try again in a few minutes.", 429);
  }

  const result = await submitAvailability({
    token,
    preferredDate: String(d.preferredDate ?? ""),
    preferredTime: String(d.preferredTime ?? ""),
    altDate: typeof d.altDate === "string" ? d.altDate : undefined,
    altTime: typeof d.altTime === "string" ? d.altTime : undefined,
    locationPreference: typeof d.locationPreference === "string" ? d.locationPreference : undefined,
    clientAddress: typeof d.clientAddress === "string" ? d.clientAddress : undefined,
    attendeeCount: typeof d.attendeeCount === "number" ? d.attendeeCount : 1,
    additionalAttendees: Array.isArray(d.additionalAttendees)
      ? (d.additionalAttendees as Record<string, unknown>[]).slice(0, 10).map((a) => ({
          name: String(a.name ?? "").slice(0, 120),
          email: typeof a.email === "string" ? a.email.slice(0, 160) : undefined,
          role: typeof a.role === "string" ? a.role.slice(0, 80) : undefined,
        }))
      : [],
    clientNotes: typeof d.clientNotes === "string" ? d.clientNotes.slice(0, 2000) : undefined,
    specialReqs: typeof d.specialReqs === "string" ? d.specialReqs.slice(0, 1000) : undefined,
  });

  return result.ok ? apiOk({ reference: result.reference }) : apiError(result.error ?? "Failed.", 400);
}
