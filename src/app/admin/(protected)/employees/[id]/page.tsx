import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, Chip } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { SubmitButton } from "@/components/admin/form";
import { updateEmployeeAction, addLeaveAction, decideLeaveAction, deleteEmployeeAction } from "../actions";
import { leaveSummary, EMPLOYEE_STATUS_META, LEAVE_TYPES, fmtDate } from "@/lib/employees";

export const metadata: Metadata = { title: "Employee record" };
export const dynamic = "force-dynamic";

/** Employee record — profile, lifecycle, leave ledger, quick HR emails. */
export default async function EmployeeRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string; e?: string; leave?: string }>;
}) {
  const { id } = await params;
  const { created, saved, e, leave } = await searchParams;
  if (!prisma) notFound();
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { leaves: { orderBy: { fromDate: "desc" } } },
  });
  if (!employee) notFound();

  const lv = leaveSummary(employee, employee.leaves);
  const meta = EMPLOYEE_STATUS_META[employee.status] ?? EMPLOYEE_STATUS_META.active;
  const pending = employee.leaves.filter((l) => l.status === "pending");
  const history = employee.leaves.filter((l) => l.status !== "pending");
  const value = (v: string | null) => v ?? "";

  return (
    <div className="max-w-5xl">
      <Link href="/admin/employees" className="t-caption font-semibold text-accent hover:underline">
        ← Employee portal
      </Link>
      <PageHeader
        title={`${employee.name}`}
        description={`${employee.employeeCode} · ${employee.position} · ${employee.department}`}
      />
      {created ? <Notice>Employee created. The welcome email with their employee ID has been sent.</Notice> : null}
      {saved ? <Notice>Record updated.</Notice> : null}
      {leave === "added" ? <Notice>Leave request recorded.</Notice> : null}
      {leave === "approved" ? <Notice>Leave approved — balance updated, email sent.</Notice> : null}
      {leave === "rejected" ? <Notice>Leave declined — email sent.</Notice> : null}
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: profile + ledger */}
        <div className="space-y-6 lg:col-span-2">
          {/* Leave ledger */}
          <section className="adm-card p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="adm-label">Leave ledger</h2>
              <Chip tone="success">Balance {lv.balance}</Chip>
              <Chip tone="muted">Credited {lv.credited}</Chip>
              <Chip tone="muted">Taken {lv.approvedDays}</Chip>
              {lv.pendingDays > 0 ? <Chip tone="warning">Pending {lv.pendingDays}</Chip> : null}
              <span className="t-caption ml-auto text-muted">1 leave / completed month · unused carry forward</span>
            </div>

            {/* Record a leave */}
            <FormGuard action={addLeaveAction} className="grid gap-3 border-b border-border pb-4 sm:grid-cols-[9rem_9rem_9rem_1fr_auto] sm:items-end">
              <input type="hidden" name="employeeId" value={employee.id} />
              <div>
                <label htmlFor="lv-type" className="adm-label mb-1 block">Type</label>
                <select id="lv-type" name="type" className="adm-select" defaultValue="privilege">
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="lv-from" className="adm-label mb-1 block">From *</label>
                <input id="lv-from" name="fromDate" type="date" required className="adm-input" />
              </div>
              <div>
                <label htmlFor="lv-to" className="adm-label mb-1 block">To *</label>
                <input id="lv-to" name="toDate" type="date" required className="adm-input" />
              </div>
              <div>
                <label htmlFor="lv-reason" className="adm-label mb-1 block">Reason</label>
                <input id="lv-reason" name="reason" maxLength={500} className="adm-input" placeholder="Optional" />
              </div>
              <SubmitButton label="Record" compact />
            </FormGuard>

            {/* Pending decisions */}
            {pending.length > 0 ? (
              <div className="pt-4">
                <p className="adm-label mb-2">Awaiting decision</p>
                <ul className="space-y-2">
                  {pending.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-accent/30 bg-accent/[0.04] px-3.5 py-2.5">
                      <span className="min-w-0 flex-1 text-[0.8125rem]">
                        <strong className="font-semibold">{l.type}</strong> · {l.days} day{l.days === 1 ? "" : "s"} ·{" "}
                        {fmtDate(l.fromDate)} → {fmtDate(l.toDate)}
                        {l.reason ? <span className="block text-muted">{l.reason}</span> : null}
                      </span>
                      <form action={decideLeaveAction}>
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
                  ))}
                </ul>
              </div>
            ) : null}

            {/* History */}
            <div className="pt-4">
              <p className="adm-label mb-2">History</p>
              {history.length === 0 ? (
                <p className="t-sm text-muted">No leave records yet.</p>
              ) : (
                <table className="adm-hairline-table w-full">
                  <thead>
                    <tr>
                      <th className="py-2 text-left text-[0.75rem] font-semibold text-muted">Type</th>
                      <th className="py-2 text-left text-[0.75rem] font-semibold text-muted">Period</th>
                      <th className="py-2 text-right text-[0.75rem] font-semibold text-muted">Days</th>
                      <th className="py-2 text-right text-[0.75rem] font-semibold text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2.5 text-[0.8125rem] capitalize">{l.type}</td>
                        <td className="py-2.5 text-[0.8125rem] text-muted">
                          {fmtDate(l.fromDate)} → {fmtDate(l.toDate)}
                        </td>
                        <td className="tnum py-2.5 text-right font-mono text-[0.8125rem]">{l.days}</td>
                        <td className="py-2.5 text-right">
                          <Chip tone={l.status === "approved" ? "success" : l.status === "rejected" ? "warning" : "muted"}>
                            {l.status}
                          </Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Edit record */}
          <section className="adm-card p-5">
            <h2 className="adm-label mb-4">Record & lifecycle</h2>
            <FormGuard action={updateEmployeeAction} className="space-y-4">
              <input type="hidden" name="id" value={employee.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ed-code" className="adm-label mb-1.5 block">Employee ID</label>
                  <input id="ed-code" name="employeeCode" defaultValue={employee.employeeCode} pattern="STPL\d{4}[A-Z]{2}" maxLength={10} className="adm-input font-mono" />
                </div>
                <div>
                  <label htmlFor="ed-name" className="adm-label mb-1.5 block">Name</label>
                  <input id="ed-name" name="name" defaultValue={employee.name} maxLength={80} className="adm-input" />
                </div>
                <div>
                  <label htmlFor="ed-email" className="adm-label mb-1.5 block">Email</label>
                  <input id="ed-email" name="email" type="email" defaultValue={employee.email} maxLength={120} className="adm-input" />
                </div>
                <div>
                  <label htmlFor="ed-phone" className="adm-label mb-1.5 block">Phone</label>
                  <input id="ed-phone" name="phone" defaultValue={value(employee.phone)} maxLength={24} className="adm-input" />
                </div>
                <div>
                  <label htmlFor="ed-position" className="adm-label mb-1.5 block">Position</label>
                  <input id="ed-position" name="position" defaultValue={employee.position} maxLength={80} className="adm-input" />
                </div>
                <div>
                  <label htmlFor="ed-dept" className="adm-label mb-1.5 block">Department</label>
                  <input id="ed-dept" name="department" defaultValue={employee.department} maxLength={80} className="adm-input" />
                </div>
                <div>
                  <label htmlFor="ed-status" className="adm-label mb-1.5 block">Status</label>
                  <select id="ed-status" name="status" defaultValue={employee.status} className="adm-select">
                    {Object.entries(EMPLOYEE_STATUS_META).map(([k, m]) => (
                      <option key={k} value={k}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ed-joining" className="adm-label mb-1.5 block">Joining date</label>
                  <input id="ed-joining" name="joiningDate" type="date" defaultValue={employee.joiningDate.toISOString().slice(0, 10)} className="adm-input" />
                </div>
                <div>
                  <label htmlFor="ed-lwd" className="adm-label mb-1.5 block">Last working day</label>
                  <input id="ed-lwd" name="lastWorkingDay" type="date" defaultValue={employee.lastWorkingDay ? employee.lastWorkingDay.toISOString().slice(0, 10) : ""} className="adm-input" />
                </div>
                <div>
                  <label htmlFor="ed-ctc" className="adm-label mb-1.5 block">CTC</label>
                  <input id="ed-ctc" name="ctc" defaultValue={value(employee.ctc)} maxLength={60} className="adm-input" />
                </div>
                <div>
                  <label htmlFor="ed-manager" className="adm-label mb-1.5 block">Reporting to</label>
                  <input id="ed-manager" name="manager" defaultValue={value(employee.manager)} maxLength={80} className="adm-input" />
                </div>
                <div>
                  <label htmlFor="ed-location" className="adm-label mb-1.5 block">Location</label>
                  <input id="ed-location" name="location" defaultValue={value(employee.location)} maxLength={80} className="adm-input" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="ed-notes" className="adm-label mb-1.5 block">Notes</label>
                  <textarea id="ed-notes" name="notes" rows={3} defaultValue={employee.notes} maxLength={2000} className="adm-textarea" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <SubmitButton label="Save record" />
                <p className="t-caption text-muted">ID format STPL0300IN (digits + country code) · uniqueness is validated on save.</p>
              </div>
            </FormGuard>
          </section>
        </div>

        {/* Right: summary + quick actions */}
        <div className="space-y-6">
          <section className="adm-card p-5">
            <h2 className="adm-label mb-4">Profile</h2>
            <dl className="space-y-2.5 text-[0.8125rem]">
              {[
                ["Employee ID", employee.employeeCode],
                ["Status", meta.label],
                ["Joining", fmtDate(employee.joiningDate)],
                ["Probation ends", fmtDate(employee.probationEnds)],
                ["Last working day", fmtDate(employee.lastWorkingDay)],
                ["CTC", employee.ctc ?? "—"],
                ["Reports to", employee.manager ?? "—"],
                ["Location", employee.location ?? "—"],
                ["Leave balance", `${lv.balance}`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3">
                  <dt className="t-caption shrink-0 text-muted">{k}</dt>
                  <dd className="min-w-0 truncate text-right font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 border-t border-border pt-4">
              <Link
                href={`/admin/email-compose?dept=hr&employee=${employee.id}&template=offerLetter`}
                className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-accent px-4 text-[0.8125rem] font-semibold text-on-accent transition-colors hover:bg-accent-hover"
              >
                Send HR email to {employee.name.split(" ")[0]}
              </Link>
              <p className="t-caption mt-2 text-center text-muted">
                Compose opens with this employee&apos;s details pre-filled.
              </p>
            </div>
          </section>

          <section className="adm-card p-5">
            <h2 className="adm-label mb-3">Danger zone</h2>
            <p className="t-caption mb-3 text-muted">
              Deletes the record and its leave ledger. Prefer setting status to Exited to preserve history.
            </p>
            <form action={deleteEmployeeAction}>
              <input type="hidden" name="id" value={employee.id} />
              <ConfirmButton label="Delete employee" confirmLabel="Confirm delete" />
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
