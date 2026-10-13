"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { PortalIcon, type PortalIconName } from "./workspace-ui";
import styles from "./portal.module.css";

const destinations: { href: string; label: string; icon: PortalIconName }[] = [
  { href: "/portal/dashboard", label: "Overview", icon: "overview" },
  { href: "/portal/projects", label: "Projects", icon: "projects" },
  { href: "/portal/invoices", label: "Invoices", icon: "invoice" },
];
export function WorkspaceNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Client workspace">
      {destinations.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={
            pathname === item.href || pathname?.startsWith(`${item.href}/`)
              ? "page"
              : undefined
          }
        >
          <PortalIcon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
export function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.signout} disabled={pending}>
      <PortalIcon name="logout" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
