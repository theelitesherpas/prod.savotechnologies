import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { leaveSummary, fmtDate, EMPLOYEE_STATUS_META } from "@/lib/employees";
import { employeeLogoutAction } from "../actions";
import { EmployeeSignOut } from "../sign-out";
import { employeeAccessAllowed } from "@/lib/employee-access";
import {
  EmptyState,
  PortalIcon,
  PortalStatus,
} from "@/components/portal/workspace-ui";
import styles from "@/components/portal/portal.module.css";

export const metadata: Metadata = {
  title: "My Dashboard · Employee Portal",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Employee-owned records only. The original session/access/author gates stay
 * independent of the visual redesign; no new HR mutation capabilities. */
export default async function EmployeeDashboard() {
  const jar = await cookies();
  const token = jar.get("savo_employee")?.value;
  if (!token || !prisma) redirect("/employee-portal");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const session = await prisma.employeeSession.findUnique({
    where: { tokenHash },
    include: {
      employee: {
        include: {
          leaves: { orderBy: { fromDate: "desc" } },
          panelUsers: { take: 1, select: { id: true } },
        },
      },
    },
  });
  if (
    !session ||
    session.expiresAt <= new Date() ||
    !employeeAccessAllowed(session.employee) ||
    session.employee.panelUsers.length === 0
  )
    redirect("/employee-portal");
  const employee = session.employee;
  const lv = leaveSummary(employee, employee.leaves);
  const meta =
    EMPLOYEE_STATUS_META[employee.status] ?? EMPLOYEE_STATUS_META.active;
  const authored = await prisma.contentItem.findMany({
    where: { authorId: employee.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, collection: true, title: true, contentStatus: true },
  });
  return (
    <div className={styles.theme}>
      <div className={styles.content}>
        <div className={styles.employeeHeader}>
          <div>
            <span className={styles.code}>{employee.employeeCode}</span>
            <span
              className={`${styles.chip} ${meta.tone === "success" ? styles.success : meta.tone === "warning" ? styles.attention : styles.neutral}`}
            >
              {meta.label}
            </span>
          </div>
          <EmployeeSignOut action={employeeLogoutAction} />
        </div>
        <header className={`${styles.pageHeader} ${styles.workspaceHero}`}>
          <div>
            <h1>Welcome back, {employee.name.trim().split(/\s+/)[0]}.</h1>
            <p>
              {employee.name} · {employee.position} · {employee.department}
            </p>
          </div>
          <a
            href="mailto:hr@savotechnologies.com"
            className={styles.workspaceAction}
          >
            Contact HR <PortalIcon name="arrow" />
          </a>
        </header>
        <dl className={styles.metrics}>
          {[
            ["Leave balance", lv.balance, "Days available"],
            ["Credited", lv.credited, "Total leave credited"],
            ["Taken", lv.approvedDays, "Approved leave days"],
            ["Authored", authored.length, "Your content records"],
          ].map(([label, value, hint]) => (
            <div className={styles.metric} key={String(label)}>
              <dt>{label}</dt>
              <dd>
                {value}
                <p>{hint}</p>
              </dd>
            </div>
          ))}
        </dl>
        <div className={`${styles.projectDetailGrid} ${styles.employeeGrid}`}>
          <section
            className={styles.panel}
            aria-labelledby="employee-employment"
          >
            <div className={styles.sectionHead}>
              <h2 id="employee-employment">Your employment</h2>
            </div>
            <dl className={styles.employeeFacts}>
              {[
                ["Joining date", fmtDate(employee.joiningDate)],
                ["Probation ends", fmtDate(employee.probationEnds)],
                ["Increment date", fmtDate(employee.incrementDate)],
                ["Bond expiry", fmtDate(employee.bondExpiry)],
                ["Reporting to", employee.manager ?? "Not provided"],
                ["CTC", employee.ctc ?? "Not provided"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className={styles.panel} aria-labelledby="employee-leaves">
            <div className={styles.sectionHead}>
              <h2 id="employee-leaves">Leave history</h2>
            </div>
            {employee.leaves.length ? (
              <ul className={styles.paymentList}>
                {employee.leaves.slice(0, 8).map((leave) => (
                  <li key={leave.id}>
                    <div>
                      <strong>{leave.type.replaceAll("_", " ")}</strong>
                      <p>
                        {leave.days} days from {fmtDate(leave.fromDate)}
                      </p>
                    </div>
                    <PortalStatus status={leave.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No leave records yet." icon="clock">
                Your recorded leave and approval status will appear here.
              </EmptyState>
            )}
          </section>
        </div>
        <section
          className={`${styles.section} ${styles.panel}`}
          aria-labelledby="employee-content"
        >
          <div className={styles.sectionHead}>
            <h2 id="employee-content">Your authored content</h2>
          </div>
          {authored.length ? (
            <ul className={styles.paymentList}>
              {authored.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.collection.replaceAll("-", " ")}</p>
                  </div>
                  <PortalStatus status={item.contentStatus} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing authored yet." icon="message">
              Content attributed to your employee profile will appear here.
            </EmptyState>
          )}
        </section>
        {employee.panelUsers.length > 0 ? (
          <div className={styles.helpStrip}>
            <p>
              Looking for your administrative tools? The admin console uses its
              own access permissions.
            </p>
            <a href="/admin" className={styles.textLink}>
              Open admin console <PortalIcon name="arrow" />
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
