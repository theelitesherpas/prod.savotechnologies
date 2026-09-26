import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackLink, PageHeader, Notice } from "@/components/admin/ui";
import { CaseStudyForm } from "@/components/admin/case-study-form";
import { caseStudySchema, type CaseStudyRecord } from "@/lib/case-study-schema";
import { saveCaseStudyAction } from "../actions";

export const metadata: Metadata = { title: "Edit case study" };

export default async function EditCaseStudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { id } = await params;
  const { e } = await searchParams;
  if (!prisma) notFound();

  const item = await prisma.contentItem.findUnique({ where: { id } });
  if (!item || item.collection !== "case-studies") notFound();

  const parsed = caseStudySchema.safeParse(item.data ?? {});
  if (!parsed.success) {
    return (
      <div className="max-w-4xl">
        <BackLink href="/admin/case-studies" label="All case studies" />
        <PageHeader title="Edit case study" description={item.title} />
        <Notice kind="alert">
          This record failed schema validation (it may predate the rich editor). Its data is preserved -
          re-enter the fields below once and save to migrate it.
        </Notice>
        <CaseStudyForm action={saveCaseStudyAction} item={{ id: item.id, slug: item.slug, contentStatus: item.contentStatus }} />
      </div>
    );
  }

  // Defaults for fields added after the record was written.
  const record: CaseStudyRecord = {
    ...parsed.data,
    services: parsed.data.services ?? [],
    technologies: parsed.data.technologies ?? [],
    results: parsed.data.results ?? [],
    palette: parsed.data.palette ?? [],
  };

  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/case-studies" label="All case studies" />
      <PageHeader title="Edit case study" description={`${item.title} · /case-studies/${item.slug}`} />
      {e === "invalid" ? <Notice kind="alert">Check the fields - the record failed validation.</Notice> : null}
      <CaseStudyForm
        action={saveCaseStudyAction}
        item={{ id: item.id, slug: item.slug, contentStatus: item.contentStatus, record }}
      />
    </div>
  );
}
