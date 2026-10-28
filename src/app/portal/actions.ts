"use server";

import { redirect } from "next/navigation";
import { handlePortalLogin } from "@/lib/portal-login";
import { logoutClient } from "@/lib/client-auth";
import { INITIAL_PORTAL_LOGIN, type PortalLoginState } from "@/lib/portal-login-state";

export async function clientSignInAction(previous: PortalLoginState, form: FormData): Promise<PortalLoginState> {
  return handlePortalLogin("client", previous, form);
}

/** Compatibility entry point: all credential paths share the same protections. */
export async function clientLoginAction(form: FormData): Promise<void> {
  form.set("intent", "password");
  const state = await clientSignInAction(INITIAL_PORTAL_LOGIN, form);
  redirect(`/portal?e=${encodeURIComponent(state.error || "Please try signing in again.")}`);
}

export async function clientLogoutAction(): Promise<void> {
  await logoutClient();
  redirect("/portal");
}
