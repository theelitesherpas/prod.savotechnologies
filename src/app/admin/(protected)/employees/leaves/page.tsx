import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, StatTile, Chip } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { decideLeaveAction } from "../actions";
import { leaveSummary, fmtDate } from "@/lib/employees";

export const metadata: Metadata = { title: "Leave management" };
export const dynamic = "force-dynamic";

/** Leave management - every request across the workforce, balances at a glance. */
export default async function LeaveManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; leave?: string }>;
}) {
  const { e } = await searchParams;
  if (!prisma) {
    return (
      <div className="max-w-6xl">
        <PageHeader title="Leave management" />
        <Notice kind="alert">Database unavailable.</Notice>
      </div>
    );
  }

  const employees = await prisma.employee.findMany({
    include: { leaves: { orderBy: { fromDate: "desc" } } },
    orderBy: { name: "asc" },
  });

  const all = employees.flatMap((emp) => emp.leaves.map((l) => ({ ...l, employee: emp })));
  const pending = all.filter((l) => l.status === "pending").sort((a, b) => a.fromDate.getTime() - b.fromDate.getTime());
  const decided = all.filter((l) => l.status !== "pending").sort((a, b) => b.fromDate.getTime() - a.fromDate.getTime());
  const onLeaveToday = all.filter(
    (l) => l.status === "approved" && l.fromDate <= new Date() && l.toDate >= new Date(),
  );
  const totalApprovedDays = all.filter((l) => l.status === "approved").reduce((s, l) => s + l.days, 0);

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Leave management"
        description="Requests across the workforce - approvals email employees automatically and adjust balances in real time."
      />
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Pending requests" value={pending.length} icon="alert" accent={pending.length > 0} />
        <StatTile label="On leave today" value={onLeaveToday.length} icon="sun" />
        <StatTile label="Approved days (all time)" value={Math.round(totalApprovedDays)} icon="check" />
        <StatTile label="Employees" value={employees.length} icon="crew" href="/admin/employees" />
      </div>

      {/* Pending decisions */}
      <section className="mb-8">
        <h2 className="adm-label mb-3">Awaiting decision</h2>
        <div className="adm-card overflow-hidden">
          {pending.length === 0 ? (
            <p className="t-sm p-5 text-muted">No pending requests.</p>
          ) : (
            <ul className="divide-y divide-border">
              {pending.map((l) => {
                const bal = leaveSummary(l.employee, l.employee.leaves);
                return (
                  <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <Link href={`/admin/employees/${l.employee.id}`} className="block truncate text-[0.875rem] font-semibold text-foreground hover:text-accent">
                        {l.employee.name}
                        <span className="tnum ml-2 font-mono text-[0.6875rem] text-muted">{l.employee.employeeCode}</span>
                      </Link>
                      <span className="t-caption block text-muted">
                        {l.type} · {l.days} day{l.days === 1 ? "" : "s"} · {fmtDate(l.fromDate)} → {fmtDate(l.toDate)}
                        {l.reason ? ` · ${l.reason}` : ""}
                      </span>
                    </span>
                    <Chip tone="muted">Balance {bal.balance}</Chip>
                    <form action={decideLeaveAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <SubmitButton label="Approve" compact />
                    </form>
                    <form action={decideLeaveAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <SubmitButton label="Decline" compact />
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Decided history */}
      <section className="mb-8">
        <h2 className="adm-label mb-3">History</h2>
        <div className="adm-card overflow-x-auto">
          {decided.length === 0 ? (
            <p className="t-sm p-5 text-muted">No decided requests yet.</p>
          ) : (
            <table className="adm-hairline-table w-full min-w-[42rem]">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 text-left text-[0.75rem] font-semibold text-muted">Employee</th>
                  <th className="px-4 py-2.5 text-left text-[0.75rem] font-semibold text-muted">Type</th>
                  <th className="px-4 py-2.5 text-left text-[0.75rem] font-semibold text-muted">Period</th>
                  <th className="px-4 py-2.5 text-right text-[0.75rem] font-semibold text-muted">Days</th>
                  <th className="px-4 py-2.5 text-right text-[0.75rem] font-semibold text-muted">Status</th>
                  <th className="px-4 py-2.5 text-right text-[0.75rem] font-semibold text-muted">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {decided.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/employees/${l.employee.id}`} className="text-[0.8125rem] font-semibold text-foreground hover:text-accent">
                        {l.employee.name}
                      </Link>
                      <span className="tnum block font-mono text-[0.6875rem] text-muted">{l.employee.employeeCode}</span>
                    </td>
                    <td className="px-4 py-3 text-[0.8125rem] capitalize">{l.type}</td>
                    <td className="px-4 py-3 text-[0.8125rem] text-muted">
                      {fmtDate(l.fromDate)} → {fmtDate(l.toDate)}
                    </td>
                    <td className="tnum px-4 py-3 text-right font-mono text-[0.8125rem]">{l.days}</td>
                    <td className="px-4 py-3 text-right">
                      <Chip tone={l.status === "approved" ? "success" : "warning"}>{l.status}</Chip>
                    </td>
                    <td className="px-4 py-3 text-right text-[0.8125rem] text-muted">{l.actedBy ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Balances */}
      <section>
        <h2 className="adm-label mb-3">Balances</h2>
        <div className="adm-card overflow-x-auto">
          {employees.length === 0 ? (
            <p className="t-sm p-5 text-muted">No employees yet.</p>
          ) : (
            <table className="adm-hairline-table w-full min-w-[36rem]">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 text-left text-[0.75rem] font-semibold text-muted">Employee</th>
                  <th className="px-4 py-2.5 text-right text-[0.75rem] font-semibold text-muted">Credited</th>
                  <th className="px-4 py-2.5 text-right text-[0.75rem] font-semibold text-muted">Taken</th>
                  <th className="px-4 py-2.5 text-right text-[0.75rem] font-semibold text-muted">Pending</th>
                  <th className="px-4 py-2.5 text-right text-[0.75rem] font-semibold text-muted">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((emp) => {
                  const lv = leaveSummary(emp, emp.leaves);
                  return (
                    <tr key={emp.id}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/employees/${emp.id}`} className="text-[0.8125rem] font-semibold text-foreground hover:text-accent">
                          {emp.name}
                        </Link>
                        <span className="tnum block font-mono text-[0.6875rem] text-muted">{emp.employeeCode}</span>
                      </td>
                      <td className="tnum px-4 py-3 text-right font-mono text-[0.8125rem]">{lv.credited}</td>
                      <td className="tnum px-4 py-3 text-right font-mono text-[0.8125rem]">{lv.approvedDays}</td>
                      <td className="tnum px-4 py-3 text-right font-mono text-[0.8125rem]">{lv.pendingDays}</td>
                      <td className="tnum px-4 py-3 text-right font-mono text-[0.8125rem] font-bold text-accent">{lv.balance}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
