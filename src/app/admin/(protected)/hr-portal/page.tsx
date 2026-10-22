import { requireAdminPage } from "@/lib/permissions";
import { CandidateWorkspace } from "@/components/admin/hr/candidate-workspace";
import type { CandidateSearch } from "@/lib/hr-candidates";
export const metadata = { title: "HR Portal" };
export const dynamic = "force-dynamic";
export default async function HRPortalPage({ searchParams }: { searchParams: Promise<CandidateSearch> }) {
  await requireAdminPage("/admin/hr-portal");
  return CandidateWorkspace({ pipeline: true, search: await searchParams });
}
