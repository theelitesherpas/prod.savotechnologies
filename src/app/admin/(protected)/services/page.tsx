import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ServiceFields } from "@/components/admin/service-fields";
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
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="t-h3">Services</h1>
        <form action={importDefaultServicesAction}>
          <button
            type="submit"
            className="t-sm border border-border px-3 py-1.5 text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            Import version-1 defaults
          </button>
        </form>
      </div>
      <p className="t-sm mb-6 text-muted">
        These power the header Services panel and the future <code>/services/…</code> pages.
        Until rows exist, the site falls back to the version-1 constants.
      </p>

      {sp.saved ? <p role="status" className="t-sm mb-4 border border-border bg-foreground/[0.03] px-3 py-2">Service saved.</p> : null}
      {sp.deleted ? <p role="status" className="t-sm mb-4 border border-border bg-foreground/[0.03] px-3 py-2">Service deleted.</p> : null}
      {sp.imported ? (
        <p role="status" className="t-sm mb-4 border border-border bg-foreground/[0.03] px-3 py-2">
          Imported/refreshed {sp.imported} services from the version-1 defaults.
        </p>
      ) : null}
      {sp.e === "dup" ? (
        <p role="alert" className="t-sm mb-4 border border-accent/40 bg-accent/5 px-3 py-2 text-accent">
          That slug is already in use, choose another.
        </p>
      ) : null}
      {sp.e === "invalid" ? (
        <p role="alert" className="t-sm mb-4 border border-accent/40 bg-accent/5 px-3 py-2 text-accent">
          Check the fields, titles need 2–80 characters, slugs lowercase/hyphens.
        </p>
      ) : null}

      {/* List */}
      {services.length === 0 ? (
        <div className="mb-8 border border-border bg-background p-8 text-center">
          <p className="t-h4 mb-2">No services in the database</p>
          <p className="t-sm mb-4 text-muted">
            The public site currently renders the version-1 defaults. Import them
            above to make the collection editable, or add the first row below.
          </p>
        </div>
      ) : (
        <ul className="mb-8 divide-y divide-border border border-border">
          {services.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 bg-background px-4 py-3">
              <span className="t-caption tnum w-8 text-muted">{String(s.order).padStart(2, "0")}</span>
              <Link
                href={`/admin/services/${s.id}`}
                className="t-sm min-w-0 flex-1 truncate font-medium text-foreground hover:text-accent"
              >
                {s.title}
                <span className="t-caption ml-2 text-muted">/services/{s.slug}/</span>
              </Link>
              {s.featured ? (
                <span className="t-caption border border-foreground/30 px-2 py-0.5 text-foreground/70">FEATURED</span>
              ) : null}
              <span className={`t-caption border px-2 py-0.5 ${s.active ? "border-border text-muted" : "border-accent/50 text-accent"}`}>
                {s.active ? "Active" : "Hidden"}
              </span>
              <form action={toggleServiceActiveAction}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="active" value={s.active ? "false" : "true"} />
                <button type="submit" className="t-caption border border-border px-2 py-1 text-foreground/70 hover:border-foreground/40">
                  {s.active ? "Hide" : "Show"}
                </button>
              </form>
              <Link
                href={`/admin/services/${s.id}`}
                className="t-caption border border-border px-2 py-1 text-foreground/70 hover:border-foreground/40"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Create */}
      <details className="border border-border bg-background">
        <summary className="t-sm cursor-pointer px-4 py-3 font-semibold text-foreground">
          + Add a service
        </summary>
        <form action={createServiceAction} className="space-y-4 border-t border-border p-4">
          <ServiceFields />
          <button
            type="submit"
            className="h-10 bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-accent hover:text-on-accent"
          >
            Create service
          </button>
        </form>
      </details>
    </div>
  );
}
