import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClientUser } from "@/lib/client-auth";
import { ProgressRail, StatusChip } from "@/components/portal/ui";

/** All of the client's projects. */
export default async function PortalProjectsPage() {
  const client = await getClientUser();
  if (!client) redirect("/portal");
  if (!prisma) redirect("/portal");

  const projects = await prisma.clientProject.findMany({
    where: { clientId: client.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="shell py-12 sm:py-16">
      <header className="mb-10">
        <p className="t-label text-accent">Projects</p>
        <h1 className="t-h2 mt-3">Everything we are building for you.</h1>
      </header>

      {projects.length === 0 ? (
        <p className="t-sm border border-border bg-surface p-6 text-muted">
          No projects yet — your delivery lead will publish the first one here at kickoff.
        </p>
      ) : (
        <ul className="grid gap-px border border-border bg-border lg:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id}>
              <a href={`/portal/projects/${p.id}`} className="group block h-full bg-background p-7 transition-colors hover:bg-surface">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="t-label tnum text-muted">{p.code}</p>
                    <h2 className="t-h4 mt-1.5 transition-colors group-hover:text-accent">{p.title}</h2>
                  </div>
                  <StatusChip status={p.status} />
                </div>
                {p.summary ? <p className="t-caption mt-4 leading-relaxed text-muted">{p.summary}</p> : null}
                <ProgressRail value={p.progress} className="mt-5" />
                <p className="t-caption tnum mt-3 text-muted">
                  {p.progress}% complete
                  {p.dueDate ? ` · due ${new Date(p.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
