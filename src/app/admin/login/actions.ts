"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { enforceLoginCaptcha, recordLoginFailure, clearLoginFailures } from "@/lib/captcha";
import { clientIpFromHeaders } from "@/lib/api";
import { login } from "@/lib/auth";

/**
 * Admin login server action.
 * Errors are conveyed via search params - the form works without JS.
 */

const credentialsSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(200),
});

export async function loginAction(formData: FormData): Promise<void> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/admin/login?e=invalid");
  }

  const hdrs = await headers();
  const ip = clientIpFromHeaders(hdrs);

  // Progressive captcha: after 2 failed attempts, verify before processing.
  const cap = await enforceLoginCaptcha("admin", ip, formData.get("captchaToken"));
  if (!cap.ok) {
    if ("captchaRequired" in cap) {
      redirect("/admin/login?e=captcha");
    }
    redirect(`/admin/login?e=${encodeURIComponent(cap.error)}`);
  }

  const result = await login(
    parsed.data.email,
    parsed.data.password,
    {
      ip,
      userAgent: hdrs.get("user-agent"),
    },
    formData.get("remember") === "on" || formData.get("remember") === "true",
  );

  if (!result.ok) {
    recordLoginFailure("admin", ip);
    redirect(`/admin/login?e=${result.reason === "rate_limited" ? "rate" : "invalid"}`);
  }

  clearLoginFailures("admin", ip);
  redirect("/admin");
}
