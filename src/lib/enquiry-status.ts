import { z } from "zod";

/** Enquiry lifecycle vocabulary shared by the API, admin UI and filters. */

export const ENQUIRY_STATUSES = ["new", "in_progress", "closed", "archived"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const enquiryStatusSchema = z.enum(ENQUIRY_STATUSES);

export const ENQUIRY_STATUS_META: Record<
  EnquiryStatus,
  { label: string; hint: string }
> = {
  new: { label: "New", hint: "Unopened lead" },
  in_progress: { label: "In progress", hint: "Being handled" },
  closed: { label: "Closed", hint: "Resolved or converted" },
  archived: { label: "Archived", hint: "Kept for reference, hidden from inbox" },
};

export function isEnquiryStatus(v: string): v is EnquiryStatus {
  return (ENQUIRY_STATUSES as readonly string[]).includes(v);
}
