import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ServiceFields } from "@/components/admin/service-fields";
import { PageHeader, Notice, Chip, EmptyState } from "@/components/admin/ui";
import { AdminIcon } from "@/components/admin/icons";
import { SubmitButton } from "@/components/admin/form";
import {
  createServiceAction,
  toggleServiceActiveAction,
  importDefaultServicesAction,
} from "./actions";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; imported?: string; e?: string }>;
}) {
  const sp = await searchParams;
  const services = prisma
    ? await prisma.service.findMany({ orderBy: [{ order: "asc" }, { title: "asc" }] })
    : [];

  return (
    <>
      <PageHeader
        title="Services"
        description="These power the header Services panel, the homepage services section and the /services/ directory. Until rows exist, the site falls back to the coded defaults."
        actions={
          services.length === 0 ? (
            <form action={importDefaultServicesAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-[0.875rem] font-semibold text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                <AdminIcon name="import" className="h-4 w-4" />
                Import defaults
              </button>
            </form>
          ) : null
        }
      />

      {sp.saved === "1" ? <Notice>Service saved. Public pages regenerate on the next request.</Notice> : null}
      {sp.deleted ? <Notice>Service deleted.</Notice> : null}
      {sp.imported ? <Notice>Imported/refreshed {sp.imported} services from the coded defaults.</Notice> : null}
      {sp.e === "dup" ? <Notice kind="alert">That slug is already in use, choose another.</Notice> : null}
      {sp.e === "invalid" ? (
        <Notice kind="alert">Check the fields, titles need 2–80 characters, slugs lowercase/hyphens.</Notice>
      ) : null}

      {services.length === 0 ? (
        <EmptyState
          title="No services in the database"
          message="The public site currently renders the coded defaults. Import them above to make the collection editable, or add the first row below."
        />
      ) : (
        <div className="adm-card mb-10 overflow-hidden">
          <table className="adm-hairline-table w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="adm-label w-14 px-4 py-3">Order</th>
                <th scope="col" className="adm-label px-4 py-3">Service</th>
                <th scope="col" className="adm-label hidden px-4 py-3 sm:table-cell">Flags</th>
                <th scope="col" className="adm-label w-56 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="tnum px-4 py-3 font-mono text-[0.6875rem] text-muted">
                    {String(s.order).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/services/${s.id}`}
                      className="block max-w-md truncate text-[0.875rem] font-semibold text-foreground transition-colors hover:text-accent"
                    >
                      {s.title}
                    </Link>
                    <span className="t-caption font-mono text-muted">/services/{s.slug}/</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {s.featured ? <Chip tone="accent">Featured</Chip> : null}
                      {s.active ? <Chip tone="success">Published</Chip> : <Chip tone="warning">Hidden</Chip>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleServiceActiveAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="active" value={s.active ? "false" : "true"} />
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3.5 text-[0.8125rem] font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
                        >
                          <AdminIcon name={s.active ? "eyeOff" : "eye"} className="h-3.5 w-3.5" />
                          {s.active ? "Hide" : "Show"}
                        </button>
                      </form>
                      <Link
                        href={`/admin/services/${s.id}`}
                        className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 text-[0.8125rem] font-semibold text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create */}
      <details className="adm-card overflow-hidden">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3.5 text-[0.875rem] font-semibold text-foreground">
          <AdminIcon name="plus" className="h-4 w-4 text-accent" />
          Add a service
        </summary>
        <form action={createServiceAction} className="space-y-5 border-t border-border p-5">
          <ServiceFields />
          <SubmitButton label="Create service" />
        </form>
      </details>
    </>
  );
}
