import { PROJECT_TYPES, enquirySchema, flattenFieldErrors, type EnquiryFieldErrors } from "@/schemas/enquiry";
import { COUNTRY_PHONE_RULES } from "@/lib/phone";

export const START_STEPS = ["You", "The project", "Review"] as const;
export type StartDraft = { name: string; email: string; company: string; phone: string; projectType: string; budget: string; message: string; website: string };
export function initialProjectType(value: unknown): string | undefined {
  return typeof value === "string" && (PROJECT_TYPES as readonly string[]).includes(value) ? value : undefined;
}
export function emptyStartDraft(type?: string): StartDraft {
  return { name: "", email: "", company: "", phone: "", projectType: initialProjectType(type) ?? "", budget: "", message: "", website: "" };
}
/** Selecting a country alone must not turn the optional phone into a required field. */
export function optionalStartPhone(value: string): string {
  return Object.values(COUNTRY_PHONE_RULES).some(rule => rule.dial === value) ? "" : value;
}
export function startDraftInput(draft: StartDraft) { return { ...draft, phone: optionalStartPhone(draft.phone) }; }
const CONTACT_SCHEMA = enquirySchema.pick({ name: true, email: true, company: true, phone: true });
const PROJECT_SCHEMA = enquirySchema.pick({ projectType: true, budget: true, message: true });
export function validateStartStep(draft: StartDraft, step: number, phoneOk = true): EnquiryFieldErrors {
  const result = (step === 0 ? CONTACT_SCHEMA : PROJECT_SCHEMA).safeParse(startDraftInput(draft));
  const errors: EnquiryFieldErrors = result.success ? {} : Object.fromEntries(result.error.issues.map(issue => [issue.path[0], issue.message]).reverse());
  if (step === 0 && !phoneOk && optionalStartPhone(draft.phone)) errors.phone = "Check the number for the country you selected.";
  return errors;
}
export function validateStartDraft(draft: StartDraft, phoneOk = true): EnquiryFieldErrors {
  const result = enquirySchema.safeParse(startDraftInput(draft));
  const errors = result.success ? {} : flattenFieldErrors(result.error);
  if (!phoneOk && optionalStartPhone(draft.phone)) errors.phone = "Check the number for the country you selected.";
  return errors;
}
export function startErrorStep(errors: EnquiryFieldErrors): number {
  if (["name", "email", "company", "phone"].some(key => errors[key as keyof EnquiryFieldErrors])) return 0;
  return ["projectType", "budget", "message"].some(key => errors[key as keyof EnquiryFieldErrors]) ? 1 : 2;
}

/** Existing published sequence; planning targets, not new delivery guarantees. */
export const START_NEXT_STEPS = [
  { when: "Within one business day", title: "An engineer reviews your brief", text: "A senior engineer reads the brief and replies with the first questions about your goals and constraints." },
  { when: "Days 2–3", title: "A free 30-minute scoping call", text: "Discuss goals, constraints, success metrics and a rough range before deciding how to move forward." },
  { when: "Days 3–5", title: "A written proposal", text: "Review scope, milestones, transparent pricing and a proposed start date before any commitment." },
] as const;
export const START_TIMING_NOTE = "Indicative timing, not a guaranteed schedule. Confirm availability, call arrangements, any NDA and proposal commitments for your enquiry.";
