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
import { money, MilestonePaymentChip } from "@/components/portal/ui";
import { projectFinancials, milestonePaymentStatus } from "@/lib/project-finance";
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
    where: { id, clientId: client.id, archivedAt: null },
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
  const finance = projectFinancials(project, project.milestones, project.invoices);
  const additional = project.milestones.filter(m => m.scope === "additional");
  const baseMilestones = project.milestones.filter(m => m.scope !== "additional");
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
              ? `Estimated delivery ${dateLabel(project.dueDate)}`
              : "Due date not set"}
          </span>
        </div>
      </header>
      {project.budget != null ? <div className={`${styles.currencyTotals} ${styles.projectFinancialSummary}`}>
        <section className={styles.currencyTotal} aria-label="Agreed project cost"><h2>Agreed project cost · {project.currency}</h2><dl><div><dt>Fixed base budget</dt><dd>{money(project.budget, project.currency)}</dd></div><div><dt>Additional work</dt><dd>{money(finance.additional, project.currency)}</dd></div><div><dt>Agreed total</dt><dd>{money(finance.total!, project.currency)}</dd></div></dl></section>
        <section className={styles.currencyTotal} aria-label="Project payments"><h2>Project payments · {project.currency}</h2><dl><div><dt>Payments recorded</dt><dd>{money(finance.paid, project.currency)}</dd></div><div><dt>Balance against agreed total</dt><dd>{money(finance.balance!, project.currency)}</dd></div></dl><p className={styles.projectBudgetNote}>This balance includes agreed work that may not yet be invoiced. Delivery progress follows completed milestones; payment completion is tracked separately.</p></section>
      </div> : null}
      <div className={styles.projectDetailGrid}>
        <section
          className={`${styles.panel} ${styles.section}`}
          aria-labelledby="project-milestones"
        >
          <div className={styles.sectionHead}>
            <h2 id="project-milestones">Milestones</h2>
          </div>
          {baseMilestones.length ? (
            <ol className={styles.milestones}>
              {baseMilestones.map((milestone) => (
                <li key={milestone.id}>
                  <div className={styles.milestoneTitle}>
                    <PortalIcon
                      name={milestone.status === "done" ? "check" : "clock"}
                    />
                    <div>
                      <strong>{milestone.title}</strong>
                      {milestone.description ? <p>{milestone.description}</p> : null}
                      {milestone.amount != null ? <p>{money(milestone.amount, project.currency)} · {project.currency}</p> : null}
                      {milestone.dueDate ? (
                        <p>Due {dateLabel(milestone.dueDate)}</p>
                      ) : null}
                    </div>
                  </div>
                  <span className="flex flex-col items-end gap-2">
                    <PortalStatus status={milestone.status} />
                    <MilestonePaymentChip status={milestonePaymentStatus(milestone.amount, project.invoices.filter(i => i.milestoneId === milestone.id))} />
                  </span>
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
      {additional.length ? <section className={`${styles.panel} ${styles.section}`} aria-labelledby="project-additional"><div className={styles.sectionHead}><h2 id="project-additional">Additional work</h2></div><ol className={styles.milestones}>{additional.map(work => <li key={work.id}><div className={styles.milestoneTitle}><PortalIcon name={work.status === "done" ? "check" : "clock"}/><div><strong>{work.title}</strong>{work.description ? <p>{work.description}</p> : null}<p>{money(work.amount ?? 0, project.currency)} · {project.currency}{work.dueDate ? ` · Due ${dateLabel(work.dueDate)}` : ""}</p></div></div><span className="flex flex-col items-end gap-2"><PortalStatus status={work.status}/><MilestonePaymentChip status={milestonePaymentStatus(work.amount, project.invoices.filter(i => i.milestoneId === work.id))}/></span></li>)}</ol></section> : null}
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
