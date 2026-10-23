import { PagedContent } from "@/components/admin/paged-content";
import { requireAdminPage } from "@/lib/permissions";
import { CAREER_ENQUIRY_WHERE, isCareerEnquiry } from "@/lib/admin-enquiries";
import { SubjectRegisters } from "@/components/admin/portal-directory";
import { CandidateOverview } from "@/components/admin/hr/candidate-profile";
import { CandidateReadBoundary } from "@/components/admin/hr/candidate-read-state";
import { CandidateActions, ContactOutcomeChip } from "@/components/admin/hr/candidate-actions";
import { candidateContact, isCallbackOverdue, CONTACT_LABELS, CONTACT_CHANNELS, type ContactOutcome } from "@/lib/hr-contact";
import { CandidateStageChip } from "@/components/admin/hr/candidate-workspace";
import { candidateReturnPath, safeCandidateUrl } from "@/lib/hr-candidates";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fmtIST } from "@/lib/datetime";
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
} from "@/app/admin/(protected)/enquiries/actions";


const FIELD_LABELS: Record<string, string> = {
  form: "Form",
  role: "Role applied for",
  city: "Current city",
  hometown: "Hometown",
  currentCtc: "Current annual CTC",
  currentCompany: "Current employer",
  currentDesignation: "Current designation",
  workPreference: "Work preference",
  linkedin: "LinkedIn profile",
  experience: "Total experience (reported band)",
  notice: "Notice period",
  expectedCtc: "Expected CTC",
  skills: "Key skills",
  links: "Portfolio / GitHub",
  resume: "Resume link",
  consent: "Application data processing consent",
  country: "Country",
  topic: "Topic",
};

/** Render the structured form payload as a labelled data grid. */
function safeWebUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

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
              ) : typeof value === "boolean" ? (
                value ? "Confirmed" : "Not confirmed"
              ) : typeof value === "string" && ["resume", "links"].includes(key) && safeWebUrl(value) ? (
                <a href={safeWebUrl(value)!} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
                  Open {FIELD_LABELS[key] ?? key}
                </a>
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

export async function EnquiryDetail({ id, saved, career, error, returnTo, scope = "sales" }: { id: string; saved?: string; career?: string; error?: string; returnTo?: string; scope?: "sales" | "hr" }) {
  const user = await requireAdminPage(scope === "hr" ? "/admin/hr-portal/applications/[id]" : "/admin/enquiries/[id]");
  const base = scope === "hr" ? "/admin/hr-portal/applications" : "/admin/enquiries";
  const resultsPath = scope === "hr" ? candidateReturnPath(returnTo) : base;
  const enquiry = prisma ? scope === "hr"
    ? await prisma.projectEnquiry.findFirst({ where: { AND: [CAREER_ENQUIRY_WHERE, { id }] } })
    : await prisma.projectEnquiry.findUnique({ where: { id } }) : null;
  if (!enquiry) notFound();
  const [trail, replies] = await Promise.all([
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

  const isCareer = isCareerEnquiry(enquiry);
  // Careers mark viewed only after the visible detail mounts, not during a GET/prefetch.
  // Preserve the existing sales inbox behavior separately.
  if (!isCareer && enquiry.status === "new" && prisma) {
    try {
      const opened = await prisma.projectEnquiry.update({
        where: { id, status: "new", updatedAt: enquiry.updatedAt },
        data: { status: "in_progress" },
      });
      Object.assign(enquiry, opened);
      revalidatePath("/admin/enquiries");
      revalidatePath("/admin");
    } catch {
      // non-fatal: badge count stays until next action
    }
  }

  const formData =
    enquiry.data && typeof enquiry.data === "object" ? (enquiry.data as Record<string, unknown>) : null;
  const mailto = `mailto:${enquiry.email ?? ""}?subject=${encodeURIComponent(
    `Re: your ${enquiry.projectType.toLowerCase()} enquiry - Savo Technologies`,
  )}`;
  const careerStage = enquiry.careerStatus || "new";
  const contact = candidateContact(enquiry.data);
  const careerMessages: Record<string, string> = { shortlisted: "Candidate shortlisted.", rejected: "Hiring rejection recorded.", interview: "Interview details saved.", docs_requested: "Document request submitted for email delivery.", hired: "Candidate marked hired. Complete the offer and onboarding records next.", reset: "Recruitment pipeline reset. Contact history and submitted answers are unchanged." };

  return (
    <>
      <BackLink href={resultsPath} label={scope === "hr" ? "Back to filtered applications" : "Back to inbox"} />
      <PageHeader
        title={enquiry.name}
        description={`Received ${fmtIST(enquiry.createdAt)}`}
        actions={
          <>
            {isCareer ? <CandidateStageChip stage={enquiry.status === "archived" ? "archived" : careerStage || "new"} /> : <EnquiryStatusChip status={enquiry.status} />}
            {enquiry.email && !isCareer ? (
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

      {saved ? <Notice>{saved === "profile" ? "HR profile saved. The original application is unchanged." : saved === "contact" ? "Contact outcome saved. Recruitment stage is unchanged; no email was sent." : saved === "inbox" ? "Inbox state saved." : "Notes saved."}</Notice> : null}
      {career && careerMessages[career] ? <Notice>{careerMessages[career]}</Notice> : null}
      {error ? <Notice kind="alert">{error}</Notice> : null}

      <div className={isCareer ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]" : "grid gap-10 lg:grid-cols-3"}>
        {/* Application facts remain separate from the top-right management controls. */}
        <div className={isCareer ? "order-last min-w-0 xl:order-first" : "min-w-0 lg:col-span-2"}>
          {isCareer ? <>
            <CandidateOverview candidate={enquiry} />
            <section className="adm-card mb-6 p-5" aria-labelledby="contact-followup"><h2 id="contact-followup" className="mb-4 text-base font-semibold">Contact & follow-up</h2>
              <dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="mb-1 text-xs text-muted">Latest outcome</dt><dd><ContactOutcomeChip outcome={contact.outcome} /></dd></div><div><dt className="mb-1 text-xs text-muted">Contact method</dt><dd>{CONTACT_CHANNELS[contact.channel]}</dd></div>
                {contact.callbackAt ? <div><dt className="mb-1 text-xs text-muted">{isCallbackOverdue(contact.callbackAt) ? "Callback overdue" : "Callback due"}</dt><dd className="font-semibold">{fmtIST(new Date(contact.callbackAt))}</dd></div> : null}
                {contact.updatedAt ? <div><dt className="mb-1 text-xs text-muted">Last updated</dt><dd>{fmtIST(new Date(contact.updatedAt))}</dd></div> : null}
              </dl><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-muted">{contact.note || "No contact note recorded. Use Update contact outcome in Manage application after a call or message."}</p>
              <p className="mt-3 text-xs leading-5 text-muted">Contact outcome records the candidate’s response. Recruitment stage records the hiring team’s decision. Callback times are IST; no automated reminder is sent.</p>
            </section>
          </> : null}
          {/* Contact record */}
          <section aria-labelledby="record-heading" className="mb-8">
            <h2 id="record-heading" className="adm-label mb-2.5">
              Contact record
            </h2>
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              {(isCareer ? [
                ["Email", enquiry.email ?? "Not provided"], ["Mobile number", enquiry.phone ?? "Not provided"],
                ["Application reference", enquiry.reference ?? "Not assigned"], ["Received", fmtIST(enquiry.createdAt)],
                ["Source", enquiry.source],
              ] : [
                ["Email", enquiry.email ?? "-"],
                ["Phone", enquiry.phone ?? "-"],
                ["Company", enquiry.company ?? "-"],
                ["Type", enquiry.projectType],
                ["Budget", enquiry.budget ?? "-"],
                ["Source", enquiry.source],
                ["Received", fmtIST(enquiry.createdAt)],
                ["Reference", enquiry.reference ?? "-"],
                ["IP (hashed prefix)", enquiry.ipHash ? enquiry.ipHash.slice(0, 12) : "-"],
              ]).map(([label, value]) => (
                <div key={label} className={`bg-surface px-4 py-3 ${isCareer && label === "Source" ? "sm:col-span-2" : ""}`}>
                  <dt className="adm-label mb-1">{label}</dt>
                  <dd className="t-sm break-words text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Structured form payload */}
          {formData ? isCareer ? <details className="adm-card mb-7 p-5"><summary className="cursor-pointer text-sm font-semibold">Original application · submitted answers</summary><div className="mt-4"><FormDataPanel data={Object.fromEntries(Object.entries(formData).filter(([key]) => !["hrProfile", "hrContact"].includes(key)))} /></div></details> : <FormDataPanel data={formData} /> : null}

          {/* Message */}
          <section aria-labelledby="message-heading" className="mb-8">
            <h2 id="message-heading" className="adm-label mb-2.5">
              Message
            </h2>
            <p className="t-sm whitespace-pre-wrap break-words rounded-lg border border-border bg-surface p-4 leading-relaxed text-foreground">
              {enquiry.message}
            </p>
            {enquiry.userAgent && !isCareer ? (
              <p className="t-caption mt-2 break-all text-muted">
                <span className="font-mono uppercase tracking-[0.08em]">User agent</span> · {enquiry.userAgent}
              </p>
            ) : null}
          </section>

          {/* Notes */}
          <section aria-labelledby="notes-heading">
            {isCareer ? <><h2 id="notes-heading" className="adm-label mb-2.5">Internal notes</h2><p className="adm-card whitespace-pre-wrap break-words p-4 text-sm leading-6 text-muted">{enquiry.adminNotes || "No internal notes yet. Use Edit internal notes in Manage application to add recruitment context."}</p></> : <form action={saveEnquiryNotesAction}>
              {scope === "hr" ? <input type="hidden" name="returnTo" value={resultsPath} /> : null}
              <input type="hidden" name="backTo" value={`${base}/${enquiry.id}`} />
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
            </form>}
          </section>
        </div>

        {/* Side rail: status + danger */}
        <aside className={isCareer ? "order-first min-w-0 xl:order-last" : "min-w-0"}>
          {isCareer ? <><CandidateReadBoundary id={enquiry.id} viewed={enquiry.status !== "new"}><CandidateActions key={`${enquiry.updatedAt.toISOString()}-${error ?? ""}`} candidate={enquiry} returnTo={resultsPath} base={base} admin={user.role === "admin"} /></CandidateReadBoundary><div className="mt-4"><SubjectRegisters portal="hr" user={user} subjectId={enquiry.id} /></div></> : <>
          <section aria-labelledby="status-heading" className="mb-8">
            <h2 id="status-heading" className="adm-label mb-2.5">
              {isCareer ? "Inbox management" : "Status"}
            </h2>
            {isCareer ? <p className="mb-3 text-xs leading-5 text-muted">Inbox state is separate from recruitment status. Opening an application marks it in progress; only recruitment actions change the hiring stage.</p> : null}
            <form action={updateEnquiryStatusAction} className="space-y-2">
              <input type="hidden" name="id" value={enquiry.id} />
              <input type="hidden" name="backTo" value={`${base}/${enquiry.id}`} />
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
          </>}
        </aside>
      </div>

      {/* Email replies from the candidate */}
      {replies.length > 0 ? (
        <section aria-labelledby="replies-heading" className="mt-10">
          <h2 id="replies-heading" className="adm-label mb-3">
            Email replies from {replies[0]?.fromName ?? replies[0]?.fromEmail ?? "candidate"} ({replies.length})
          </h2>
          <PagedContent as="div" label="email replies" className="space-y-3">
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
                    {fmtIST(reply.createdAt)}
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
          </PagedContent>
        </section>
      ) : null}

      {/* Action timeline */}
      <section aria-labelledby="trail-heading" className="mt-10">
        <h2 id="trail-heading" className="adm-label mb-3">Action timeline</h2>
        <div className="adm-card p-5">
          {trail.length === 0 ? (
            <p className="t-sm text-muted">{isCareer ? "No activity recorded yet. Contact outcomes, notes and recruitment updates will appear here." : "No actions recorded yet for this enquiry."}</p>
          ) : (
            <PagedContent as="ol" label="activity entries" className="relative">
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
                        <span className="text-[0.875rem] font-bold text-foreground">{log.action === "enquiry.contactUpdated" ? `Contact outcome: ${CONTACT_LABELS[meta.to as ContactOutcome] ?? "Updated"}` : actionLabel}</span>
                        <span className="tnum text-[0.6875rem] font-mono text-muted">
                          {fmtIST(log.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[0.75rem] text-muted">
                        by {log.user?.name ?? "system"}
                        {typeof meta.candidate === "string" ? ` · ${meta.candidate}` : ""}
                        {typeof meta.role === "string" ? ` (${meta.role})` : ""}
                      </p>
                      {typeof meta.date === "string" || typeof meta.time === "string" || typeof meta.interviewer === "string" ? (
                        <div className="mt-1.5 rounded-md border border-accent/25 bg-accent/[0.04] px-3 py-2 text-[0.75rem] text-foreground">
                          {typeof meta.date === "string" ? <span className="font-semibold">Interview: {meta.date}</span> : null}
                          {typeof meta.time === "string" ? <span className="ml-2 font-semibold">at {meta.time}</span> : null}
                          {typeof meta.interviewer === "string" ? <span className="ml-2 text-muted">with {meta.interviewer}</span> : null}
                          {typeof meta.meetingLink === "string" && safeCandidateUrl(meta.meetingLink) ? (
                            <a href={safeCandidateUrl(meta.meetingLink)!} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate font-mono text-[0.6875rem] text-accent hover:underline">
                              {meta.meetingLink}
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                      {log.action === "enquiry.contactUpdated" ? <div className="mt-2 space-y-1 text-xs leading-5 text-muted">
                        {typeof meta.from === "string" ? <p>{CONTACT_LABELS[meta.from as ContactOutcome] ?? "Not recorded"} → {CONTACT_LABELS[meta.to as ContactOutcome] ?? "Updated"}{typeof meta.channel === "string" && meta.channel ? ` · ${CONTACT_CHANNELS[meta.channel as keyof typeof CONTACT_CHANNELS] ?? meta.channel}` : ""}</p> : null}
                        {typeof meta.callbackAt === "string" && Number.isFinite(Date.parse(meta.callbackAt)) ? <p className="font-semibold text-foreground">Callback: {fmtIST(new Date(meta.callbackAt))}</p> : null}
                        {typeof meta.note === "string" && meta.note ? <p className="whitespace-pre-wrap break-words">{meta.note}</p> : null}
                        <p>Internal update · no email sent · hiring stage unchanged</p>
                      </div> : null}
                      {typeof meta.emailSent === "string" && typeof meta.emailTo === "string" && meta.emailTo ? <p className="mt-1 break-words text-xs text-muted">Candidate email requested: {({ shortlistAck: "shortlist acknowledgment", candidateRejection: "rejection notice", interviewInvite: "interview invitation", offerLetter: "offer template", documentVerification: "document checklist" } as Record<string, string>)[meta.emailSent] ?? "notification"}. Delivery is tracked separately.</p> : meta.emailRequested === false ? <p className="mt-1 text-xs text-muted">Recorded internally · no candidate email requested</p> : null}
                    </div>
                  </li>
                );
              })}
            </PagedContent>
          )}
        </div>
      </section>
    </>
  );
}
