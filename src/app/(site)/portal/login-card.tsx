"use client";

import { clientSignInAction } from "@/app/portal/actions";
import { PortalLoginForm } from "@/components/portal/login-fields";

export function PortalLoginCard({ error }: { error?: string }) {
  return <PortalLoginForm kind="client" action={clientSignInAction} error={error === "invalid" ? "Enter a valid email address and try again." : error} />;
}
