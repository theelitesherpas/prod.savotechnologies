"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sendTemplateNow } from "@/lib/mail";

/**
 * Career enquiry pipeline actions - triggered from the enquiry detail
 * page and the HR portal. Each action updates the career status and
 * sends the appropriate email automatically.
 */

const back = (id: string, e: string): never =>
  redirect(`/admin/enquiries/${id}?e=${encodeURIComponent(e)}`);

async function getEnquiry(id: string) {
  if (!prisma) return null;
  return prisma.projectEnquiry.findUnique({ where: { id } });
}

function extractRole(data: unknown): string {
  if (data && typeof data === "object" && "role" in data) {
    return String((data as Record<string, unknown>).role ?? "the position");
  }
  return "the position";
}

/** Shortlist a career candidate - sends shortlist acknowledgment email. */
export async function shortlistEnquiryAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const enquiry = await getEnquiry(id);
  if (!enquiry) back(id, "Enquiry not found.");
  const eq = enquiry!;

  await prisma!.projectEnquiry.update({
    where: { id },
    data: { careerStatus: "shortlisted", status: "in_progress" },
  });
  await audit(user.id, "enquiry.shortlisted", "ProjectEnquiry", id);

  if (eq.email) {
    sendTemplateNow("shortlistAck", eq.email, {
      candidateName: eq.name,
      position: extractRole(enquiry!.data),
    });
  }

  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin/hr-portal");
  redirect(`/admin/enquiries/${id}?career=shortlisted`);
}

/** Reject a career candidate - sends rejection email. */
export async function rejectEnquiryAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const enquiry = await getEnquiry(id);
  if (!enquiry) back(id, "Enquiry not found.");
  const eq = enquiry!;

  await prisma!.projectEnquiry.update({
    where: { id },
    data: { careerStatus: "rejected", status: "closed" },
  });
  await audit(user.id, "enquiry.rejected", "ProjectEnquiry", id);

  if (eq.email) {
    sendTemplateNow("candidateRejection", eq.email, {
      candidateName: eq.name,
      position: extractRole(enquiry!.data),
    });
  }

  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin/hr-portal");
  redirect(`/admin/enquiries/${id}?career=rejected`);
}

const interviewSchema = z.object({
  id: z.string().min(10).max(32),
  interviewDate: z.string().trim().min(4),
  interviewTime: z.string().trim().min(3),
  meetingLink: z.string().trim().url().max(500),
  interviewer: z.string().trim().min(2).max(80),
  duration: z.string().trim().max(20).optional().or(z.literal("")),
});

/** Schedule an interview - sends the interview invitation with link. */
export async function scheduleInterviewAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const parsed = interviewSchema.safeParse({
    id: formData.get("id"),
    interviewDate: formData.get("interviewDate"),
    interviewTime: formData.get("interviewTime"),
    meetingLink: formData.get("meetingLink"),
    interviewer: formData.get("interviewer"),
    duration: formData.get("duration") ?? "45 minutes",
  });
  if (!parsed.success) back(String(formData.get("id") ?? ""), parsed.error.issues[0]?.message ?? "Check the interview fields.");
  const d = parsed.data!;

  const enquiry = await getEnquiry(d!.id);
  if (!enquiry) back(d!.id, "Enquiry not found.");
  const eq2 = enquiry!;

  // Convert "10:00 AM" / "02:30 PM" to 24-hour "10:00" / "14:30" for Date parsing
  const to24h = (t: string): string => {
    const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return t.includes(":") ? t : t + ":00";
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ap = match[3].toUpperCase();
    if (ap === "PM" && h < 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}:00`;
  };
  const time24 = to24h(d!.interviewTime);
  const date = new Date(`${d!.interviewDate}T${time24}`);
  if (isNaN(date.getTime())) back(d!.id, "Enter a valid date and time.");

  await prisma!.projectEnquiry.update({
    where: { id: d!.id },
    data: {
      careerStatus: "interview_scheduled",
      status: "in_progress",
      interviewDate: date,
      meetingLink: d!.meetingLink,
      interviewer: d!.interviewer,
    },
  });
  await audit(user.id, "enquiry.interviewScheduled", "ProjectEnquiry", d!.id);

  if (eq2.email) {
    sendTemplateNow("interviewInvite", eq2.email, {
      candidateName: eq2.name,
      position: extractRole(enquiry!.data),
      interviewDate: date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      interviewTime: d!.interviewTime,
      timezone: "IST",
      duration: d!.duration || "45 minutes",
      mode: "Google Meet / Microsoft Teams",
      interviewer: d!.interviewer,
      meetingLink: d!.meetingLink,
    });
  }

  revalidatePath(`/admin/enquiries/${d!.id}`);
  revalidatePath("/admin/hr-portal");
  redirect(`/admin/enquiries/${d!.id}?career=interview`);
}

/** Request documents from a shortlisted candidate. */
export async function requestDocumentsAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const enquiry = await getEnquiry(id);
  if (!enquiry) back(id, "Enquiry not found.");

  await audit(user.id, "enquiry.docsRequested", "ProjectEnquiry", id);

  if (enquiry!.email) {
    sendTemplateNow("documentVerification", enquiry!.email, {
      candidateName: enquiry!.name,
      position: extractRole(enquiry!.data),
      documents: "- Government photo ID\n- Highest qualification certificate\n- Relieving letter from previous employer\n- Last three salary slips",
      deadline: new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    });
  }

  revalidatePath(`/admin/enquiries/${id}`);
  redirect(`/admin/enquiries/${id}?career=docs_requested`);
}

/** Mark a candidate as hired - moves to employee creation. */
export async function markHiredAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const enquiry = await getEnquiry(id);
  if (!enquiry) back(id, "Enquiry not found.");

  await prisma!.projectEnquiry.update({
    where: { id },
    data: { careerStatus: "hired", status: "closed" },
  });
  await audit(user.id, "enquiry.hired", "ProjectEnquiry", id);

  if (enquiry!.email) {
    sendTemplateNow("offerLetter", enquiry!.email, {
      candidateName: enquiry!.name,
      position: extractRole(enquiry!.data),
      ctc: "To be discussed",
      joiningDate: "To be confirmed",
      reportTo: "To be confirmed",
      validUntil: new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    });
  }

  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin/hr-portal");
  redirect(`/admin/enquiries/${id}?career=hired`);
}

/** Reset career status back to pipeline start. */
export async function resetCareerStatusAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  await prisma!.projectEnquiry.update({
    where: { id },
    data: { careerStatus: null, status: "new", interviewDate: null, meetingLink: null, interviewer: null },
  });
  await audit(user.id, "enquiry.careerReset", "ProjectEnquiry", id);
  revalidatePath(`/admin/enquiries/${id}`);
  revalidatePath("/admin/hr-portal");
  redirect(`/admin/enquiries/${id}?career=reset`);
}
