import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ENQUIRY_STATUS_META, type EnquiryStatus } from "@/lib/enquiry-status";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

/** Date math lives outside render so the component body stays pure. */
function weekAgoDate(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

function StatusChip({ status }: { status: string }) {
  const known: EnquiryStatus | null = (["new", "in_progress", "closed", "archived"] as const).includes(
    status as EnquiryStatus,
  )
    ? (status as EnquiryStatus)
    : null;
  return (
    <span
      className={`t-caption inline-flex items-center border px-2 py-0.5 ${
        known === "new"
          ? "border-accent/50 text-accent"
          : known === "in_progress"
            ? "border-foreground/30 text-foreground/80"
            : "border-border text-muted"
      }`}
    >
      {known ? ENQUIRY_STATUS_META[known].label : status}
    </span>
  );
}

export default async function AdminDashboard() {
  if (!prisma) {
    return (
      <p className="t-sm text-muted">Database not configured — set DATABASE_URL.</p>
    );
  }

  const weekAgo = weekAgoDate();

  const [newCount, weekCount, callbackWeekCount, activeServices, activeIndustries, recent] =
    await Promise.all([
      prisma.projectEnquiry.count({ where: { status: "new" } }),
      prisma.projectEnquiry.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.projectEnquiry.count({
        where: { projectType: "Callback", createdAt: { gte: weekAgo } },
      }),
      prisma.service.count({ where: { active: true } }),
      prisma.industry.count({ where: { active: true } }),
      prisma.projectEnquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, name: true, projectType: true, status: true, createdAt: true },
      }),
    ]);

  const stats = [
    { label: "New enquiries", value: newCount, href: "/admin/enquiries?status=new" },
    { label: "This week", value: weekCount, href: "/admin/enquiries" },
    { label: "Callbacks · 7d", value: callbackWeekCount, href: "/admin/enquiries?type=Callback" },
    { label: "Active services", value: activeServices, href: "/admin/services" },
    { label: "Active industries", value: activeIndustries, href: "/admin/industries" },
  ];

  return (
    <div>
      <h1 className="t-h3 mb-2">Dashboard</h1>
      <p className="t-sm mb-8 text-muted">Lead inbox health and content status at a glance.</p>

      <div className="mb-10 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group bg-background p-5 transition-colors hover:bg-foreground/[0.03]"
          >
            <p className="tnum t-h3 text-foreground group-hover:text-accent">{s.value}</p>
            <p className="t-caption mt-1 text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="t-h4">Latest enquiries</h2>
        <Link href="/admin/enquiries" className="t-sm link-underline text-accent">
          Open inbox →
        </Link>
      </div>

      <div className="border border-border">
        {recent.length === 0 ? (
          <p className="t-sm bg-background p-6 text-muted">
            No enquiries yet — they will appear here the moment the first one arrives.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((enq) => (
              <li key={enq.id}>
                <Link
                  href={`/admin/enquiries/${enq.id}`}
                  className="flex flex-wrap items-center gap-3 bg-background px-4 py-3 transition-colors hover:bg-foreground/[0.03]"
                >
                  <span className="t-sm min-w-0 flex-1 truncate font-medium text-foreground">
                    {enq.name}
                  </span>
                  <span className="t-caption tnum text-muted">
                    {enq.createdAt.toISOString().slice(0, 10)}
                  </span>
                  <span className="t-caption border border-border px-2 py-0.5 text-muted">
                    {enq.projectType}
                  </span>
                  <StatusChip status={enq.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
