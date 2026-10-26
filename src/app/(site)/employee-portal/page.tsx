import type { Metadata } from "next";
import { PortalEntrance } from "@/components/portal/entrance";
import { EmployeeLoginForm } from "./login-form";
import { openGraphFor, socialImageFor } from "@/lib/seo";

const TITLE = "Employee Portal · Savo Technologies";
const DESCRIPTION =
  "Sign in to your Savo employee workspace to review your employment details, leave and authored content.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: openGraphFor({ title: TITLE, description: DESCRIPTION, url: "/employee-portal" }),
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [socialImageFor(TITLE, DESCRIPTION, "/employee-portal")],
  },
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
