import { requireAdminPage } from "@/lib/permissions";
import { Pagination } from "@/components/admin/pagination";
import { parseAdminPage, adminPageUrl, type PageSearch } from "@/lib/admin-pagination";
import type { Metadata } from "next";
import { fmtISTFull } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { PageHeader, Chip, EmptyState } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string } & PageSearch>;
}) {
  await requireAdminPage("/admin/audit");
  const sp = await searchParams;

  if (!prisma) {
    return (
      <>
        <PageHeader title="Audit log" />
        <p className="t-sm text-muted">Database not configured, set DATABASE_URL.</p>
      </>
    );
  }

  const q = (sp.q ?? "").trim().slice(0, 60);

  const where = q
    ? {
        OR: [
          { action: { contains: q, mode: "insensitive" as const } },
          { entity: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const total = await prisma.auditLog.count({ where });
  const paging = parseAdminPage(sp, total);
  const [entries, users] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: paging.take,
      skip: paging.skip,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        meta: true,
        createdAt: true,
        userId: true,
      },
    }),
    prisma.adminUser.findMany({ select: { id: true, name: true } }),
  ]);

  const userName = (id: string | null) => users.find((u) => u.id === id)?.name ?? "system";

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Append-only trail of every panel action - who did what, when. Logins included; nothing here is editable."
      />

      <form action="/admin/audit" method="get" className="mb-6 flex max-w-md items-center gap-2">
        <input type="hidden" name="pageSize" value={paging.pageSize} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={60}
          placeholder="Filter by action or entity, e.g. enquiry. or content."
          aria-label="Filter audit log"
          className="adm-input"
        />
        <button
          type="submit"
          className="inline-flex h-[38px] shrink-0 items-center rounded-lg border border-border px-3.5 text-[0.8125rem] font-semibold text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Filter
        </button>
      </form>

      {entries.length === 0 ? (
        <EmptyState
          title="No matching entries"
          message={q ? `Nothing matches “${q}”.` : "Actions in the panel are recorded here the moment they happen."}
        />
      ) : (
        <div className="adm-card overflow-hidden">
          <table className="adm-hairline-table w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className=" w-44 px-4 py-3">When</th>
                <th scope="col" className=" px-4 py-3">User</th>
                <th scope="col" className=" px-4 py-3">Action</th>
                <th scope="col" className=" hidden px-4 py-3 md:table-cell">Entity</th>
                <th scope="col" className=" hidden px-4 py-3 lg:table-cell">Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="tnum px-4 py-2.5 font-mono text-[0.6875rem] text-muted">
                    {fmtISTFull(e.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 text-[0.8125rem] font-semibold text-foreground">
                    {userName(e.userId)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Chip tone={e.action.startsWith("auth.") ? "muted" : "default"}>{e.action}</Chip>
                  </td>
                  <td className="hidden px-4 py-2.5 font-mono text-[0.6875rem] text-muted md:table-cell">
                    {e.entity ? `${e.entity}${e.entityId ? ` · ${e.entityId.slice(0, 14)}` : ""}` : "-"}
                  </td>
                  <td className="hidden max-w-xs px-4 py-2.5 lg:table-cell">
                    <span className="t-caption block truncate text-muted">
                      {e.meta ? JSON.stringify(e.meta) : "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination {...paging} total={total} href={(page, size) => adminPageUrl("/admin/audit", sp, page, size)} label="audit entries" />
    </>
  );
}
