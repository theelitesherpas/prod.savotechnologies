import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_META,
  isEnquiryStatus,
  type EnquiryStatus,
} from "@/lib/enquiry-status";

export const metadata: Metadata = { title: "Enquiries" };

const PAGE_SIZE = 25;

type SearchParams = {
  status?: string;
  type?: string;
  page?: string;
  deleted?: string;
};

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  if (!prisma) {
    return <p className="t-sm text-muted">Database not configured, set DATABASE_URL.</p>;
  }

  const status = sp.status && isEnquiryStatus(sp.status) ? sp.status : undefined;
  const type = sp.type === "Callback" || sp.type === "Project" ? sp.type : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(status ? { status } : { status: { not: "archived" } }),
    ...(type === "Callback"
      ? { projectType: "Callback" }
      : type === "Project"
        ? { projectType: { not: "Callback" } }
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
    if (merged.page && merged.page !== "1") params.set("page", merged.page);
    const s = params.toString();
    return s ? `/admin/enquiries?${s}` : "/admin/enquiries";
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="t-h3">Enquiry inbox</h1>
          <p className="t-sm mt-1 text-muted">
            {total} record{total === 1 ? "" : "s"}
            {status ? ` · ${ENQUIRY_STATUS_META[status as EnquiryStatus].label.toLowerCase()}` : " · excluding archived"}
            {type ? ` · ${type.toLowerCase()}s` : ""}
          </p>
        </div>
        {sp.deleted ? (
          <p role="status" className="t-sm border border-border bg-foreground/[0.03] px-3 py-1.5 text-foreground/80">
            Enquiry deleted.
          </p>
        ) : null}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        <Link
          href={qs({ status: undefined, page: undefined })}
          className={`t-sm border px-3 py-1.5 transition-colors ${!status ? "border-foreground bg-foreground text-background" : "border-border text-foreground/70 hover:border-foreground/40"}`}
        >
          Active
        </Link>
        {ENQUIRY_STATUSES.map((s) => (
          <Link
            key={s}
            href={qs({ status: s, page: undefined })}
            className={`t-sm border px-3 py-1.5 transition-colors ${status === s ? "border-foreground bg-foreground text-background" : "border-border text-foreground/70 hover:border-foreground/40"}`}
          >
            {ENQUIRY_STATUS_META[s].label}
          </Link>
        ))}
        <span className="mx-2 hidden w-px bg-border sm:block" />
        {["Project", "Callback"].map((t) => (
          <Link
            key={t}
            href={qs({ type: type === t ? undefined : t, page: undefined })}
            className={`t-sm border px-3 py-1.5 transition-colors ${type === t ? "border-accent text-accent" : "border-border text-foreground/70 hover:border-foreground/40"}`}
          >
            {t === "Project" ? "Projects only" : "Callbacks only"}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="border border-border bg-background p-8 text-center">
          <p className="t-h4 mb-2">Inbox zero</p>
          <p className="t-sm text-muted">
            No enquiries match this filter. New leads arrive from the site&apos;s
            enquiry drawer and footer callback form.
          </p>
        </div>
      ) : (
        <ul className="border border-border divide-y divide-border">
          {items.map((enq) => (
            <li key={enq.id}>
              <Link
                href={`/admin/enquiries/${enq.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-background px-4 py-3.5 transition-colors hover:bg-foreground/[0.03]"
              >
                <span className="t-sm min-w-0 flex-1 truncate font-medium text-foreground">
                  {enq.name}
                  {enq.company ? <span className="text-muted"> · {enq.company}</span> : null}
                </span>
                <span className="t-caption tnum text-muted">
                  {enq.createdAt.toISOString().slice(0, 16).replace("T", " · ")}
                </span>
                <span
                  className={`t-caption border px-2 py-0.5 ${
                    enq.status === "new" ? "border-accent/50 text-accent" : "border-border text-muted"
                  }`}
                >
                  {isEnquiryStatus(enq.status) ? ENQUIRY_STATUS_META[enq.status].label : enq.status}
                </span>
                <span className="t-caption border border-border px-2 py-0.5 text-muted">
                  {enq.projectType}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center gap-3">
          {page > 1 ? (
            <Link href={qs({ page: String(page - 1) })} className="t-sm border border-border px-3 py-1.5 hover:border-foreground/40">
              ← Previous
            </Link>
          ) : null}
          <span className="t-caption tnum text-muted">
            Page {page} / {pages}
          </span>
          {page < pages ? (
            <Link href={qs({ page: String(page + 1) })} className="t-sm border border-border px-3 py-1.5 hover:border-foreground/40">
              Next →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
