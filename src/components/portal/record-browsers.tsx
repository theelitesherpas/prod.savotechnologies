"use client";

import { useId, useState } from "react";
import {
  EmptyState,
  InvoiceTable,
  ProjectCard,
  type InvoiceRecord,
  type ProjectRecord,
} from "./workspace-ui";
import styles from "./portal.module.css";

function useRecordFilter() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  return {
    query,
    setQuery,
    status,
    setStatus,
    clear: () => {
      setQuery("");
      setStatus("all");
    },
  };
}
function RecordControls({
  kind,
  filter,
  statuses,
  count,
  total,
}: {
  kind: "projects" | "invoices";
  filter: ReturnType<typeof useRecordFilter>;
  statuses: { value: string; label: string }[];
  count: number;
  total: number;
}) {
  const id = useId();
  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <label htmlFor={`${id}-search`}>Search {kind}</label>
          <input
            id={`${id}-search`}
            type="search"
            value={filter.query}
            onChange={(e) => filter.setQuery(e.target.value)}
            placeholder={
              kind === "projects"
                ? "Project name or reference"
                : "Invoice number or project"
            }
          />
        </div>
        <div className={styles.filterField}>
          <label htmlFor={`${id}-status`}>Status</label>
          <select
            id={`${id}-status`}
            value={filter.status}
            onChange={(e) => filter.setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {filter.query || filter.status !== "all" ? (
          <button type="button" className={styles.clear} onClick={filter.clear}>
            Clear filters
          </button>
        ) : null}
      </div>
      <p className={styles.resultCount} role="status">
        Showing {count} of {total} {kind}
      </p>
    </>
  );
}
export function ProjectBrowser({ projects }: { projects: ProjectRecord[] }) {
  const filter = useRecordFilter();
  const query = filter.query.trim().toLocaleLowerCase();
  const visible = projects.filter(
    (p) =>
      (filter.status === "all" || p.status === filter.status) &&
      `${p.title} ${p.code} ${p.summary ?? ""}`
        .toLocaleLowerCase()
        .includes(query),
  );
  if (!projects.length)
    return (
      <EmptyState title="Your first project starts here." contact>
        Your delivery lead will publish your project and its progress here once
        it is ready to share.
      </EmptyState>
    );
  return (
    <>
      <RecordControls
        kind="projects"
        filter={filter}
        count={visible.length}
        total={projects.length}
        statuses={[
          { value: "planning", label: "Planning" },
          { value: "in_progress", label: "In progress" },
          { value: "review", label: "In review" },
          { value: "delivered", label: "Completed" },
          { value: "paused", label: "Paused" },
          { value: "cancelled", label: "Cancelled" },
        ]}
      />
      {visible.length ? (
        <ul className={styles.projectGrid}>
          {visible.map((p) => (
            <li key={p.id}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No matching projects.">
          Try another project name or reference, or clear your filters to see
          all projects.
        </EmptyState>
      )}
    </>
  );
}
export function InvoiceBrowser({ invoices }: { invoices: InvoiceRecord[] }) {
  const filter = useRecordFilter();
  const query = filter.query.trim().toLocaleLowerCase();
  const visible = invoices.filter(
    (i) =>
      (filter.status === "all" || i.status === filter.status) &&
      `${i.number} ${i.project?.title ?? ""} ${i.project?.code ?? ""}`
        .toLocaleLowerCase()
        .includes(query),
  );
  if (!invoices.length)
    return (
      <EmptyState title="No invoices issued yet." icon="invoice">
        Published invoices will appear here with their amount, currency and
        payment status.
      </EmptyState>
    );
  return (
    <>
      <RecordControls
        kind="invoices"
        filter={filter}
        count={visible.length}
        total={invoices.length}
        statuses={[
          { value: "sent", label: "Unpaid" },
          { value: "overdue", label: "Overdue" },
          { value: "paid", label: "Paid" },
          { value: "cancelled", label: "Cancelled" },
        ]}
      />
      {visible.length ? (
        <InvoiceTable invoices={visible} />
      ) : (
        <EmptyState title="No matching invoices." icon="invoice">
          Try an invoice number or project name, or clear your filters to see
          the full history.
        </EmptyState>
      )}
    </>
  );
}
