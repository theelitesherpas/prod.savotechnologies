import type { PublicMeetingData } from "@/lib/meeting/service";
import { COUNTRY_PHONE_RULES, validatePhone } from "@/lib/phone";

export const MEETING_TYPES: Record<string, string> = { in_person: "In-Person Meeting", video: "Video Meeting", phone: "Phone Call", office_visit: "Office Visit", client_office: "Client Office", custom: "Meeting" };
export const MEETING_LOCATIONS: Record<string, string> = { savo_office: "Savo Technologies Office", client_office: "Client Office", google_meet: "Google Meet", zoom: "Zoom", teams: "Microsoft Teams", phone: "Phone", custom: "Custom Location" };
export const MEETING_LIMITS = { email: 160, address: 500, notes: 2000 } as const;
export const MEETING_CONTACT_NOTE = "Added phone and email are saved with your meeting notes, not as changes to the invitation’s contact record. Contact Savo to update the address used for notifications.";
export type MeetingClock = { date: string; minutes: number };
export type MeetingDraft = { date: string; time: string; country: string; phone: string; email: string; address: string; notes: string };
export const emptyMeetingDraft = (): MeetingDraft => ({ date: "", time: "", country: "India", phone: "", email: "", address: "", notes: "" });

export function istClock(now = new Date()): MeetingClock {
  // IST has no DST: an explicit UTC shift is deterministic on server and browser.
  const shifted = new Date(now.getTime() + 330 * 60_000);
  return { date: shifted.toISOString().slice(0, 10), minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
}
export function validMeetingDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function meetingTimeMinutes(value: string): number | null {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
export function meetingDateLabel(value: string): string {
  return validMeetingDate(value) ? new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00Z`)) : "Not specified";
}
export function meetingDateParts(value: string) {
  if (!validMeetingDate(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return {
    weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short" }).format(date),
    day: String(date.getUTCDate()),
    month: new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "short" }).format(date),
    year: String(date.getUTCFullYear()),
  };
}
export function meetingTimeGroups(times: string[]) {
  return [
    { label: "Before noon (AM)", times: times.filter(time => { const minutes = meetingTimeMinutes(time); return minutes !== null && minutes < 720; }) },
    { label: "Noon onwards (PM)", times: times.filter(time => { const minutes = meetingTimeMinutes(time); return minutes !== null && minutes >= 720; }) },
  ].filter(group => group.times.length);
}
export function meetingTimeLabel(value: string): string {
  const minutes = meetingTimeMinutes(value);
  if (minutes === null) return "Not specified";
  const hours = Math.floor(minutes / 60);
  return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}
export function meetingSlots(from: string, to: string, date: string, clock: MeetingClock): string[] {
  const first = meetingTimeMinutes(from), last = meetingTimeMinutes(to);
  if (first === null || last === null || first >= last || !validMeetingDate(date) || date < clock.date) return [];
  const slots: string[] = [];
  for (let minutes = first; minutes < last; minutes += 30) {
    if (date === clock.date && minutes <= clock.minutes + 30) continue;
    slots.push(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
  }
  return slots;
}
export function meetingDates(data: PublicMeetingData, clock: MeetingClock) {
  return [...new Set(data.availableDates)].filter(date => validMeetingDate(date) && date >= clock.date).sort();
}
export function meetingLocation(data: PublicMeetingData) { return data.meetingUrl || data.locationAddress || MEETING_LOCATIONS[data.locationType] || data.locationType; }
export function safeMeetingUrl(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function meetingNeeds(data: PublicMeetingData) {
  return { phone: !data.clientPhone, email: !data.clientEmail, address: ["client_office", "savo_office", "in_person", "office_visit", "custom"].includes(data.locationType) && !data.locationAddress, requiredAddress: data.locationType === "client_office" && !data.locationAddress };
}
export type MeetingView = "schedule" | "pending" | "confirmed" | "completed" | "cancelled" | "expired" | "unavailable";
export function meetingView(data: PublicMeetingData): MeetingView {
  if (["cancelled", "completed", "expired"].includes(data.status)) return data.status as MeetingView;
  if (data.status === "confirmed") return "confirmed";
  if (data.status === "availability_received" || (data.preferredDate && data.status !== "reschedule_requested")) return "pending";
  return ["draft", "awaiting_client", "reschedule_requested"].includes(data.status) ? "schedule" : "unavailable";
}
export function meetingPhone(country: string, value: string) {
  const rule = COUNTRY_PHONE_RULES[country], raw = value.trim().replace(/ /g, "");
  if (!rule || (raw.startsWith("+") && rule.dial !== "+" && !raw.startsWith(rule.dial))) return { ok: false as const, error: "Check the number and selected country." };
  // Prefix national numbers before using the shared validator so a dial code
  // occurring inside a national number is not accidentally removed.
  return validatePhone(country, raw.startsWith("+") ? raw : `${rule.dial}${raw}`);
}
export function meetingSavedNotes(draft: MeetingDraft, data: PublicMeetingData) {
  const needs = meetingNeeds(data), phone = meetingPhone(draft.country, draft.phone);
  const contact = [needs.phone && phone.ok ? `Phone supplied: ${phone.normalized}` : "", needs.email && draft.email.trim() ? `Email supplied: ${draft.email.trim()}` : ""].filter(Boolean);
  return [contact.length ? `Contact supplied with availability (not an account update):\n${contact.join("\n")}` : "", draft.notes.trim()].filter(Boolean).join("\n\n");
}
export function validateMeetingDraft(draft: MeetingDraft, data: PublicMeetingData, clock: MeetingClock) {
  const errors: Partial<Record<keyof MeetingDraft, string>> = {};
  const needs = meetingNeeds(data);
  if (!validMeetingDate(draft.date) || draft.date < clock.date) errors.date = "Choose today or a future date in IST.";
  else if (!data.allowSuggest && !data.availableDates.includes(draft.date)) errors.date = "Choose a date from the invitation.";
  if (!meetingSlots(data.availableFrom, data.availableTo, draft.date, clock).includes(draft.time)) errors.time = "Choose a current start time in IST.";
  if (needs.phone) { const phone = meetingPhone(draft.country, draft.phone); if (!phone.ok) errors.phone = phone.error; }
  if (needs.email && draft.email.trim() && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) || draft.email.trim().length > MEETING_LIMITS.email)) errors.email = "Enter a valid email address, or leave it blank.";
  if (needs.requiredAddress && !draft.address.trim()) errors.address = "Enter the address for the client-office meeting.";
  if (draft.address.trim().length > MEETING_LIMITS.address) errors.address = "Keep the address within 500 characters.";
  if (meetingSavedNotes(draft, data).length > MEETING_LIMITS.notes) errors.notes = "Your message and added contact details must fit within 2,000 characters.";
  return errors;
}
export function meetingPayload(draft: MeetingDraft, data: PublicMeetingData, token: string) {
  const needs = meetingNeeds(data), phone = meetingPhone(draft.country, draft.phone), notes = meetingSavedNotes(draft, data);
  return { token, preferredDate: draft.date, preferredTime: draft.time,
    ...(needs.phone && phone.ok ? { clientPhone: phone.normalized } : {}),
    ...(needs.email && draft.email.trim() ? { clientEmail: draft.email.trim() } : {}),
    ...(needs.address && draft.address.trim() ? { clientAddress: draft.address.trim() } : {}),
    ...(notes ? { clientNotes: notes } : {}),
  };
}
