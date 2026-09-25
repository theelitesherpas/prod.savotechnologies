import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getClientUser } from "@/lib/client-auth";
import { ProgressRail, StatusChip, InvoiceStatusChip, money } from "@/components/portal/ui";

/**
 * Overview — active projects at a glance, next payments, latest delivery log.
 */
export default async function PortalDashboard() {
  const client = await getClientUser();
  if (!client) redirect("/portal");
  if (!prisma) redirect("/portal");

  const [projects, invoices] = await Promise.all([
    prisma.clientProject.findMany({
      where: { clientId: client.id, status: { notIn: ["cancelled"] } },
      orderBy: { updatedAt: "desc" },
      include: { updates: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.invoice.findMany({
      where: { clientId: client.id, status: { in: ["sent", "overdue"] } },
      orderBy: { dueDate: "asc" },
      take: 3,
    }),
  ]);

  const active = projects.filter((p) => !["delivered", "cancelled"].includes(p.status));
  const latestUpdates = projects
    .flatMap((p) => p.updates.map((u) => ({ ...u, project: { code: p.code, title: p.title } })))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 4);

  return (
    <div className="shell space-y-14 py-12 sm:py-16">
      {/* Greeting + headline numbers */}
      <header>
        <p className="t-label text-accent">Overview</p>
        <h1 className="t-h2 mt-3">Welcome back, {client.name.split(" ")[0]}.</h1>
        <dl className="mt-8 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
          {[
            { k: "Active projects", v: String(active.length) },
            { k: "In delivery", v: active.length ? `${Math.round(active.reduce((s, p) => s + p.progress, 0) / active.length)}%` : "—" },
            { k: "Payments due", v: String(invoices.length) },
            { k: "Member since", v: "" },
          ].map((s, i) => (
            <div key={s.k} className="bg-background p-5">
              <dt className="t-label text-muted">{s.k}</dt>
              <dd className="t-h4 tnum mt-2">{i === 3 ? "" : s.v || "0"}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Projects */}
      <section aria-labelledby="db-projects">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="db-projects" className="t-h3">Your projects</h2>
          <Link href="/portal/projects" className="t-sm font-semibold text-muted transition-colors hover:text-accent">
            All projects →
          </Link>
        </div>
        {projects.length === 0 ? (
          <p className="t-sm border border-border bg-surface p-6 text-muted">
            No projects yet — your delivery lead will publish the first one here at kickoff.
          </p>
        ) : (
          <ul className="grid gap-px border border-border bg-border lg:grid-cols-2">
            {projects.slice(0, 4).map((p) => (
              <li key={p.id} className="bg-background p-6">
                <Link href={`/portal/projects/${p.id}`} className="group block">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="t-label tnum text-muted">{p.code}</p>
                      <h3 className="t-h4 mt-1.5 transition-colors group-hover:text-accent">{p.title}</h3>
                    </div>
                    <StatusChip status={p.status} />
                  </div>
                  <ProgressRail value={p.progress} className="mt-5" />
                  <p className="t-caption tnum mt-3 text-muted">
                    {p.progress}% complete
                    {p.dueDate ? ` · due ${new Date(p.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Payments due + latest log */}
      <div className="grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="db-payments">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 id="db-payments" className="t-h3">Payments due</h2>
            <Link href="/portal/invoices" className="t-sm font-semibold text-muted transition-colors hover:text-accent">
              All payments →
            </Link>
          </div>
          {invoices.length === 0 ? (
            <p className="t-sm border border-border bg-surface p-6 text-muted">Nothing due — you are all settled.</p>
          ) : (
            <ul className="divide-y divide-border border border-border bg-surface">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="t-sm font-semibold tnum">{inv.number}</p>
                    <p className="t-caption mt-1 text-muted">
                      {inv.dueDate ? `Due ${new Date(inv.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "Issued"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="t-sm font-semibold tnum">{money(inv.amount, inv.currency)}</p>
                    <InvoiceStatusChip status={inv.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="db-log">
          <h2 id="db-log" className="t-h3 mb-6">Latest from delivery</h2>
          {latestUpdates.length === 0 ? (
            <p className="t-sm border border-border bg-surface p-6 text-muted">
              Updates from your delivery lead will appear here.
            </p>
          ) : (
            <ol className="relative space-y-6 border-l border-border pl-6">
              {latestUpdates.map((u) => (
                <li key={u.id} className="relative">
                  <span aria-hidden="true" className="absolute -left-[27px] top-[7px] h-2 w-2 bg-accent" />
                  <p className="t-sm font-semibold">{u.title}</p>
                  <p className="t-caption mt-1 text-muted">
                    {u.project.code} · {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {u.project.title}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
