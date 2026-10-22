import { requireAdminPage } from "@/lib/permissions";
import { CandidateWorkspace } from "@/components/admin/hr/candidate-workspace";
import type { CandidateSearch } from "@/lib/hr-candidates";
export const dynamic = "force-dynamic";
export const metadata = { title: "Applications & candidates" };
export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<CandidateSearch> }) {
  await requireAdminPage("/admin/hr-portal/applications");
  return CandidateWorkspace({ search: await searchParams });
}
