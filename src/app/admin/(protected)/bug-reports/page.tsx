import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, StatTile, Chip } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { updateBugStatusAction } from "./actions";

export const metadata: Metadata = { title: "Bug reports" };
export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; tone: "default" | "accent" | "success" | "warning" | "muted" }> = {
  error: { label: "Error", tone: "accent" },
  "404": { label: "404", tone: "default" },
  api_error: { label: "API error", tone: "warning" },
  user_report: { label: "User report", tone: "accent" },
};

const STATUS_META: Record<string, { label: string; tone: "default" | "accent" | "success" | "warning" | "muted" }> = {
  new: { label: "New", tone: "accent" },
  acknowledged: { label: "Acknowledged", tone: "warning" },
  resolved: { label: "Resolved", tone: "success" },
  ignored: { label: "Ignored", tone: "muted" },
};

/** Admin - Bug reports: captured errors, 404s and user-submitted issues. */
export default async function BugReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; e?: string }>;
}) {
  const { status, type, e } = await searchParams;
  if (!prisma) {
    return (
      <div className="max-w-5xl">
        <PageHeader title="Bug reports" />
        <Notice kind="alert">Database unavailable.</Notice>
      </div>
    );
  }

  const where: Record<string, unknown> = {};
  if (status && ["new", "acknowledged", "resolved", "ignored"].includes(status)) where.status = status;
  if (type && ["error", "404", "api_error", "user_report"].includes(type)) where.type = type;

  const [reports, counts] = await Promise.all([
    prisma.bugReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.bugReport.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const newCount = countFor("new");

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Bug reports"
        description="Captured errors, 404s, API failures and user-submitted issues - everything that goes wrong, in one place."
      />
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="New" value={newCount} icon="alert" accent={newCount > 0} href="/admin/bug-reports?status=new" />
        <StatTile label="Acknowledged" value={countFor("acknowledged")} icon="gauge" href="/admin/bug-reports?status=acknowledged" />
        <StatTile label="Resolved" value={countFor("resolved")} icon="check" href="/admin/bug-reports?status=resolved" />
        <StatTile label="Total" value={reports.length} icon="trail" />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/bug-reports"
          className={`inline-flex h-8 items-center rounded-md border px-3 text-[0.75rem] font-semibold transition-colors ${!status && !type ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-foreground/40"}`}
        >
          All
        </Link>
        {Object.entries(STATUS_META).map(([k, m]) => (
          <Link
            key={k}
            href={`/admin/bug-reports?status=${k}`}
            className={`inline-flex h-8 items-center rounded-md border px-3 text-[0.75rem] font-semibold transition-colors ${status === k ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-foreground/40"}`}
          >
            {m.label} ({countFor(k)})
          </Link>
        ))}
        {Object.entries(TYPE_META).map(([k, m]) => (
          <Link
            key={k}
            href={`/admin/bug-reports?type=${k}`}
            className={`inline-flex h-8 items-center rounded-md border px-3 text-[0.75rem] font-semibold transition-colors ${type === k ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-foreground/40"}`}
          >
            {m.label}
          </Link>
        ))}
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="adm-card p-6 text-center">
            <p className="t-sm text-muted">
              No reports{status ? ` with status "${STATUS_META[status]?.label ?? status}"` : ""}. Either everything
              is working perfectly, or the capture system needs a test.
            </p>
          </div>
        ) : (
          reports.map((r) => {
            const typeMeta = TYPE_META[r.type] ?? TYPE_META.error;
            const statusMeta = STATUS_META[r.status] ?? STATUS_META.new;
            const ctx = (r.context ?? {}) as Record<string, unknown>;
            return (
              <article key={r.id} className="adm-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone={typeMeta.tone}>{typeMeta.label}</Chip>
                      <Chip tone={statusMeta.tone}>{statusMeta.label}</Chip>
                      <span className="tnum t-caption font-mono text-muted">
                        {r.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                      </span>
                    </div>
                    <p className="mt-2 text-[0.875rem] font-semibold text-foreground">{r.message}</p>
                    {r.url ? (
                      <p className="t-caption mt-1 truncate font-mono text-muted">URL: {r.url}</p>
                    ) : null}
                    {ctx.userReport ? (
                      <p className="t-sm mt-2 rounded-md border border-accent/30 bg-accent/[0.04] px-3 py-2 text-foreground">
                        <strong>User said:</strong> {String(ctx.userReport)}
                      </p>
                    ) : null}
                    {r.details ? (
                      <details className="mt-2">
                        <summary className="t-caption cursor-pointer text-muted hover:text-foreground">
                          View technical details
                        </summary>
                        <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-[0.6875rem] leading-relaxed text-foreground/80">
                          {r.details}
                        </pre>
                      </details>
                    ) : null}
                    {ctx.screen || ctx.language ? (
                      <p className="t-caption mt-1 text-muted">
                        {ctx.screen ? `Screen: ${ctx.screen}` : ""}
                        {ctx.screen && ctx.language ? " · " : ""}
                        {ctx.language ? `Lang: ${ctx.language}` : ""}
                      </p>
                    ) : null}
                  </div>

                  {/* Status actions */}
                  <FormGuard action={updateBugStatusAction} className="flex gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    {r.status !== "acknowledged" && r.status !== "resolved" ? (
                      <>
                        <input type="hidden" name="status" value="acknowledged" />
                        <SubmitButton label="Acknowledge" compact />
                      </>
                    ) : r.status !== "resolved" ? (
                      <>
                        <input type="hidden" name="status" value="resolved" />
                        <SubmitButton label="Resolve" compact />
                      </>
                    ) : (
                      <>
                        <input type="hidden" name="status" value="ignored" />
                        <SubmitButton label="Archive" compact />
                      </>
                    )}
                  </FormGuard>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
