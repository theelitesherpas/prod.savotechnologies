import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_META,
  isEnquiryStatus,
} from "@/lib/enquiry-status";
import { PageHeader, Notice, EnquiryStatusChip, Chip, EmptyState } from "@/components/admin/ui";
import { AdminIcon } from "@/components/admin/icons";

export const metadata: Metadata = { title: "Enquiries" };

const PAGE_SIZE = 20;

type SearchParams = {
  status?: string;
  type?: string;
  q?: string;
  page?: string;
  deleted?: string;
  e?: string;
};

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  if (!prisma) {
    return (
      <>
        <PageHeader title="Enquiries" />
        <p className="t-sm text-muted">Database not configured, set DATABASE_URL.</p>
      </>
    );
  }

  const status = sp.status && isEnquiryStatus(sp.status) ? sp.status : undefined;
  const type = sp.type === "Callback" || sp.type === "Project" ? sp.type : undefined;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(status ? { status } : { status: { not: "archived" } }),
    ...(type === "Callback"
      ? { projectType: "Callback" }
      : type === "Project"
        ? { projectType: { not: "Callback" } }
        : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { company: { contains: q, mode: "insensitive" as const } },
            { message: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.projectEnquiry.count({ where }),
    prisma.projectEnquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        projectType: true,
        status: true,
        source: true,
        message: true,
        createdAt: true,
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qs = (over: Partial<SearchParams>) => {
    const merged = { ...sp, ...over };
    const params = new URLSearchParams();
    if (merged.status) params.set("status", merged.status);
    if (merged.type) params.set("type", merged.type);
    if (merged.q) params.set("q", merged.q);
    if (merged.page && merged.page !== "1") params.set("page", merged.page);
    const s = params.toString();
    return s ? `/admin/enquiries?${s}` : "/admin/enquiries";
  };

  const filterTab = (label: string, href: string, active: boolean, count?: number) => (
    <Link
      key={label}
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-[0.8125rem] font-semibold transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted hover:border-foreground/40 hover:text-foreground"
      }`}
    >
      {label}
      {typeof count === "number" ? (
        <span className={`tnum font-mono text-[0.6875rem] ${active ? "opacity-70" : "opacity-60"}`}>{count}</span>
      ) : null}
    </Link>
  );

  const statusCounts = await prisma.projectEnquiry.groupBy({ by: ["status"], _count: { _all: true } });
  const sc = (s: string) => statusCounts.find((r) => r.status === s)?._count._all ?? 0;

  return (
    <>
      <PageHeader
        title="Enquiries"
        description={`Every public form — Start a project, Contact, Careers applications and callbacks — lands in this one pipeline. ${total} shown for the current filter.`}
      />

      {sp.deleted ? <Notice>Enquiry deleted.</Notice> : null}
      {sp.e === "notfound" ? <Notice kind="alert">That enquiry no longer exists.</Notice> : null}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filterTab("Inbox", qs({ status: undefined, page: "1" }), !status)}
        {ENQUIRY_STATUSES.map((s) =>
          filterTab(
            ENQUIRY_STATUS_META[s].label,
            qs({ status: s, page: "1" }),
            status === s,
            s === "archived" ? undefined : sc(s),
          ),
        )}
        <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-border sm:block" />
        {filterTab("Projects", qs({ type: "Project", page: "1" }), type === "Project")}
        {filterTab("Callbacks", qs({ type: "Callback", page: "1" }), type === "Callback")}
        {type ? filterTab("All types", qs({ type: undefined, page: "1" }), false) : null}
      </div>

      {/* Search */}
      <form action="/admin/enquiries" method="get" className="mb-6 flex max-w-md items-center gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="relative min-w-0 flex-1">
          <AdminIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={80}
            placeholder="Search name, email, company, message…"
            aria-label="Search enquiries"
            className="adm-input pl-9"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-[38px] items-center rounded-lg border border-border px-3.5 text-[0.8125rem] font-semibold text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Search
        </button>
        {q ? (
          <Link href={qs({ q: undefined, page: "1" })} className="t-caption link-underline text-muted">
            Clear
          </Link>
        ) : null}
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="No enquiries match"
          message={
            q
              ? `Nothing matches “${q}” under the current filter. Try a shorter search, or clear the filters.`
              : "No enquiries here yet. Every form on the site feeds this inbox the moment it is submitted."
          }
          actions={
            <Link
              href="/admin/enquiries"
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[0.875rem] font-semibold text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              Reset filters
            </Link>
          }
        />
      ) : (
        <div className="adm-card overflow-hidden">
          <table className="adm-hairline-table w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="adm-label px-4 py-3">Lead</th>
                <th scope="col" className="adm-label hidden px-4 py-3 lg:table-cell">Type</th>
                <th scope="col" className="adm-label hidden px-4 py-3 md:table-cell">Source</th>
                <th scope="col" className="adm-label hidden px-4 py-3 sm:table-cell">Received</th>
                <th scope="col" className="adm-label px-4 py-3">Status</th>
                <th scope="col" className="adm-label px-4 py-3 text-right"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((enq) => (
                <tr key={enq.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/enquiries/${enq.id}`} className="group block max-w-sm">
                      <span className="block truncate text-[0.875rem] font-semibold text-foreground group-hover:text-accent">
                        {enq.name}
                      </span>
                      <span className="t-caption block truncate text-muted">
                        {enq.email ?? enq.company ?? "—"}
                      </span>
                      <span className="t-caption mt-0.5 block truncate text-muted/80 lg:hidden">
                        {enq.projectType}
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <Chip tone="muted">{enq.projectType}</Chip>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-[0.6875rem] text-muted md:table-cell">
                    {enq.source}
                  </td>
                  <td className="tnum hidden px-4 py-3 font-mono text-[0.6875rem] text-muted sm:table-cell">
                    {enq.createdAt.toISOString().replace("T", " ").slice(0, 16)}
                  </td>
                  <td className="px-4 py-3">
                    <EnquiryStatusChip status={enq.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/enquiries/${enq.id}`}
                      className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-[0.75rem] font-semibold text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
          <p className="t-caption tnum text-muted">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={qs({ page: String(page - 1) })}
                className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 text-[0.8125rem] font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                Previous
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={qs({ page: String(page + 1) })}
                className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 text-[0.8125rem] font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}
