import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice } from "@/components/admin/ui";
import { EmailTemplateEditor } from "@/components/admin/email-template-editor";

export const metadata: Metadata = { title: "Email templates" };
export const dynamic = "force-dynamic";

/** Admin · Email templates — preview every automated email, customise
 *  subject + body with {{placeholders}}, or reset to the code default. */
export default async function AdminEmailTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; reset?: string; e?: string }>;
}) {
  const { saved, reset, e } = await searchParams;
  const overrides = prisma
    ? await prisma.emailTemplate.findMany({ select: { key: true, subject: true, body: true } })
    : [];

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Email templates"
        description="Preview every automated email, customise it with placeholders, or send a one-off email from the compose screen."
      />
      {saved ? <Notice>Custom template saved — real sends use it immediately.</Notice> : null}
      {reset ? <Notice>Reset — the tested code default is back in use.</Notice> : null}
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}
      <EmailTemplateEditor overrides={overrides} />
    </div>
  );
}
