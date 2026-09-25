import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, Chip, EmptyState } from "@/components/admin/ui";
import { caseStudySchema } from "@/lib/case-study-schema";
import { CASE_DISCIPLINES } from "@/constants/case-studies";
import { IS_DEMO } from "@/lib/content-mode";
import { deleteCaseStudyAction } from "./actions";
import { ConfirmButton } from "@/components/admin/form";

export const metadata: Metadata = { title: "Case studies" };

const SAVED_MESSAGES: Record<string, string> = {
  created: "Case study created. Publish it when the content is verified.",
  updated: "Changes saved.",
  deleted: "Case study deleted.",
  status: "Lifecycle updated.",
};

const STATUS_TONE: Record<string, "default" | "accent" | "success" | "warning" | "muted"> = {
  draft: "muted",
  demo: "warning",
  review: "default",
  verified: "default",
  published: "success",
};

export default async function AdminCaseStudiesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; e?: string }>;
}) {
  const sp = await searchParams;

  const rows = prisma
    ? await prisma.contentItem
        .findMany({ where: { collection: "case-studies" }, orderBy: { updatedAt: "desc" } })
        .catch(() => [])
    : [];

  const parsed = rows.flatMap((row) => {
    const res = caseStudySchema.safeParse(row.data ?? {});
    const discipline = CASE_DISCIPLINES.find((d) => d.id === res.data?.discipline);
    return [
      {
        id: row.id,
        slug: row.slug,
        title: row.title,
        discipline: discipline?.title ?? String((row.data as Record<string, unknown>)?.discipline ?? "—"),
        contentStatus: row.contentStatus,
        published: row.contentStatus === "published",
        updatedAt: row.updatedAt,
        valid: res.success,
      },
    ];
  });

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Case studies"
        description={`Full-dossier editor: identity, discipline, capabilities, stack, outcomes, palette and testimonial. Only published records render on the public site.${
          IS_DEMO ? " Staging also shows the coded demo dossiers (Meridian, NovaFlow, Aster, Northstar) until DB records exist." : ""
        }`}
        actions={
          <Link
            href="/admin/case-studies/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-[0.875rem] font-semibold text-on-accent shadow-sm transition-colors hover:bg-accent-hover"
          >
            New case study
          </Link>
        }
      />

      {sp.saved && SAVED_MESSAGES[sp.saved] ? <Notice>{SAVED_MESSAGES[sp.saved]}</Notice> : null}
      {sp.e === "invalid" ? <Notice kind="alert">Check the fields — the record failed validation.</Notice> : null}
      {sp.e === "dup" ? <Notice kind="alert">That slug is already in use.</Notice> : null}
      {sp.e === "db" ? <Notice kind="alert">Database unavailable — start PostgreSQL and retry.</Notice> : null}

      {parsed.length === 0 ? (
        <EmptyState
          title="No case-study records yet"
          message="Create the first dossier, or keep running on the coded defaults. Published records replace the defaults on the public site."
        />
      ) : (
        <ul className="adm-card divide-y divide-border">
          {parsed.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/case-studies/${row.id}`} className="truncate text-[0.9375rem] font-semibold text-foreground hover:text-accent">
                    {row.title}
                  </Link>
                  <Chip tone={STATUS_TONE[row.contentStatus] ?? "muted"}>{row.contentStatus}</Chip>
                  {!row.valid ? <Chip tone="warning">invalid data</Chip> : null}
                </div>
                <p className="t-caption mt-1 text-muted">
                  {row.discipline} · /case-studies/{row.slug} · updated{" "}
                  {new Date(row.updatedAt).toISOString().slice(0, 16).replace("T", " ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {row.published ? (
                  <Link
                    href={`/case-studies/${row.slug}`}
                    className="t-caption rounded-lg border border-border px-3 py-1.5 text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
                  >
                    View live
                  </Link>
                ) : null}
                <Link
                  href={`/admin/case-studies/${row.id}`}
                  className="t-caption rounded-lg border border-border px-3 py-1.5 text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  Edit
                </Link>
                <form action={deleteCaseStudyAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <ConfirmButton label="Delete" confirmLabel="Really delete?" />
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
