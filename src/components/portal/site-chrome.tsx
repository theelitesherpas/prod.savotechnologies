"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { EnquiryProvider } from "@/components/shared/enquiry-dialog";
import { ProjectModalProvider } from "@/components/shared/project-lead-modal";
import { SavoLogo } from "@/components/shared/savo-logo";
import { PortalIcon } from "./workspace-ui";
import styles from "./entrance.module.css";

const isAccessRoute = (path: string) =>
  /^\/(?:portal|employee-portal)(?:\/|$)/.test(path);

/** Portal access never mounts hidden sales forms or their CAPTCHA widgets.
 * Outside these routes, preserve the original provider hierarchy. */
export function SiteInteractionProviders(
  props: ComponentProps<typeof ProjectModalProvider>,
) {
  const access = isAccessRoute(usePathname());
  if (access) return props.children;
  return (
    <EnquiryProvider>
      <ProjectModalProvider {...props} />
    </EnquiryProvider>
  );
}

export function PortalMarketingBoundary({ children }: { children: ReactNode }) {
  return isAccessRoute(usePathname()) ? null : children;
}

/** Only access routes get focused chrome. All other site chrome is unchanged. */
export function PortalSiteHeader({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (!isAccessRoute(path)) return children;
  return (
    <header className={styles.header}>
      <Link
        href="/"
        className={styles.logo}
        aria-label="Savo Technologies home"
      >
        <SavoLogo />
      </Link>
      <Link href="/" className={styles.back}>
        <PortalIcon name="back" /> Back to website
      </Link>
    </header>
  );
}
export function PortalSiteFooter({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (!isAccessRoute(path)) return children;
  return (
    <footer className={styles.footer}>
      <span>
        © {new Date().getFullYear()} Savo Technologies Private Limited
      </span>
      <div>
        <Link href="/privacy-policy">Privacy policy</Link>
        <a
          href={
            path.startsWith("/employee-portal")
              ? "mailto:hr@savotechnologies.com"
              : "mailto:hello@savotechnologies.com"
          }
        >
          Need help?
        </a>
      </div>
    </footer>
  );
}
