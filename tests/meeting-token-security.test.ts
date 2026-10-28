import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  findClient: vi.fn(), findMeeting: vi.fn(), updateMeeting: vi.fn(), updateMany: vi.fn(), createMeeting: vi.fn(),
  findActivity: vi.fn(), createActivity: vi.fn(), transaction: vi.fn(),
  deleteAttendees: vi.fn(), createAttendee: vi.fn(), mail: vi.fn(), publish: vi.fn(),
  invitation: vi.fn(), availability: vi.fn(), confirmed: vi.fn(), adminNotification: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  clientUser: { findUnique: m.findClient },
  meeting: { findUnique: m.findMeeting, update: m.updateMeeting, updateMany: m.updateMany, create: m.createMeeting },
  meetingActivity: { findFirst: m.findActivity, create: m.createActivity },
  meetingAttendee: { deleteMany: m.deleteAttendees, create: m.createAttendee },
  $transaction: m.transaction,
} }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/mail", () => ({ sendMailNow: m.mail }));
vi.mock("@/lib/mail/meeting-templates", () => ({
  meetingInvitation: m.invitation,
  meetingAvailabilityReceived: m.availability,
  meetingConfirmed: m.confirmed,
  meetingAdminNotification: m.adminNotification,
}));
vi.mock("@/lib/livechat/pubsub", () => ({ publish: m.publish }));

import { createMeeting, getMeetingByToken, hashMeetingToken, isMeetingAccessToken, newMeetingToken, sendInvitation, submitAvailability, generateICS } from "@/lib/meeting/service";

const validToken = "Abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
const reference = "STPL-2026-ABCDE";
const meeting = {
  id: "meeting-fixture", reference, tokenHash: hashMeetingToken(validToken), tokenPlain: validToken,
  clientName: "Test Client", clientCompany: "Fixture only", clientPhone: null,
  clientEmail: null, clientRole: null, title: "Synthetic meeting", agenda: "Fixture agenda",
  meetingType: "video", durationMin: 60, locationType: "google_meet", locationAddress: null,
  meetingUrl: null, notes: null, availableDates: [], availableFrom: "10:00", availableTo: "18:00",
  allowSuggest: true, autoConfirm: false, status: "awaiting_client", expiresAt: null,
  preferredDate: null, preferredTime: null, altDate: null, altTime: null,
  locationPreference: null, clientAddress: null, attendeeCount: 1, clientNotes: null,
  specialReqs: null, confirmedDate: null, confirmedTime: null, attendees: [],
  createdAt: new Date("2030-01-01T00:00:00.000Z"), duration: 60,
};

beforeEach(() => {
  vi.clearAllMocks();
  m.findClient.mockResolvedValue({ title: "Mr." });
  m.findMeeting.mockResolvedValue(meeting);
  m.findActivity.mockResolvedValue(null);
  m.createActivity.mockResolvedValue({});
  m.updateMeeting.mockResolvedValue(meeting);
  m.updateMany.mockResolvedValue({ count: 1 });
  m.deleteAttendees.mockResolvedValue({ count: 0 });
  m.createAttendee.mockResolvedValue({});
  m.transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) => work({
    meeting: { update: m.updateMeeting, updateMany: m.updateMany },
    meetingAttendee: { deleteMany: m.deleteAttendees, create: m.createAttendee },
  }));
  m.invitation.mockImplementation((data: unknown) => data);
  m.availability.mockImplementation((data: unknown) => data);
  m.confirmed.mockImplementation((data: unknown) => data);
  m.adminNotification.mockImplementation((data: unknown) => data);
});

describe("meeting invitation bearer-token security", () => {
  it("resolves a linked client's current title for existing invitations without changing the snapshot name", async () => {
    m.findMeeting.mockResolvedValue({ ...meeting, clientId: "client-fixture", clientName: "James Miller", clientEmail: "james@example.invalid" });
    expect(await getMeetingByToken(validToken)).toMatchObject({ clientName: "Mr. James Miller" });
    await sendInvitation(meeting.id, "Admin");
    expect(m.invitation).toHaveBeenLastCalledWith(expect.objectContaining({ clientName: "Mr. James Miller" }));
    m.findClient.mockResolvedValue({ title: "Dr." });
    expect(await getMeetingByToken(validToken)).toMatchObject({ clientName: "Dr. James Miller" });
    m.findClient.mockResolvedValue({ title: null });
    expect(await getMeetingByToken(validToken)).toMatchObject({ clientName: "James Miller" });
    expect(m.updateMeeting.mock.calls.every(([arg]) => !("clientName" in arg.data))).toBe(true);
  });
  it("includes the full titled name, not a greeting or duplicated prefix, in calendar descriptions", () => {
    const ics = generateICS({ ...meeting, clientName: "Mr. James Miller", clientTitle: "Mr.", preferredDate: "2030-10-15", preferredTime: "10:00" });
    expect(ics).toContain("Meeting with Mr. James Miller"); expect(ics).not.toContain("Mr. Mr.");
  });
  it("generates a 256-bit base64url token and rejects human references as credentials", () => {
    const token = newMeetingToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(isMeetingAccessToken(token)).toBe(true);
    for (const input of [reference, "MTG-2026-ABCDE", "short-token", "x".repeat(129), "has spaces" ]) {
      expect(isMeetingAccessToken(input)).toBe(false);
    }
    expect(isMeetingAccessToken(validToken)).toBe(true); // compatible with existing 192-bit tokens
  });

  it("rejects a reference before querying the database", async () => {
    await expect(getMeetingByToken(reference)).resolves.toEqual({ error: "Invalid link." });
    expect(m.findMeeting).not.toHaveBeenCalled();
    await expect(submitAvailability({ token: reference, preferredDate: "2030-10-15", preferredTime: "10:00" }))
      .resolves.toEqual({ ok: false, error: "Invalid link." });
    expect(m.findMeeting).not.toHaveBeenCalled();
  });

  it("looks up a valid bearer only by its hash, never by reference", async () => {
    const result = await getMeetingByToken(validToken);
    expect(result).toMatchObject({ reference, clientEmail: null, clientName: "Test Client" });
    expect(m.findMeeting).toHaveBeenCalledWith({
      where: { tokenHash: hashMeetingToken(validToken) },
      include: { attendees: true },
    });
  });

  it("enforces invitation date/time rules on the server and rejects impossible or unoffered slots", async () => {
    const base = { token: validToken, preferredDate: "2030-10-15", preferredTime: "10:00" };
    await expect(submitAvailability({ ...base, preferredDate: "2030-02-30" })).resolves.toMatchObject({ ok: false });
    await expect(submitAvailability({ ...base, preferredTime: "25:00" })).resolves.toMatchObject({ ok: false });
    expect(m.updateMany).not.toHaveBeenCalled();

    m.findMeeting.mockResolvedValue({ ...meeting, allowSuggest: false, availableDates: ["2030-10-15"] });
    await expect(submitAvailability({ ...base, preferredDate: "2030-10-16" })).resolves.toMatchObject({ ok: false, error: "Choose a date from the invitation." });
    expect(m.updateMany).not.toHaveBeenCalled();
  });

  it("atomically accepts only one active availability submission", async () => {
    await expect(submitAvailability({ token: validToken, preferredDate: "2030-10-15", preferredTime: "10:00" }))
      .resolves.toMatchObject({ ok: true, reference });
    expect(m.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: meeting.id, status: { in: ["draft", "awaiting_client", "reschedule_requested"] } },
    }));

    m.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(submitAvailability({ token: validToken, preferredDate: "2030-10-15", preferredTime: "10:00" }))
      .resolves.toMatchObject({ ok: false, error: "Your availability has already been submitted." });
  });

  it("sends the strong bearer token in invitation links, not the enumerable reference", async () => {
    const input = {
      clientName: "Test Client", clientEmail: "client@example.test", title: "Synthetic meeting",
      createdBy: "admin-fixture", createdByName: "Test Admin",
    };
    m.createMeeting.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...meeting, ...data, id: "meeting-created", reference: "STPL-2030-ABCDE",
    }));
    const result = await createMeeting(input);
    expect("meeting" in result).toBe(true);
    if (!("meeting" in result)) return;
    expect(result.meeting.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(m.createMeeting.mock.calls[0][0].data.tokenHash).toBe(hashMeetingToken(result.meeting.token));
    expect(m.invitation).toHaveBeenCalledWith(expect.objectContaining({
      schedulingLink: `https://savotechnologies.com/meeting/${result.meeting.token}`,
    }));
    expect(m.invitation.mock.calls[0][0].schedulingLink).not.toContain("STPL-2030-ABCDE");
  });

  it("uses bearer tokens in all generated and admin-shared scheduling links", () => {
    const adminUi = readFileSync("src/app/admin/(protected)/meetings/meetings-app.tsx", "utf8");
    const publicPage = readFileSync("src/app/(site)/meeting/[token]/page.tsx", "utf8");
    expect(adminUi).toContain("json.meeting.token}");
    expect(adminUi).toContain("detail.tokenPlain}");
    expect(adminUi).not.toContain("/meeting/${json.meeting.reference}");
    expect(adminUi).not.toContain("/meeting/${detail.reference}");
    expect(publicPage).toContain("referrer: \"no-referrer\"");
  });

  it("reissues an invalid stored token before sending an invitation", async () => {
    m.findMeeting.mockResolvedValue({ ...meeting, tokenPlain: "", clientEmail: "client@example.test" });
    await expect(sendInvitation("meeting-fixture", "Test Admin")).resolves.toMatchObject({ ok: true, emailSent: true });
    const generated = m.invitation.mock.calls[0][0].schedulingLink as string;
    expect(generated).toMatch(/^https:\/\/savotechnologies\.com\/meeting\/[A-Za-z0-9_-]{43}$/);
    expect(generated).not.toContain(reference);
    expect(m.updateMeeting).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tokenPlain: generated.split("/").at(-1) }),
    }));
  });
});
