"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { loginClient, logoutClient } from "@/lib/client-auth";
import { enforceLoginCaptcha, recordLoginFailure, clearLoginFailures } from "@/lib/captcha";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email.").max(120),
  password: z.string().min(1).max(128),
});

export async function clientLoginAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) redirect("/portal?e=invalid");

  // IP extraction (same pattern as admin/employee login)
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";

  // Progressive captcha: after 2 failed attempts, verify before processing.
  const cap = await enforceLoginCaptcha("client", ip, formData.get("captchaToken"));
  if (!cap.ok) {
    if ("captchaRequired" in cap) {
      redirect("/portal?e=Please complete the human verification.");
    }
    redirect(`/portal?e=${encodeURIComponent(cap.error)}`);
  }

  const result = await loginClient(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    recordLoginFailure("client", ip);
    redirect(`/portal?e=${encodeURIComponent(result.error)}`);
  }

  clearLoginFailures("client", ip);
  redirect("/portal/dashboard");
}

export async function clientLogoutAction(): Promise<void> {
  await logoutClient();
  redirect("/portal");
}
