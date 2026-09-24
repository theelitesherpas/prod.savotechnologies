import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { COLLECTION_KEYS, CONTENT_COLLECTIONS } from "@/lib/content-registry";
import { StatTile, PageHeader, EnquiryStatusChip, Chip } from "@/components/admin/ui";
import { AdminIcon } from "@/components/admin/icons";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_META } from "@/lib/enquiry-status";

export const metadata: Metadata = { title: "Dashboard" };

function weekAgoDate(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

const fmtDateTime = (d: Date) => d.toISOString().replace("T", " · ").slice(0, 17);

export default async function AdminDashboard() {
  const user = await getAdminUser();

  if (!prisma) {
    return (
      <>
        <PageHeader title="Dashboard" description="Lead inbox health and content status at a glance." />
        <p className="t-sm text-muted">Database not configured, set DATABASE_URL.</p>
      </>
    );
  }

  const weekAgo = weekAgoDate();

  const [statusRows, weekCount, callbackWeekCount, activeServices, activeIndustries, recent, activity] =
    await Promise.all([
      prisma.projectEnquiry.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.projectEnquiry.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.projectEnquiry.count({ where: { projectType: "Callback", createdAt: { gte: weekAgo } } }),
      prisma.service.count({ where: { active: true } }),
      prisma.industry.count({ where: { active: true } }),
      prisma.projectEnquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, name: true, projectType: true, status: true, createdAt: true, email: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, action: true, entity: true, createdAt: true, userId: true },
      }),
    ]);

  const statusCount = (s: string) => statusRows.find((r) => r.status === s)?._count._all ?? 0;
  const newCount = statusCount("new");
  const inProgressCount = statusCount("in_progress");
  const closedCount = statusCount("closed");
  const totalPipeline = newCount + inProgressCount + closedCount;

  // Content collections status: DB rows vs coded-default fallback.
  const contentCounts = await prisma.contentItem
    .groupBy({ by: ["collection"], _count: { _all: true } })
    .catch(() => [] as { collection: string; _count: { _all: number } }[]);
  const countFor = (c: string) => contentCounts.find((r) => r.collection === c)?._count._all ?? 0;

  const activityUsers = await prisma.adminUser.findMany({
    where: { id: { in: activity.map((a) => a.userId).filter((x): x is string => !!x) } },
    select: { id: true, name: true },
  });
  const userName = (id: string | null) => activityUsers.find((u) => u.id === id)?.name ?? "system";

  const pipelineSegments = totalPipeline
    ? ([
        ["new", newCount, "bg-accent"],
        ["in_progress", inProgressCount, "bg-foreground/70"],
        ["closed", closedCount, "bg-muted/50"],
      ] as const).filter(([, n]) => n > 0)
    : [];

  return (
    <>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${user?.name.split(" ")[0] ?? "operator"}.`}
        description="Lead inbox health and content status at a glance."
      />

      {/* Stat tiles */}
      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="New enquiries" value={newCount} href="/admin/enquiries?status=new" accent={newCount > 0} />
        <StatTile label="This week" value={weekCount} href="/admin/enquiries" hint="All submissions, 7 days" />
        <StatTile label="Callbacks · 7d" value={callbackWeekCount} href="/admin/enquiries?type=Callback" />
        <StatTile
          label="Needs action"
          value={newCount + inProgressCount}
          href="/admin/enquiries"
          hint="New + in progress"
        />
      </div>

      {/* Pipeline */}
      <section aria-labelledby="pipeline-heading" className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="pipeline-heading" className="text-[1.0625rem] font-bold tracking-[-0.01em]">
            Lead pipeline
          </h2>
          <Link href="/admin/enquiries" className="t-sm link-underline text-accent">
            Open inbox →
          </Link>
        </div>
        <div className="adm-card p-4 sm:p-5">
          {totalPipeline ? (
            <>
              <div className="flex h-2.5 w-full overflow-hidden rounded-lg bg-foreground/[0.06]">
                {pipelineSegments.map(([status, n, cls]) => (
                  <div
                    key={status}
                    className={cls}
                    style={{ width: `${(n / totalPipeline) * 100}%` }}
                    title={`${ENQUIRY_STATUS_META[status as keyof typeof ENQUIRY_STATUS_META].label}: ${n}`}
                  />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ENQUIRY_STATUSES.map((s) => (
                  <Link
                    key={s}
                    href={`/admin/enquiries?status=${s}`}
                    className="group transition-colors hover:text-accent"
                  >
                    <p className="tnum font-mono text-[1.25rem] font-semibold leading-none text-foreground group-hover:text-accent">
                      {statusCount(s)}
                    </p>
                    <p className="adm-label mt-1.5 group-hover:text-accent">
                      {ENQUIRY_STATUS_META[s].label}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="t-sm text-muted">
              No enquiries yet — submissions from every site form land here the moment they arrive.
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Latest enquiries */}
        <section aria-labelledby="latest-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="latest-heading" className="text-[1.0625rem] font-bold tracking-[-0.01em]">
              Latest enquiries
            </h2>
            <Link href="/admin/enquiries" className="t-sm link-underline text-accent">
              All →
            </Link>
          </div>
          <div className="adm-card overflow-hidden">
            {recent.length === 0 ? (
              <p className="t-sm p-5 text-muted">Nothing yet. The inbox fills itself.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((enq) => (
                  <li key={enq.id}>
                    <Link
                      href={`/admin/enquiries/${enq.id}`}
                      className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.03]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.875rem] font-semibold text-foreground">
                          {enq.name}
                        </span>
                        <span className="t-caption block truncate text-muted">{enq.email ?? "no email"}</span>
                      </span>
                      <Chip tone="muted">{enq.projectType}</Chip>
                      <span className="tnum t-caption hidden font-mono text-muted sm:inline">
                        {enq.createdAt.toISOString().slice(5, 10).replace("-", "/")}
                      </span>
                      <EnquiryStatusChip status={enq.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Recent activity */}
        <section aria-labelledby="activity-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="activity-heading" className="text-[1.0625rem] font-bold tracking-[-0.01em]">
              Recent activity
            </h2>
            <Link href="/admin/audit" className="t-sm link-underline text-accent">
              Full log →
            </Link>
          </div>
          <div className="adm-card overflow-hidden">
            {activity.length === 0 ? (
              <p className="t-sm p-5 text-muted">Actions in the panel are recorded here.</p>
            ) : (
              <ul className="divide-y divide-border">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-foreground/30" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[0.75rem] text-foreground">{a.action}</span>
                      <span className="t-caption block truncate text-muted">
                        {userName(a.userId)}
                        {a.entity ? ` · ${a.entity}` : ""}
                      </span>
                    </span>
                    <span className="tnum t-caption shrink-0 font-mono text-muted">{fmtDateTime(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Content status matrix */}
      <section aria-labelledby="content-heading" className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="content-heading" className="text-[1.0625rem] font-bold tracking-[-0.01em]">
            Website content
          </h2>
          <p className="t-caption text-muted">Collections fall back to coded defaults until rows exist.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/admin/services", label: "Services", count: activeServices, alwaysManaged: true },
            { href: "/admin/industries", label: "Industries", count: activeIndustries, alwaysManaged: true },
            ...COLLECTION_KEYS.map((key) => ({
              href: `/admin/content/${key}`,
              label: CONTENT_COLLECTIONS[key].label,
              count: countFor(key),
              alwaysManaged: false,
            })),
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgb(16_24_40/0.05)] transition-colors hover:border-foreground/25"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.875rem] font-semibold text-foreground group-hover:text-accent">
                  {c.label}
                </span>
                <span className="t-caption block text-muted">
                  {c.count > 0 ? `${c.count} item${c.count === 1 ? "" : "s"} in the database` : "Rendering coded defaults"}
                </span>
              </span>
              {c.count > 0 ? (
                <span className="tnum font-mono text-[0.75rem] text-muted">{String(c.count).padStart(2, "0")}</span>
              ) : (
                <AdminIcon name="import" className="h-4 w-4 shrink-0 text-accent" />
              )}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
