import { captchaConfigured } from "@/lib/captcha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/captcha/required
 *  Forms call this on mount to know whether the reCAPTCHA challenge
 *  should render. The gate is always-on: `required` is true whenever
 *  BOTH halves are configured (server secret + public site key), so a
 *  half-configured deployment never renders a widget that cannot pass. */
export async function GET() {
  const configured = captchaConfigured() && Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
  return Response.json(
    { required: configured, configured },
    { headers: { "Cache-Control": "no-store" } },
  );
}
