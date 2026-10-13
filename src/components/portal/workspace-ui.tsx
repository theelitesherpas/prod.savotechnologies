import Link from "next/link";
import type { ReactNode } from "react";
import { money } from "./ui";
import styles from "./portal.module.css";

export type PortalIconName =
  | "shield"
  | "overview"
  | "projects"
  | "invoice"
  | "arrow"
  | "back"
  | "logout"
  | "check"
  | "clock"
  | "message"
  | "eye"
  | "eye-off";
const paths: Record<PortalIconName, ReactNode> = {
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  projects: (
    <>
      <path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M3 9h18" />
    </>
  ),
  invoice: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 7h6M9 11h6M9 15h3" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </>
  ),
  back: (
    <>
      <path d="M20 12H4M10 6l-6 6 6 6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4H4v16h5M12 12h9M17 8l4 4-4 4" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  message: (
    <>
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-1 1v-9.5A8.5 8.5 0 0 1 11.5 3h1a8.5 8.5 0 0 1 8.5 8.5Z" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="m3 3 18 18M10.6 5.1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.1 4M6.2 6.2A20 20 0 0 0 2 12s3.5 7 10 7c1.6 0 3-.4 4.2-1M10 10a3 3 0 0 0 4 4" />
    </>
  ),
};
export function PortalIcon({ name }: { name: PortalIconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
export function dateLabel(date: Date | string | null | undefined): string {
  if (!date) return "Not scheduled";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
export function progressValue(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}
const states: Record<string, { label: string; tone: string }> = {
  approved: { label: "Approved", tone: styles.success },
  rejected: { label: "Rejected", tone: styles.working },
  published: { label: "Published", tone: styles.success },
  planning: { label: "Planning", tone: styles.neutral },
  in_progress: { label: "In progress", tone: styles.working },
  review: { label: "In review", tone: styles.attention },
  delivered: { label: "Delivered", tone: styles.success },
  paused: { label: "Paused", tone: styles.neutral },
  cancelled: { label: "Cancelled", tone: styles.neutral },
  draft: { label: "Draft", tone: styles.neutral },
  sent: { label: "Due", tone: styles.attention },
  overdue: { label: "Overdue", tone: styles.working },
  paid: { label: "Paid", tone: styles.success },
  done: { label: "Done", tone: styles.success },
  pending: { label: "Upcoming", tone: styles.neutral },
};
export function PortalStatus({ status }: { status: string }) {
  const state = states[status] ?? {
    label: status.replaceAll("_", " "),
    tone: styles.neutral,
  };
  return <span className={`${styles.chip} ${state.tone}`}>{state.label}</span>;
}
export function PortalProgress({
  value,
  label = "Project progress",
}: {
  value: number;
  label?: string;
}) {
  const progress = progressValue(value);
  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
    </div>
  );
}
export function EmptyState({
  title,
  children,
  icon = "projects",
  contact = false,
}: {
  title: string;
  children: ReactNode;
  icon?: PortalIconName;
  contact?: boolean;
}) {
  return (
    <div className={styles.empty}>
      <PortalIcon name={icon} />
      <h3>{title}</h3>
      <p>{children}</p>
      {contact ? (
        <a className={styles.textLink} href="mailto:hello@savotechnologies.com">
          Contact the team
          <PortalIcon name="arrow" />
        </a>
      ) : null}
    </div>
  );
}
export type ProjectRecord = {
  id: string;
  code: string;
  title: string;
  status: string;
  summary: string | null;
  progress: number;
  dueDate: string | null;
  updatedAt: string;
};
export function ProjectCard({
  project,
  heading = "h2",
}: {
  project: ProjectRecord;
  heading?: "h2" | "h3";
}) {
  const Heading = heading;
  return (
    <Link
      href={`/portal/projects/${project.id}`}
      className={styles.projectCard}
    >
      <div className={styles.projectTop}>
        <span className={styles.code}>{project.code}</span>
        <PortalStatus status={project.status} />
      </div>
      <Heading>{project.title}</Heading>
      {project.summary ? (
        <p className={styles.projectSummary}>{project.summary}</p>
      ) : null}
      <div className={styles.projectProgress}>
        <PortalProgress
          value={project.progress}
          label={`${project.title} progress`}
        />
        <div className={styles.progressMeta}>
          <span>{progressValue(project.progress)}% complete</span>
          <span>
            {project.dueDate
              ? `Due ${dateLabel(project.dueDate)}`
              : "Due date not set"}
          </span>
        </div>
      </div>
      <div className={styles.projectFoot}>
        <span>View project</span>
        <PortalIcon name="arrow" />
      </div>
    </Link>
  );
}
export type InvoiceRecord = {
  id: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  issuedAt: string;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  project: { code: string; title: string } | null;
};
export function invoiceTotals(
  invoices: Pick<InvoiceRecord, "currency" | "amount" | "status">[],
) {
  const totals = new Map<
    string,
    { currency: string; paid: number; due: number }
  >();
  for (const invoice of invoices) {
    const group = totals.get(invoice.currency) ?? {
      currency: invoice.currency,
      paid: 0,
      due: 0,
    };
    if (invoice.status === "paid") group.paid += invoice.amount;
    if (invoice.status === "sent" || invoice.status === "overdue")
      group.due += invoice.amount;
    totals.set(invoice.currency, group);
  }
  return [...totals.values()].sort((a, b) =>
    a.currency.localeCompare(b.currency),
  );
}
export function InvoiceTable({
  invoices,
  caption = "Invoice history",
}: {
  invoices: InvoiceRecord[];
  caption?: string;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.invoiceTable} role="table">
        <caption>{caption}</caption>
        <thead role="rowgroup">
          <tr role="row">
            {["Invoice", "Project", "Dates", "Amount", "Status"].map((h) => (
              <th scope="col" role="columnheader" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {invoices.map((invoice) => (
            <tr role="row" key={invoice.id}>
              <td role="cell" data-label="Invoice">
                <div>
                  <strong>{invoice.number}</strong>
                  {invoice.notes ? <p>{invoice.notes}</p> : null}
                </div>
              </td>
              <td role="cell" data-label="Project">
                <div>
                  {invoice.project ? (
                    <>
                      <strong>{invoice.project.code}</strong>
                      <p>{invoice.project.title}</p>
                    </>
                  ) : (
                    <p>No linked project</p>
                  )}
                </div>
              </td>
              <td role="cell" data-label="Dates">
                <div>
                  <span>Issued {dateLabel(invoice.issuedAt)}</span>
                  {invoice.dueDate ? (
                    <p>Due {dateLabel(invoice.dueDate)}</p>
                  ) : null}
                  {invoice.paidAt ? (
                    <p>Paid {dateLabel(invoice.paidAt)}</p>
                  ) : null}
                </div>
              </td>
              <td role="cell" data-label="Amount">
                <div className={styles.amount}>
                  <strong>{money(invoice.amount, invoice.currency)}</strong>
                  <p>{invoice.currency}</p>
                </div>
              </td>
              <td role="cell" data-label="Status">
                <PortalStatus status={invoice.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
