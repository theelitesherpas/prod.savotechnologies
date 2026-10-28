"use client";

import { PortalLoginForm } from "@/components/portal/login-fields";
import { employeeSignInAction } from "./actions";

export function EmployeeLoginForm({ error }: { error?: string }) {
  return <PortalLoginForm kind="employee" action={employeeSignInAction} error={error} />;
}
