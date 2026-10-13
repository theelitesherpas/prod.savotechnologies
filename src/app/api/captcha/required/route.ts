import { requiredForRequest, loginCaptchaRequired, captchaConfiguration } from "@/lib/captcha";
import { clientIpFromHeaders } from "@/lib/api";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/captcha/required?portal=admin|employee|client
 *  Public forms call this to check whether Google verification is
 *  configured. Client/employee access is mandatory from the first attempt;
 *  admin retains the login-failure threshold. */
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

    const configuration = captchaConfiguration();
    const mandatory = portal === "client" || portal === "employee";
    return Response.json(
      {
        required: isPortal ? loginRequired : requiredForRequest(),
        configured: configuration === "ready",
        unavailable: configuration === "invalid" || (mandatory && configuration === "off"),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ required: true, configured: false, unavailable: true }, { headers: { "Cache-Control": "no-store" } });
  }
}
