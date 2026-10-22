import { beforeEach, describe, expect, it, vi } from "vitest";
import { candidateContact, contactOutcomeSchema, parseCallbackIST, callbackInputValue, canRecruit, CONTACT_OUTCOMES } from "@/lib/hr-contact";
import { parseCandidateFilters, candidateListUrl, candidateReturnPath } from "@/lib/hr-candidates";
import { candidateSqlBase, candidateSqlFilter } from "@/lib/hr-candidate-data";
const m = vi.hoisted(() => ({ user: { id: "reviewer-id", role: "editor", permissions: ["hr-portal"] }, find: vi.fn(), update: vi.fn(), audit: vi.fn(), mail: vi.fn(), tx: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: async () => m.user, getAdminUser: async () => m.user }));
vi.mock("@/lib/prisma", () => ({ prisma: { projectEnquiry: { findUnique: m.find }, $transaction: m.tx } }));
vi.mock("@/lib/mail", () => ({ sendTemplateNow: m.mail }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { saveCandidateContactAction, saveCandidateProfileAction, shortlistEnquiryAction, requestDocumentsAction, markHiredAction, rejectEnquiryAction, scheduleInterviewAction, resetCareerStatusAction } from "@/app/admin/(protected)/enquiries/career-actions";
const id = "candidate-fixture-id", revision = "2026-10-22T12:00:00.000Z";
const original = { form: "careers", role: "Backend Engineer", hometown: "Jaipur", currentCtc: "Prefer not to disclose", hrProfile: { city: "Indore", totalExperienceMonths: 32 } };
function form(values: Record<string, string> = {}) {
  const result = new FormData();
  for (const [key, value] of Object.entries({ id, revision, outcome: "contacted", channel: "phone", callbackAt: "", note: "Spoke about availability", returnTo: "/admin/hr-portal/applications?contact=not_responded&page=2", ...values })) result.set(key, value);
  return result;
}
beforeEach(() => {
  vi.clearAllMocks(); m.user.permissions = ["hr-portal"];
  m.find.mockResolvedValue({ id, name: "Synthetic candidate", email: "candidate@example.invalid", projectType: "General application", data: original, status: "in_progress", careerStatus: null, updatedAt: new Date(revision) });
  m.update.mockResolvedValue({ count: 1 }); m.audit.mockResolvedValue({});
  m.tx.mockImplementation(async fn => fn({ projectEnquiry: { updateMany: m.update }, auditLog: { create: m.audit } }));
});
describe("contact outcome parsing and validation", () => {
  it("does not invent previous contact attempts for older records", () => {
    expect(candidateContact(original)).toMatchObject({ outcome: "not_recorded", callbackAt: null, updatedAt: null, note: "", channel: "" });
    expect(candidateContact({ hrContact: { outcome: "forged", callbackAt: "bad", note: {}, channel: "invalid" } }).outcome).toBe("not_recorded");
  });
  it.each(CONTACT_OUTCOMES.filter(outcome => outcome !== "not_recorded"))("supports explicit %s without a hiring decision", outcome => {
    const values = Object.fromEntries(form({ outcome, callbackAt: outcome === "callback_requested" ? "2099-11-05T10:30" : "" }));
    expect(contactOutcomeSchema.safeParse(values).success).toBe(true);
  });
  it.each(["2026-02-30T10:00", "2026-11-05T25:00", "2026-11-05", "not a date"])("refuses a malformed IST date: %s", value => expect(parseCallbackIST(value)).toBeNull());
  it("round-trips an IST callback without depending on server timezone", () => {
    const value = parseCallbackIST("2099-11-05T10:30")!.toISOString();
    expect(value).toBe("2099-11-05T05:00:00.000Z"); expect(callbackInputValue(value)).toBe("2099-11-05T10:30");
  });
  it("requires a future callback and bounds notes", () => {
    expect(contactOutcomeSchema.safeParse(Object.fromEntries(form({ outcome: "callback_requested" }))).success).toBe(false);
    expect(contactOutcomeSchema.safeParse(Object.fromEntries(form({ outcome: "callback_requested", callbackAt: "2000-11-05T10:30" }))).success).toBe(false);
    expect(contactOutcomeSchema.safeParse(Object.fromEntries(form({ note: "x".repeat(1001) }))).success).toBe(false);
  });
});
describe("contact outcome mutations", () => {
  it("preserves submitted/reviewed answers and keeps contact, recruitment and inbox independent", async () => {
    await expect(saveCandidateContactAction(form({ outcome: "not_interested" }))).rejects.toThrow("saved=contact");
    const mutation = m.update.mock.calls[0][0];
    expect(mutation.where.AND[1]).toEqual({ id, updatedAt: new Date(revision) });
    expect(mutation.data).toEqual({ data: expect.objectContaining({ ...original, hrContact: expect.objectContaining({ outcome: "not_interested", callbackAt: null, note: "Spoke about availability" }) }) });
    expect(m.audit.mock.calls[0][0].data).toMatchObject({ action: "enquiry.contactUpdated", entityId: id, meta: { from: "not_recorded", to: "not_interested" } });
    expect(m.mail).not.toHaveBeenCalled();
  });
  it("stores callback instants in UTC and keeps the chosen return/filter context", async () => {
    await expect(saveCandidateContactAction(form({ outcome: "callback_requested", callbackAt: "2099-11-05T10:30" }))).rejects.toThrow("returnTo=");
    expect(m.update.mock.calls[0][0].data.data.hrContact.callbackAt).toBe("2099-11-05T05:00:00.000Z");
    expect(m.audit.mock.calls[0][0].data.meta.callbackAt).toBe("2099-11-05T05:00:00.000Z");
  });
  it("clears the current callback when a later contact outcome replaces it, retaining its old audit record", async () => {
    m.find.mockResolvedValue({ ...(await m.find()), data: { ...original, hrContact: { outcome: "callback_requested", callbackAt: "2099-11-05T05:00:00.000Z" } } });
    await expect(saveCandidateContactAction(form())).rejects.toThrow("saved=contact");
    expect(m.update.mock.calls[0][0].data.data.hrContact.callbackAt).toBeNull(); expect(m.audit.mock.calls[0][0].data.meta.from).toBe("callback_requested");
  });
  it("rejects stale, racing and foreign-category saves without emails or success audits", async () => {
    await expect(saveCandidateContactAction(form({ revision: "2026-10-21T12:00:00.000Z" }))).rejects.toThrow("changed"); expect(m.tx).not.toHaveBeenCalled();
    m.update.mockResolvedValue({ count: 0 }); await expect(saveCandidateContactAction(form())).rejects.toThrow("changed"); expect(m.audit).not.toHaveBeenCalled();
    m.find.mockResolvedValue({ projectType: "Website" }); await expect(saveCandidateContactAction(form())).rejects.toThrow("not%20found"); expect(m.mail).not.toHaveBeenCalled();
  });
  it("checks the HR/enquiry grant before reading a candidate", async () => {
    m.user.permissions = ["content"]; await expect(saveCandidateContactAction(form())).rejects.toThrow("denied=Recruitment"); expect(m.find).not.toHaveBeenCalled();
  });
  it("keeps contact history when HR-confirmed profile fields change", async () => {
    const contact = { outcome: "contacted", note: "Confirmed city" };
    m.find.mockResolvedValue({ ...(await m.find()), data: { ...original, hrContact: contact } });
    await expect(saveCandidateProfileAction(form({ city: "Pune", hometown: "Jaipur", role: "Engineer", years: "3", months: "4" }))).rejects.toThrow("saved=profile");
    expect(m.update.mock.calls[0][0].data.data.hrContact).toEqual(contact);
  });
});
describe("standard recruitment transitions", () => {
  it("requires shortlisting before interview/document requests and scheduling before hire", () => {
    expect(canRecruit("interview", null, "in_progress")).toBe(false); expect(canRecruit("documents", null, "in_progress")).toBe(false);
    expect(canRecruit("hire", "shortlisted", "in_progress")).toBe(false); expect(canRecruit("hire", "interview_scheduled", "in_progress")).toBe(true);
    expect(canRecruit("interview", "interview_scheduled", "in_progress")).toBe(true);
  });
  it.each(["shortlist", "interview", "documents", "hire", "reject", "reset"] as const)("requires archived applications to be restored before %s", action => expect(canRecruit(action, "shortlisted", "archived")).toBe(false));
  it("can recover an older archived career stage after its inbox has been restored", () => {
    expect(canRecruit("reset", "archived", "in_progress")).toBe(true); expect(canRecruit("shortlist", "archived", "in_progress")).toBe(false);
  });
  it("blocks forged stage transitions on the server, not merely in the UI", async () => {
    await expect(markHiredAction(form())).rejects.toThrow("not+available"); await expect(requestDocumentsAction(form())).rejects.toThrow("not+available");
    expect(m.tx).not.toHaveBeenCalled(); expect(m.mail).not.toHaveBeenCalled();
  });
  it("requires confirmation against the displayed revision before emailing", async () => {
    await expect(shortlistEnquiryAction(form({ revision: "2026-10-20T12:00:00.000Z" }))).rejects.toThrow("changed"); expect(m.mail).not.toHaveBeenCalled();
    m.update.mockResolvedValue({ count: 0 }); await expect(shortlistEnquiryAction(form())).rejects.toThrow("changed"); expect(m.audit).not.toHaveBeenCalled(); expect(m.mail).not.toHaveBeenCalled();
  });
  it("lets HR record a decision without sending an email, with accurate history", async () => {
    await expect(shortlistEnquiryAction(form({ emailPreference: "explicit" }))).rejects.toThrow("career=shortlisted");
    expect(m.mail).not.toHaveBeenCalled(); expect(m.audit.mock.calls[0][0].data.meta).toMatchObject({ emailRequested: false });
    expect(m.audit.mock.calls[0][0].data.meta).not.toHaveProperty("emailSent");
  });
  it("retains explicit and already-open legacy email workflows", async () => {
    await expect(shortlistEnquiryAction(form({ emailPreference: "explicit", notifyCandidate: "yes" }))).rejects.toThrow("career=shortlisted"); expect(m.mail).toHaveBeenCalledWith("shortlistAck", "candidate@example.invalid", expect.anything());
    m.mail.mockClear(); await expect(rejectEnquiryAction(form())).rejects.toThrow("career=rejected"); expect(m.mail).toHaveBeenCalledWith("candidateRejection", "candidate@example.invalid", expect.anything());
  });
  it("reschedules an existing interview safely and rejects unsafe meeting links", async () => {
    m.find.mockResolvedValue({ ...(await m.find()), careerStatus: "interview_scheduled" });
    const values = { interviewDate: "2099-11-05", interviewTime: "10:00 AM", meetingLink: "https://example.invalid/meeting", interviewer: "Synthetic interviewer", emailPreference: "explicit" };
    await expect(scheduleInterviewAction(form(values))).rejects.toThrow("career=interview"); expect(m.update.mock.calls[0][0].data.interviewDate.toISOString()).toBe("2099-11-05T04:30:00.000Z");
    expect(m.mail).not.toHaveBeenCalled(); m.tx.mockClear(); await expect(scheduleInterviewAction(form({ ...values, meetingLink: "javascript:alert(1)" }))).rejects.toThrow(); expect(m.tx).not.toHaveBeenCalled();
  });
  it("resets only the pipeline/interview, not contact data or original answers", async () => {
    m.find.mockResolvedValue({ ...(await m.find()), careerStatus: "rejected" }); await expect(resetCareerStatusAction(form())).rejects.toThrow("career=reset");
    expect(m.update.mock.calls[0][0].data).toEqual({ careerStatus: null, status: "in_progress", interviewDate: null, meetingLink: null, interviewer: null }); expect(m.mail).not.toHaveBeenCalled();
  });
});
describe("contact queues remain filterable before pagination", () => {
  it("preserves contact outcome in all page and back links and parameterizes its SQL", () => {
    const filter = parseCandidateFilters({ contact: "callback_requested", city: "Indore", page: "2" });
    const url = candidateListUrl("/admin/hr-portal/applications", filter, { page: 3 }); expect(candidateReturnPath(url)).toContain("contact=callback_requested"); expect(candidateReturnPath(url)).toContain("page=3");
    expect(candidateSqlFilter(filter).values).toContain("callback_requested"); expect(candidateSqlBase().sql).toContain('AS "contactOutcome"');
    expect(parseCandidateFilters({ contact: "invented" }).contact).toBe("");
  });
});
