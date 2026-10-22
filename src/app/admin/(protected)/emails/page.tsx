import { requireAdminPage } from "@/lib/permissions";
import { Pagination } from "@/components/admin/pagination";
import { parseAdminPage, adminPageUrl, type PageSearch } from "@/lib/admin-pagination";
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
  searchParams: Promise<{ sent?: string; e?: string; dept?: string; folder?: string; q?: string } & PageSearch>;
}) {
  await requireAdminPage("/admin/emails");
  const sp = await searchParams;
  const dept = sp.dept === "hr" || sp.dept === "hello" ? sp.dept : undefined;
  const folder = sp.folder === "sent" ? "sent" : "inbox";
  const q = (sp.q ?? "").trim().slice(0, 100);
  const contains = { contains: q, mode: "insensitive" as const };
  const department = dept ? { dept } : {};
  const inboxWhere = { ...department, ...(q ? { OR: [{ fromEmail: contains }, { fromName: contains }, { subject: contains }, { bodyText: contains }] } : {}) };
  const sentWhere = { ...department, ...(q ? { OR: [{ toEmail: contains }, { toName: contains }, { subject: contains }] } : {}) };
  const [total, unread] = prisma ? await Promise.all([
    folder === "sent" ? prisma.sentEmail.count({ where: sentWhere }) : prisma.emailReply.count({ where: inboxWhere }),
    prisma.emailReply.count({ where: { ...department, isRead: false } }),
  ]) : [0, 0];
  const paging = parseAdminPage(sp, total);
  const [replies, sentRows] = prisma ? await Promise.all([
    folder === "inbox" ? prisma.emailReply.findMany({ where: inboxWhere, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: paging.take, skip: paging.skip }) : [],
    folder === "sent" ? prisma.sentEmail.findMany({ where: sentWhere, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: paging.take, skip: paging.skip }) : [],
  ]) : [[], []];

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
        title={dept === "hr" ? "HR mailbox" : dept === "hello" ? "Client mailbox" : "All department mail"}
        description="Inbound replies and sent correspondence, organized by department. Sending mail requires the corresponding compose permission."
      />
      <Mailbox
        key={`${dept ?? "all"}-${folder}-${paging.page}-${paging.pageSize}-${q}`}
        dept={dept}
        initialFolder={folder}
        initialQuery={q}
        totalUnread={unread}
        paginationControl={<Pagination {...paging} total={total} href={(page, size) => adminPageUrl("/admin/emails", { dept, folder, q }, page, size)} label="messages" />}
        replies={inbox}
        sent={sent}
        templates={templates}
        notice={sp.sent ? "Email sent. It is logged in the Sent folder." : undefined}
        error={sp.e}
      />
    </div>
  );
}
