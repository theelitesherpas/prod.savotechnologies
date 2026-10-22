"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { sendTemplateNow } from "@/lib/mail";
import { CAREER_PROJECT_TYPES, CAREER_ENQUIRY_WHERE } from "@/lib/admin-enquiries";
import type { Prisma, ProjectEnquiry } from "@prisma/client";
import { candidateProfile, candidateProfileSchema, candidateReturnPath, safeCandidateUrl } from "@/lib/hr-candidates";
import { canRecruit, contactOutcomeSchema, parseCallbackIST, type RecruitmentAction } from "@/lib/hr-contact";

const idSchema = z.string().min(10).max(40).regex(/^[a-zA-Z0-9_-]+$/);
const candidatePath = (user: { role: string; permissions?: unknown }, id: string) =>
  canAccess(user, "hr-portal") ? `/admin/hr-portal/applications/${id}` : `/admin/enquiries/${id}`;
function candidateActionUrl(user: { role: string; permissions?: unknown }, id: string, form: FormData, key: string, value: string) {
  const params = new URLSearchParams({ [key]: value });
  if (form.get("returnTo")) params.set("returnTo", candidateReturnPath(form.get("returnTo")));
  return `${candidatePath(user, id)}?${params}`;
}
function back(_id: string, error: string): never { redirect(`/admin?denied=${encodeURIComponent(error)}`); }
async function requireCareerAccess() {
  const user = await requireAdmin();
  if (!canAccess(user, "enquiries") && !canAccess(user, "hr-portal")) redirect("/admin?denied=Recruitment");
  return user;
}
async function getEnquiry(id: string) {
  if (!prisma) return null;
  const enquiry = await prisma.projectEnquiry.findUnique({ where: { id } });
  return enquiry && CAREER_PROJECT_TYPES.includes(enquiry.projectType) ? enquiry : null;
}
function refreshCandidate(id: string) {
  for (const path of ["/admin", "/admin/enquiries", "/admin/hr-portal", "/admin/hr-portal/applications", `/admin/hr-portal/applications/${id}`, `/admin/enquiries/${id}`]) revalidatePath(path);
}
const staleMessage = "This application changed while you were editing. Reload and review before saving.";
function extractRole(enquiry: ProjectEnquiry) { return candidateProfile(enquiry.data, enquiry.projectType).role || "the position"; }

/** Stage transitions and revision checks are enforced here, not merely hidden in the UI. */
async function careerAction(form: FormData, action: RecruitmentAction, user: Awaited<ReturnType<typeof requireCareerAccess>>) {
  const parsed = idSchema.safeParse(form.get("id"));
  if (!parsed.success) back("", "Invalid application.");
  const enquiry = await getEnquiry(parsed.data);
  if (!enquiry) back(parsed.data, "Enquiry not found.");
  if (!canRecruit(action, enquiry.careerStatus, enquiry.status)) redirect(candidateActionUrl(user, enquiry.id, form, "e", "This action is not available at the current recruitment stage. Restore archived applications before changing the pipeline."));
  // Already-open legacy forms may lack revision; writes still compare the freshly-read revision atomically.
  if (form.get("revision") && form.get("revision") !== enquiry.updatedAt.toISOString()) redirect(candidateActionUrl(user, enquiry.id, form, "e", staleMessage));
  return enquiry;
}
async function commitCareer(user: Awaited<ReturnType<typeof requireCareerAccess>>, enquiry: ProjectEnquiry, form: FormData, data: Prisma.ProjectEnquiryUpdateManyMutationInput, action: string, meta: Prisma.InputJsonObject = {}) {
  const saved = await prisma!.$transaction(async tx => {
    const result = await tx.projectEnquiry.updateMany({ where: { AND: [CAREER_ENQUIRY_WHERE, { id: enquiry.id, updatedAt: enquiry.updatedAt }] }, data });
    if (!result.count) return false;
    await tx.auditLog.create({ data: { userId: user.id, action, entity: "ProjectEnquiry", entityId: enquiry.id, meta } });
    return true;
  });
  if (!saved) redirect(candidateActionUrl(user, enquiry.id, form, "e", staleMessage));
  refreshCandidate(enquiry.id);
}
function notifyCandidate(form: FormData) { return form.get("emailPreference") !== "explicit" || form.get("notifyCandidate") === "yes"; }
function emailMeta(enquiry: ProjectEnquiry, template: string, form: FormData): Prisma.InputJsonObject {
  const requested = Boolean(enquiry.email && notifyCandidate(form));
  return { candidate: enquiry.name, role: extractRole(enquiry), emailRequested: requested, ...(requested ? { emailSent: template, emailTo: enquiry.email! } : {}) };
}

/** HR-confirmed facts remain separate from applicant-supplied answers and contact history. */
export async function saveCandidateProfileAction(formData: FormData): Promise<void> {
  const user = await requireCareerAccess();
  const parsed = candidateProfileSchema.safeParse(Object.fromEntries(["id", "revision", "city", "hometown", "role", "years", "months"].map(key => [key, String(formData.get(key) ?? "")])));
  if (!parsed.success) redirect("/admin/hr-portal?e=Check%20the%20candidate%20profile%20fields.");
  const d = parsed.data;
  const enquiry = await getEnquiry(d.id);
  if (!enquiry || !prisma) back(d.id, "Candidate not found.");
  if (d.revision !== enquiry.updatedAt.toISOString()) redirect(candidateActionUrl(user, d.id, formData, "e", staleMessage));
  const profile = candidateProfile(enquiry.data);
  const total = d.years === "" && d.months === "" ? null : Number(d.years || 0) * 12 + Number(d.months || 0);
  const data = { ...profile.original, hrProfile: { ...profile.reviewed, city: d.city, hometown: d.hometown, role: d.role, totalExperienceMonths: total, reviewedAt: new Date().toISOString(), reviewedBy: user.id } } as Prisma.InputJsonObject;
  await commitCareer(user, enquiry, formData, { data }, "enquiry.profileUpdated", { fields: ["city", "hometown", "role", "totalExperienceMonths"] });
  redirect(candidateActionUrl(user, d.id, formData, "saved", "profile"));
}

/** Internal contact tracking: no emails, hiring decisions or inbox-state changes. */
export async function saveCandidateContactAction(form: FormData): Promise<void> {
  const user = await requireCareerAccess();
  const parsed = contactOutcomeSchema.safeParse(Object.fromEntries(["id", "revision", "outcome", "channel", "callbackAt", "note"].map(key => [key, String(form.get(key) ?? "")])));
  const id = idSchema.safeParse(form.get("id"));
  if (!id.success) back("", "Invalid application.");
  if (!parsed.success) redirect(candidateActionUrl(user, id.data, form, "e", parsed.error.issues[0]?.message ?? "Check the contact details."));
  const d = parsed.data;
  const enquiry = await getEnquiry(d.id);
  if (!enquiry) back(d.id, "Candidate not found.");
  if (d.revision !== enquiry.updatedAt.toISOString()) redirect(candidateActionUrl(user, d.id, form, "e", staleMessage));
  const callbackAt = d.outcome === "callback_requested" ? parseCallbackIST(d.callbackAt)!.toISOString() : null;
  const original = candidateProfile(enquiry.data).original;
  const previous = original.hrContact && typeof original.hrContact === "object" && !Array.isArray(original.hrContact) ? original.hrContact as Record<string, unknown> : {};
  const data = { ...original, hrContact: { outcome: d.outcome, channel: d.channel, callbackAt, note: d.note, updatedAt: new Date().toISOString(), updatedBy: user.id } } as Prisma.InputJsonObject;
  await commitCareer(user, enquiry, form, { data }, "enquiry.contactUpdated", { from: typeof previous.outcome === "string" ? previous.outcome : "not_recorded", to: d.outcome, channel: d.channel, callbackAt, note: d.note });
  redirect(candidateActionUrl(user, d.id, form, "saved", "contact"));
}

export async function shortlistEnquiryAction(form: FormData): Promise<void> {
  const user = await requireCareerAccess(), enquiry = await careerAction(form, "shortlist", user);
  await commitCareer(user, enquiry, form, { careerStatus: "shortlisted", status: "in_progress" }, "enquiry.shortlisted", emailMeta(enquiry, "shortlistAck", form));
  if (enquiry.email && notifyCandidate(form)) sendTemplateNow("shortlistAck", enquiry.email, { candidateName: enquiry.name, position: extractRole(enquiry) });
  redirect(candidateActionUrl(user, enquiry.id, form, "career", "shortlisted"));
}
export async function rejectEnquiryAction(form: FormData): Promise<void> {
  const user = await requireCareerAccess(), enquiry = await careerAction(form, "reject", user);
  await commitCareer(user, enquiry, form, { careerStatus: "rejected", status: "closed" }, "enquiry.rejected", emailMeta(enquiry, "candidateRejection", form));
  if (enquiry.email && notifyCandidate(form)) sendTemplateNow("candidateRejection", enquiry.email, { candidateName: enquiry.name, position: extractRole(enquiry) });
  redirect(candidateActionUrl(user, enquiry.id, form, "career", "rejected"));
}
const interviewSchema = z.object({
  id: idSchema, interviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), interviewTime: z.string().regex(/^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/i),
  meetingLink: z.string().trim().url().max(500).refine(link => safeCandidateUrl(link) !== null, "Enter an http or https meeting link."),
  interviewer: z.string().trim().min(2).max(80), duration: z.string().trim().max(20).optional().or(z.literal("")),
});
export async function scheduleInterviewAction(form: FormData): Promise<void> {
  const user = await requireCareerAccess();
  const parsed = interviewSchema.safeParse(Object.fromEntries(["id", "interviewDate", "interviewTime", "meetingLink", "interviewer", "duration"].map(key => [key, form.get(key) ?? ""])));
  if (!parsed.success) back(String(form.get("id") ?? ""), parsed.error.issues[0]?.message ?? "Check the interview fields.");
  const d = parsed.data, enquiry = await careerAction(form, "interview", user);
  const match = d.interviewTime.match(/(\d{1,2}):(\d{2}) (AM|PM)/i)!;
  const hours = Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
  const date = parseCallbackIST(`${d.interviewDate}T${String(hours).padStart(2, "0")}:${match[2]}`);
  if (!date || date.getTime() <= Date.now()) redirect(candidateActionUrl(user, d.id, form, "e", "Choose a future interview date and time in IST."));
  const dateLabel = date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  await commitCareer(user, enquiry, form, { careerStatus: "interview_scheduled", status: "in_progress", interviewDate: date, meetingLink: d.meetingLink, interviewer: d.interviewer }, "enquiry.interviewScheduled", { ...emailMeta(enquiry, "interviewInvite", form), date: dateLabel, time: d.interviewTime, interviewer: d.interviewer, meetingLink: d.meetingLink });
  if (enquiry.email && notifyCandidate(form)) sendTemplateNow("interviewInvite", enquiry.email, { candidateName: enquiry.name, position: extractRole(enquiry), interviewDate: dateLabel, interviewTime: d.interviewTime, timezone: "IST", duration: d.duration || "45 minutes", mode: "Google Meet / Microsoft Teams", interviewer: d.interviewer, meetingLink: d.meetingLink });
  redirect(candidateActionUrl(user, enquiry.id, form, "career", "interview"));
}
export async function requestDocumentsAction(form: FormData): Promise<void> {
  const user = await requireCareerAccess(), enquiry = await careerAction(form, "documents", user);
  if (!enquiry.email) redirect(candidateActionUrl(user, enquiry.id, form, "e", "A candidate email address is required to request documents."));
  await commitCareer(user, enquiry, form, { updatedAt: new Date() }, "enquiry.docsRequested", { ...emailMeta(enquiry, "documentVerification", form), emailRequested: true, emailSent: "documentVerification", emailTo: enquiry.email });
  if (enquiry.email) sendTemplateNow("documentVerification", enquiry.email, { candidateName: enquiry.name, position: extractRole(enquiry), documents: "- Government photo ID\n- Highest qualification certificate\n- Relieving letter from previous employer\n- Last three salary slips", deadline: new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }) });
  redirect(candidateActionUrl(user, enquiry.id, form, "career", "docs_requested"));
}
export async function markHiredAction(form: FormData): Promise<void> {
  const user = await requireCareerAccess(), enquiry = await careerAction(form, "hire", user);
  await commitCareer(user, enquiry, form, { careerStatus: "hired", status: "closed" }, "enquiry.hired", emailMeta(enquiry, "offerLetter", form));
  if (enquiry.email && notifyCandidate(form)) sendTemplateNow("offerLetter", enquiry.email, { candidateName: enquiry.name, position: extractRole(enquiry), ctc: "To be discussed", joiningDate: "To be confirmed", reportTo: "To be confirmed", validUntil: new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }) });
  redirect(candidateActionUrl(user, enquiry.id, form, "career", "hired"));
}
export async function resetCareerStatusAction(form: FormData): Promise<void> {
  const user = await requireCareerAccess(), enquiry = await careerAction(form, "reset", user);
  await commitCareer(user, enquiry, form, { careerStatus: null, status: "in_progress", interviewDate: null, meetingLink: null, interviewer: null }, "enquiry.careerReset");
  redirect(candidateActionUrl(user, enquiry.id, form, "career", "reset"));
}
