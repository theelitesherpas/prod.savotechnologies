import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader, Chip, EmptyState } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Audit log" };

const PAGE_SIZE = 30;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
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
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where = q
    ? {
        OR: [
          { action: { contains: q, mode: "insensitive" as const } },
          { entity: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, entries, users] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
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

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const userName = (id: string | null) => users.find((u) => u.id === id)?.name ?? "system";
  const qs = (over: Record<string, string | undefined>) => {
    const merged = { q, page: String(page), ...over };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.page && merged.page !== "1") params.set("page", merged.page);
    const s = params.toString();
    return s ? `/admin/audit?${s}` : "/admin/audit";
  };

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Append-only trail of every panel action — who did what, when. Logins included; nothing here is editable."
      />

      <form action="/admin/audit" method="get" className="mb-6 flex max-w-md items-center gap-2">
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
                <th scope="col" className="adm-label w-44 px-4 py-3">When</th>
                <th scope="col" className="adm-label px-4 py-3">User</th>
                <th scope="col" className="adm-label px-4 py-3">Action</th>
                <th scope="col" className="adm-label hidden px-4 py-3 md:table-cell">Entity</th>
                <th scope="col" className="adm-label hidden px-4 py-3 lg:table-cell">Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="tnum px-4 py-2.5 font-mono text-[0.6875rem] text-muted">
                    {e.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td className="px-4 py-2.5 text-[0.8125rem] font-semibold text-foreground">
                    {userName(e.userId)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Chip tone={e.action.startsWith("auth.") ? "muted" : "default"}>{e.action}</Chip>
                  </td>
                  <td className="hidden px-4 py-2.5 font-mono text-[0.6875rem] text-muted md:table-cell">
                    {e.entity ? `${e.entity}${e.entityId ? ` · ${e.entityId.slice(0, 14)}` : ""}` : "—"}
                  </td>
                  <td className="hidden max-w-xs px-4 py-2.5 lg:table-cell">
                    <span className="t-caption block truncate text-muted">
                      {e.meta ? JSON.stringify(e.meta) : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
          <p className="t-caption tnum text-muted">
            Page {page} of {pages} · {total} entries
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <a
                href={qs({ page: String(page - 1) })}
                className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 text-[0.8125rem] font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                Previous
              </a>
            ) : null}
            {page < pages ? (
              <a
                href={qs({ page: String(page + 1) })}
                className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 text-[0.8125rem] font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                Next
              </a>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}
