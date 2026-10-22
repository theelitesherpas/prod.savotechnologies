import { requireAdminPage } from "@/lib/permissions";
import { CandidateWorkspace } from "@/components/admin/hr/candidate-workspace";
import type { CandidateSearch } from "@/lib/hr-candidates";
import type { Prisma } from "@prisma/client";
import { Pagination } from "@/components/admin/pagination";
import { parseAdminPage } from "@/lib/admin-pagination";
import { CAREER_ENQUIRY_WHERE, SALES_ENQUIRY_WHERE, isCareerEnquiry } from "@/lib/admin-enquiries";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_META,
  isEnquiryStatus,
} from "@/lib/enquiry-status";
import { PageHeader, Notice, EnquiryStatusChip, Chip, EmptyState } from "@/components/admin/ui";
import { AdminIcon } from "@/components/admin/icons";
import { RefreshOnMount } from "@/components/admin/refresh-on-mount";

export type EnquirySearchParams = CandidateSearch & {
  status?: string;
  type?: string;
  q?: string;
  page?: string;
  deleted?: string;
  e?: string;
};

export async function EnquiryInbox({ sp, scope = "sales" }: { sp: EnquirySearchParams; scope?: "sales" | "hr" }) {
  await requireAdminPage(scope === "hr" ? "/admin/hr-portal/applications" : "/admin/enquiries");
  const careers = scope === "hr" || sp.type === "Careers";
  if (careers) return CandidateWorkspace({ search: sp, legacy: scope !== "hr" });
  const base = "/admin/enquiries";
  const title = careers ? "Applications & candidates" : "Client enquiries";

  if (!prisma) {
    return (
      <>
        <PageHeader title={title} />
        <p className="t-sm text-muted">Database not configured, set DATABASE_URL.</p>
      </>
    );
  }

  const status = sp.status && isEnquiryStatus(sp.status) ? sp.status : undefined;
  const type = careers ? "Careers" : sp.type === "Callback" ? "Callback" : "Client";
  const department = careers ? CAREER_ENQUIRY_WHERE : SALES_ENQUIRY_WHERE;
  const category: Prisma.ProjectEnquiryWhereInput = { AND: [department, ...(type === "Callback" ? [{ projectType: "Callback" }] : [])] };
  const q = (sp.q ?? "").trim().slice(0, 80);

  const where = {
    ...category,
    ...(status ? { status } : { status: { not: "archived" } }),

    ...(q
      ? {
          OR: [
            { businessId: { contains: q, mode: "insensitive" as const } },
            { reference: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { company: { contains: q, mode: "insensitive" as const } },
            { message: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const total = await prisma.projectEnquiry.count({ where });
  const paging = parseAdminPage(sp, total);
  const currentPage = paging.page;
  const items = await prisma.projectEnquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: paging.take,
      skip: paging.skip,
      select: {
        id: true,
        businessId: true,
        name: true,
        email: true,
        company: true,
        projectType: true,
        status: true,
        source: true,
        message: true,
        data: true,
        createdAt: true,
      },
    });

  const qs = (over: Partial<EnquirySearchParams>) => {
    const merged = { ...sp, ...over };
    const params = new URLSearchParams();
    if (merged.status) params.set("status", merged.status);
    if (merged.type) params.set("type", merged.type);
    if (merged.q) params.set("q", merged.q);
    if (merged.page && merged.page !== "1") params.set("page", merged.page);
    if (merged.pageSize) params.set("pageSize", merged.pageSize);
    const s = params.toString();
    return s ? `${base}?${s}` : base;
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

  const statusCounts = await prisma.projectEnquiry.groupBy({ where: category, by: ["status"], _count: { _all: true } });
  const sc = (s: string) => statusCounts.find((r) => r.status === s)?._count._all ?? 0;

  return (
    <>
      <RefreshOnMount />
      <PageHeader
        title={title}
        description={`${careers ? "Career applications and candidate information, separate from sales enquiries." : "Project, contact and callback enquiries, separate from recruitment."} ${total} match the current filter.`}
      />

      {sp.deleted ? <Notice>Enquiry deleted.</Notice> : null}
      {sp.e === "notfound" ? <Notice kind="alert">That enquiry no longer exists.</Notice> : null}

      {!careers ? <div className="mb-2 flex flex-wrap gap-2">
        {filterTab("All client enquiries", qs({ type: "Client", page: "1" }), type === "Client")}
        {filterTab("Callbacks", qs({ type: "Callback", page: "1" }), type === "Callback")}
      </div> : null}

      {/* Status filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filterTab("Inbox", qs({ status: undefined, page: "1" }), !status)}
        {ENQUIRY_STATUSES.map((s2) =>
          filterTab(
            ENQUIRY_STATUS_META[s2].label,
            qs({ status: s2, page: "1" }),
            status === s2,
            s2 === "archived" ? undefined : sc(s2),
          ),
        )}
      </div>

      {/* Search */}
      <form action={base} method="get" className="mb-6 flex max-w-md items-center gap-2">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="pageSize" value={paging.pageSize} />
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
              : careers ? "New career applications will appear here." : "New project, contact and callback enquiries will appear here."
          }
          actions={
            <Link
              href={base}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[0.875rem] font-semibold text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              Reset filters
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
              {items.map((enq) => {
                const isCallback = enq.projectType === "Callback";
                const isCareer = isCareerEnquiry(enq);
                const kindLabel = isCallback ? "Callback" : isCareer ? "Application" : enq.projectType;
                const kindTone = isCallback ? "default" : isCareer ? "accent" : "muted";
                const sourceLabel = (enq.source ?? "")
                  .replace("careers:", "Careers page")
                  .replace("contact-page", "Contact page")
                  .replace("homepage", "Homepage")
                  .replace("footer-callback", "Footer callback")
                  .replace("start-page", "Start a project")
                  .replace("contact", "Contact page")
                  .replace(/-/g, " ");
                const timeAgo = (() => {
                  const diff = Date.now() - enq.createdAt.getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 1) return "Just now";
                  if (mins < 60) return `${mins}m ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  const days = Math.floor(hrs / 24);
                  if (days < 7) return `${days}d ago`;
                  return enq.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                })();
                return (
                  <Link
                    key={enq.id}
                    href={`/admin/enquiries/${enq.id}`}
                    className={`group flex flex-wrap items-center gap-3 border px-4 py-3.5 transition-colors hover:border-foreground/25 ${
                      enq.status === "new"
                        ? "border-l-4 border-l-accent border-y-border border-r-border bg-accent/[0.06] shadow-sm"
                        : "border-border bg-surface"
                    }`}
                  >
                    {/* Name + email */}
                    <div className="min-w-0 flex-1 sm:flex-[2]">
                      <span className={`flex items-center gap-2.5 truncate text-[0.9375rem] ${enq.status === "new" ? "font-extrabold" : "font-medium text-foreground/80"} text-foreground group-hover:text-accent`}>
                        {enq.status === "new" ? (
                          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent ring-2 ring-accent/20" />
                        ) : null}
                        {enq.name}
                        {enq.businessId ? <span className="ml-2 text-xs font-normal text-muted tnum">{enq.businessId}</span> : null}
                      </span>
                      <span className={`t-caption block truncate ${enq.status === "new" ? "font-semibold text-foreground/70" : "text-muted"}`}>
                        {enq.email ?? enq.company ?? "-"}
                      </span>
                    </div>

                    {/* Kind */}
                    <div className="hidden shrink-0 sm:block">
                      <Chip tone={kindTone as "default" | "accent" | "muted"}>{kindLabel}</Chip>
                    </div>

                    {/* Source */}
                    <div className="hidden shrink-0 lg:block">
                      <span className="t-caption block max-w-[8rem] truncate text-muted">{sourceLabel}</span>
                    </div>

                    {/* Time */}
                    <span className="t-caption tnum shrink-0 font-mono text-muted">{timeAgo}</span>

                    {/* Status */}
                    <EnquiryStatusChip status={enq.status} />

                    {/* Arrow */}
                    <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3.5 w-3.5 shrink-0 text-muted transition-all group-hover:translate-x-0.5 group-hover:text-accent" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                    </svg>
                  </Link>
                );
              })}
            </div>
      )}

      {/* Pagination */}
      <Pagination page={currentPage} total={total} pageSize={paging.pageSize} href={(page, size) => qs({ page: String(page), pageSize: String(size) })} label="enquiries" />
    </>
  );
}
