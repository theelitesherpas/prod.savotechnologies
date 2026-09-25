import { z } from "zod";
import { CAREERS_TYPES } from "@/constants/careers";

/** Shared client + server validation for the project enquiry form. */

export const PROJECT_TYPES = [
  "Website",
  "Mobile App",
  "AI / AI Agent",
  "SaaS",
  "Custom Software",
  "UI/UX",
  "eCommerce",
  "Digital Marketing",
  "Other",
] as const;

export const BUDGET_RANGES = [
  "Under $5k",
  "$5k – $15k",
  "$15k – $40k",
  "$40k – $100k",
  "$100k+",
  "To be discussed",
] as const;

/** Topic chips on the contact page (version-1 content). Stored in the
 *  same projectType column, so the admin inbox sees one pipeline. */
export const CONTACT_TOPICS = [
  "New project",
  "Hire a team",
  "Support",
  "Careers",
  "Something else",
] as const;
const name = z
  .string()
  .trim()
  .min(2, "Please enter your name.")
  .max(80, "Name is too long.");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid business email.")
  .max(120, "Email is too long.");

const company = z.string().trim().max(120, "Company name is too long.").optional().or(z.literal(""));

/** Optional phone — contact page only. Loose format check; the callback
 *  form applies stricter country-aware rules when a call back is booked. */
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()\-]{6,24}$/, "Please enter a valid phone number.")
  .optional()
  .or(z.literal(""));

const projectType = z.enum([...PROJECT_TYPES, ...CONTACT_TOPICS, ...CAREERS_TYPES], {
  message: "Please choose a project type.",
});

const budget = z.enum(BUDGET_RANGES).optional().or(z.literal(""));

const message = z
  .string()
  .trim()
  .min(20, "Please tell us a little more, at least 20 characters.")
  .max(4000, "Message is too long (max 4000 characters).");

/** Honeypot — humans never see or fill this. The handler short-circuits bots. */
const website = z.string().max(500).optional().or(z.literal(""));

export const enquirySchema = z.object({
  name,
  email,
  company,
  phone,
  projectType,
  budget,
  message,
  website,
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export type EnquiryFieldErrors = Partial<Record<keyof EnquiryInput, string>>;

/**
 * Authoritative field limits for every public form — the input maxLength
 * attributes mirror these so the browser enforces what the server validates.
 */
export const ENQUIRY_FIELD_LIMITS = {
  name: 80,
  email: 120,
  company: 120,
  phone: 24,
  message: 4000,
  website: 500,
} as const;

/** Careers/details fields (city, links, resume, notes, …) are each capped
 * at 500 characters server-side (sanitizeDetails). */
export const DETAILS_FIELD_LIMIT = 500;

export function flattenFieldErrors(error: z.ZodError<EnquiryInput>): EnquiryFieldErrors {
  const flat = error.flatten().fieldErrors;
  const out: EnquiryFieldErrors = {};
  for (const key of Object.keys(flat) as (keyof EnquiryInput)[]) {
    const first = flat[key]?.[0];
    if (first) out[key] = first;
  }
  return out;
}
