import type { ProjectEnquiry } from "@prisma/client";
import { CandidateActionDialog } from "./action-dialog";
import { ContactOutcomeForm } from "./contact-outcome-form";
import { CandidateProfileEditor } from "./candidate-profile";
import { CandidateStageChip } from "./candidate-workspace";
import { FormGuard } from "@/components/admin/form-guard";
import { SubmitButton } from "@/components/admin/form";
import { Chip } from "@/components/admin/ui";
import { candidateContact, isCallbackOverdue, CONTACT_LABELS, CONTACT_CHANNELS, canRecruit, type RecruitmentAction } from "@/lib/hr-contact";
import { fmtIST, todayIST } from "@/lib/datetime";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_META } from "@/lib/enquiry-status";
import { saveEnquiryNotesAction, updateEnquiryStatusAction, deleteEnquiryAction } from "@/app/admin/(protected)/enquiries/actions";
import { shortlistEnquiryAction, rejectEnquiryAction, scheduleInterviewAction, requestDocumentsAction, markHiredAction, resetCareerStatusAction } from "@/app/admin/(protected)/enquiries/career-actions";

export function ContactOutcomeChip({ outcome }: { outcome: ReturnType<typeof candidateContact>["outcome"] }) {
  return <Chip tone={outcome === "callback_requested" ? "warning" : outcome === "contacted" ? "success" : "muted"}>{CONTACT_LABELS[outcome]}</Chip>;
}
function ContextFields({ candidate, returnTo, base }: { candidate: ProjectEnquiry; returnTo: string; base: string }) {
  return <><input type="hidden" name="id" value={candidate.id} /><input type="hidden" name="revision" value={candidate.updatedAt.toISOString()} /><input type="hidden" name="returnTo" value={returnTo} /><input type="hidden" name="backTo" value={`${base}/${candidate.id}`} /></>;
}
function EmailChoice({ candidate, template }: { candidate: ProjectEnquiry; template: string }) {
  return <div className="mb-5 rounded-lg border border-border bg-surface-2 p-3 text-sm">
    <input type="hidden" name="emailPreference" value="explicit" />
    {candidate.email ? <><label className="flex items-start gap-2.5"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-accent" name="notifyCandidate" value="yes" defaultChecked /><span>Also email the candidate<span className="mt-1 block break-words text-xs leading-5 text-muted">{template} to {candidate.email}. Uncheck to record the decision internally only.</span></span></label></> : <p className="text-muted">No email address is available. This saves the change internally only.</p>}
  </div>;
}
type ActionContext = { candidate: ProjectEnquiry; returnTo: string; base: string };
function Decision({ context, kind, label, description, action, confirm, template, danger = false }: {
  context: ActionContext; kind: RecruitmentAction; label: string; description: string; action: (form: FormData) => Promise<void>; confirm: string; template?: string; danger?: boolean;
}) {
  const { candidate } = context;
  if (!canRecruit(kind, candidate.careerStatus, candidate.status) || kind === "documents" && !candidate.email) return <button type="button" disabled aria-describedby="pipeline-help" className="adm-btn-ghost w-full justify-center opacity-40">{label}</button>;
  return <CandidateActionDialog label={label} title={`${label}?`} description={description} danger={danger}>
    <FormGuard action={action}><ContextFields {...context} />{template ? <EmailChoice candidate={candidate} template={template} /> : null}<SubmitButton label={confirm} pendingLabel="Saving…" /></FormGuard>
  </CandidateActionDialog>;
}
const GUIDANCE: Record<string, string> = {
  new: "Review the application, then shortlist to arrange an interview. Reject only for a hiring decision.",
  shortlisted: "Arrange an interview or request documents. Mark hired becomes available after an interview is scheduled.",
  interview_scheduled: "You can reschedule, request documents, or record the hiring decision after reviewing the interview.",
  hired: "Complete the offer and onboarding records. No employee account is created automatically.",
  rejected: "The hiring team declined this application. Shortlist again to reopen it, or archive it under Inbox & more.",
  archived: "This application is archived. Restore it under Inbox & more before changing the recruitment stage.",
};

/** One right-hand action centre; protected dialogs keep consequential decisions deliberate. */
export function CandidateActions({ candidate, returnTo, base, admin }: { candidate: ProjectEnquiry; returnTo: string; base: string; admin: boolean }) {
  const contact = candidateContact(candidate.data), stage = candidate.careerStatus || "new";
  const archived = candidate.status === "archived" || stage === "archived";
  const can = (action: RecruitmentAction) => canRecruit(action, candidate.careerStatus, candidate.status);
  const phone = candidate.phone?.replace(/[^\d+]/g, "") ?? "";
  const fields = <ContextFields candidate={candidate} returnTo={returnTo} base={base} />;
  const context = { candidate, returnTo, base };
  return <section className="adm-card p-4 sm:p-5" aria-labelledby="candidate-actions">
    <h2 id="candidate-actions" className="mb-4 text-base font-bold">Manage application</h2>
    <div className="mb-5 grid grid-cols-2 gap-2">
      {/^\+?\d{6,15}$/.test(phone) ? <a className="adm-btn-ghost justify-center" href={`tel:${phone}`}>Call candidate</a> : <span className="self-center text-xs text-muted">No callable number</span>}
      {candidate.email ? <a className="adm-btn-ghost justify-center" href={`mailto:${candidate.email}?subject=${encodeURIComponent("Your application at Savo Technologies")}`}>Email candidate</a> : <span className="self-center text-xs text-muted">Email not provided</span>}
    </div>
    <div className="border-t border-border pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Contact outcome</h3><ContactOutcomeChip outcome={contact.outcome} /></div>
      {contact.callbackAt ? <p className="mb-3 text-sm leading-5"><span className="font-semibold">{isCallbackOverdue(contact.callbackAt) ? "Callback overdue" : "Callback due"}</span><span className="mt-1 block">{fmtIST(new Date(contact.callbackAt))}</span></p> : null}
      <CandidateActionDialog label="Update contact outcome" title="Update contact outcome" description="Record what happened when you tried to reach this candidate." primary>
        <ContactOutcomeForm id={candidate.id} revision={candidate.updatedAt.toISOString()} returnTo={returnTo} current={contact} />
      </CandidateActionDialog>
      {contact.updatedAt ? <p className="mt-2 text-xs leading-5 text-muted">Updated {fmtIST(new Date(contact.updatedAt))}{contact.channel ? ` · ${CONTACT_CHANNELS[contact.channel]}` : ""}</p> : null}
    </div>
    <div className="mt-5 border-t border-border pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Recruitment pipeline</h3><CandidateStageChip stage={archived ? "archived" : stage} /></div>
      <p id="pipeline-help" className="mb-3 text-xs leading-5 text-muted">{stage === "archived" && candidate.status !== "archived" ? "This older record has an archived recruitment stage. Use Reset pipeline under Inbox & more to reopen recruitment." : GUIDANCE[archived ? "archived" : stage] ?? "Review the current stage before changing the pipeline."}</p>
      {contact.outcome === "not_interested" ? <p className="mb-3 text-xs leading-5 text-error">The candidate is marked Not interested. Confirm their interest before progressing or sending recruitment emails.</p> : null}
      <div className="grid grid-cols-2 gap-2">
        <Decision context={context} kind="shortlist" label={stage === "rejected" ? "Shortlist again" : "Shortlist candidate"} description={`Move ${candidate.name} to Shortlisted and reopen the application for recruitment.`} action={shortlistEnquiryAction} confirm="Confirm shortlist" template="Shortlist acknowledgment" />
        {can("interview") ? <CandidateActionDialog label={stage === "interview_scheduled" ? "Reschedule interview" : "Schedule interview"} title={stage === "interview_scheduled" ? "Reschedule interview" : "Schedule interview"} description="Choose the interview details in India Standard Time. Rescheduling replaces the existing interview slot.">
          <FormGuard action={scheduleInterviewAction} className="space-y-4">{fields}
            <div className="grid gap-3 sm:grid-cols-2"><label><span className="adm-label mb-1.5">Date *</span><input name="interviewDate" type="date" required min={todayIST()} className="adm-input" /></label><label><span className="adm-label mb-1.5">Time (IST) *</span><select name="interviewTime" required className="adm-select"><option value="">Choose time</option>{["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM"].map(time => <option key={time}>{time}</option>)}</select></label></div>
            <label className="block"><span className="adm-label mb-1.5">Meeting link *</span><input name="meetingLink" type="url" required maxLength={500} defaultValue={candidate.meetingLink ?? ""} placeholder="https://meet.google.com/…" className="adm-input" /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label><span className="adm-label mb-1.5">Interviewer *</span><input name="interviewer" required minLength={2} maxLength={80} defaultValue={candidate.interviewer ?? ""} className="adm-input" /></label><label><span className="adm-label mb-1.5">Duration</span><input name="duration" defaultValue="45 minutes" maxLength={20} className="adm-input" /></label></div>
            <EmailChoice candidate={candidate} template={stage === "interview_scheduled" ? "Updated interview invitation" : "Interview invitation"} /><SubmitButton label="Save interview" pendingLabel="Saving interview…" />
          </FormGuard>
        </CandidateActionDialog> : <button type="button" disabled aria-describedby="pipeline-help" className="adm-btn-ghost w-full justify-center opacity-40">Schedule interview</button>}
        <Decision context={context} kind="documents" label="Request documents" description={`Send ${candidate.name} the existing verification checklist by email, with a seven-day submission deadline. This does not change the hiring stage. An email address is required.`} action={requestDocumentsAction} confirm="Send document request" />
        <Decision context={context} kind="hire" label="Mark hired" description="Record the hiring decision and close the application inbox item. This does not create an employee account or a signed offer. The existing offer email uses compensation and joining-date placeholders; uncheck email below if you will send a finalized offer separately." action={markHiredAction} confirm="Confirm hired" template="Existing offer-letter template" />
        <div className="col-span-2"><Decision context={context} kind="reject" label="Reject candidate" description="Record the hiring team's decision to decline this application and close its inbox item. If the candidate declined instead, use the Not interested contact outcome." action={rejectEnquiryAction} confirm="Confirm rejection" template="Rejection notice" danger /></div>
      </div>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-4">
      <CandidateActionDialog label="Edit HR profile" title="Edit HR-confirmed profile" description="Update confirmed details without replacing the original application."><CandidateProfileEditor candidate={candidate} returnTo={returnTo} embedded /></CandidateActionDialog>
      <CandidateActionDialog label="Edit internal notes" title="Edit internal notes" description="Internal recruitment context, visible only in the admin workspace."><FormGuard action={saveEnquiryNotesAction}>{fields}<label className="block"><span className="adm-label mb-1.5">Internal notes</span><textarea name="notes" className="adm-textarea mb-4" rows={6} maxLength={4000} defaultValue={candidate.adminNotes ?? ""} /></label><SubmitButton label="Save notes" /></FormGuard></CandidateActionDialog>
    </div>
    <details className="mt-4 border-t border-border pt-4"><summary className="cursor-pointer text-sm font-semibold">Inbox & more</summary>
      <p className="my-3 text-xs leading-5 text-muted">Inbox: {ENQUIRY_STATUS_META[candidate.status as keyof typeof ENQUIRY_STATUS_META]?.label ?? candidate.status}. Inbox state is separate from contact outcome and hiring stage.</p>
      <div className="space-y-2">
        <CandidateActionDialog label={archived ? "Restore / manage inbox" : "Manage inbox / archive"} title="Manage application inbox" description="Archive hides this application from active lists. Restoring it leaves its contact outcome and hiring decision unchanged."><FormGuard action={updateEnquiryStatusAction}>{fields}<label className="mb-4 block"><span className="adm-label mb-1.5">Inbox state</span><select name="status" className="adm-select" defaultValue={candidate.status}>{ENQUIRY_STATUSES.map(key => <option key={key} value={key}>{ENQUIRY_STATUS_META[key].label}</option>)}</select></label><SubmitButton label="Save inbox state" /></FormGuard></CandidateActionDialog>
        <Decision context={context} kind="reset" label="Reset pipeline" description="Return to New application and clear the interview slot, link and interviewer. Contact outcomes, notes and original answers are kept. No email is sent." action={resetCareerStatusAction} confirm="Reset recruitment pipeline" danger />
        {admin ? <CandidateActionDialog label="Delete application" title="Permanently delete application?" description="This permanently removes the application. This cannot be undone. Archive instead if you only want to remove it from active lists." danger><form action={deleteEnquiryAction}>{fields}<input type="hidden" name="confirm" value="DELETE" /><SubmitButton label="Delete permanently" pendingLabel="Deleting…" /></form></CandidateActionDialog> : null}
      </div>
    </details>
  </section>;
}
