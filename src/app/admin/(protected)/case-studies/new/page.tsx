import { requireAdminPage } from "@/lib/permissions";
import type { Metadata } from "next";
import { BackLink, PageHeader } from "@/components/admin/ui";
import { CaseStudyForm } from "@/components/admin/case-study-form";
import { saveCaseStudyAction } from "../actions";
import { getManagedIndustryDossiers } from "@/lib/industry-dossiers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "New case study" };

export default async function NewCaseStudyPage() {
  await requireAdminPage("/admin/case-studies/new");
  const industryOptions = (await getManagedIndustryDossiers()).map(({ slug, title }) => ({ slug, title }));
  const latest = prisma ? await prisma.contentItem.aggregate({ where: { collection: "case-studies" }, _max: { order: true } }).catch(() => null) : null;
  const nextOrder = (latest?._max.order ?? 0) + 1;
  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/case-studies" label="All case studies" />
      <PageHeader
        title="New case study"
        description="Full dossier: identity, discipline, capabilities, stack, outcomes, palette and testimonial. Set the lifecycle to Published when the content is verified - only published records render publicly."
      />
      <CaseStudyForm action={saveCaseStudyAction} industryOptions={industryOptions} defaultOrder={nextOrder} />
    </div>
  );
}
