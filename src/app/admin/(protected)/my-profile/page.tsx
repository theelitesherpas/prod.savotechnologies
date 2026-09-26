import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leaveSummary, fmtDate, EMPLOYEE_STATUS_META } from "@/lib/employees";
import { PageHeader, Notice, Chip, StatTile } from "@/components/admin/ui";
import Link from "next/link";

export const metadata = Metadata();
function Metadata() {
  return { title: "My profile" };
}
export const dynamic = "force-dynamic";

/** Employee self-service — their own record, leave balance, authored content.
 *  Linked via AdminUser.employeeId; unlinked users see a notice instead. */
export default async function MyProfilePage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  if (!prisma) {
    return (
      <div className="max-w-4xl">
        <PageHeader title="My profile" />
        <Notice kind="alert">Database unavailable.</Notice>
      </div>
    );
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { id: user.id },
    include: {
      employee: { include: { leaves: { orderBy: { fromDate: "desc" } } } },
    },
  });

  const employee = adminUser?.employee;
  if (!employee) {
    return (
      <div className="max-w-4xl">
        <PageHeader
          title="My profile"
          description="Your panel account is not linked to an employee record yet."
        />
        <Notice>
          Ask an administrator to link your panel account to your employee ID from
          <strong> Configuration → Panel users</strong>. Once linked, your joining details,
          leave balance, bond expiry and authored content appear here.
        </Notice>
      </div>
    );
  }

  const lv = leaveSummary(employee, employee.leaves);
  const meta = EMPLOYEE_STATUS_META[employee.status] ?? EMPLOYEE_STATUS_META.active;
  const authored = await prisma.contentItem.findMany({
    where: { authorId: employee.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, collection: true, title: true, slug: true, contentStatus: true, active: true, updatedAt: true },
  });

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; tone: string }> = {
      published: { label: "Published", tone: "success" },
      verified: { label: "Verified", tone: "success" },
      review: { label: "Awaiting approval", tone: "warning" },
      demo: { label: "Demo", tone: "default" },
      draft: { label: "Draft", tone: "muted" },
    };
    return map[s] ?? { label: s, tone: "muted" };
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`Hello, ${employee.name.split(" ")[0]}`}
        description={`Your employee record, leave balance and authored content — ${employee.employeeCode}.`}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Leave balance" value={lv.balance} icon="sun" hint={`${lv.credited} credited · ${lv.approvedDays} taken`} />
        <StatTile label="Status" value={meta.label} icon="user" />
        <StatTile label="Authored items" value={authored.length} icon="pen" hint="Case studies + insights" />
        <StatTile label="Awaiting approval" value={authored.filter((a) => a.contentStatus === "review").length} icon="alert" accent={authored.some((a) => a.contentStatus === "review")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Employment details */}
        <section className="adm-card p-5">
          <h2 className="adm-label mb-4">Employment details</h2>
          <dl className="space-y-2.5 text-[0.8125rem]">
            {[
              ["Employee ID", employee.employeeCode],
              ["Position", employee.position],
              ["Department", employee.department],
              ["Joining date", fmtDate(employee.joiningDate)],
              ["Probation ends", fmtDate(employee.probationEnds)],
              ["Increment date", fmtDate(employee.incrementDate)],
              ["Bond expiry", fmtDate(employee.bondExpiry)],
              ["Reporting to", employee.manager ?? "—"],
              ["CTC", employee.ctc ?? "—"],
              ["Location", employee.location ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2 last:border-0">
                <dt className="t-caption shrink-0 text-muted">{k}</dt>
                <dd className="min-w-0 truncate text-right font-semibold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Leave ledger */}
        <section className="adm-card p-5">
          <h2 className="adm-label mb-4">Leave history</h2>
          {employee.leaves.length === 0 ? (
            <p className="t-sm text-muted">No leave records yet.</p>
          ) : (
            <ul className="space-y-2">
              {employee.leaves.slice(0, 10).map((l) => (
                <li key={l.id} className="flex items-center gap-3 text-[0.8125rem]">
                  <span className="min-w-0 flex-1">
                    <strong className="capitalize">{l.type}</strong> · {l.days}d · {fmtDate(l.fromDate)}
                  </span>
                  <Chip tone={l.status === "approved" ? "success" : l.status === "rejected" ? "warning" : "muted"}>
                    {l.status}
                  </Chip>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Authored content */}
        <section className="adm-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="adm-label">My authored content</h2>
            <Link href="/admin/content" className="t-caption font-semibold text-accent hover:underline">
              Create new →
            </Link>
          </div>
          {authored.length === 0 ? (
            <p className="t-sm text-muted">
              No authored content yet. Case studies and insights you create appear here with their approval status.
            </p>
          ) : (
            <table className="adm-hairline-table w-full">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left text-[0.75rem] font-semibold text-muted">Title</th>
                  <th className="px-2 py-2 text-left text-[0.75rem] font-semibold text-muted">Type</th>
                  <th className="px-2 py-2 text-right text-[0.75rem] font-semibold text-muted">Status</th>
                  <th className="hidden px-2 py-2 text-right text-[0.75rem] font-semibold text-muted sm:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {authored.map((item) => {
                  const st = statusLabel(item.contentStatus);
                  return (
                    <tr key={item.id}>
                      <td className="px-2 py-2.5">
                        <Link
                          href={item.collection === "case-studies" ? `/admin/case-studies` : `/admin/content/${item.collection}`}
                          className="text-[0.8125rem] font-semibold text-foreground hover:text-accent"
                        >
                          {item.title}
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 text-[0.75rem] capitalize text-muted">
                        {item.collection.replace("-", " ")}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <Chip tone={st.tone as "success" | "warning" | "muted" | "default"}>{st.label}</Chip>
                      </td>
                      <td className="hidden px-2 py-2.5 text-right text-[0.75rem] text-muted sm:table-cell">
                        {item.updatedAt.toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
