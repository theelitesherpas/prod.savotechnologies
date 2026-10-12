import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TEMPLATE_REGISTRY } from "@/lib/mail/registry";
import { EmailDesignReview } from "@/components/mail/email-design-review";

export const metadata: Metadata = {
  title: "Email design review · Local preview",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Sample-only local review. No database, private records, send/save actions,
 *  or SMTP imports. Production always returns notFound, even in demo mode. */
export default function EmailPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const previews = TEMPLATE_REGISTRY.map(entry => ({
    key: entry.key,
    label: entry.label,
    dept: entry.dept,
    category: entry.category,
    fires: entry.fires,
    ...entry.default({ ...entry.vars, __to: "preview@example.invalid" }),
  }));
  return <EmailDesignReview previews={previews} />;
}
