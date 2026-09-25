import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getClientUser } from "@/lib/client-auth";
import { ProgressRail, StatusChip, MilestoneChip, InvoiceStatusChip, money } from "@/components/portal/ui";

/** One project: status, milestones, delivery log, related payments. */
export default async function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const client = await getClientUser();
  if (!client) redirect("/portal");
  if (!prisma) redirect("/portal");

  const { id } = await params;
  const project = await prisma.clientProject.findFirst({
    where: { id, clientId: client.id },
    include: {
      milestones: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
      updates: { orderBy: { createdAt: "desc" }, take: 12 },
      invoices: { orderBy: { issuedAt: "desc" } },
    },
  });
  if (!project) notFound();

  const fmt = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <div className="shell space-y-14 py-12 sm:py-16">
      {/* Header */}
      <header>
        <Link href="/portal/projects" className="t-caption text-muted transition-colors hover:text-foreground">
          ← All projects
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="t-label tnum text-accent">{project.code}</p>
            <h1 className="t-h2 mt-3">{project.title}</h1>
          </div>
          <StatusChip status={project.status} />
        </div>
        {project.summary ? <p className="t-body mt-5 max-w-2xl text-muted">{project.summary}</p> : null}
        <div className="mt-8">
          <ProgressRail value={project.progress} />
          <div className="mt-3 flex flex-wrap justify-between gap-3">
            <p className="t-caption tnum text-muted">{project.progress}% complete</p>
            <p className="t-caption tnum text-muted">
              {fmt(project.startDate) ? `Started ${fmt(project.startDate)}` : ""}
              {project.dueDate ? ` · Due ${fmt(project.dueDate)}` : ""}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-12 lg:grid-cols-12">
        {/* Milestones */}
        <section aria-labelledby="pr-milestones" className="lg:col-span-7">
          <h2 id="pr-milestones" className="t-h3 mb-6">Milestones</h2>
          {project.milestones.length === 0 ? (
            <p className="t-sm border border-border bg-surface p-6 text-muted">Milestones publish as the plan firms up.</p>
          ) : (
            <ol className="divide-y divide-border border border-border bg-surface">
              {project.milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 p-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 ${m.status === "done" ? "bg-[rgb(30_122_63)]" : m.status === "in_progress" ? "bg-accent" : "bg-muted/40"}`}
                    />
                    <div className="min-w-0">
                      <p className={`t-sm font-medium ${m.status === "pending" ? "text-muted" : "text-foreground"}`}>{m.title}</p>
                      {m.dueDate ? (
                        <p className="t-caption mt-0.5 text-muted">Due {fmt(m.dueDate)}</p>
                      ) : null}
                    </div>
                  </div>
                  <MilestoneChip status={m.status} />
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Delivery log */}
        <section aria-labelledby="pr-log" className="lg:col-span-5">
          <h2 id="pr-log" className="t-h3 mb-6">Delivery log</h2>
          {project.updates.length === 0 ? (
            <p className="t-sm border border-border bg-surface p-6 text-muted">No updates posted yet.</p>
          ) : (
            <ol className="relative space-y-7 border-l border-border pl-6">
              {project.updates.map((u) => (
                <li key={u.id} className="relative">
                  <span aria-hidden="true" className="absolute -left-[27px] top-[7px] h-2 w-2 bg-accent" />
                  <p className="t-sm font-semibold">{u.title}</p>
                  {u.body ? <p className="t-caption mt-1.5 leading-relaxed text-muted">{u.body}</p> : null}
                  <p className="t-caption mt-1.5 text-muted/70">{fmt(u.createdAt)}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Related payments */}
      {project.invoices.length > 0 ? (
        <section aria-labelledby="pr-payments">
          <h2 id="pr-payments" className="t-h3 mb-6">Payments for this project</h2>
          <ul className="divide-y divide-border border border-border bg-surface">
            {project.invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="t-sm font-semibold tnum">{inv.number}</p>
                  <p className="t-caption mt-1 text-muted">
                    Issued {fmt(inv.issuedAt)}
                    {inv.dueDate ? ` · due ${fmt(inv.dueDate)}` : ""}
                    {inv.paidAt ? ` · paid ${fmt(inv.paidAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="t-sm font-semibold tnum">{money(inv.amount, inv.currency)}</p>
                  <InvoiceStatusChip status={inv.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
