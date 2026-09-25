"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { loginClient, logoutClient } from "@/lib/client-auth";

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
