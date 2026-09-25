import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackLink, PageHeader, Notice } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { updateClientAction, resetClientPasswordAction } from "../actions";

export const metadata: Metadata = { title: "Edit client" };

export default async function EditClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { id } = await params;
  const { e } = await searchParams;
  if (!prisma) notFound();

  const client = await prisma.clientUser.findUnique({
    where: { id },
    include: { projects: { orderBy: { updatedAt: "desc" } } },
  });
  if (!client) notFound();

  const input = "adm-input w-full";

  return (
    <div className="max-w-3xl">
      <BackLink href="/admin/clients" label="All clients" />
      <PageHeader title="Edit client" description={client.email} />
      {e === "invalid" ? <Notice kind="alert">Check the fields — name and a valid email are required.</Notice> : null}
      {e === "dup" ? <Notice kind="alert">That email is already used by another client.</Notice> : null}

      <form action={updateClientAction} className="adm-card mb-6 space-y-5 p-5">
        <input type="hidden" name="id" value={client.id} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="cl-name">Name *</label>
            <input id="cl-name" name="name" required maxLength={80} defaultValue={client.name} className={input} />
          </div>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="cl-email">Email *</label>
            <input id="cl-email" name="email" type="email" required maxLength={120} defaultValue={client.email} className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className="adm-label mb-1.5 block" htmlFor="cl-company">Company</label>
            <input id="cl-company" name="company" maxLength={120} defaultValue={client.company} className={input} />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[0.875rem] font-medium text-foreground">
          <input type="checkbox" name="active" defaultChecked={client.active} className="h-4 w-4 accent-[var(--accent)]" />
          Account active (can sign in)
        </label>
        <SubmitButton label="Save client" />
      </form>

      <form action={resetClientPasswordAction} className="adm-card mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="adm-label">Password</p>
          <p className="t-caption mt-1 text-muted">Generates a new one-time password and signs out all their sessions.</p>
        </div>
        <input type="hidden" name="id" value={client.id} />
        <SubmitButton label="Reset password" pendingLabel="Generating…" />
      </form>

      {client.projects.length > 0 ? (
        <div className="adm-card p-5">
          <p className="adm-label mb-3">Their projects</p>
          <ul className="divide-y divide-border">
            {client.projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <span className="t-sm">
                  <span className="tnum text-muted">{p.code}</span> · {p.title}
                </span>
                <a href={`/admin/projects/${p.id}`} className="t-caption text-muted transition-colors hover:text-accent">
                  Edit →
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
