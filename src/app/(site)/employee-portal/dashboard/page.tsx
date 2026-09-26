import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { leaveSummary, fmtDate, EMPLOYEE_STATUS_META } from "@/lib/employees";
import { employeeLogoutAction } from "../actions";
import { EmployeeSignOut } from "../sign-out";

export const metadata: Metadata = {
  title: "My Dashboard · Employee Portal",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Employee dashboard - their record, leave, authored content and admin extras. */
export default async function EmployeeDashboard() {
  const jar = await cookies();
  const token = jar.get("savo_employee")?.value;
  if (!token || !prisma) redirect("/employee-portal");

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const session = await prisma.employeeSession.findUnique({
    where: { tokenHash },
    include: {
      employee: { include: { leaves: { orderBy: { fromDate: "desc" } }, panelUsers: { take: 1, select: { id: true } } } },
    },
  });
  if (!session || session.expiresAt < new Date()) redirect("/employee-portal");
  const employee = session.employee;
  const lv = leaveSummary(employee, employee.leaves);
  const meta = EMPLOYEE_STATUS_META[employee.status] ?? EMPLOYEE_STATUS_META.active;

  const authored = await prisma.contentItem.findMany({
    where: { authorId: employee.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, collection: true, title: true, contentStatus: true },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.75rem] tracking-[0.1em] text-muted">{employee.employeeCode}</p>
          <h1 className="t-h2 mt-1 text-ink">{employee.name}</h1>
          <p className="t-body mt-1 text-muted">{employee.position} - {employee.department}</p>
        </div>
        <span className={`rounded-md border px-3 py-1 text-[0.75rem] font-bold uppercase tracking-wide ${meta.tone === "success" ? "border-green-600/30 bg-green-50 text-green-700" : meta.tone === "warning" ? "border-amber-500/30 bg-amber-50 text-amber-700" : "border-border bg-surface-2 text-muted"}`}>
          {meta.label}
        </span>
        <EmployeeSignOut action={employeeLogoutAction} />
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Leave balance", lv.balance],
          ["Credited", lv.credited],
          ["Taken", lv.approvedDays],
          ["Authored", authored.length],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-lg border border-border bg-white p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-[0.75rem] font-semibold text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Employment */}
        <section className="rounded-lg border border-border bg-white p-5">
          <h2 className="mb-4 text-[0.875rem] font-bold tracking-tight text-foreground">Employment</h2>
          <dl className="space-y-2 text-[0.8125rem]">
            {[
              ["Joining date", fmtDate(employee.joiningDate)],
              ["Probation ends", fmtDate(employee.probationEnds)],
              ["Increment date", fmtDate(employee.incrementDate)],
              ["Bond expiry", fmtDate(employee.bondExpiry)],
              ["Reporting to", employee.manager ?? "-"],
              ["CTC", employee.ctc ?? "-"],
            ].map((pair) => (
              <div key={String(pair[0])} className="flex justify-between gap-3 border-b border-border/50 pb-1.5">
                <dt className="text-muted">{pair[0]}</dt>
                <dd className="font-semibold text-foreground">{pair[1]}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Recent leaves */}
        <section className="rounded-lg border border-border bg-white p-5">
          <h2 className="mb-4 text-[0.875rem] font-bold tracking-tight text-foreground">Leave history</h2>
          {employee.leaves.length === 0 ? (
            <p className="text-sm text-muted">No records.</p>
          ) : (
            <ul className="space-y-2 text-[0.8125rem]">
              {employee.leaves.slice(0, 8).map((l: { id: string; type: string; days: number; fromDate: Date; status: string }) => (
                <li key={l.id} className="flex items-center justify-between gap-2">
                  <span>
                    <strong className="capitalize">{l.type}</strong> - {l.days}d from {fmtDate(l.fromDate)}
                  </span>
                  <span className={`text-[0.6875rem] font-bold uppercase ${l.status === "approved" ? "text-green-600" : l.status === "rejected" ? "text-red-500" : "text-muted"}`}>
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Authored content */}
        {authored.length > 0 ? (
          <section className="rounded-lg border border-border bg-white p-5 lg:col-span-2">
            <h2 className="mb-4 text-[0.875rem] font-bold tracking-tight text-foreground">My content</h2>
            <ul className="space-y-2 text-[0.8125rem]">
              {authored.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{item.title}</span>
                  <span className="text-muted">{item.collection.replace("-", " ")}</span>
                  <span className={`text-[0.6875rem] font-bold uppercase ${item.contentStatus === "published" ? "text-green-600" : "text-amber-500"}`}>
                    {item.contentStatus}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* Admin access shortcut */}
      {employee.panelUsers.length > 0 ? (
        <div className="mt-8 rounded-lg border border-accent/30 bg-accent/[0.04] p-5 text-center">
          <p className="text-[0.875rem] font-semibold text-foreground">
            You have admin panel access
          </p>
          <a
            href="/admin"
            className="mt-2 inline-flex h-10 items-center rounded-lg bg-accent px-5 text-[0.8125rem] font-bold text-white transition-colors hover:bg-accent-hover"
          >
            Open Admin Console
          </a>
        </div>
      ) : null}
    </main>
  );
}
