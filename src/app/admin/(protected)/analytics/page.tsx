import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { PageHeader, StatTile, Chip, Notice } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

/** Admin · Analytics - first-party, privacy-friendly traffic + engagement.
 *
 *  Data comes from the site's own collector (/api/analytics/collect):
 *  pageviews on every route change plus every tracked event (assistant
 *  questions, CTA clicks, form funnel…). No raw IPs or user agents are
 *  stored - uniques use a daily salted hash. The same events also flow to
 *  Google Analytics when NEXT_PUBLIC_GA_ID is configured; this page is the
 *  zero-dependency view the business owns end to end.
 */

const RANGES = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
] as const;

function Bucket({ label, value, max, sub }: { label: string; value: number; max: number; sub?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="relative h-9 overflow-hidden rounded-md bg-foreground/[0.05]">
      <div
        className="absolute inset-y-0 left-0 rounded-md bg-accent/75 transition-[width] duration-500"
        style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%` }}
      />
      <div className="relative flex h-full items-center justify-between px-3">
        <span className="truncate text-[0.8125rem] font-medium text-foreground">{label}</span>
        <span className="tnum shrink-0 pl-3 text-[0.8125rem] text-muted">
          {value.toLocaleString()}
          {sub ? ` · ${sub}` : ""}
        </span>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="adm-card p-5">
      <h2 className="adm-label mb-4">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function sinceDays(days: number) {
  return new Date(Date.now() - days * 86400000);
}

function sinceMinutes(min: number) {
  return new Date(Date.now() - min * 60000);
}

/** Funnel row - label, count, share of the funnel's first stage. */
function FunnelRow({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[0.8125rem] font-medium text-foreground">{label}</span>
        <span className="tnum t-caption shrink-0 text-muted">
          {value.toLocaleString()}
          {pct > 0 && pct < 100 ? ` · ${pct}%` : ""}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-foreground/[0.06]">
        <div className="h-full rounded-full bg-accent/80" style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }} />
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const days = RANGES.some((r) => r.key === range) ? Number(range) : 30;
  const since = sinceDays(days);
  const prevSince = sinceDays(days * 2);

  const [events, prevViews, liveEvents, gaConfigured, dbUp] = await Promise.all([
    prisma ? prisma.analyticsEvent.findMany({ where: { createdAt: { gte: since } } }) : [],
    prisma
      ? prisma.analyticsEvent.count({ where: { type: "pageview", createdAt: { gte: prevSince, lt: since } } })
      : 0,
    prisma
      ? prisma.analyticsEvent.findMany({ where: { createdAt: { gte: sinceMinutes(30) } }, select: { visitorHash: true } })
      : [],
    Promise.resolve(Boolean(env.NEXT_PUBLIC_GA_ID)),
    Promise.resolve(Boolean(prisma)),
  ]);
  if (!dbUp) {
    return (
      <div className="max-w-5xl">
        <PageHeader title="Analytics" description="First-party traffic and engagement." />
        <Notice kind="alert">Analytics storage is not reachable on this deployment.</Notice>
      </div>
    );
  }

  const pageviews = events.filter((e) => e.type === "pageview");
  const trackedEvents = events.filter((e) => e.type === "event");
  const uniques = new Set(pageviews.map((e) => e.visitorHash).filter(Boolean)).size;
  const assistantQuestions = trackedEvents.filter((e) => e.eventName === "ask_savo_question").length;
  const assistantHandoffs = trackedEvents.filter((e) => e.eventName === "ask_savo_handoff").length;
  const activeNow = new Set(liveEvents.map((e) => e.visitorHash).filter(Boolean)).size;
  const viewsTrend =
    prevViews === 0
      ? undefined
      : {
          dir: (pageviews.length >= prevViews ? "up" : "down") as "up" | "down",
          text: `${Math.abs(Math.round(((pageviews.length - prevViews) / prevViews) * 100))}% vs previous ${days}d`,
        };
  const perVisitor = uniques > 0 ? (pageviews.length / uniques).toFixed(1) : "-";

  // ── funnels (share of first stage)
  const evCount = (name: string) => trackedEvents.filter((e) => e.eventName === name).length;
  const funnelBase = Math.max(1, pageviews.length);
  const enquiryFunnel = [
    { label: "Page views", value: pageviews.length },
    { label: "Opened enquiry form", value: evCount("enquiry_form_start") },
    { label: "Submitted", value: evCount("enquiry_form_submit") },
    { label: "Delivered successfully", value: evCount("enquiry_form_success") },
  ];
  const assistantBase = Math.max(1, evCount("ask_savo_open"));
  const assistantFunnel = [
    { label: "Opened the assistant", value: evCount("ask_savo_open") },
    { label: "Asked a question", value: assistantQuestions },
    { label: "Human handoff (email)", value: assistantHandoffs },
  ];

  // ── daily trend
  const buckets: { label: string; views: number }[] = [];
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.push({ label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), views: 0 });
  }
  for (const pv of pageviews) {
    const d = new Date(pv.createdAt);
    const idx =
      days - 1 -
      Math.floor(
        (todayEnd.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000,
      );
    if (idx >= 0 && idx < days) buckets[idx].views += 1;
  }
  const maxViews = Math.max(1, ...buckets.map((b) => b.views));
  const step = Math.max(1, Math.ceil(days / 14));

  // ── top lists
  const tally = (rows: { key: string; extra?: string }[]) => {
    const m = new Map<string, { count: number; extra?: string }>();
    for (const r of rows) {
      const hit = m.get(r.key) ?? { count: 0, extra: r.extra };
      hit.count += 1;
      m.set(r.key, hit);
    }
    return [...m.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  };
  const topPages = tally(pageviews.map((e) => ({ key: e.path })));
  const topReferrers = tally(
    pageviews.map((e) => ({ key: e.referrer ?? "direct / none" })),
  );
  const topEvents = tally(trackedEvents.map((e) => ({ key: e.eventName ?? "unknown" })));
  const topLangs = tally(
    pageviews.map((e) => {
      const meta = e.meta as { lang?: string } | null;
      return { key: meta?.lang ?? "unknown" };
    }),
  );

  const devices = tally(pageviews.map((e) => ({ key: e.device ?? "unknown" })));
  const deviceTotal = pageviews.length || 1;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Analytics"
        description="First-party traffic and engagement - owned end to end, no third-party dependency."
      />

      {/* Range switch */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`/admin/analytics?range=${r.key}`}
            aria-current={days === Number(r.key) ? "page" : undefined}
            className={`inline-flex h-9 items-center rounded-lg border px-3.5 text-[0.8125rem] font-semibold transition-colors ${
              days === Number(r.key)
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            {r.label}
          </Link>
        ))}
        <span className="t-caption tnum ml-auto text-muted">
          {events.length.toLocaleString()} records · since{" "}
          {since.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      {!gaConfigured ? (
        <div className="mb-6">
          <Notice kind="alert">
            Google Analytics is not connected. Set <code>NEXT_PUBLIC_GA_ID</code> (GA4 Measurement
            ID, e.g. <code>G-XXXXXXX</code>) in the server environment and redeploy - every event
            below already flows to GA4 automatically.
          </Notice>
        </div>
      ) : null}

      {/* Stat tiles */}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatTile
          label="Page views"
          value={pageviews.length}
          icon="gauge"
          trend={viewsTrend}
          hint={`${perVisitor} / visitor`}
        />
        <StatTile label="Unique visitors" value={uniques} icon="user" hint="Daily salted hash" />
        <StatTile
          label="Active now"
          value={activeNow}
          icon="sun"
          accent={activeNow > 0}
          hint="Last 30 minutes"
        />
        <StatTile
          label="Assistant questions"
          value={assistantQuestions}
          icon="bot"
          hint={`${assistantHandoffs} human handoffs`}
        />
        <StatTile label="Tracked events" value={trackedEvents.length} icon="trend" hint="CTAs, forms, funnel" />
      </div>

      {/* Trend */}
      <section className="adm-card mb-6 p-5" aria-label="Page views trend">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="adm-label">Page views · last {days} days</h2>
          <Chip>{buckets.reduce((s, b) => s + b.views, 0).toLocaleString()} total</Chip>
        </div>
        <div className="flex h-40 items-end gap-[3px]">
          {buckets.map((b, i) => (
            <div key={i} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-[3px] bg-accent/70 transition-colors group-hover:bg-accent"
                style={{ height: `${Math.max((b.views / maxViews) * 100, b.views > 0 ? 4 : 1)}%` }}
                title={`${b.label}: ${b.views} views`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between">
          {buckets
            .filter((_, i) => i % step === 0 || i === days - 1)
            .map((b, i) => (
              <span key={i} className="t-caption text-muted">
                {b.label}
              </span>
            ))}
        </div>
      </section>

      {/* Funnels */}
      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <Panel title={`Enquiry funnel · ${days}d`}>
          <div className="space-y-3.5">
            {enquiryFunnel.map((s) => (
              <FunnelRow key={s.label} label={s.label} value={s.value} pct={Math.round((s.value / funnelBase) * 100)} />
            ))}
          </div>
          <p className="t-caption mt-3 text-muted">
            Overall conversion: <span className="font-semibold text-foreground">{((evCount("enquiry_form_success") / funnelBase) * 100).toFixed(1)}%</span> of pageviews end in a delivered enquiry.
          </p>
        </Panel>
        <Panel title={`Savo Assistant funnel · ${days}d`}>
          <div className="space-y-3.5">
            {assistantFunnel.map((s) => (
              <FunnelRow key={s.label} label={s.label} value={s.value} pct={Math.round((s.value / assistantBase) * 100)} />
            ))}
          </div>
          <p className="t-caption mt-3 text-muted">
            Handoff rate: <span className="font-semibold text-foreground">{((assistantHandoffs / assistantBase) * 100).toFixed(0)}%</span> of assistant opens reach a human handoff.
          </p>
        </Panel>
      </div>

      {/* Lists */}
      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <Panel title="Top pages">
          {topPages.length === 0 ? (
            <p className="t-caption text-muted">No pageviews recorded yet.</p>
          ) : (
            topPages.map(([path, v]) => <Bucket key={path} label={path} value={v.count} max={topPages[0][1].count} />)
          )}
        </Panel>
        <Panel title="Referrers">
          {topReferrers.length === 0 ? (
            <p className="t-caption text-muted">Nothing yet.</p>
          ) : (
            topReferrers.map(([host, v]) => (
              <Bucket key={host} label={host} value={v.count} max={topReferrers[0][1].count} />
            ))
          )}
        </Panel>
        <Panel title="Devices">
          <div className="grid grid-cols-3 gap-3 pt-1">
            {devices.map(([d, v]) => (
              <div key={d} className="rounded-lg border border-border p-3 text-center">
                <p className="tnum text-[1.375rem] font-bold leading-none text-foreground">
                  {Math.round((v.count / deviceTotal) * 100)}%
                </p>
                <p className="t-caption mt-1.5 capitalize text-muted">
                  {d} · {v.count.toLocaleString()}
                </p>
              </div>
            ))}
            {devices.length === 0 ? <p className="t-caption text-muted">Nothing yet.</p> : null}
          </div>
        </Panel>
        <Panel title="Top events">
          {topEvents.length === 0 ? (
            <p className="t-caption text-muted">No tracked events yet.</p>
          ) : (
            topEvents.map(([name, v]) => (
              <Bucket key={name} label={name.replace(/_/g, " ")} value={v.count} max={topEvents[0][1].count} />
            ))
          )}
        </Panel>
        <Panel title="Visitor languages">
          {topLangs.filter(([l]) => l !== "unknown").length === 0 ? (
            <p className="t-caption text-muted">Languages appear as traffic arrives.</p>
          ) : (
            topLangs
              .filter(([l]) => l !== "unknown")
              .map(([lang, v]) => (
                <Bucket key={lang} label={lang} value={v.count} max={topLangs.filter(([l]) => l !== "unknown")[0]?.[1].count ?? 1} />
              ))
          )}
        </Panel>
      </div>

      <p className="t-caption text-muted">
        Privacy: no raw IP addresses or user agents are stored. Unique visitors use a per-day salted
        hash - counts are approximate by design and unlinkable across days. Bot user agents are
        filtered at collection.
      </p>
    </div>
  );
}
