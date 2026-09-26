import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, StatTile, Chip } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { markReadAction, markAllReadAction } from "./actions";

export const metadata: Metadata = { title: "Emails" };
export const dynamic = "force-dynamic";

const fmtTime = (d: Date) =>
  d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/** Admin - Emails: the shared inbox for all inbound replies. */
export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string; unread?: string; e?: string }>;
}) {
  const { dept, unread, e } = await searchParams;
  if (!prisma) {
    return (
      <div className="max-w-5xl">
        <PageHeader title="Emails" />
        <Notice kind="alert">Database unavailable.</Notice>
      </div>
    );
  }

  const where: Record<string, unknown> = {};
  if (dept === "hr" || dept === "hello") where.dept = dept;
  if (unread === "1") where.isRead = false;

  const [replies, unreadCount, hrCount, helloCount] = await Promise.all([
    prisma.emailReply.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { enquiry: { select: { id: true, name: true, projectType: true, careerStatus: true } } },
    }),
    prisma.emailReply.count({ where: { isRead: false } }),
    prisma.emailReply.count({ where: { dept: "hr" } }),
    prisma.emailReply.count({ where: { dept: "hello" } }),
  ]);

  const total = hrCount + helloCount;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Emails"
        description="All inbound replies from candidates and clients - read, reply, and track conversations."
      />
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Unread" value={unreadCount} icon="alert" accent={unreadCount > 0} href="/admin/emails?unread=1" />
        <StatTile label="HR replies (hr@)" value={hrCount} icon="bot" href="/admin/emails?dept=hr" />
        <StatTile label="Client replies (hello@)" value={helloCount} icon="user" href="/admin/emails?dept=hello" />
        <StatTile label="Total" value={total} icon="trail" />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/emails"
          className={`inline-flex h-9 items-center rounded-lg border px-3.5 text-[0.8125rem] font-semibold transition-colors ${
            !dept && !unread ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-foreground/40"
          }`}
        >
          All ({total})
        </Link>
        <Link
          href="/admin/emails?unread=1"
          className={`inline-flex h-9 items-center rounded-lg border px-3.5 text-[0.8125rem] font-semibold transition-colors ${
            unread === "1" ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-foreground/40"
          }`}
        >
          Unread ({unreadCount})
        </Link>
        <Link
          href="/admin/emails?dept=hr"
          className={`inline-flex h-9 items-center rounded-lg border px-3.5 text-[0.8125rem] font-semibold transition-colors ${
            dept === "hr" ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-foreground/40"
          }`}
        >
          HR · hr@ ({hrCount})
        </Link>
        <Link
          href="/admin/emails?dept=hello"
          className={`inline-flex h-9 items-center rounded-lg border px-3.5 text-[0.8125rem] font-semibold transition-colors ${
            dept === "hello" ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-foreground/40"
          }`}
        >
          Client · hello@ ({helloCount})
        </Link>
        {unreadCount > 0 ? (
          <form action={markAllReadAction} className="ml-auto">
            <SubmitButton label="Mark all as read" compact />
          </form>
        ) : null}
      </div>

      {/* Email list */}
      <div className="space-y-2">
        {replies.length === 0 ? (
          <div className="adm-card p-8 text-center">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto mb-4 h-12 w-12 text-muted/40" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <p className="t-sm text-muted">
              No emails yet. When someone replies to an email sent from Savo, it appears here.
            </p>
            <p className="t-caption mt-2 text-muted">
              Try sending a test email from{" "}
              <Link href="/admin/email-compose?dept=hr" className="font-semibold text-accent">
                Send email
              </Link>{" "}
              and replying to it.
            </p>
          </div>
        ) : (
          replies.map((reply) => {
            const preview = reply.bodyText?.slice(0, 120) ?? "(HTML only)";
            return (
              <article
                key={reply.id}
                className={`adm-card p-4 transition-colors ${!reply.isRead ? "border-accent/30 bg-accent/[0.02]" : ""}`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  {/* Unread dot */}
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${!reply.isRead ? "bg-accent" : "bg-transparent"}`} />

                  {/* Sender + subject */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className={`text-[0.875rem] ${!reply.isRead ? "font-bold" : "font-semibold"} text-foreground`}>
                        {reply.fromName ?? reply.fromEmail}
                      </span>
                      <span className="text-[0.75rem] text-muted">{reply.fromEmail}</span>
                      <Chip tone={reply.dept === "hr" ? "accent" : "default"}>
                        {reply.dept === "hr" ? "HR" : "Client"}
                      </Chip>
                      {!reply.isRead ? <Chip tone="warning">New</Chip> : null}
                    </div>
                    <p className={`mt-0.5 text-[0.8125rem] ${!reply.isRead ? "font-semibold" : ""} text-foreground`}>
                      {reply.subject}
                    </p>
                    <p className="mt-0.5 truncate text-[0.75rem] text-muted">{preview}...</p>

                    {/* Linked enquiry */}
                    {reply.enquiry ? (
                      <p className="mt-1 text-[0.6875rem] text-muted">
                        <Link href={`/admin/enquiries/${reply.enquiry.id}`} className="font-semibold text-accent hover:underline">
                          → View enquiry: {reply.enquiry.name}
                          {reply.enquiry.careerStatus ? ` (${reply.enquiry.careerStatus.replace("_", " ")})` : ""}
                        </Link>
                      </p>
                    ) : (
                      <p className="mt-1 text-[0.6875rem] text-muted/60">No matching enquiry</p>
                    )}
                  </div>

                  {/* Timestamp + actions */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="tnum text-[0.6875rem] font-mono text-muted">{fmtTime(reply.createdAt)}</span>
                    <div className="flex gap-2">
                      <details className="relative">
                        <summary className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-border px-3 text-[0.6875rem] font-semibold text-muted transition-colors hover:border-foreground/40 list-none">
                          Read
                        </summary>
                        <div className="absolute right-0 top-10 z-20 w-96 max-w-[90vw] rounded-xl border border-border bg-white p-4 shadow-xl">
                          <p className="text-[0.875rem] font-bold text-foreground">{reply.subject}</p>
                          <p className="t-caption mt-1 text-muted">
                            From: {reply.fromName ?? reply.fromEmail} &lt;{reply.fromEmail}&gt;
                          </p>
                          <div className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-surface-2/30 px-3 py-2.5 text-[0.8125rem] leading-relaxed text-foreground">
                            {reply.bodyText ?? "(HTML only - open in webmail for full view)"}
                          </div>
                          {reply.spamScore !== null && reply.spamScore > 5 ? (
                            <p className="t-caption mt-2 text-error">Spam score: {reply.spamScore}</p>
                          ) : null}
                        </div>
                      </details>
                      <Link
                        href={`/admin/email-compose?dept=${reply.dept}&to=${encodeURIComponent(reply.fromEmail)}&subject=${encodeURIComponent("Re: " + reply.subject)}`}
                        className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-[0.6875rem] font-bold text-on-accent transition-colors hover:bg-accent-hover"
                      >
                        Reply
                      </Link>
                      {!reply.isRead ? (
                        <form action={markReadAction}>
                          <input type="hidden" name="id" value={reply.id} />
                          <SubmitButton label="✓" compact />
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
