import { requireAdminPage } from "@/lib/permissions";
import type { Metadata } from "next";
import { BackLink, PageHeader } from "@/components/admin/ui";
import { CaseStudyForm } from "@/components/admin/case-study-form";
import { saveCaseStudyAction } from "../actions";
import { getManagedIndustryDossiers } from "@/lib/industry-dossiers";

export const metadata: Metadata = { title: "New case study" };

export default async function NewCaseStudyPage() {
  await requireAdminPage("/admin/case-studies/new");
  const industryOptions = (await getManagedIndustryDossiers()).map(({ slug, title }) => ({ slug, title }));
  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/case-studies" label="All case studies" />
      <PageHeader
        title="New case study"
        description="Full dossier: identity, discipline, capabilities, stack, outcomes, palette and testimonial. Set the lifecycle to Published when the content is verified - only published records render publicly."
      />
      <CaseStudyForm action={saveCaseStudyAction} industryOptions={industryOptions} />
    </div>
  );
}
