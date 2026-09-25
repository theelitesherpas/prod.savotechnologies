import { requiredForRequest } from "@/lib/captcha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/captcha/required — does this visitor's IP need a captcha
 *  for its next form submission? Forms call this on mount and after
 *  each successful submit, rendering the challenge only when needed. */
export async function GET(req: Request) {
  try {
    return Response.json(
      { required: requiredForRequest(req), configured: Boolean(process.env.RECAPTCHA_SECRET_KEY) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ required: false, configured: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
