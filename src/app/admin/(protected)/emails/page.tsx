import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { Mailbox, type MailboxReply, type MailboxSent, type MailboxTemplate } from "@/components/admin/mailbox";
import { TEMPLATE_REGISTRY, CATEGORY_LABEL } from "@/lib/mail/registry";

export const metadata: Metadata = { title: "Emails" };
export const dynamic = "force-dynamic";

/** Admin · Emails - the shared mailbox: inbound replies (Inbox) and every
 *  email the panel sends (Sent), with an inline composer whose template
 *  selector is grouped by department: Clients (hello@) and HR (hr@). */
export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; e?: string }>;
}) {
  const sp = await searchParams;

  const [replies, sentRows] = prisma
    ? await Promise.all([
        prisma.emailReply.findMany({ orderBy: { createdAt: "desc" }, take: 200 }).catch(() => []),
        prisma.sentEmail.findMany({ orderBy: { createdAt: "desc" }, take: 200 }).catch(() => []),
      ])
    : [[], []];

  const inbox: MailboxReply[] = replies.map((r) => ({
    id: r.id,
    fromEmail: r.fromEmail,
    fromName: r.fromName,
    dept: r.dept,
    subject: r.subject,
    bodyText: r.bodyText,
    bodyHtml: r.bodyHtml,
    isRead: r.isRead,
    createdAt: r.createdAt.toISOString(),
  }));

  const sent: MailboxSent[] = sentRows.map((s) => ({
    id: s.id,
    toEmail: s.toEmail,
    toName: s.toName,
    dept: s.dept,
    subject: s.subject,
    html: s.html,
    templateKey: s.templateKey,
    sentBy: s.sentBy,
    createdAt: s.createdAt.toISOString(),
  }));

  const templates: MailboxTemplate[] = TEMPLATE_REGISTRY.map((t) => ({
    key: t.key,
    label: t.label,
    dept: t.dept,
    category: CATEGORY_LABEL[t.category],
    vars: t.vars,
  }));

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Emails"
        description="The shared mailbox. Inbound replies arrive automatically via the reply domain; every email sent from the panel is logged in Sent, by department."
      />
      <Mailbox
        replies={inbox}
        sent={sent}
        templates={templates}
        notice={sp.sent ? "Email sent. It is logged in the Sent folder." : undefined}
        error={sp.e ? decodeURIComponent(sp.e) : undefined}
      />
    </div>
  );
}
