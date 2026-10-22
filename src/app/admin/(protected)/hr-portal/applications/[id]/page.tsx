import { requireAdminPage } from "@/lib/permissions";
import { EnquiryDetail } from "@/components/admin/enquiry-detail";
export const metadata = { title: "Candidate information" };
export default async function CandidatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; career?: string; e?: string; returnTo?: string }> }) {
  await requireAdminPage("/admin/hr-portal/applications/[id]");
  const sp = await searchParams;
  return EnquiryDetail({ scope: "hr", id: (await params).id, saved: sp.saved, career: sp.career, error: sp.e, returnTo: sp.returnTo });
}
