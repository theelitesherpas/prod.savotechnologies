import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { IndustryFields } from "@/components/admin/industry-fields";
import { createIndustryAction, importDefaultIndustriesAction } from "./actions";

export const metadata: Metadata = { title: "Industries" };

export default async function IndustriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; imported?: string; e?: string }>;
}) {
  const sp = await searchParams;
  const industries = prisma
    ? await prisma.industry.findMany({ orderBy: [{ order: "asc" }, { title: "asc" }] })
    : [];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="t-h3">Industries</h1>
        <form action={importDefaultIndustriesAction}>
          <button
            type="submit"
            className="t-sm border border-border px-3 py-1.5 text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            Import version-1 defaults
          </button>
        </form>
      </div>
      <p className="t-sm mb-6 text-muted">
        These power the header Industries panel and the future <code>/industries/…</code> pages.
      </p>

      {sp.saved ? <p role="status" className="t-sm mb-4 border border-border bg-foreground/[0.03] px-3 py-2">Saved.</p> : null}
      {sp.deleted ? <p role="status" className="t-sm mb-4 border border-border bg-foreground/[0.03] px-3 py-2">Industry deleted.</p> : null}
      {sp.imported ? (
        <p role="status" className="t-sm mb-4 border border-border bg-foreground/[0.03] px-3 py-2">
          Imported/refreshed {sp.imported} industries from the version-1 defaults.
        </p>
      ) : null}
      {sp.e ? (
        <p role="alert" className="t-sm mb-4 border border-accent/40 bg-accent/5 px-3 py-2 text-accent">
          {sp.e === "dup" ? "That slug is already in use." : "Check the fields, slugs are lowercase/hyphens."}
        </p>
      ) : null}

      {industries.length === 0 ? (
        <div className="mb-8 border border-border bg-background p-8 text-center">
          <p className="t-h4 mb-2">No industries in the database</p>
          <p className="t-sm text-muted">
            The public site currently renders the version-1 defaults. Import them above to edit.
          </p>
        </div>
      ) : (
        <ul className="mb-8 divide-y divide-border border border-border">
          {industries.map((ind) => (
            <li key={ind.id} className="flex flex-wrap items-center gap-3 bg-background px-4 py-3">
              <span className="t-caption tnum w-8 text-muted">{String(ind.order).padStart(2, "0")}</span>
              <Link
                href={`/admin/industries/${ind.id}`}
                className="t-sm min-w-0 flex-1 truncate font-medium text-foreground hover:text-accent"
              >
                {ind.title}
                <span className="t-caption ml-2 text-muted">/industries/{ind.slug}/</span>
              </Link>
              <span className={`t-caption border px-2 py-0.5 ${ind.active ? "border-border text-muted" : "border-accent/50 text-accent"}`}>
                {ind.active ? "Active" : "Hidden"}
              </span>
              <Link
                href={`/admin/industries/${ind.id}`}
                className="t-caption border border-border px-2 py-1 text-foreground/70 hover:border-foreground/40"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}

      <details className="border border-border bg-background">
        <summary className="t-sm cursor-pointer px-4 py-3 font-semibold text-foreground">
          + Add an industry
        </summary>
        <form action={createIndustryAction} className="space-y-4 border-t border-border p-4">
          <IndustryFields />
          <button
            type="submit"
            className="h-10 bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-accent hover:text-on-accent"
          >
            Create industry
          </button>
        </form>
      </details>
    </div>
  );
}
