"use client";

import { PortalIcon } from "@/components/portal/workspace-ui";
import styles from "@/components/portal/portal.module.css";

export default function PortalSignInError({ retry }: { retry: () => void }) {
  return (
    <div className={styles.loginPage}>
      <div className={styles.loginRail}>
        <section className={styles.panel}>
          <header className={styles.pageHeader}>
            <h1>We couldn’t connect.</h1>
            <p>
              Please try loading the sign-in page again. If you still can’t
              access your workspace, contact the Savo team.
            </p>
          </header>
          <button type="button" className={styles.textLink} onClick={retry}>
            Try again
            <PortalIcon name="arrow" />
          </button>
          <div className={styles.helpStrip}>
            <a
              className={styles.textLink}
              href="mailto:hello@savotechnologies.com"
            >
              hello@savotechnologies.com
              <PortalIcon name="arrow" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
