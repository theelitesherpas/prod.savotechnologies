import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClientUser } from "@/lib/client-auth";
import { ProjectBrowser } from "@/components/portal/record-browsers";
import { projectRecord } from "@/components/portal/records";
import styles from "@/components/portal/portal.module.css";

export const metadata: Metadata = { title: "Projects" };
export default async function PortalProjectsPage() {
  const client = await getClientUser();
  if (!client || !prisma) redirect("/portal");
  const projects = await prisma.clientProject.findMany({
    where: { clientId: client.id, archivedAt: null },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className={styles.content}>
      <header className={styles.pageHeader}>
        <h1>Your projects.</h1>
        <p>
          From the first milestone to the final handover. Open a project for its
          plan, delivery updates and related invoices.
        </p>
      </header>
      <ProjectBrowser projects={projects.map(projectRecord)} />
    </div>
  );
}
