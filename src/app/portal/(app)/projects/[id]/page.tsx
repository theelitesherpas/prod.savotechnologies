import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getClientUser } from "@/lib/client-auth";
import {
  EmptyState,
  PortalIcon,
  PortalProgress,
  PortalStatus,
  InvoiceTable,
  dateLabel,
  progressValue,
} from "@/components/portal/workspace-ui";
import { invoiceRecord } from "@/components/portal/records";
import styles from "@/components/portal/portal.module.css";

export const metadata: Metadata = { title: "Project details" };
export default async function PortalProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const client = await getClientUser();
  if (!client || !prisma) redirect("/portal");
  const { id } = await params;
  const project = await prisma.clientProject.findFirst({
    where: { id, clientId: client.id },
    include: {
      milestones: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
      updates: { orderBy: { createdAt: "desc" }, take: 12 },
      invoices: {
        where: { clientId: client.id, status: { notIn: ["draft"] } },
        orderBy: { issuedAt: "desc" },
      },
    },
  });
  if (!project) notFound();
  return (
    <div className={styles.content}>
      <Link href="/portal/projects" className={styles.textLink}>
        <PortalIcon name="back" />
        All projects
      </Link>
      <header className={styles.projectHero}>
        <div className={styles.projectTitleRow}>
          <span className={styles.code}>{project.code}</span>
          <PortalStatus status={project.status} />
        </div>
        <div className={styles.pageHeader}>
          <h1>{project.title}</h1>
          {project.summary ? <p>{project.summary}</p> : null}
        </div>
        <PortalProgress
          value={project.progress}
          label={`${project.title} progress`}
        />
        <div className={styles.progressMeta}>
          <span>{progressValue(project.progress)}% complete</span>
          <span>
            {project.startDate
              ? `Started ${dateLabel(project.startDate)} · `
              : ""}
            {project.dueDate
              ? `Due ${dateLabel(project.dueDate)}`
              : "Due date not set"}
          </span>
        </div>
      </header>
      <div className={styles.projectDetailGrid}>
        <section
          className={`${styles.panel} ${styles.section}`}
          aria-labelledby="project-milestones"
        >
          <div className={styles.sectionHead}>
            <h2 id="project-milestones">Milestones</h2>
          </div>
          {project.milestones.length ? (
            <ol className={styles.milestones}>
              {project.milestones.map((milestone) => (
                <li key={milestone.id}>
                  <div className={styles.milestoneTitle}>
                    <PortalIcon
                      name={milestone.status === "done" ? "check" : "clock"}
                    />
                    <div>
                      <strong>{milestone.title}</strong>
                      {milestone.dueDate ? (
                        <p>Due {dateLabel(milestone.dueDate)}</p>
                      ) : null}
                    </div>
                  </div>
                  <PortalStatus status={milestone.status} />
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="The plan is taking shape." icon="clock">
              Your delivery lead will publish milestones here when the project
              plan is ready.
            </EmptyState>
          )}
        </section>
        <section
          className={`${styles.panel} ${styles.section}`}
          aria-labelledby="project-delivery"
        >
          <div className={styles.sectionHead}>
            <h2 id="project-delivery">Delivery updates</h2>
          </div>
          {project.updates.length ? (
            <ol className={styles.timeline}>
              {project.updates.map((update) => (
                <li key={update.id}>
                  <strong>{update.title}</strong>
                  {update.body ? <p>{update.body}</p> : null}
                  <time dateTime={update.createdAt.toISOString()}>
                    {dateLabel(update.createdAt)}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="No updates posted yet." icon="message">
              Project notes and delivery updates will appear here as your team
              shares them.
            </EmptyState>
          )}
        </section>
      </div>
      <section className={styles.section} aria-labelledby="project-invoices">
        <div className={styles.sectionHead}>
          <h2 id="project-invoices">Project invoices</h2>
          <Link href="/portal/invoices" className={styles.textLink}>
            All invoices
            <PortalIcon name="arrow" />
          </Link>
        </div>
        {project.invoices.length ? (
          <InvoiceTable
            caption={`Invoices for ${project.title}`}
            invoices={project.invoices.map((invoice) =>
              invoiceRecord({
                ...invoice,
                project: { code: project.code, title: project.title },
              }),
            )}
          />
        ) : (
          <EmptyState title="No invoices for this project." icon="invoice">
            Issued invoices linked to this project will appear here.
          </EmptyState>
        )}
      </section>
      <div className={styles.helpStrip}>
        <p>Need context on a milestone or delivery update?</p>
        <a href="mailto:hello@savotechnologies.com" className={styles.textLink}>
          Contact your team
          <PortalIcon name="arrow" />
        </a>
      </div>
    </div>
  );
}
