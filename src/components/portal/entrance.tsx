import Link from "next/link";
import type { ReactNode } from "react";
import { SavoLogo } from "@/components/shared/savo-logo";
import { PortalIcon } from "./workspace-ui";
import portal from "./portal.module.css";
import styles from "./entrance.module.css";

/** Reference-pinned login composition, scoped to the two entrances.
 * THESIS: one clear sign-in task, with a useful glimpse of the workspace.
 * WORLD: white, neutral gray and Savo red; existing Outfit/Inter, precise controls.
 * STORY: choose portal → password or registered-email OTP → owned workspace.
 * VIEWPORT: compact viewport-fit form left, straight workspace preview right;
 * task-only entrance on phones. Natural overflow remains available for zoom/keyboard.
 * FORM: owner-supplied split-screen reference; code-led, no generated assets.
 * FINISH: responsive/functional checks and scoped documentation, not a global rebrand.
 */
export function PortalEntrance({ kind, children }: { kind: "client" | "employee"; children: ReactNode }) {
  const employee = kind === "employee";
  return (
    <div className={`${portal.loginPage} ${styles.page}`}>
      <div className={styles.gateway}>
        <div className={styles.formSide}>
          <nav className={styles.switcher} aria-label="Choose your portal">
            <Link href="/portal" aria-current={!employee ? "page" : undefined}>Client portal</Link>
            <Link href="/employee-portal" aria-current={employee ? "page" : undefined}>Employee portal</Link>
          </nav>
          {children}
        </div>
        <section className={styles.story} aria-labelledby="access-story">
          <div className={styles.storyCopy}>
            <h2 id="access-story">{employee ? <>Your work. Your team.<br />Your space at Savo.</> : <>Great work starts<br />with a clear view.</>}</h2>
            <p>{employee ? "Your employment details, leave and authored work — together in your employee workspace." : "Stay connected to your projects, delivery and invoices. Everything you need to move forward, together."}</p>
          </div>
          <WorkspaceIllustration employee={employee} />
          <div className={styles.storyFoot}><span>Bold Brands. Built by Savo.</span><span>savotechnologies.com</span></div>
        </section>
      </div>
    </div>
  );
}

/** Static capability illustration, not account records or invented metrics. */
function WorkspaceIllustration({ employee }: { employee: boolean }) {
  const rows = employee ? [
    ["projects", "Employment details", "Your role & department", "Profile"],
    ["message", "Leave overview", "Balance & leave history", "Leave"],
    ["invoice", "Authored content", "Your published & draft work", "Content"],
  ] as const : [
    ["projects", "Your projects", "Scope, milestones & progress", "Projects"],
    ["message", "Delivery updates", "The latest from your team", "Updates"],
    ["invoice", "Invoices & payments", "Your billing, in one place", "Billing"],
  ] as const;
  return (
    <div className={styles.preview} role="img" aria-label={`Illustrative ${employee ? "employee" : "client"} workspace preview: ${rows.map((row) => row[1]).join(", ")}. No actual account data.`}>
      <div className={styles.previewRail} aria-hidden="true"><SavoLogo /><div>{rows.map(([icon]) => <span key={icon}><PortalIcon name={icon} /></span>)}</div></div>
      <div className={styles.previewBody} aria-hidden="true">
        <div className={styles.previewTop}><span>{employee ? "Employee workspace" : "Client workspace"}</span><PortalIcon name="shield" /></div>
        <div className={styles.previewTitle}><strong>{employee ? "Your space at Savo." : "A little more clarity."}</strong><span>Your workspace at a glance</span></div>
        <div className={styles.previewRows}>{rows.map(([icon, title, detail, tag]) => <div key={title} className={styles.previewRow}><PortalIcon name={icon} /><div><strong>{title}</strong><span>{detail}</span></div><span className={styles.previewTag}>{tag}</span></div>)}</div>
        <div className={styles.previewBottom}><span>Workspace preview</span><span>Illustration · no account data</span></div>
      </div>
    </div>
  );
}
