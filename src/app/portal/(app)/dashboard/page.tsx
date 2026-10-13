import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getClientUser } from "@/lib/client-auth";
import { money } from "@/components/portal/ui";
import {
  EmptyState,
  PortalIcon,
  PortalStatus,
  ProjectCard,
  dateLabel,
  progressValue,
} from "@/components/portal/workspace-ui";
import { projectRecord } from "@/components/portal/records";
import styles from "@/components/portal/portal.module.css";

export const metadata: Metadata = { title: "Overview" };
export default async function PortalDashboard() {
  const client = await getClientUser();
  if (!client || !prisma) redirect("/portal");
  const [projects, invoices] = await Promise.all([
    prisma.clientProject.findMany({
      where: { clientId: client.id, status: { notIn: ["cancelled"] } },
      orderBy: { updatedAt: "desc" },
      include: { updates: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.invoice.findMany({
      where: { clientId: client.id, status: { in: ["sent", "overdue"] } },
      orderBy: { dueDate: "asc" },
      take: 3,
    }),
  ]);
  const active = projects.filter(
    (p) => !["delivered", "cancelled"].includes(p.status),
  );
  const average = active.length
    ? Math.round(
        active.reduce((sum, p) => sum + progressValue(p.progress), 0) /
          active.length,
      )
    : null;
  const latest = projects
    .flatMap((p) =>
      p.updates.map((u) => ({
        ...u,
        project: { id: p.id, code: p.code, title: p.title },
      })),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 4);
  const metrics = [
    {
      label: "Active projects",
      value: String(active.length),
      hint: "Planning through review",
    },
    {
      label: "Average progress",
      value: average === null ? "—" : `${average}%`,
      hint: "Across active projects",
    },
    {
      label: "Delivered projects",
      value: String(projects.filter((p) => p.status === "delivered").length),
      hint: "Completed engagements",
    },
    {
      label: "Invoices to review",
      value: String(invoices.length),
      hint: "Up to three next payments",
    },
  ];
  return (
    <div className={styles.content}>
      <header className={`${styles.pageHeader} ${styles.workspaceHero}`}>
        <div>
          <h1>Welcome back, {client.name.trim().split(/\s+/)[0]}.</h1>
          <p>See where your projects stand, what’s changed and which invoices need your attention.</p>
        </div>
        <Link href="/portal/projects" className={styles.workspaceAction}>
          View your projects <PortalIcon name="arrow" />
        </Link>
      </header>
      <dl className={styles.metrics}>
        {metrics.map((m) => (
          <div className={styles.metric} key={m.label}>
            <dt>{m.label}</dt>
            <dd>
              {m.value}
              <p>{m.hint}</p>
            </dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="overview-projects">
        <div className={styles.sectionHead}>
          <h2 id="overview-projects">Your projects</h2>
          <Link href="/portal/projects" className={styles.textLink}>
            All projects
            <PortalIcon name="arrow" />
          </Link>
        </div>
        {projects.length ? (
          <ul className={styles.projectGrid}>
            {projects.slice(0, 4).map((project) => (
              <li key={project.id}>
                <ProjectCard project={projectRecord(project)} heading="h3" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Your first project starts here." contact>
            Your delivery lead will publish the project and its progress here
            once it is ready to share.
          </EmptyState>
        )}
      </section>
      <div className={styles.dashboardColumns}>
        <section
          className={`${styles.section} ${styles.panel}`}
          aria-labelledby="overview-invoices"
        >
          <div className={styles.sectionHead}>
            <h2 id="overview-invoices">Next payments</h2>
            <Link href="/portal/invoices" className={styles.textLink}>
              All invoices
              <PortalIcon name="arrow" />
            </Link>
          </div>
          {invoices.length ? (
            <ul className={styles.paymentList}>
              {invoices.map((invoice) => (
                <li key={invoice.id}>
                  <div>
                    <strong>{invoice.number}</strong>
                    <p>
                      {invoice.dueDate
                        ? `Due ${dateLabel(invoice.dueDate)}`
                        : "Due date not set"}
                    </p>
                  </div>
                  <div className={styles.paymentValue}>
                    <strong>
                      {money(invoice.amount, invoice.currency)}{" "}
                      {invoice.currency}
                    </strong>
                    <PortalStatus status={invoice.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No payments due." icon="invoice">
              There are no issued invoices awaiting payment. Your full billing
              history is available in Invoices.
            </EmptyState>
          )}
        </section>
        <section
          className={`${styles.section} ${styles.panel}`}
          aria-labelledby="overview-updates"
        >
          <div className={styles.sectionHead}>
            <h2 id="overview-updates">Latest from delivery</h2>
          </div>
          {latest.length ? (
            <ol className={styles.timeline}>
              {latest.map((update) => (
                <li key={update.id}>
                  <strong>{update.title}</strong>
                  <p>
                    <Link
                      href={`/portal/projects/${update.project.id}`}
                      className={styles.textLink}
                    >
                      {update.project.code} · {update.project.title}
                    </Link>
                  </p>
                  <time dateTime={update.createdAt.toISOString()}>
                    {dateLabel(update.createdAt)}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="Updates will appear here." icon="message">
              Follow the latest notes from your delivery lead as work
              progresses.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
