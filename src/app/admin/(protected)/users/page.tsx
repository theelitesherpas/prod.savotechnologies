import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { PageHeader, Notice, Chip, DangerZone } from "@/components/admin/ui";
import { AdminIcon } from "@/components/admin/icons";
import { SubmitButton, ConfirmButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { SECTIONS } from "@/lib/permissions";
import { createUserAction, updateUserAction, deleteUserAction } from "./actions";

export const metadata: Metadata = { title: "Panel users" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; e?: string }>;
}) {
  const user = await getAdminUser();
  if (user?.role !== "admin") redirect("/admin");
  const sp = await searchParams;

  const users = prisma
    ? await prisma.adminUser.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          createdAt: true,
          _count: { select: { sessions: true, auditLogs: true } },
        },
      })
    : [];

  return (
    <>
      <PageHeader
        title="Panel users"
        description="Admins have full access including user management. Editors get exactly the sections you check — everything else is hidden and unreachable."
      />

      {sp.saved === "created" ? <Notice>User created. They can sign in immediately.</Notice> : null}
      {sp.saved === "updated" ? <Notice>User updated.</Notice> : null}
      {sp.saved === "deleted" ? <Notice>User deleted. Their sessions were revoked.</Notice> : null}
      {sp.e === "dup" ? <Notice kind="alert">That email is already registered.</Notice> : null}
      {sp.e === "self" ? <Notice kind="alert">You cannot demote or delete your own account.</Notice> : null}
      {sp.e && sp.e !== "dup" && sp.e !== "self" ? (
        <Notice kind="alert">{decodeURIComponent(sp.e)}</Notice>
      ) : null}

      <div className="adm-card mb-10 overflow-hidden">
        <table className="adm-hairline-table w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="adm-label px-4 py-3">User</th>
              <th scope="col" className="adm-label hidden px-4 py-3 sm:table-cell">Activity</th>
              <th scope="col" className="adm-label px-4 py-3">Role</th>
              <th scope="col" className="adm-label w-40 px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <FormGuard action={updateUserAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input
                      name="name"
                      defaultValue={u.name}
                      required
                      minLength={2}
                      maxLength={80}
                      aria-label={`Name for ${u.email}`}
                      className="adm-input h-9 w-44"
                    />
                    <select
                      name="role"
                      defaultValue={u.role}
                      aria-label={`Role for ${u.email}`}
                      className="adm-select h-9 w-28"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                    </select>
                    <SubmitButton label="Save user" pendingLabel="Saving…" compact />
                    <span className="t-caption block w-full truncate text-muted">
                      {u.email}
                      {u.id === user.id ? " · you" : ""}
                    </span>
                    <fieldset className="w-full border-t border-border pt-2.5">
                      <legend className="t-caption font-semibold text-muted">Section access {u.role === "admin" ? "(admin — full access)" : ""}</legend>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1.5">
                        {SECTIONS.map((sec) => (
                          <label key={sec.key} className="flex cursor-pointer items-center gap-1.5 text-[0.75rem] font-medium text-foreground/85">
                            <input
                              type="checkbox"
                              name="permissions"
                              value={sec.key}
                              defaultChecked={u.role === "admin" || (Array.isArray(u.permissions) && (u.permissions as string[]).includes(sec.key))}
                              disabled={u.role === "admin"}
                              className="h-3.5 w-3.5 accent-[var(--accent)]"
                            />
                            {sec.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </FormGuard>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="t-caption text-muted">
                    {u._count.auditLogs} logged actions
                    <span className="tnum font-mono"> · joined {u.createdAt.toISOString().slice(0, 10)}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.role === "admin" ? <Chip tone="accent">Admin</Chip> : <Chip tone="default">Editor</Chip>}
                </td>
                <td className="px-4 py-3">
                  {u.id !== user.id ? (
                    <div className="flex justify-end">
                      <form action={deleteUserAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <ConfirmButton label="Remove" confirmLabel="Confirm" />
                      </form>
                    </div>
                  ) : (
                    <p className="t-caption text-right text-muted">—</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section aria-labelledby="invite-heading" className="max-w-xl">
        <h2 id="invite-heading" className="text-[1.0625rem] mb-4 font-bold tracking-[-0.01em]">
          Add a panel user
        </h2>
        <FormGuard action={createUserAction} className="adm-card space-y-5 p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="new-name" className="adm-label mb-1.5 block">
                Name
              </label>
              <input id="new-name" name="name" required minLength={2} maxLength={80} className="adm-input" />
            </div>
            <div>
              <label htmlFor="new-email" className="adm-label mb-1.5 block">
                Email
              </label>
              <input id="new-email" name="email" type="email" required maxLength={160} className="adm-input" />
            </div>
            <div>
              <label htmlFor="new-password" className="adm-label mb-1.5 block">
                Temporary password
              </label>
              <input
                id="new-password"
                name="password"
                type="text"
                required
                minLength={10}
                maxLength={200}
                autoComplete="off"
                placeholder="At least 10 characters"
                className="adm-input font-mono text-[0.8125rem]"
              />
            </div>
            <div>
              <label htmlFor="new-role" className="adm-label mb-1.5 block">
                Role
              </label>
              <select id="new-role" name="role" defaultValue="editor" className="adm-select">
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
              </select>
            </div>
          </div>
          <fieldset className="border-t border-border pt-4">
            <legend className="t-caption font-semibold text-muted">Section access (for Editors)</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2">
              {SECTIONS.map((sec) => (
                <label key={sec.key} className="flex cursor-pointer items-center gap-1.5 text-[0.75rem] font-medium text-foreground/85" title={sec.hint}>
                  <input type="checkbox" name="permissions" value={sec.key} defaultChecked={false} className="h-3.5 w-3.5 accent-[var(--accent)]" />
                  {sec.label}
                </label>
              ))}
            </div>
            <p className="t-caption mt-2 text-muted">Admins always get full access. Editors see and reach exactly the checked sections.</p>
          </fieldset>
          <div className="flex items-center gap-3 border-t border-border pt-5">
            <SubmitButton label="Create user" />
            <p className="t-caption text-muted">Share the password privately; it is stored hashed.</p>
          </div>
        </FormGuard>
      </section>

      <div className="mt-8 max-w-xl">
        <DangerZone title="Notes">
          <ul className="t-sm space-y-1.5 text-muted">
            <li className="flex gap-2">
              <AdminIcon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              Deleting a user revokes their sessions immediately; their audit trail is preserved.
            </li>
            <li className="flex gap-2">
              <AdminIcon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              You cannot delete or demote your own account.
            </li>
          </ul>
        </DangerZone>
      </div>
    </>
  );
}
