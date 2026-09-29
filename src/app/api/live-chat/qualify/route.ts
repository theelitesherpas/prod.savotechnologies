import { apiOk, apiError, isJsonRequest, readJsonBody } from "@/lib/api";
import { validatePhone, COUNTRY_PHONE_RULES } from "@/lib/phone";
import { resolveVisitor, visitorCookieOptions, VISITOR_COOKIE, visitorRateLimit } from "@/lib/livechat/http";
import { startHumanRequest, getConversationByPublicToken } from "@/lib/livechat/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/live-chat/qualify — the "Start Live Chat" / "Leave a Message"
 * submission. Carries the whole pre-chat qualification + contact payload
 * (collected conversationally client-side) in one atomic request that
 * creates the thread, stores the lead, generates the AI summary and
 * notifies the team. Server-side validation on every field.
 */

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const clean = v.trim();
  return clean ? clean.slice(0, max) : null;
}

export async function POST(req: Request) {
  if (!isJsonRequest(req)) return apiError("Unsupported request format.", 415);
  const visitor = await resolveVisitor(req);
  if (!visitor) return apiError("Chat is unavailable right now.", 503);

  const body = await readJsonBody(req);
  if (!body.ok) return apiError("Invalid request.", 400);
  const data = body.data as Record<string, unknown>;

  if (!visitorRateLimit(visitor.visitorId, "qualify", 5, 10 * 60_000)) {
    return apiError("A request was already sent — the team has it and will reply soon.", 429);
  }

  // ── Contact (name always, phone per settings, email optional) ──
  const name = str(data.name, 120);
  if (!name || name.length < 2) return apiError("Please share your name so we know who we're talking to.", 400);
  const country = str(data.country, 60);
  const phoneRaw = str(data.phone, 32);
  const email = str(data.email, 160);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return apiError("That email address doesn't look right.", 400);

  const { getLiveChatSettings } = await import("@/lib/livechat/settings");
  const settings = await getLiveChatSettings();

  let phone: string | null = null;
  if (phoneRaw) {
    if (!country || !COUNTRY_PHONE_RULES[country]) return apiError("Please pick your country so we can validate the number.", 400);
    const check = validatePhone(country, phoneRaw);
    if (!check.ok) return apiError(check.error, 400);
    phone = check.normalized;
  } else if (settings.phoneRequired) {
    return apiError("A phone number is needed so the team can reach you if the chat disconnects.", 400);
  }

  // ── Qualification ──
  const qualification = {
    service: str(data.service, 80),
    stage: str(data.stage, 80),
    requirement: str(data.requirement, 2000),
    timeline: str(data.timeline, 80),
    budget: str(data.budget, 80),
  };

  const pageContextRaw = data.pageContext;
  const pageContext =
    pageContextRaw && typeof pageContextRaw === "object"
      ? (pageContextRaw as { landingPage?: string; currentPage?: string; referrer?: string; utm?: Record<string, string> })
      : null;

  const offline = data.offline === true;

  const result = await startHumanRequest({
    visitorId: visitor.visitorId,
    conversation: typeof data.conversationToken === "string" ? await getConversationByPublicToken(data.conversationToken, visitor.visitorId) : null,
    qualification,
    contact: { name, phone, country, email },
    consent: data.consent === true,
    pageContext,
    offline,
  });
  if ("error" in result) return apiError(result.error, 400);

  const res = apiOk({
    conversationToken: result.conversation.publicToken,
    status: result.conversation.status,
    offline: result.offline,
  });
  if (visitor.token) res.cookies.set(VISITOR_COOKIE, visitor.token, visitorCookieOptions());
  return res;
}
