"use client";

import { useState } from "react";
import { FormGuard } from "@/components/admin/form-guard";
import { SubmitButton } from "@/components/admin/form";
import { saveCandidateContactAction } from "@/app/admin/(protected)/enquiries/career-actions";
import { CONTACT_OUTCOMES, CONTACT_LABELS, CONTACT_HINTS, CONTACT_CHANNELS, callbackInputValue, parseCallbackIST, type candidateContact } from "@/lib/hr-contact";

export function ContactOutcomeForm({ id, revision, returnTo, current }: {
  id: string; revision: string; returnTo: string; current: ReturnType<typeof candidateContact>;
}) {
  const [outcome, setOutcome] = useState(current.outcome);
  return <FormGuard action={saveCandidateContactAction} className="space-y-4" validate={form => {
    if (outcome !== "callback_requested") return [];
    const date = parseCallbackIST(String(new FormData(form).get("callbackAt") ?? ""));
    return date && date.getTime() > Date.now() ? [] : [{ anchor: "contact-callback", message: "Choose a future callback date and time in IST." }];
  }}>
    <input type="hidden" name="id" value={id} /><input type="hidden" name="revision" value={revision} /><input type="hidden" name="returnTo" value={returnTo} />
    <label className="block"><span className="adm-label mb-1.5">Contact outcome *</span><select name="outcome" className="adm-select" required value={outcome === "not_recorded" ? "" : outcome} onChange={event => setOutcome(event.target.value as typeof outcome)} aria-describedby="contact-hint">
      <option value="" disabled>Choose what happened</option>{CONTACT_OUTCOMES.filter(key => key !== "not_recorded").map(key => <option key={key} value={key}>{CONTACT_LABELS[key]}</option>)}
    </select></label>
    <p id="contact-hint" className="text-xs leading-5 text-muted">{CONTACT_HINTS[outcome]}</p>
    <label className="block"><span className="adm-label mb-1.5">Contact method</span><select name="channel" className="adm-select" defaultValue={current.channel}>{Object.entries(CONTACT_CHANNELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    {outcome === "callback_requested" ? <label className="block"><span className="adm-label mb-1.5">Callback date & time (IST) *</span><input id="contact-callback" name="callbackAt" type="datetime-local" className="adm-input" required defaultValue={callbackInputValue(current.callbackAt)} /><span className="mt-1.5 block text-xs leading-5 text-muted">India Standard Time. This records a follow-up; it does not send an automatic reminder.</span></label> : <input type="hidden" name="callbackAt" value="" />}
    <label className="block"><span className="adm-label mb-1.5">Contact note (optional)</span><textarea name="note" className="adm-textarea" rows={3} maxLength={1000} defaultValue={current.note} placeholder="What happened, what was agreed, or what to ask next" /></label>
    <p className="text-xs leading-5 text-muted">Internal only. Saving does not send an email or change the recruitment stage. Every update is kept in the activity history.</p>
    <SubmitButton label="Save contact outcome" pendingLabel="Saving outcome…" />
  </FormGuard>;
}
