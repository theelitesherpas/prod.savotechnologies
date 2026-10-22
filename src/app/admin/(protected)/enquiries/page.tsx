import { requireAdminPage } from "@/lib/permissions";
import { EnquiryInbox, type EnquirySearchParams } from "@/components/admin/enquiry-inbox";
export const dynamic = "force-dynamic";
export const metadata = { title: "Client enquiries" };
export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<EnquirySearchParams> }) {
  await requireAdminPage("/admin/enquiries");
  return EnquiryInbox({ sp: await searchParams });
}
