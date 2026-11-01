"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { STEP_UP_PURPOSE_PAYMENTS, stepUpVerified } from "@/lib/step-up";
import { setGatewayAvailability } from "@/lib/payment-availability";
import { audit } from "@/lib/audit";
const back = "/admin/settings/payments";
export async function setGatewayAvailabilityAction(form: FormData): Promise<void> {
  const user = await requireAdmin();
  if (user.role !== "admin") redirect("/admin?denied=Payment%20settings%20are%20admin-only");
  if (!(await stepUpVerified(user.id, STEP_UP_PURPOSE_PAYMENTS))) redirect(`${back}?e=Fresh%20email%20verification%20is%20required.`);
  const parsed = z.object({ provider: z.enum(["razorpay", "paypal"]), enabled: z.enum(["true", "false"]), revision: z.coerce.number().int().min(0).max(2147483646) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`${back}?e=Invalid%20payment%20availability%20request.`);
  const { provider, enabled, revision } = parsed.data;
  try { await setGatewayAvailability(provider, enabled === "true", revision, user.id); }
  catch { redirect(`${back}?e=Availability%20changed%20or%20could%20not%20be%20saved.%20Refresh%20before%20retrying.`); }
  await audit(user.id, "payment.availability.change", "PaymentGatewayAvailability", provider, { enabled: enabled === "true" });
  for (const path of [back, "/portal/dashboard", "/portal/invoices", "/portal/projects"]) revalidatePath(path);
  revalidatePath("/portal/invoices/[id]/pay", "page");
  revalidatePath("/portal/projects/[id]", "page");
  redirect(`${back}?availabilitySaved=1#${provider}`);
}
