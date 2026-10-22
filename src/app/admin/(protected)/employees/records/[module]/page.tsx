import { requireAdminPage } from "@/lib/permissions";
import { OperationalRegister, type RegisterSearch } from "@/components/admin/operational-register";
export const dynamic = "force-dynamic";
export const metadata = { title: "Operational register" };
export default async function RegisterPage({ params, searchParams }: { params: Promise<{ module: string }>; searchParams: Promise<RegisterSearch> }) {
  await requireAdminPage("/admin/employees/records/[module]");
  return OperationalRegister({ portal: "employee", moduleKey: (await params).module, search: await searchParams });
}
