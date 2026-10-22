import { z } from "zod";

export const CONTACT_OUTCOMES = ["not_recorded", "not_contacted", "contacted", "not_responded", "not_interested", "callback_requested"] as const;
export type ContactOutcome = typeof CONTACT_OUTCOMES[number];
export const CONTACT_LABELS: Record<ContactOutcome, string> = {
  not_recorded: "Not recorded", not_contacted: "Not contacted", contacted: "Contacted",
  not_responded: "Not responded", not_interested: "Not interested", callback_requested: "Callback requested",
};
export const CONTACT_HINTS: Record<ContactOutcome, string> = {
  not_recorded: "No contact outcome has been recorded yet.",
  not_contacted: "The candidate has not been contacted yet.",
  contacted: "You reached the candidate and spoke or exchanged messages.",
  not_responded: "You tried to reach the candidate but have not received a response.",
  not_interested: "The candidate said they do not want to proceed. This is not a hiring rejection.",
  callback_requested: "The candidate asked you to contact them again at a specific time.",
};
export const CONTACT_CHANNELS = { "": "Not specified", phone: "Phone call", email: "Email", whatsapp: "WhatsApp", other: "Other" } as const;
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
export function candidateContact(data: unknown) {
  const contact = record(record(data).hrContact);
  const outcome: ContactOutcome = CONTACT_OUTCOMES.includes(contact.outcome as ContactOutcome) ? contact.outcome as ContactOutcome : "not_recorded";
  const date = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
  return { outcome, callbackAt: outcome === "callback_requested" ? date(contact.callbackAt) : null,
    updatedAt: date(contact.updatedAt), note: typeof contact.note === "string" ? contact.note : "",
    channel: Object.hasOwn(CONTACT_CHANNELS, String(contact.channel)) ? contact.channel as keyof typeof CONTACT_CHANNELS : "" };
}
/** Datetime-local fields in this HR workspace always mean India Standard Time. */
export function parseCallbackIST(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const result = new Date(`${value}:00+05:30`);
  if (!Number.isFinite(result.getTime())) return null;
  return new Date(result.getTime() + 330 * 60000).toISOString().slice(0, 16) === value ? result : null;
}
export function isCallbackOverdue(value: string | null, now = Date.now()) { return value !== null && Date.parse(value) < now; }
export function callbackInputValue(value: string | null) {
  return value ? new Date(Date.parse(value) + 330 * 60000).toISOString().slice(0, 16) : "";
}
export const contactOutcomeSchema = z.object({
  id: z.string().min(10).max(40).regex(/^[a-zA-Z0-9_-]+$/), revision: z.iso.datetime(),
  outcome: z.enum(CONTACT_OUTCOMES).refine(value => value !== "not_recorded", "Choose a contact outcome."),
  channel: z.enum(["", "phone", "email", "whatsapp", "other"]),
  callbackAt: z.string().max(30), note: z.string().trim().max(1000),
}).superRefine((value, context) => {
  if (value.outcome === "callback_requested") {
    const date = parseCallbackIST(value.callbackAt);
    if (!date || date.getTime() <= Date.now()) context.addIssue({ code: "custom", path: ["callbackAt"], message: "Choose a future callback date and time in IST." });
  }
});

export type RecruitmentAction = "shortlist" | "interview" | "documents" | "hire" | "reject" | "reset";
/** Shared UI/server transition rules. A contact outcome never implicitly changes the hiring stage. */
export function canRecruit(action: RecruitmentAction, stage: string | null, inbox: string) {
  if (inbox === "archived") return false;
  if (stage === "archived") return action === "reset";
  const current = stage || "new";
  switch (action) {
    case "shortlist": return ["new", "rejected"].includes(current);
    case "interview": case "documents": return ["shortlisted", "interview_scheduled"].includes(current);
    case "hire": return current === "interview_scheduled";
    case "reject": return ["new", "shortlisted", "interview_scheduled"].includes(current);
    case "reset": return current !== "new";
  }
}
