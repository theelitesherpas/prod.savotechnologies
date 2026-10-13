import styles from "@/components/portal/portal.module.css";
export default function PortalLoading() {
  return (
    <div
      className={styles.content}
      role="status"
      aria-label="Loading your workspace"
    >
      <span className="sr-only">Loading your workspace…</span>
      <div className={styles.loading} aria-hidden="true">
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}
