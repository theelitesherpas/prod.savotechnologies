"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { handlePortalLogin } from "@/lib/portal-login";
import { INITIAL_PORTAL_LOGIN, type PortalLoginState } from "@/lib/portal-login-state";

export async function employeeSignInAction(previous: PortalLoginState, form: FormData): Promise<PortalLoginState> {
  return handlePortalLogin("employee", previous, form);
}

/** Compatibility entry point; no weaker password-only endpoint. */
export async function employeeLoginAction(form: FormData): Promise<void> {
  form.set("intent", "password");
  const state = await employeeSignInAction(INITIAL_PORTAL_LOGIN, form);
  redirect(`/employee-portal?e=${encodeURIComponent(state.error || "Please try signing in again.")}`);
}

export async function employeeLogoutAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get("savo_employee")?.value;
  if (token && prisma) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await prisma.employeeSession.deleteMany({ where: { tokenHash } }).catch(() => undefined);
  }
  jar.delete("savo_employee");
  redirect("/employee-portal");
}
