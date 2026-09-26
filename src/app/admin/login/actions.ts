"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
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
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";

  const result = await login(parsed.data.email, parsed.data.password, {
    ip,
    userAgent: hdrs.get("user-agent"),
  });

  if (!result.ok) {
    redirect(`/admin/login?e=${result.reason === "rate_limited" ? "rate" : "invalid"}`);
  }

  redirect("/admin");
}
