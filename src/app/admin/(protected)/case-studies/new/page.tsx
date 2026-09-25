import type { Metadata } from "next";
import { BackLink, PageHeader } from "@/components/admin/ui";
import { CaseStudyForm } from "@/components/admin/case-study-form";
import { saveCaseStudyAction } from "../actions";

export const metadata: Metadata = { title: "New case study" };

export default function NewCaseStudyPage() {
  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/case-studies" label="All case studies" />
      <PageHeader
        title="New case study"
        description="Full dossier: identity, discipline, capabilities, stack, outcomes, palette and testimonial. Set the lifecycle to Published when the content is verified — only published records render publicly."
      />
      <CaseStudyForm action={saveCaseStudyAction} />
    </div>
  );
}
