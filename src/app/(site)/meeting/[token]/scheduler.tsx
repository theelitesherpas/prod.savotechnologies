"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import type { PublicMeetingData } from "@/lib/meeting/service";
import { COUNTRY_PHONE_RULES } from "@/lib/phone";
import { withBasePath } from "@/lib/utils";
import { MeetingFrame, MeetingHero, MeetingContext, MeetingOutcome, MeetingUnavailable, meetingHelpEmail } from "@/sections/meeting/meeting-views";
import { MeetingArrow } from "@/sections/meeting/meeting-art";
import { MeetingAvailabilityPicker } from "@/sections/meeting/availability-picker";
import { emptyMeetingDraft, istClock, meetingDates, meetingSlots, meetingView, meetingNeeds, meetingDateLabel, meetingTimeLabel, validateMeetingDraft, meetingPayload, meetingPhone, meetingSavedNotes, MEETING_LIMITS, MEETING_CONTACT_NOTE, type MeetingClock, type MeetingDraft } from "@/sections/meeting/meeting-model";
import s from "@/sections/meeting/meeting.module.css";

const subscribe = () => () => {};
const ready = () => true;
const notReady = () => false;
const FIELD_ORDER: (keyof MeetingDraft)[] = ["date", "time", "phone", "email", "address", "notes"];

export function MeetingScheduler({ data, token, initialClock }: { data: PublicMeetingData; token: string; initialClock?: MeetingClock }) {
  const hydrated = useSyncExternalStore(subscribe, ready, notReady);
  const [clock, setClock] = useState(() => initialClock ?? istClock());
  const [draft, setDraft] = useState(emptyMeetingDraft);
  const [phase, setPhase] = useState<"choose" | "review">("choose");
  const [errors, setErrors] = useState<Partial<Record<keyof MeetingDraft, string>>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const [expired, setExpired] = useState(false);
  const view = meetingView(data);
  const needs = meetingNeeds(data);
  const normalizedPhone = meetingPhone(draft.country, draft.phone);
  const dates = meetingDates(data, clock);
  const slots = meetingSlots(data.availableFrom, data.availableTo, draft.date, clock);
  const suggested = !!draft.date && !data.availableDates.includes(draft.date);
  const selectionReady = !!draft.date && slots.includes(draft.time);
  const hasOfferedTime = dates.some(date => meetingSlots(data.availableFrom, data.availableTo, date, clock).length > 0);

  useEffect(() => {
    const update = () => { setClock(istClock()); setExpired(!!data.expiresAt && new Date(data.expiresAt).getTime() < Date.now()); };
    update();
    const interval = setInterval(update, 30_000);
    window.addEventListener("focus", update);
    return () => { clearInterval(interval); window.removeEventListener("focus", update); };
  }, [data.expiresAt]);
  useEffect(() => { if (submitted) receiptRef.current?.focus(); }, [submitted]);

  function focusField(field: keyof MeetingDraft) {
    requestAnimationFrame(() => {
      const form = formRef.current;
      const selector = field === "date" || field === "time" ? `input[name="${field}"]:not(:disabled)` : `[name="${field}"]`;
      const checked = form?.querySelector<HTMLInputElement>(`input[name="${field}"]:checked:not(:disabled)`);
      const alternative = field === "date" && checked?.getAttribute("value") === "other" ? form?.querySelector<HTMLElement>('#suggest-date') : null;
      (alternative ?? checked ?? form?.querySelector<HTMLElement>(selector) ?? form?.querySelector<HTMLElement>('input[name="date"]:not(:disabled)') ?? form)?.focus();
    });
  }
  function update(field: keyof MeetingDraft, value: string) {
    if (pending.current) return;
    setDraft(previous => ({ ...previous, [field]: value, ...(field === "date" ? { time: "" } : {}), ...(field === "country" ? { phone: "" } : {}) }));
    setErrors(previous => ({ ...previous, [field]: undefined, ...(field === "date" ? { time: undefined } : {}) }));
    setServerError("");
  }
  function showErrors(nextErrors: typeof errors) {
    setErrors(nextErrors); setPhase("choose");
    const field = FIELD_ORDER.find(key => nextErrors[key]);
    if (field) focusField(field);
  }
  function review() {
    if (pending.current || !hydrated) return;
    const current = istClock(); setClock(current);
    const nextErrors = validateMeetingDraft(draft, data, current);
    if (Object.keys(nextErrors).length) { showErrors(nextErrors); return; }
    setErrors({}); setServerError(""); setPhase("review");
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('#review-heading')?.focus());
  }
  function edit(field: keyof MeetingDraft = "date") { if (!pending.current) { setPhase("choose"); setServerError(""); focusField(field); } }
  async function send() {
    if (pending.current || !hydrated || phase !== "review" || view !== "schedule") return;
    const current = istClock(); setClock(current);
    const nextErrors = validateMeetingDraft(draft, data, current);
    if (Object.keys(nextErrors).length) { showErrors(nextErrors); return; }
    if (expired) return;
    pending.current = true; setSubmitting(true); setServerError("");
    try {
      const response = await fetch(withBasePath("/api/meeting/submit"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(meetingPayload(draft, data, token)) });
      const json = await response.json() as { ok?: boolean; error?: string };
      if (response.ok && json.ok === true) setSubmitted(true);
      else { setServerError(typeof json.error === "string" ? json.error : "Your availability was not accepted. Try again or contact Savo."); requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('#meeting-error')?.focus()); }
    } catch { setServerError("We couldn’t verify receipt of your availability. Check your connection, then try again or contact Savo."); requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('#meeting-error')?.focus()); }
    finally { pending.current = false; setSubmitting(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); if (phase === "choose") review(); else void send(); }
  function fieldError(field: keyof MeetingDraft) { return errors[field] ? <p id={`${field}-error`} className={s.fieldError}>{errors[field]}</p> : null; }
  function description(field: keyof MeetingDraft, extra?: string) { return [extra, errors[field] ? `${field}-error` : undefined].filter(Boolean).join(" ") || undefined; }

  if (submitted) return <MeetingOutcome data={data} view="pending" date={draft.date} time={draft.time} fresh focusRef={receiptRef} />;
  if (expired || view === "expired") return <MeetingUnavailable kind="expired" />;
  if (view !== "schedule") return <MeetingOutcome data={data} view={view} />;

  return <MeetingFrame><MeetingHero data={data} /><section id="availability" className={s.workspace} aria-labelledby="availability-heading"><div className={`${s.rail} ${s.workspaceLayout}`}>
    <form ref={formRef} onSubmit={submit} className={s.form} noValidate aria-busy={submitting} tabIndex={-1}>
      {phase === "choose" ? <>
        <h2 id="availability-heading" className="sr-only">Choose your date and time</h2>
        <fieldset disabled={!hydrated || submitting}>
          <MeetingAvailabilityPicker data={data} clock={clock} date={draft.date} time={draft.time} onDateChange={date => update("date", date)} onTimeChange={time => update("time", time)} dateError={errors.date} timeError={errors.time} />
          {(needs.phone || needs.email || needs.address) && <section className={s.stage} aria-labelledby="contact-heading"><h3 id="contact-heading">Your contact details.</h3>{(needs.phone || needs.email) && <p className={s.note}>{MEETING_CONTACT_NOTE}</p>}<div className={s.contactFields}>
            {needs.phone && <><div className={s.field}><label htmlFor="meeting-country">Phone country</label><select id="meeting-country" name="country" value={draft.country} onChange={event => update("country", event.target.value)}>{Object.entries(COUNTRY_PHONE_RULES).map(([country, rule]) => <option value={country} key={country}>{country} ({rule.dial})</option>)}</select></div><div className={s.field}><label htmlFor="meeting-phone">Phone number <span>(required)</span></label><input id="meeting-phone" name="phone" type="tel" autoComplete="tel" value={draft.phone} maxLength={24} onChange={event => update("phone", event.target.value)} aria-invalid={!!errors.phone} aria-describedby={description("phone", "phone-help")} /><p id="phone-help">Use digits, with an optional country code.</p>{fieldError("phone")}</div></>}
            {needs.email && <div className={`${s.field} ${s.wide}`}><label htmlFor="meeting-email">Email address <span>(optional)</span></label><input id="meeting-email" name="email" type="email" autoComplete="email" maxLength={MEETING_LIMITS.email} value={draft.email} onChange={event => update("email", event.target.value)} aria-invalid={!!errors.email} aria-describedby={description("email")} />{fieldError("email")}</div>}
            {needs.address && <div className={`${s.field} ${s.wide}`}><label htmlFor="meeting-address">Meeting address <span>({needs.requiredAddress ? "required" : "optional"})</span></label><input id="meeting-address" name="address" autoComplete="street-address" maxLength={MEETING_LIMITS.address} value={draft.address} onChange={event => update("address", event.target.value)} aria-invalid={!!errors.address} aria-describedby={description("address")} />{fieldError("address")}</div>}
          </div></section>}
          <div className={s.field}><label htmlFor="meeting-notes">Notes / message <span>(optional)</span></label><textarea id="meeting-notes" name="notes" rows={3} maxLength={MEETING_LIMITS.notes} value={draft.notes} onChange={event => update("notes", event.target.value)} aria-invalid={!!errors.notes} aria-describedby={description("notes", "notes-help")} /><p id="notes-help">{meetingSavedNotes(draft, data).length.toLocaleString("en-GB")} / 2,000 characters, including any added contact details.</p>{fieldError("notes")}</div>
          {selectionReady ? <div className={s.selectionSummary} aria-label="Your selected date and time"><span className={s.selectionLabel}>Your selection</span><strong>{meetingDateLabel(draft.date)}</strong><span>{meetingTimeLabel(draft.time)} IST · {data.durationMin} minutes{suggested ? " · Your suggested date" : ""}</span></div> : null}
          <div className={s.actions}><button type="submit" className={s.primary} disabled={!hasOfferedTime && !data.allowSuggest}>Review date &amp; time<MeetingArrow /></button></div>
          <p className={s.nextStep}>Next: check your choices before sending. {meetingHelpEmail ? <a href={`mailto:${meetingHelpEmail}`}>Need help?</a> : null}</p>
        </fieldset>
      </> : <>
        <h2 id="availability-heading" className={s.reviewTitle}><span className={s.stepNumber} aria-hidden="true">3</span>Review your date and time.</h2><h3 id="review-heading" tabIndex={-1}>Ready to send?</h3><p className={s.note}>Check your date, start time and details. This sends your availability; check the invitation status afterwards for meeting confirmation.</p>
        <dl className={s.review}>{[
          { label: "Preferred date", value: meetingDateLabel(draft.date) + (suggested ? " · Suggested date" : ""), field: "date" as const },
          { label: "Preferred start time · IST", value: meetingTimeLabel(draft.time), field: "time" as const },
          ...(needs.phone ? [{ label: "Added phone", value: normalizedPhone.ok ? normalizedPhone.normalized : draft.phone, field: "phone" as const }] : []),
          ...(needs.email ? [{ label: "Added email", value: draft.email.trim() || "Not specified", field: "email" as const }] : []),
          ...(needs.address ? [{ label: "Meeting address", value: draft.address.trim() || "Not specified", field: "address" as const }] : []),
          { label: "Notes / message", value: draft.notes.trim() || "Not specified", field: "notes" as const },
        ].map(row => <div key={row.label}><div><dt>{row.label}</dt><dd>{row.value}</dd></div><button type="button" onClick={() => edit(row.field)} disabled={submitting} className={s.textAction} aria-label={`Edit ${row.label}`}>Edit<MeetingArrow /></button></div>)}</dl>
        {(needs.phone || needs.email) && <div className={s.notice}><p>{MEETING_CONTACT_NOTE}</p></div>}
        <div className={s.actions}><button type="button" onClick={() => edit()} disabled={submitting} className={s.secondary}><MeetingArrow back />Back</button><button type="submit" disabled={!hydrated || submitting} className={s.primary}>{submitting ? "Sending availability…" : "Send availability"}<MeetingArrow /></button></div>
      </>}
      {serverError && <div id="meeting-error" className={s.error} tabIndex={-1} role="alert"><p>{serverError}</p>{meetingHelpEmail && <a href={`mailto:${meetingHelpEmail}`}>Contact Savo and quote {data.reference}</a>}</div>}
      {!hydrated && <p className={s.note}>Enable JavaScript to choose and send availability. {meetingHelpEmail && <a href={`mailto:${meetingHelpEmail}`}>Email Savo instead</a>} and quote {data.reference}.</p>}
    </form>
    <MeetingContext data={data} />
  </div></section></MeetingFrame>;
}
