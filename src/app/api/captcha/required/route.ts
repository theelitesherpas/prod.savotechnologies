import { requiredForRequest, loginCaptchaRequired, captchaConfiguration } from "@/lib/captcha";
import { clientIpFromHeaders } from "@/lib/api";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/captcha/required?portal=admin|employee|client
 *  Public forms call this to check whether Google verification is
 *  configured. Portal params retain the login-failure threshold. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const portal = url.searchParams.get("portal");
    // Match the IP extraction used by server-action login handlers
    // (next/headers sees the same forwarded headers).
    const hdrs = await headers();
    const ip = clientIpFromHeaders(hdrs);

    const isPortal = !!portal && ["admin", "employee", "client"].includes(portal);
    const loginRequired = isPortal ? loginCaptchaRequired(portal!, ip) : false;

    return Response.json(
      {
        required: isPortal ? loginRequired : requiredForRequest(),
        configured: captchaConfiguration() === "ready",
        unavailable: captchaConfiguration() === "invalid",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ required: false, configured: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
