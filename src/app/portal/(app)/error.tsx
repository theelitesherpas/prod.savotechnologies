"use client";
import { EmptyState, PortalIcon } from "@/components/portal/workspace-ui";
import styles from "@/components/portal/portal.module.css";
export default function PortalError({ retry }: { retry: () => void }) {
  return (
    <div className={styles.content}>
      <header className={styles.pageHeader}>
        <h1>We couldn’t load this page.</h1>
        <p>
          Your workspace is temporarily unavailable. Try again, or contact the
          team if the problem continues.
        </p>
      </header>
      <EmptyState title="Let’s reconnect." icon="message" contact>
        You can retry loading your workspace below, or reach us through the
        usual support channel.
      </EmptyState>
      <button type="button" className={styles.textLink} onClick={retry}>
        Try again
        <PortalIcon name="arrow" />
      </button>
    </div>
  );
}
