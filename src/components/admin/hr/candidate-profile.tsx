import { candidateProfile, safeCandidateUrl } from "@/lib/hr-candidates";
import { CandidateStageChip } from "./candidate-workspace";
import { FormGuard } from "@/components/admin/form-guard";
import { SubmitButton } from "@/components/admin/form";
import { Chip } from "@/components/admin/ui";
import { saveCandidateProfileAction } from "@/app/admin/(protected)/enquiries/career-actions";
import { fmtIST } from "@/lib/datetime";

type Candidate = { id: string; company?: string | null; data: unknown; projectType: string; status: string; careerStatus: string | null; updatedAt: Date; interviewDate: Date | null; interviewer: string | null; meetingLink: string | null };
export function CandidateOverview({ candidate }: { candidate: Candidate }) {
  const profile = candidateProfile(candidate.data, candidate.projectType);
  const stage = candidate.status === "archived" ? "archived" : candidate.careerStatus || "new";
  const currentCtc = typeof profile.original.currentCtc === "string" ? profile.original.currentCtc : "";
  return <section className="adm-card mb-6 p-5" aria-labelledby="candidate-summary">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 id="candidate-summary" className="text-lg font-semibold">Candidate at a glance</h2><CandidateStageChip stage={stage} /></div>
    <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
      {[["Role", profile.role], ["Total experience", profile.experience], ["Current city", profile.city], ["Hometown", profile.hometown], ["Notice period", profile.notice], ["Current annual CTC", currentCtc], ["Expected annual CTC", profile.expectedCtc], ["Current employer", String(profile.original.currentCompany || candidate.company || "")], ["Current designation", String(profile.original.currentDesignation ?? "")], ["Work preference", String(profile.original.workPreference ?? "")]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-medium text-muted">{label}</dt><dd className={`mt-1 break-words text-sm ${value ? "font-medium" : "text-muted"}`}>{value || "Not provided"}</dd>{label === "Total experience" && value ? <p className="mt-1 text-xs text-muted">{profile.months === null ? "Applicant-reported band" : "Exact total confirmed by HR"}</p> : null}</div>)}
    </dl>
    {profile.skills.length ? <div className="mt-5 border-t border-border pt-4"><h3 className="mb-2 text-xs font-medium text-muted">Key skills</h3><div className="flex flex-wrap gap-2">{profile.skills.map((skill, i) => <Chip key={`${skill}-${i}`}>{skill}</Chip>)}</div></div> : null}
    <div className="mt-5 flex flex-wrap gap-2">{[["Open resume", profile.resume], ["Portfolio / GitHub", profile.links], ["LinkedIn profile", profile.original.linkedin]].map(([label, value]) => {
      const href = safeCandidateUrl(value); return href ? <a key={String(label)} href={href} target="_blank" rel="noopener noreferrer" className="adm-btn-ghost">{String(label)}</a> : null;
    })}</div>
    {profile.resume ? <p className="mt-3 text-xs text-muted">Resume permissions are controlled by the applicant. If access is denied, ask for an “Anyone with the link can view” link.</p> : null}
    {candidate.interviewDate && stage === "interview_scheduled" ? <div className="mt-5 border-t border-border pt-4"><h3 className="mb-2 text-sm font-semibold">Scheduled interview</h3><p className="text-sm">{fmtIST(candidate.interviewDate)}{candidate.interviewer ? ` · ${candidate.interviewer}` : ""}</p>{safeCandidateUrl(candidate.meetingLink) ? <a className="adm-btn-ghost mt-3" href={safeCandidateUrl(candidate.meetingLink)!} target="_blank" rel="noopener noreferrer">Open meeting link</a> : null}</div> : null}
  </section>;
}
export function CandidateProfileEditor({ candidate, returnTo, embedded = false }: { candidate: Candidate; returnTo: string; embedded?: boolean }) {
  const profile = candidateProfile(candidate.data, candidate.projectType);
  const content = <>
    <p className="mb-4 mt-3 text-xs leading-5 text-muted">Add confirmed hometown, location, role or precise experience after speaking with the candidate. Submitted answers remain unchanged. Blank fields use the original application.</p>
    <FormGuard action={saveCandidateProfileAction} className="space-y-4">
      <input type="hidden" name="id" value={candidate.id} /><input type="hidden" name="revision" value={candidate.updatedAt.toISOString()} /><input type="hidden" name="returnTo" value={returnTo} />
      {[["role", "Role", 120], ["city", "Current city", 150], ["hometown", "Hometown", 150]].map(([key, label, max]) => <label key={String(key)} className="block"><span className="adm-label mb-1">{label}</span><input className="adm-input" name={String(key)} maxLength={Number(max)} defaultValue={String(profile.reviewed[String(key)] ?? "")} placeholder={String(profile[String(key) as "role" | "city" | "hometown"] || "Not provided")} /></label>)}
      <fieldset><legend className="adm-label mb-2">Confirmed total experience (optional)</legend><div className="grid grid-cols-2 gap-3"><label><span className="mb-1 block text-xs text-muted">Years</span><input className="adm-input" name="years" type="number" min={0} max={60} step={1} defaultValue={profile.months === null ? "" : Math.floor(profile.months / 12)} /></label><label><span className="mb-1 block text-xs text-muted">Months</span><input className="adm-input" name="months" type="number" min={0} max={11} step={1} defaultValue={profile.months === null ? "" : profile.months % 12} /></label></div><p className="mt-2 text-xs leading-5 text-muted">Enter 0 years and 0 months for a confirmed fresher. Leave both blank to retain the submitted band.</p></fieldset>
      <SubmitButton label="Save HR profile" />
    </FormGuard>
  </>;
  return embedded ? <div id="hr-profile">{content}</div> : <details className="adm-card mb-7 p-5" id="hr-profile"><summary className="cursor-pointer text-sm font-semibold">Update HR-confirmed profile</summary>{content}</details>;
}
