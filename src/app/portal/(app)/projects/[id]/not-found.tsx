import Link from "next/link";
import { PortalIcon } from "@/components/portal/workspace-ui";
import styles from "@/components/portal/portal.module.css";
export default function ProjectNotFound() {
  return (
    <div className={styles.content}>
      <header className={styles.pageHeader}>
        <h1>Project not available.</h1>
        <p>
          This project could not be found in your workspace. Check the link or
          return to your projects.
        </p>
      </header>
      <Link href="/portal/projects" className={styles.textLink}>
        <PortalIcon name="back" />
        Back to projects
      </Link>
    </div>
  );
}
