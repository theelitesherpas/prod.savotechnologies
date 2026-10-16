import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SavoLogo } from "@/components/shared/savo-logo";
import { getClientUser } from "@/lib/client-auth";
import { WorkspaceNav, SignOutButton } from "@/components/portal/workspace-nav";
import { PortalIcon } from "@/components/portal/workspace-ui";
import styles from "@/components/portal/portal.module.css";
import { clientLogoutAction } from "../actions";

/** Savo client workspace — Operate, owner-pinned current website identity.
 * Persistent dark wayfinding beside white/gray records; no promotional UI.
 * Client scope is still enforced here AND independently at every leaf. */
export const metadata: Metadata = {
  title: { default: "Client Portal", template: "%s · Savo Client Portal" },
  robots: { index: false, follow: false },
};
const contract = `<!-- SAVO CLIENT WORKSPACE
THESIS: A task-first extension of the current Savo website, not a marketing teaser.
OWN-WORLD: Outfit headings, Inter controls/data; black rail, white panels, gray canvas, red actions.
STORY: Sign in, locate a project, follow delivery, review invoices, contact the team.
FIRST VIEWPORT: Persistent navigation, named account, clear heading, real summaries and current records. Mobile reflows the rail above the task.
FORM: Established owner-pinned website identity; familiar Operate composition, scoped to the client journey.
FINISH: Functional and responsive evidence recorded in the portal surface brief. No fictional capabilities or client records.
-->`;
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = await getClientUser();
  if (!client) redirect("/portal");
  const initials = client.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div className={`${styles.theme} ${styles.shell}`}>
      <div hidden dangerouslySetInnerHTML={{ __html: contract }} />
      <a
        href="#portal-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3 focus:text-black"
      >
        Skip to workspace
      </a>
      <aside className={styles.sidebar}>
        <Link
          className={styles.brand}
          href="/portal/dashboard"
          aria-label="Savo client portal home"
        >
          <SavoLogo />
        </Link>
        <p className={styles.workspaceName}>Client workspace</p>
        <WorkspaceNav />
        <div className={styles.sidebarBottom}>
          <p>Your delivery team is still a conversation away.</p>
          <a href="mailto:hello@savotechnologies.com">
            Contact the team
            <PortalIcon name="arrow" />
          </a>
          <Link href="/">
            Visit Savo website
            <PortalIcon name="arrow" />
          </Link>
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">
              {initials}
            </span>
            <div>
              <p className={styles.identityName}>{client.name}</p>
              {client.businessId ? <p className={styles.identityCompany}>Client ID: {client.businessId}</p> : null}
              {client.company ? (
                <p className={styles.identityCompany}>{client.company}</p>
              ) : null}
            </div>
          </div>
          <form action={clientLogoutAction}>
            <SignOutButton />
          </form>
        </header>
        <main id="portal-main" className={styles.main}>
          {children}
        </main>
        <footer className={styles.footer}>
          <span>
            © {new Date().getFullYear()} Savo Technologies Private Limited
          </span>
          <div>
            <a href="mailto:hello@savotechnologies.com">
              Need help? Contact the team
            </a>
            <span aria-hidden="true"> · </span>
            <Link href="/privacy-policy">Privacy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
