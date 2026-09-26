import { requiredForRequest, loginCaptchaRequired } from "@/lib/captcha";
import { clientIpFromHeaders } from "@/lib/api";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/captcha/required?portal=admin|employee|client
 *  Forms call this on mount and after each attempt to know whether
 *  a captcha challenge should render. Portal param adds login-failure
 *  tracking for the three portal login forms. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const portal = url.searchParams.get("portal");
    // Match the IP extraction used by server-action login handlers
    // (next/headers sees the same forwarded headers).
    const hdrs = await headers();
    const ip = clientIpFromHeaders(hdrs);

    const loginRequired =
      portal && ["admin", "employee", "client"].includes(portal)
        ? loginCaptchaRequired(portal, ip)
        : false;

    return Response.json(
      {
        required: requiredForRequest(req) || loginRequired,
        configured: Boolean(process.env.RECAPTCHA_SECRET_KEY),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ required: false, configured: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
