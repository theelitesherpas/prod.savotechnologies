import type { ReactNode } from "react";
import type { PublicMeetingData } from "@/lib/meeting/service";
import { clientGreetingName } from "@/lib/client-name";
import { COMPANY_FACTS } from "@/constants/company-facts";
import { MEETING_TYPES, meetingDateLabel, meetingTimeLabel, meetingLocation, safeMeetingUrl, type MeetingView } from "./meeting-model";
import { MeetingArrow, MeetingSymbol } from "./meeting-art";
import s from "./meeting.module.css";

const emailFact = COMPANY_FACTS.email;
const phoneFact = COMPANY_FACTS.phone;
export const meetingHelpEmail = emailFact.visibility === "public" && ["verified", "computed"].includes(emailFact.status) ? emailFact.value : null;
const digits = phoneFact.visibility === "public" && ["verified", "computed"].includes(phoneFact.status) ? phoneFact.value.replace(/\D/g, "") : "";
export const meetingWhatsApp = digits ? `https://wa.me/${digits}` : null;

/**
 * THESIS: a preference is not a booking; review it, send it, read the actual status.
 * OWN-WORLD: approved Outfit/Inter, flat white/grey/black fields and accessible red actions.
 * STORY: invitation, IST date/time, missing details, exact review, truthful receipt.
 * FIRST VIEWPORT: compact subject/IST header, collapsible phone details and large offered-date choices.
 * FORM: owner-pinned date-first flow; native date cards, explicit alternative date, day-linked times and inline review.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 * finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
 */
export function MeetingFrame({ children }: { children: ReactNode }) {
  return <div className={s.page} data-meeting-page="availability-not-a-booking" data-design-contract="meeting-v7:THESIS=availability-not-booking;OWN-WORLD=Outfit-Inter-white-black-red-grey;STORY=invitation-IST-details-review-receipt;FIRST-VIEWPORT=compact-header-large-date-choices;FORM=owner-pinned-offered-dates-alternative-time-review;FINISH=review-verdict-documentation-provenance">{children}</div>;
}
export function MeetingFacts({ children }: { children: ReactNode }) { return <dl className={s.facts}>{children}</dl>; }
export function MeetingFact({ label, children }: { label: string; children: ReactNode }) { return <div><dt>{label}</dt><dd>{children}</dd></div>; }
export function InvitationFacts({ data }: { data: PublicMeetingData }) {
  return <MeetingFacts><MeetingFact label="Meeting type">{MEETING_TYPES[data.meetingType] ?? data.meetingType}</MeetingFact><MeetingFact label="Duration">{data.durationMin} minutes</MeetingFact><MeetingFact label="Location">{meetingLocation(data)}</MeetingFact><MeetingFact label="Reference">{data.reference}</MeetingFact></MeetingFacts>;
}
export function MeetingHero({ data }: { data: PublicMeetingData }) {
  return <section className={s.hero} aria-labelledby="meeting-heading"><div className={s.rail}>
    <h1 id="meeting-heading">{data.title}</h1>
    <p className={s.heroIntro}>Hi {clientGreetingName(data.clientName)}, {data.status === "reschedule_requested" ? "choose a new date, then a start time." : "choose a date, then a start time."} You can review both before sending.</p>
    <div className={s.meetingMeta} aria-label="Meeting format, duration and timezone"><span>{MEETING_TYPES[data.meetingType] ?? data.meetingType}</span><span><MeetingSymbol kind="clock" />{data.durationMin} minutes</span><span>IST · UTC+5:30</span></div>
    <details className={s.mobileInvitation}><summary>View meeting details<Chevron /></summary><MeetingContext data={data} compact /></details>
  </div></section>;
}
function Chevron() { return <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m5 7 5 5 5-5" /></svg>; }
export function MeetingContext({ data, compact = false }: { data: PublicMeetingData; compact?: boolean }) {
  const heading = compact ? "context-mobile-heading" : "context-heading";
  return <aside className={s.context} aria-labelledby={heading}><div className={s.invitation}><h2 id={heading}>Your invitation.</h2><InvitationFacts data={data} /><details className={s.contactRecord}><summary>View contact details<Chevron /></summary><MeetingFacts><MeetingFact label="Name">{data.clientName}</MeetingFact>{data.clientCompany && <MeetingFact label="Company">{data.clientCompany}</MeetingFact>}{data.clientPhone && <MeetingFact label="Phone">{data.clientPhone}</MeetingFact>}{data.clientEmail && <MeetingFact label="Email">{data.clientEmail}</MeetingFact>}</MeetingFacts></details>{data.agenda && <div className={s.agenda}><h3>Agenda</h3><p>{data.agenda}</p></div>}</div><div className={s.help}><h3>Need another arrangement?</h3><p>Keep your invitation link private. For a change to the meeting, contact details or location, contact Savo and quote the reference.</p>{meetingHelpEmail && <a href={`mailto:${meetingHelpEmail}`}>{meetingHelpEmail}<MeetingArrow /></a>}</div></aside>;
}
export function MeetingUnavailable({ kind }: { kind: "expired" | "unavailable" }) {
  return <MeetingFrame><section className={s.terminal} aria-labelledby="meeting-status-heading"><div className={`${s.rail} ${s.statusLayout}`}><div><MeetingSymbol kind="clock" /><h1 id="meeting-status-heading">{kind === "expired" ? "This meeting request has expired." : "We can’t load this meeting right now."}</h1><p>{kind === "expired" ? "Please contact Savo Technologies to request a new scheduling link." : "The scheduling service is unavailable. Try again, or contact Savo with the reference from your invitation."}</p><div className={s.actions}>{kind === "unavailable" && <a href="" className={s.primary}>Try again<MeetingArrow /></a>}{meetingHelpEmail && <a href={`mailto:${meetingHelpEmail}`} className={kind === "expired" ? s.primary : s.secondary}>Contact Savo<MeetingArrow /></a>}</div></div><aside className={s.statusNote}><h2>Your next step.</h2><p>{kind === "expired" ? "Request a fresh invitation before choosing a time. An expired link cannot submit availability." : "Your scheduling details haven’t been submitted here. Keep the invitation and try again when the service is available."}</p></aside></div></section></MeetingFrame>;
}
export function MeetingOutcome({ data, view, date, time, fresh = false, focusRef }: { data: PublicMeetingData; view: Exclude<MeetingView, "schedule" | "expired">; date?: string; time?: string; fresh?: boolean; focusRef?: React.Ref<HTMLDivElement> }) {
  const cancelled = view === "cancelled", completed = view === "completed", confirmed = view === "confirmed";
  const title = cancelled ? "This meeting has been cancelled." : completed ? "This meeting has been completed." : confirmed ? "Your meeting is confirmed." : view === "unavailable" ? "This invitation is not open for scheduling." : fresh ? "Availability received." : "Your availability has been submitted.";
  const lead = cancelled ? "Please contact us to reschedule or discuss alternatives." : completed ? "Thank you for meeting with us. Keep these details for your reference." : confirmed ? "The invitation records a confirmed meeting. Check the date, start time and location below." : view === "unavailable" ? "Contact Savo to check the status or request an active scheduling link." : fresh ? "Your preferred time has been received. This receipt does not establish whether the meeting is confirmed. Check this invitation again for the meeting status or contact Savo." : "This is your preferred time, not a confirmed booking. Check this invitation again for the meeting status or contact Savo.";
  const join = confirmed ? safeMeetingUrl(data.meetingUrl) : null;
  return <MeetingFrame><section className={s.terminal} aria-labelledby="meeting-status-heading"><div className={`${s.rail} ${s.statusLayout}`}><div className={s.outcome} ref={focusRef} tabIndex={-1} role={fresh ? "status" : undefined}><MeetingSymbol kind={cancelled ? "closed" : completed || confirmed ? "check" : "clock"} /><h1 id="meeting-status-heading">{title}</h1><p>{lead}</p><div className={s.actions}>{join && <a href={join} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={s.primary}>Open meeting link<MeetingArrow /></a>}{!cancelled && !completed && <a href="" className={s.secondary}>Check meeting status<MeetingArrow /></a>}{meetingHelpEmail && <a href={`mailto:${meetingHelpEmail}`} className={cancelled ? s.primary : s.textAction}>Contact Savo<MeetingArrow /></a>}{cancelled && meetingWhatsApp && <a href={meetingWhatsApp} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className={s.secondary}>WhatsApp Us<MeetingArrow /></a>}</div>{fresh && <p className={s.receiptNote}>Receipt of availability does not verify confirmation-email delivery. Added phone/email details are kept with meeting notes; notification contacts are not changed.</p>}</div><aside className={s.statusNote}><h2>{data.title}</h2><MeetingFacts><MeetingFact label={confirmed || completed ? "Date" : "Preferred date"}>{meetingDateLabel(date ?? data.confirmedDate ?? data.preferredDate ?? "")}</MeetingFact><MeetingFact label={confirmed || completed ? "Start time · IST" : "Preferred time · IST"}>{meetingTimeLabel(time ?? data.confirmedTime ?? data.preferredTime ?? "")}</MeetingFact><MeetingFact label="Duration">{data.durationMin} minutes</MeetingFact><MeetingFact label="Meeting type">{MEETING_TYPES[data.meetingType] ?? data.meetingType}</MeetingFact><MeetingFact label="Location">{meetingLocation(data)}</MeetingFact>{data.clientCompany && <MeetingFact label="Company">{data.clientCompany}</MeetingFact>}<MeetingFact label="Reference">{data.reference}</MeetingFact></MeetingFacts></aside></div></section></MeetingFrame>;
}
