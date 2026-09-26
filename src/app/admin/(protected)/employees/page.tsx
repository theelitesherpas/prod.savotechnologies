import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, StatTile, Chip } from "@/components/admin/ui";
import { leaveSummary, EMPLOYEE_STATUS_META, fmtDate } from "@/lib/employees";

export const metadata: Metadata = { title: "Employee portal" };
export const dynamic = "force-dynamic";

/** Employee portal — dashboard: workforce stats, pending leaves, roster. */
export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; e?: string; deleted?: string; created?: string }>;
}) {
  const { q, status, e, deleted } = await searchParams;
  if (!prisma) {
    return (
      <div className="max-w-6xl">
        <PageHeader title="Employee portal" description="Employee records, lifecycle and leave management." />
        <Notice kind="alert">Database unavailable.</Notice>
      </div>
    );
  }

  const employees = await prisma.employee.findMany({
    include: { leaves: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const search = (q ?? "").toLowerCase().trim();
  const filtered = employees.filter((emp) => {
    const matchesQ =
      !search ||
      emp.name.toLowerCase().includes(search) ||
      emp.email.toLowerCase().includes(search) ||
      emp.employeeCode.toLowerCase().includes(search) ||
      emp.position.toLowerCase().includes(search) ||
      emp.department.toLowerCase().includes(search);
    const matchesS = !status || emp.status === status;
    return matchesQ && matchesS;
  });

  const active = employees.filter((em) => ["active", "probation", "notice"].includes(em.status)).length;
  const onProbation = employees.filter((em) => em.status === "probation").length;
  const joining = employees.filter((em) => em.status === "joining").length;
  const pendingLeaves = employees.flatMap((em) =>
    em.leaves.filter((l) => l.status === "pending").map((l) => ({ ...l, employee: em })),
  );

  const departments = [...new Set(employees.map((em) => em.department))].sort();

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Employee portal"
        description="Employee records, lifecycle and leave management — one record per employee, keyed by employee ID."
      />
      {deleted ? <Notice>Employee record deleted.</Notice> : null}
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}

      {/* Stat tiles */}
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatTile label="Total employees" value={employees.length} icon="crew" href="/admin/employees" />
        <StatTile label="On roll" value={active} icon="user" hint="Active + probation + notice" />
        <StatTile label="Probation" value={onProbation} icon="gauge" href="/admin/employees?status=probation" />
        <StatTile label="Joining soon" value={joining} icon="sun" href="/admin/employees?status=joining" />
        <StatTile
          label="Pending leave requests"
          value={pendingLeaves.length}
          icon="alert"
          accent={pendingLeaves.length > 0}
          hint={pendingLeaves.length ? "Awaiting decision" : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending leaves */}
        <section className="lg:col-span-1">
          <h2 className="adm-label mb-3">Leave requests awaiting decision</h2>
          <div className="adm-card overflow-hidden">
            {pendingLeaves.length === 0 ? (
              <p className="t-sm p-5 text-muted">No pending requests. Approvals and rejections email the employee automatically.</p>
            ) : (
              <ul className="divide-y divide-border">
                {pendingLeaves.slice(0, 6).map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/admin/employees/${l.employee.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.03]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.875rem] font-semibold text-foreground">
                          {l.employee.name}
                        </span>
                        <span className="t-caption block text-muted">
                          {l.type} · {l.days} day{l.days === 1 ? "" : "s"} · from {fmtDate(l.fromDate)}
                        </span>
                      </span>
                      <span className="tnum font-mono text-[0.6875rem] text-muted">{l.employee.employeeCode}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Departments */}
          <h2 className="adm-label mb-3 mt-6">Departments</h2>
          <div className="adm-card p-4">
            {departments.length === 0 ? (
              <p className="t-sm text-muted">Departments appear as employees are added.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => {
                  const n = employees.filter((em) => em.department === dept).length;
                  return (
                    <Link key={dept} href={`/admin/employees?q=${encodeURIComponent(dept)}`} className="transition-transform hover:-translate-y-px">
                      <Chip>{dept} · {n}</Chip>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Roster */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <form action="/admin/employees" method="get" className="flex min-w-0 flex-1 gap-2">
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search name, ID (STPL…), position, department…"
                className="adm-input h-10 min-w-0 flex-1"
                aria-label="Search employees"
              />
              {status ? <input type="hidden" name="status" value={status} /> : null}
              <button type="submit" className="btn-ghost h-10 rounded-lg border border-border px-4 text-[0.8125rem] font-semibold text-muted hover:border-foreground/40 hover:text-foreground">
                Search
              </button>
            </form>
            <Link
              href="/admin/employees/new"
              className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-[0.8125rem] font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              + New employee
            </Link>
          </div>

          <div className="adm-card overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-6 text-center">
                <p className="t-sm text-muted">
                  {employees.length === 0
                    ? "No employees yet — create the first record and the welcome email with their employee ID goes out automatically."
                    : "No employees match this search."}
                </p>
              </div>
            ) : (
              <table className="adm-hairline-table w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2.5 text-left font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted">Employee ID</th>
                    <th className="px-4 py-2.5 text-left text-[0.75rem] font-semibold text-muted">Name</th>
                    <th className="hidden px-4 py-2.5 text-left text-[0.75rem] font-semibold text-muted sm:table-cell">Position</th>
                    <th className="hidden px-4 py-2.5 text-left text-[0.75rem] font-semibold text-muted lg:table-cell">Dept</th>
                    <th className="px-4 py-2.5 text-right text-[0.75rem] font-semibold text-muted">Leaves</th>
                    <th className="px-4 py-2.5 text-right text-[0.75rem] font-semibold text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((emp) => {
                    const lv = leaveSummary(emp, emp.leaves);
                    const meta = EMPLOYEE_STATUS_META[emp.status] ?? EMPLOYEE_STATUS_META.active;
                    return (
                      <tr key={emp.id} className="cursor-pointer transition-colors hover:bg-foreground/[0.03]">
                        <td className="px-4 py-3">
                          <Link href={`/admin/employees/${emp.id}`} className="tnum font-mono text-[0.75rem] font-semibold text-accent">
                            {emp.employeeCode}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/employees/${emp.id}`} className="block max-w-[16rem] truncate text-[0.875rem] font-semibold text-foreground">
                            {emp.name}
                          </Link>
                          <span className="t-caption block max-w-[16rem] truncate text-muted">{emp.email}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-[0.8125rem] text-foreground/80 sm:table-cell">{emp.position}</td>
                        <td className="hidden px-4 py-3 text-[0.8125rem] text-foreground/80 lg:table-cell">{emp.department}</td>
                        <td className="tnum px-4 py-3 text-right font-mono text-[0.8125rem] text-foreground">{lv.balance}</td>
                        <td className="px-4 py-3 text-right">
                          <Chip tone={meta.tone}>{meta.label}</Chip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <p className="t-caption mt-2 text-muted">
            Leave balance = months of service credited − approved days. One leave per completed month, unused months carry forward automatically.
          </p>
        </section>
      </div>
    </div>
  );
}
