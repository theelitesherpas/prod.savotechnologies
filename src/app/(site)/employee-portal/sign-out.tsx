"use client";

import { useFormStatus } from "react-dom";
import { PortalIcon } from "@/components/portal/workspace-ui";
import styles from "@/components/portal/portal.module.css";

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.signout} disabled={pending}>
      <PortalIcon name="logout" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
export function EmployeeSignOut({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <SignOutButton />
    </form>
  );
}
