"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { loginClient, logoutClient } from "@/lib/client-auth";
import { clientIpFromHeaders } from "@/lib/api";
import { enforceLoginCaptcha } from "@/lib/captcha";

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
  const ip = clientIpFromHeaders(hdrs);

  // Always-on captcha: every login attempt must be verified.
  const cap = await enforceLoginCaptcha("client", ip, formData.get("captchaToken"));
  if (!cap.ok) {
    if ("captchaRequired" in cap) {
      redirect("/portal?e=Please complete the human verification.");
    }
    redirect(`/portal?e=${encodeURIComponent(cap.error)}`);
  }

  const result = await loginClient(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    redirect(`/portal?e=${encodeURIComponent(result.error)}`);
  }

  redirect("/portal/dashboard");
}

export async function clientLogoutAction(): Promise<void> {
  await logoutClient();
  redirect("/portal");
}
