import { requireAdminPage } from "@/lib/permissions";
import { OperationalRegister, type RegisterSearch } from "@/components/admin/operational-register";
export const dynamic = "force-dynamic";
export const metadata = { title: "Operational register" };
export default async function RegisterPage({ params, searchParams }: { params: Promise<{ module: string }>; searchParams: Promise<RegisterSearch> }) {
  await requireAdminPage("/admin/hr-portal/records/[module]");
  return OperationalRegister({ portal: "hr", moduleKey: (await params).module, search: await searchParams });
}
