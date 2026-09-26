import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { COLLECTION_KEYS, CONTENT_COLLECTIONS } from "@/lib/content-registry";
import { StatTile, PageHeader, EnquiryStatusChip, Chip } from "@/components/admin/ui";
import { AdminIcon } from "@/components/admin/icons";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_META } from "@/lib/enquiry-status";
import { fmtIST } from "@/lib/datetime";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function weekAgoDate(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

function twoWeeksAgoDate(): Date {
  return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
}

const fmtDateTime = (d: Date) => fmtIST(d);

function monthAgoDate(): Date {
  return new Date(Date.now() - 30 * 86400000);
}

function daysFromNow(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

/** Pure-SVG 14-day enquiry trend - area + line, accent stroke, hairline grid. */
function TrendChart(rows: { createdAt: Date }[]) {
  const days = 14;
  const now = new Date();
  const buckets: { label: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.push({
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: 0,
    });
  }
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  for (const r of rows) {
    const d = new Date(r.createdAt);
    const idx =
      days - 1 -
      Math.floor((todayEnd.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
    if (idx >= 0 && idx < days) buckets[idx].count += 1;
  }
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const W = 640;
  const H = 150;
  const PAD = 8;
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (days - 1);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2 - 18);
  const line = buckets.map((b, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(b.count).toFixed(1)}`).join(" ");
  const area = `${line} L${x(days - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`;
  const total = buckets.reduce((a, b) => a + b.count, 0);

  return (
    <div className="adm-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="trend-heading" className="text-[0.9375rem] font-bold tracking-[-0.01em] text-foreground">
            Enquiries · last 14 days
          </h2>
          <p className="t-caption text-muted">{total} submissions across every form</p>
        </div>
        <Chip tone={total > 0 ? "accent" : "muted"}>{total > 0 ? "live" : "quiet"}</Chip>
      </div>
      {total === 0 ? (
        <p className="t-sm py-8 text-center text-muted">
          No submissions in the last two weeks - the chart draws itself the moment one arrives.
        </p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full" role="img" aria-label={`Enquiries over the last 14 days, ${total} total`} preserveAspectRatio="none">
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={PAD}
              x2={W - PAD}
              y1={PAD + f * (H - PAD * 2)}
              y2={PAD + f * (H - PAD * 2)}
              stroke="var(--border)"
              strokeWidth="1"
            />
          ))}
          <path d={area} fill="var(--accent)" fillOpacity="0.08" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {buckets.map((b, i) =>
            b.count > 0 ? (
              <rect key={i} x={x(i) - 2.5} y={y(b.count) - 2.5} width="5" height="5" fill="var(--accent)" />
            ) : null,
          )}
        </svg>
      )}
      <div className="mt-2 flex justify-between font-mono text-[0.625rem] text-muted">
        {buckets
          .filter((_, i) => i % 3 === 0 || i === days - 1)
          .map((b) => (
            <span key={b.label}>{b.label}</span>
          ))}
      </div>
    </div>
  );
}

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

  const twoWeeksAgo = twoWeeksAgoDate();
  const [statusRows, weekCount, prevWeekCount, callbackWeekCount, recentDated, activeServices, activeIndustries, recent, activity] =
    await Promise.all([
      prisma.projectEnquiry.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.projectEnquiry.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.projectEnquiry.count({
        where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
      }),
      prisma.projectEnquiry.count({ where: { projectType: "Callback", createdAt: { gte: weekAgo } } }),
      prisma.projectEnquiry.findMany({
        where: { createdAt: { gte: twoWeeksAgo } },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
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

  /* ── Business & delivery: revenue, projects, milestones, demand ── */
  const monthAgo = monthAgoDate();
  const [invoices, activeProjects, totalClients, upcomingMilestones, typeBreakdown] = await Promise.all([
    prisma.invoice.findMany({ select: { status: true, amount: true, currency: true } }).catch(() => []),
    prisma.clientProject
      .count({ where: { status: { in: ["planning", "in_progress", "review"] } } })
      .catch(() => 0),
    prisma.clientUser.count({ where: { active: true } }).catch(() => 0),
    prisma.projectMilestone
      .findMany({
        where: { status: { not: "done" }, dueDate: { not: null } },
        orderBy: { dueDate: "asc" },
        take: 6,
        include: { project: { select: { code: true, title: true } } },
      })
      .catch(() => []),
    prisma.projectEnquiry
      .groupBy({ by: ["projectType"], _count: { _all: true }, where: { createdAt: { gte: monthAgo } } })
      .catch(() => [] as { projectType: string; _count: { _all: number } }[]),
  ]);

  const sumFor = (statuses: string[]) =>
    invoices.filter((i) => statuses.includes(i.status)).reduce((s, i) => s + i.amount, 0);
  const money = (minor: number, currency = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(
      minor / 100,
    );
  const collected = sumFor(["paid"]);
  const outstanding = sumFor(["sent", "overdue"]);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const daysTo = (d: Date) => daysFromNow(d);
  const topTypes = [...typeBreakdown].sort((a, b) => b._count._all - a._count._all).slice(0, 6);
  const maxType = Math.max(1, ...topTypes.map((t) => t._count._all));

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
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="New enquiries" value={newCount} href="/admin/enquiries?status=new" icon="inbox" accent={newCount > 0} />
        <StatTile
          label="This week"
          value={weekCount}
          href="/admin/enquiries"
          icon="trend"
          trend={
            prevWeekCount === 0
              ? weekCount > 0
                ? { dir: "up", text: "first this period" }
                : undefined
              : {
                  dir: weekCount >= prevWeekCount ? "up" : "down",
                  text: `${Math.abs(Math.round(((weekCount - prevWeekCount) / prevWeekCount) * 100))}% vs last week`,
                }
          }
        />
        <StatTile label="Callbacks · 7d" value={callbackWeekCount} href="/admin/enquiries?type=Callback" icon="gauge" />
        <StatTile label="Needs action" value={newCount + inProgressCount} href="/admin/enquiries" icon="alert" hint="New + in progress" />
      </div>

      {/* 14-day trend chart */}
      <section aria-labelledby="trend-heading" className="mb-6">{TrendChart(recentDated)}</section>

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
              No enquiries yet - submissions from every site form land here the moment they arrive.
            </p>
          )}
        </div>
      </section>

      {/* Business & delivery */}
      <section aria-labelledby="business-heading" className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="business-heading" className="text-[1.0625rem] font-bold tracking-[-0.01em]">
            Business &amp; delivery
          </h2>
          <div className="flex gap-3">
            <Link href="/admin/invoices" className="t-sm link-underline text-accent">
              Invoices →
            </Link>
            <Link href="/admin/projects" className="t-sm link-underline text-accent">
              Projects →
            </Link>
          </div>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatTile label="Collected · all time" value={money(collected)} href="/admin/invoices" icon="check" hint="Paid invoices" />
          <StatTile
            label="Outstanding"
            value={money(outstanding)}
            href="/admin/invoices"
            icon="briefcase"
            accent={overdueCount > 0}
            hint={overdueCount > 0 ? `${overdueCount} overdue` : "Sent, awaiting payment"}
          />
          <StatTile label="Active projects" value={activeProjects} href="/admin/projects" icon="folder" hint="Planning → review" />
          <StatTile label="Portal clients" value={totalClients} href="/admin/clients" icon="user" />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="adm-card p-4 sm:p-5">
            <h3 className="adm-label mb-3">Milestones on the calendar</h3>
            {upcomingMilestones.length === 0 ? (
              <p className="t-sm text-muted">No open milestones with due dates.</p>
            ) : (
              <ul className="divide-y divide-border">
                {upcomingMilestones.map((m) => {
                  const d = daysTo(m.dueDate as Date);
                  const overdue = d < 0;
                  return (
                    <li key={m.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.8125rem] font-semibold text-foreground">{m.title}</span>
                        <span className="t-caption block truncate text-muted">
                          {m.project.code} · {m.project.title}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "t-caption tnum shrink-0 rounded-md border px-2 py-1 font-semibold",
                          overdue
                            ? "border-error/40 bg-error/[0.06] text-error"
                            : d <= 7
                              ? "border-accent/40 bg-accent/[0.06] text-accent"
                              : "border-border text-muted",
                        )}
                      >
                        {overdue ? `${Math.abs(d)}d overdue` : d === 0 ? "today" : `in ${d}d`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="adm-card p-4 sm:p-5">
            <h3 className="adm-label mb-3">What people ask for · 30 days</h3>
            {topTypes.length === 0 ? (
              <p className="t-sm text-muted">Enquiry demand appears here as forms come in.</p>
            ) : (
              <div className="space-y-2">
                {topTypes.map((t) => (
                  <div key={t.projectType} className="relative h-9 overflow-hidden rounded-md bg-foreground/[0.05]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-md bg-foreground/70"
                      style={{ width: `${Math.max((t._count._all / maxType) * 100, 4)}%` }}
                    />
                    <div className="relative flex h-full items-center justify-between px-3">
                      <span className="truncate text-[0.8125rem] font-medium text-foreground">{t.projectType}</span>
                      <span className="tnum t-caption shrink-0 pl-3 text-muted">{t._count._all}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
              className="adm-card group flex items-center gap-3 px-4 py-3.5 transition-colors hover:border-foreground/25"
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
