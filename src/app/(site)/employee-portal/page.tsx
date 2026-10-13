import type { Metadata } from "next";
import { PortalEntrance } from "@/components/portal/entrance";
import { EmployeeLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Employee Portal · Savo Technologies",
  description:
    "Sign in to your Savo employee workspace to review your employment details, leave and authored content.",
  robots: { index: false, follow: false },
};

/** Registered-account access. No nested main, synthetic employee claims or
 * second URL decode: Next already decoded the search parameter. */
export default async function EmployeePortalPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  return (
    <PortalEntrance kind="employee">
      <EmployeeLoginForm error={typeof e === "string" ? e : undefined} />
    </PortalEntrance>
  );
}
