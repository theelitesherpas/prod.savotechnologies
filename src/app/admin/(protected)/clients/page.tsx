import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, Chip, EmptyState } from "@/components/admin/ui";
import { SubmitButton, ConfirmButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { deleteClientAction } from "./actions";

export const metadata: Metadata = { title: "Clients" };

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; reset?: string; saved?: string; deleted?: string; pw?: string; e?: string }>;
}) {
  const sp = await searchParams;
  const clients = prisma
    ? await prisma.clientUser
        .findMany({
          orderBy: { createdAt: "desc" },
          include: { projects: { select: { id: true, status: true } } },
        })
        .catch(() => [])
    : [];

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Clients"
        description="Portal accounts - create a client, hand them their one-time password, then publish their projects and payments."
      />

      {sp.created === "1" && sp.pw ? (
        <Notice>
          Client created. One-time password (shown once, copy it now):{" "}
          <strong className="tnum select-all">{sp.pw}</strong>
        </Notice>
      ) : null}
      {sp.reset === "1" && sp.pw ? (
        <Notice>
          Password reset, existing sessions revoked. New one-time password:{" "}
          <strong className="tnum select-all">{sp.pw}</strong>
        </Notice>
      ) : null}
      {sp.saved ? <Notice>Client saved.</Notice> : null}
      {sp.deleted ? <Notice>Client deleted (with their projects and payments).</Notice> : null}
      {sp.e ? <Notice kind="alert">{sp.e}</Notice> : null}

      {/* Existing clients */}
      {clients.length > 0 ? (
        <ul className="adm-card mb-10 divide-y divide-border">
          {clients.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/clients/${c.id}`} className="truncate text-[0.9375rem] font-semibold text-foreground hover:text-accent">
                    {c.name}
                  </Link>
                  {!c.active ? <Chip tone="muted">disabled</Chip> : null}
                </div>
                <p className="t-caption mt-1 text-muted">
                  {c.email}
                  {c.company ? ` · ${c.company}` : ""} · {c.projects.length} project{c.projects.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/clients/${c.id}`}
                  className="t-caption rounded-lg border border-border px-3 py-1.5 text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/projects?client=${c.id}`}
                  className="t-caption rounded-lg border border-border px-3 py-1.5 text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  Projects
                </Link>
                <form action={deleteClientAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmButton label="Delete" confirmLabel="Really delete?" />
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No clients yet" message="Create the first portal account below." />
      )}

      {/* Create */}
      <form action={"../clients/create"} className="hidden" />
      <CreateClientCard />
    </div>
  );
}

import { createClientAction } from "./actions";

function CreateClientCard() {
  const input = "adm-input w-full";
  return (
    <FormGuard action={createClientAction} className="adm-card space-y-5 p-5">
      <p className="adm-label">New client account</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="adm-label mb-1.5 block" htmlFor="cl-name">Name *</label>
          <input id="cl-name" name="name" required maxLength={80} className={input} placeholder="Meera Krishnan" />
        </div>
        <div>
          <label className="adm-label mb-1.5 block" htmlFor="cl-email">Email *</label>
          <input id="cl-email" name="email" type="email" required maxLength={120} className={input} placeholder="meera@company.com" />
        </div>
        <div className="sm:col-span-2">
          <label className="adm-label mb-1.5 block" htmlFor="cl-company">Company</label>
          <input id="cl-company" name="company" maxLength={120} className={input} placeholder="Company name (optional)" />
        </div>
        <div className="sm:col-span-2">
          <label className="adm-label mb-1.5 block" htmlFor="cl-password">Password (optional)</label>
          <input id="cl-password" name="password" maxLength={64} className={input} placeholder="Leave empty to auto-generate" />
          <p className="t-caption mt-1.5 text-muted">The one-time password is shown once after saving - share it securely with the client.</p>
        </div>
      </div>
      <SubmitButton label="Create client" />
    </FormGuard>
  );
}
