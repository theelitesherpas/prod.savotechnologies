import { requireAdminPage } from "@/lib/permissions";
import { EnquiryDetail } from "@/components/admin/enquiry-detail";
export const metadata = { title: "Enquiry" };
export default async function EnquiryDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; career?: string; e?: string }> }) {
  await requireAdminPage("/admin/enquiries/[id]");
  const sp = await searchParams;
  return EnquiryDetail({ id: (await params).id, saved: sp.saved, career: sp.career, error: sp.e });
}
