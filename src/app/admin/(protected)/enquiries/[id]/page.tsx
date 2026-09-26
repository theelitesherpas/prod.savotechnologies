import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
  const [user, enquiry] = await Promise.all([
    getAdminUser(),
    prisma ? prisma.projectEnquiry.findUnique({ where: { id } }) : Promise.resolve(null),
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
        description={`Received ${enquiry.createdAt.toISOString().replace("T", " · ").slice(0, 17)}`}
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
                ["Received", enquiry.createdAt.toISOString().replace("T", " · ").slice(0, 17)],
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
                          <input id="iv-date" name="interviewDate" type="date" required className="adm-input" />
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
    </>
  );
}
