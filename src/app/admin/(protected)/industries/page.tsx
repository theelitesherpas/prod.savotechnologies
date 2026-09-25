import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { IndustryFields } from "@/components/admin/industry-fields";
import { PageHeader, Notice, Chip, EmptyState } from "@/components/admin/ui";
import { AdminIcon } from "@/components/admin/icons";
import { SubmitButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import {
  createIndustryAction,
  toggleIndustryActiveAction,
  importDefaultIndustriesAction,
} from "./actions";

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
    <>
      <PageHeader
        title="Industries"
        description="These power the header Industries panel, the homepage industries section and the /industries/ atlas. Until rows exist, the site falls back to the coded defaults."
        actions={
          industries.length === 0 ? (
            <form action={importDefaultIndustriesAction}>
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

      {sp.saved === "1" ? <Notice>Industry saved. Public pages regenerate on the next request.</Notice> : null}
      {sp.deleted ? <Notice>Industry deleted.</Notice> : null}
      {sp.imported ? <Notice>Imported/refreshed {sp.imported} industries from the coded defaults.</Notice> : null}
      {sp.e === "dup" ? <Notice kind="alert">That slug is already in use, choose another.</Notice> : null}
      {sp.e === "invalid" ? (
        <Notice kind="alert">Check the fields, titles need 2–80 characters, slugs lowercase/hyphens.</Notice>
      ) : null}

      {industries.length === 0 ? (
        <EmptyState
          title="No industries in the database"
          message="The public site currently renders the coded defaults. Import them above to make the collection editable, or add the first row below."
        />
      ) : (
        <div className="adm-card mb-10 overflow-hidden">
          <table className="adm-hairline-table w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="adm-label w-14 px-4 py-3">Order</th>
                <th scope="col" className="adm-label px-4 py-3">Industry</th>
                <th scope="col" className="adm-label w-32 px-4 py-3">Status</th>
                <th scope="col" className="adm-label w-56 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {industries.map((s) => (
                <tr key={s.id}>
                  <td className="tnum px-4 py-3 font-mono text-[0.6875rem] text-muted">
                    {String(s.order).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/industries/${s.id}`}
                      className="block max-w-md truncate text-[0.875rem] font-semibold text-foreground transition-colors hover:text-accent"
                    >
                      {s.title}
                    </Link>
                    <span className="t-caption font-mono text-muted">/industries/{s.slug}/</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.active ? <Chip tone="success">Published</Chip> : <Chip tone="warning">Hidden</Chip>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleIndustryActiveAction}>
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
                        href={`/admin/industries/${s.id}`}
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
          Add an industry
        </summary>
        <FormGuard action={createIndustryAction} className="space-y-5 border-t border-border p-5">
          <IndustryFields />
          <SubmitButton label="Create industry" />
        </FormGuard>
      </details>
    </>
  );
}
