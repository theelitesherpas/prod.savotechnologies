import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtIST, todayIST } from "@/lib/datetime";
import { getAdminUser } from "@/lib/auth";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_META } from "@/lib/enquiry-status";
import {
  BackLink,
  PageHeader,
  Notice,
  Chip,
  EnquiryStatusChip,
  DangerZone,
} from "@/components/admin/ui";
import { SubmitButton, ConfirmButton } from "@/components/admin/form";
import {
  updateEnquiryStatusAction,
  saveEnquiryNotesAction,
  deleteEnquiryAction,
} from "../actions";
import {
  shortlistEnquiryAction,
  rejectEnquiryAction,
  scheduleInterviewAction,
  requestDocumentsAction,
  markHiredAction,
  resetCareerStatusAction,
} from "../career-actions";
import { FormGuard } from "@/components/admin/form-guard";
import { ConfirmAction } from "@/components/admin/confirm-dialog";

export const metadata: Metadata = { title: "Enquiry" };

const FIELD_LABELS: Record<string, string> = {
  form: "Form",
  role: "Role applied for",
  city: "Current city",
  experience: "Experience",
  notice: "Notice period",
  expectedCtc: "Expected CTC",
  skills: "Key skills",
  links: "Portfolio / GitHub",
  resume: "Resume link",
  country: "Country",
  topic: "Topic",
};

/** Render the structured form payload as a labelled data grid. */
function FormDataPanel({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => {
    if (v === null || v === undefined || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="formdata-heading" className="mb-8">
      <h2 id="formdata-heading" className="adm-label mb-2.5">
        Form submission · complete data
      </h2>
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="bg-surface px-4 py-3">
            <dt className="adm-label mb-1">{FIELD_LABELS[key] ?? key}</dt>
            <dd className="t-sm break-words text-foreground">
              {Array.isArray(value) ? (
                <span className="flex flex-wrap gap-1.5">
                  {(value as unknown[]).map((item, i) => (
                    <Chip key={i} tone="default">
                      {String(item)}
                    </Chip>
                  ))}
                </span>
              ) : typeof value === "object" ? (
                <code className="font-mono text-[0.75rem]">{JSON.stringify(value)}</code>
              ) : (
                String(value)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function EnquiryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; confirm?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [user, enquiry, trail, replies] = await Promise.all([
    getAdminUser(),
    prisma ? prisma.projectEnquiry.findUnique({ where: { id } }) : Promise.resolve(null),
    prisma
      ? prisma.auditLog.findMany({
          where: { entity: "ProjectEnquiry", entityId: id },
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        })
      : Promise.resolve([]),
    prisma
      ? prisma.emailReply.findMany({
          where: { enquiryId: id },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  if (!enquiry) notFound();

  const formData =
    enquiry.data && typeof enquiry.data === "object" ? (enquiry.data as Record<string, unknown>) : null;
  const mailto = `mailto:${enquiry.email ?? ""}?subject=${encodeURIComponent(
    `Re: your ${enquiry.projectType.toLowerCase()} enquiry - Savo Technologies`,
  )}`;
  const isCareer = formData?.form === "careers";
  const careerRole = typeof formData?.role === "string" ? formData.role : "";
  const careerStage = enquiry.careerStatus ?? "";

  return (
    <>
      <BackLink href="/admin/enquiries" label="Back to inbox" />
      <PageHeader
        title={enquiry.name}
        description={`Received ${fmtIST(enquiry.createdAt)}`}
        actions={
          <>
            <EnquiryStatusChip status={enquiry.status} />
            {enquiry.email ? (
              <a
                href={mailto}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-[0.875rem] font-semibold text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                Reply by email
              </a>
            ) : null}
          </>
        }
      />

      {saved ? <Notice>Notes saved.</Notice> : null}

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Lead record */}
        <div className="min-w-0 lg:col-span-2">
          {/* Contact record */}
          <section aria-labelledby="record-heading" className="mb-8">
            <h2 id="record-heading" className="adm-label mb-2.5">
              Contact record
            </h2>
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              {[
                ["Email", enquiry.email ?? "-"],
                ["Phone", enquiry.phone ?? "-"],
                ["Company", enquiry.company ?? "-"],
                ["Type", enquiry.projectType],
                ["Budget", enquiry.budget ?? "-"],
                ["Source", enquiry.source],
                ["Received", fmtIST(enquiry.createdAt)],
                ["IP (hashed prefix)", enquiry.ipHash ? enquiry.ipHash.slice(0, 12) : "-"],
              ].map(([label, value]) => (
                <div key={label} className="bg-surface px-4 py-3">
                  <dt className="adm-label mb-1">{label}</dt>
                  <dd className="t-sm break-words text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Structured form payload */}
          {formData ? <FormDataPanel data={formData} /> : null}

          {/* Career pipeline actions */}
          {isCareer ? (
            <section aria-labelledby="career-heading" className="mb-8">
              <h2 id="career-heading" className="adm-label mb-3">
                Recruitment pipeline {careerRole ? `- ${careerRole}` : ""}
              </h2>
              <div className="adm-card p-5">
                {careerStage ? (
                  <p className="t-caption mb-4 rounded-md border border-accent/30 bg-accent/[0.04] px-3 py-2 font-semibold text-accent">
                    Current stage: {careerStage.replace("_", " ")}
                    {enquiry.interviewDate ? ` - ${enquiry.interviewDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                  </p>
                ) : (
                  <p className="t-caption mb-4 text-muted">No pipeline action taken yet.</p>
                )}

                <div className="flex flex-wrap gap-3">
                  {!careerStage || careerStage === "rejected" ? (
                    <ConfirmAction
                      action={shortlistEnquiryAction}
                      id={enquiry.id}
                      label="Shortlist candidate"
                      title="Shortlist this candidate?"
                      description={`${enquiry.name} will move to the shortlisted stage and receive a shortlist acknowledgment email from hr@savotechnologies.com.`}
                      confirmLabel="Yes, shortlist"
                      tone="success"
                    />
                  ) : null}

                  {careerStage === "shortlisted" ? (
                    <details className="w-full">
                      <summary className="t-sm cursor-pointer font-semibold text-accent">Schedule interview</summary>
                      <FormGuard action={scheduleInterviewAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input type="hidden" name="id" value={enquiry.id} />
                        <div>
                          <label htmlFor="iv-date" className="adm-label mb-1 block">Date *</label>
                          <input id="iv-date" name="interviewDate" type="date" required min={todayIST()} className="adm-input" />
                        </div>
                        <div>
                          <label htmlFor="iv-time" className="adm-label mb-1 block">Time (IST) *</label>
                          <select id="iv-time" name="interviewTime" required className="adm-select">
                            <option value="">Select time</option>
                            {["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM"].map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="iv-link" className="adm-label mb-1 block">Meeting link *</label>
                          <input id="iv-link" name="meetingLink" type="url" required placeholder="https://meet.google.com/..." className="adm-input" />
                        </div>
                        <div>
                          <label htmlFor="iv-interviewer" className="adm-label mb-1 block">Interviewer *</label>
                          <input id="iv-interviewer" name="interviewer" required maxLength={80} className="adm-input" placeholder="Name (role)" />
                        </div>
                        <div>
                          <label htmlFor="iv-duration" className="adm-label mb-1 block">Duration</label>
                          <input id="iv-duration" name="duration" defaultValue="45 minutes" maxLength={20} className="adm-input" />
                        </div>
                        <div className="sm:col-span-2">
                          <SubmitButton label="Send interview invitation" pendingLabel="Sending..." />
                          <p className="t-caption mt-1.5 text-muted">Sends the interview invitation email with the meeting link automatically.</p>
                        </div>
                      </FormGuard>
                    </details>
                  ) : null}

                  {careerStage === "shortlisted" || careerStage === "interview_scheduled" ? (
                    <ConfirmAction
                      action={requestDocumentsAction}
                      id={enquiry.id}
                      label="Request documents"
                      title="Send document request?"
                      description={`${enquiry.name} will receive an email listing the required documents with a submission deadline.`}
                      confirmLabel="Send request"
                    />
                  ) : null}

                  {careerStage === "interview_scheduled" ? (
                    <ConfirmAction
                      action={markHiredAction}
                      id={enquiry.id}
                      label="Mark hired"
                      title="Mark this candidate as hired?"
                      description={`${enquiry.name} will receive an offer letter email and the enquiry will be closed. Create their employee record next from the Employee portal.`}
                      confirmLabel="Yes, hire"
                      tone="success"
                    />
                  ) : null}

                  {!careerStage || careerStage === "shortlisted" || careerStage === "interview_scheduled" ? (
                    <ConfirmAction
                      action={rejectEnquiryAction}
                      id={enquiry.id}
                      label="Reject candidate"
                      title="Reject this candidate?"
                      description={`${enquiry.name} will receive a rejection email. This action can be undone by resetting the pipeline.`}
                      confirmLabel="Yes, reject"
                      tone="danger"
                    />
                  ) : null}

                  {careerStage ? (
                    <form action={resetCareerStatusAction}>
                      <input type="hidden" name="id" value={enquiry.id} />
                      <SubmitButton label="Reset pipeline" compact />
                    </form>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {/* Message */}
          <section aria-labelledby="message-heading" className="mb-8">
            <h2 id="message-heading" className="adm-label mb-2.5">
              Message
            </h2>
            <p className="t-sm whitespace-pre-wrap break-words rounded-lg border border-border bg-surface p-4 leading-relaxed text-foreground">
              {enquiry.message}
            </p>
            {enquiry.userAgent ? (
              <p className="t-caption mt-2 break-all text-muted">
                <span className="font-mono uppercase tracking-[0.08em]">User agent</span> · {enquiry.userAgent}
              </p>
            ) : null}
          </section>

          {/* Notes */}
          <section aria-labelledby="notes-heading">
            <form action={saveEnquiryNotesAction}>
              <input type="hidden" name="id" value={enquiry.id} />
              <label htmlFor="notes" className="adm-label mb-2 block">
                Internal notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                maxLength={4000}
                defaultValue={enquiry.adminNotes ?? ""}
                placeholder="Context, follow-ups, outcome…"
                className="adm-textarea"
              />
              <div className="mt-3">
                <SubmitButton label="Save notes" pendingLabel="Saving…" />
              </div>
            </form>
          </section>
        </div>

        {/* Side rail: status + danger */}
        <aside className="min-w-0">
          <section aria-labelledby="status-heading" className="mb-8">
            <h2 id="status-heading" className="adm-label mb-2.5">
              Status
            </h2>
            <form action={updateEnquiryStatusAction} className="space-y-2">
              <input type="hidden" name="id" value={enquiry.id} />
              <input type="hidden" name="backTo" value={`/admin/enquiries/${enquiry.id}`} />
              {ENQUIRY_STATUSES.map((s) => {
                const active = enquiry.status === s;
                return (
                  <button
                    key={s}
                    type="submit"
                    name="status"
                    value={s}
                    aria-pressed={active}
                    className={`flex w-full items-start gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground/80 hover:border-foreground/40"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-[5px] h-1.5 w-1.5 shrink-0 ${
                        active
                          ? "bg-accent"
                          : s === "new"
                            ? "bg-accent/60"
                            : s === "in_progress"
                              ? "bg-foreground/50"
                              : "bg-muted/50"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block text-[0.875rem] font-semibold">{ENQUIRY_STATUS_META[s].label}</span>
                      <span className={`t-caption block ${active ? "text-background/70" : "text-muted"}`}>
                        {ENQUIRY_STATUS_META[s].hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </form>
          </section>

          {user?.role === "admin" ? (
            <DangerZone title="Danger zone">
              <p className="t-sm mb-3 text-muted">
                Permanent. This cannot be undone.
              </p>
              <form action={deleteEnquiryAction}>
                <input type="hidden" name="id" value={enquiry.id} />
                <input type="hidden" name="confirm" value="DELETE" />
                <ConfirmButton label="Delete this enquiry…" confirmLabel="Delete permanently" />
              </form>
            </DangerZone>
          ) : null}
        </aside>
      </div>

      {/* Email replies from the candidate */}
      {replies.length > 0 ? (
        <section aria-labelledby="replies-heading" className="mt-10">
          <h2 id="replies-heading" className="adm-label mb-3">
            Email replies from {replies[0]?.fromName ?? replies[0]?.fromEmail ?? "candidate"} ({replies.length})
          </h2>
          <div className="space-y-3">
            {replies.map((reply) => (
              <article key={reply.id} className="adm-card overflow-hidden">
                {/* Reply header */}
                <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2/50 px-4 py-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h9A1.5 1.5 0 0 1 14 4.5v5a1.5 1.5 0 0 1-1.5 1.5H6.5L3.5 13v-2A1.5 1.5 0 0 1 2 9.5v-5Z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-bold text-foreground">
                      {reply.fromName ?? reply.fromEmail}
                      <span className="ml-2 font-normal text-muted">{reply.fromEmail}</span>
                    </p>
                    <p className="text-[0.75rem] text-muted">
                      to {reply.toEmail} · {reply.dept === "hr" ? "HR" : "General"}
                    </p>
                  </div>
                  <span className="tnum text-[0.6875rem] font-mono text-muted">
                    {reply.createdAt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {/* Subject */}
                <div className="px-4 pt-3">
                  <p className="text-[0.875rem] font-semibold text-foreground">{reply.subject}</p>
                </div>
                {/* Body */}
                <div className="px-4 pb-4 pt-2">
                  <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-surface-2/30 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-foreground/90">
                    {reply.bodyText ?? "(HTML only reply - open in webmail)"}
                  </div>
                  {reply.spamScore !== null && reply.spamScore > 5 ? (
                    <p className="t-caption mt-2 text-error">⚠ Spam score: {reply.spamScore}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* Action timeline */}
      <section aria-labelledby="trail-heading" className="mt-10">
        <h2 id="trail-heading" className="adm-label mb-3">Action timeline</h2>
        <div className="adm-card p-5">
          {trail.length === 0 ? (
            <p className="t-sm text-muted">No actions recorded yet for this enquiry.</p>
          ) : (
            <ol className="relative">
              {trail.map((log, i) => {
                const isLast = i === trail.length - 1;
                const meta = (log.meta ?? {}) as Record<string, unknown>;
                const tone = log.action.includes("reject")
                  ? "bg-error"
                  : log.action.includes("hire") || log.action.includes("shortlist")
                    ? "bg-green-500"
                    : log.action.includes("interview")
                      ? "bg-accent"
                    : "bg-foreground/30";
                const actionLabel = log.action
                  .replace("enquiry.", "")
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())
                  .trim();
                return (
                  <li key={log.id} className={`relative flex gap-4 ${!isLast ? "pb-6" : ""}`}>
                    {!isLast ? (
                      <span aria-hidden="true" className="absolute left-[7px] top-5 h-full w-px bg-border" />
                    ) : null}
                    <span className={`relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-white ${tone} shadow-sm`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-[0.875rem] font-bold text-foreground">{actionLabel}</span>
                        <span className="tnum text-[0.6875rem] font-mono text-muted">
                          {log.createdAt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[0.75rem] text-muted">
                        by {log.user?.name ?? "system"}
                        {typeof meta.candidate === "string" ? ` — ${meta.candidate}` : ""}
                        {typeof meta.role === "string" ? ` (${meta.role})` : ""}
                      </p>
                      {typeof meta.date === "string" || typeof meta.time === "string" || typeof meta.interviewer === "string" ? (
                        <div className="mt-1.5 rounded-md border border-accent/25 bg-accent/[0.04] px-3 py-2 text-[0.75rem] text-foreground">
                          {typeof meta.date === "string" ? <span className="font-semibold">Interview: {meta.date}</span> : null}
                          {typeof meta.time === "string" ? <span className="ml-2 font-semibold">at {meta.time}</span> : null}
                          {typeof meta.interviewer === "string" ? <span className="ml-2 text-muted">with {meta.interviewer}</span> : null}
                          {typeof meta.meetingLink === "string" ? (
                            <a href={meta.meetingLink} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate font-mono text-[0.6875rem] text-accent hover:underline">
                              {meta.meetingLink}
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                      {log.action.includes("reject") ? (
                        <p className="mt-1 text-[0.75rem] italic text-error/80">Rejection email sent to candidate</p>
                      ) : null}
                      {log.action.includes("shortlist") ? (
                        <p className="mt-1 text-[0.75rem] italic text-green-600/80">Shortlist acknowledgment email sent to candidate</p>
                      ) : null}
                      {log.action.includes("interview") ? (
                        <p className="mt-1 text-[0.75rem] italic text-accent/80">Interview invitation with meeting link sent to candidate</p>
                      ) : null}
                      {log.action.includes("hired") ? (
                        <p className="mt-1 text-[0.75rem] italic text-green-600/80">Offer letter email sent to candidate</p>
                      ) : null}
                      {log.action.includes("docs") ? (
                        <p className="mt-1 text-[0.75rem] italic text-muted">Document verification checklist email sent to candidate</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}
