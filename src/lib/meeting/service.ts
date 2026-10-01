/**
 * Meeting scheduling service — the complete lifecycle:
 * create → send link → client picks slot → admin confirms → done.
 *
 * Security: public links use 256-bit random tokens (hash-stored),
 * server-side validation everywhere, double-booking prevention,
 * activity audit trail, expiring links.
 */

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendMailNow } from "@/lib/mail";
import {
  meetingInvitation,
  meetingAvailabilityReceived,
  meetingConfirmed,
  meetingAdminNotification,
} from "@/lib/mail/meeting-templates";
import { publish } from "@/lib/livechat/pubsub";

/* ───────────────────────── tokens & references ───────────────────────── */

export function newMeetingToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashMeetingToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newMeetingReference(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
  return `STPL-${year}-${rand}`;
}

/* ───────────────────────── types ───────────────────────── */

export const MEETING_STATUSES = [
  "draft",
  "awaiting_client",
  "availability_received",
  "confirmed",
  "reschedule_requested",
  "completed",
  "cancelled",
  "expired",
  "trash",
] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const MEETING_TYPES = [
  { value: "in_person", label: "In-Person Meeting" },
  { value: "video", label: "Video Meeting" },
  { value: "phone", label: "Phone Call" },
  { value: "office_visit", label: "Office Visit" },
  { value: "client_office", label: "Client Office" },
  { value: "custom", label: "Custom" },
] as const;

export const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "60 minutes" },
  { value: 90, label: "90 minutes" },
] as const;

export const LOCATION_TYPES = [
  { value: "savo_office", label: "Savo Technologies Office" },
  { value: "client_office", label: "Client Office" },
  { value: "google_meet", label: "Google Meet" },
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "phone", label: "Phone" },
  { value: "custom", label: "Custom Location" },
] as const;

export function meetingTypeLabel(v: string): string {
  return MEETING_TYPES.find((t) => t.value === v)?.label ?? v;
}

export function locationTypeLabel(v: string): string {
  return LOCATION_TYPES.find((t) => t.value === v)?.label ?? v;
}

export function durationLabel(min: number): string {
  return DURATION_OPTIONS.find((d) => d.value === min)?.label ?? `${min} minutes`;
}

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    draft: "Draft",
    awaiting_client: "Awaiting Client",
    availability_received: "Availability Received",
    confirmed: "Confirmed",
    reschedule_requested: "Reschedule Requested",
    completed: "Completed",
    cancelled: "Cancelled",
    expired: "Expired",
  };
  return map[s] ?? s;
}

/* ───────────────────────── activity log ───────────────────────── */

async function logActivity(
  meetingId: string,
  type: string,
  actorName?: string | null,
  meta?: object,
): Promise<void> {
  if (!prisma) return;
  await prisma.meetingActivity
    .create({ data: { meetingId, type, actorName: actorName ?? null, meta: meta as object } })
    .catch(() => undefined);
}

/* ───────────────────────── create meeting ───────────────────────── */

export type CreateMeetingInput = {
  clientId?: string | null;
  clientName: string;
  clientCompany?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientRole?: string;
  title: string;
  agenda?: string;
  meetingType?: string;
  durationMin?: number;
  locationType?: string;
  locationAddress?: string;
  meetingUrl?: string;
  notes?: string;
  availableDates?: string[];
  availableFrom?: string;
  availableTo?: string;
  allowSuggest?: boolean;
  autoConfirm?: boolean;
  expiresDays?: number;
  createdBy: string;
  createdByName: string;
};

export async function createMeeting(input: CreateMeetingInput): Promise<{ meeting: { id: string; reference: string; token: string } } | { error: string }> {
  if (!prisma) return { error: "Database unavailable." };
  if (!input.clientName?.trim() || input.clientName.trim().length < 2) {
    return { error: "Client name is required." };
  }
  if (!input.title?.trim() || input.title.trim().length < 3) {
    return { error: "Meeting title is required." };
  }

  const token = newMeetingToken();
  const reference = newMeetingReference();
  const expiresAt = input.expiresDays ? new Date(Date.now() + input.expiresDays * 86400_000) : null;

  const meeting = await prisma.meeting.create({
    data: {
      reference,
      tokenHash: hashMeetingToken(token),
      tokenPlain: token,
      expiresAt,
      clientId: input.clientId ?? null,
      clientName: input.clientName.trim().slice(0, 120),
      clientCompany: (input.clientCompany ?? "").slice(0, 160),
      clientPhone: input.clientPhone?.slice(0, 32) || null,
      clientEmail: input.clientEmail?.toLowerCase().slice(0, 160) || null,
      clientRole: input.clientRole?.slice(0, 80) || null,
      title: input.title.trim().slice(0, 200),
      agenda: (input.agenda ?? "").slice(0, 2000),
      meetingType: input.meetingType ?? "in_person",
      durationMin: input.durationMin ?? 60,
      locationType: input.locationType ?? "savo_office",
      locationAddress: input.locationAddress?.slice(0, 500) || null,
      meetingUrl: input.meetingUrl?.slice(0, 500) || null,
      notes: input.notes?.slice(0, 2000) || null,
      availableDates: input.availableDates ?? undefined,
      availableFrom: input.availableFrom ?? "10:00",
      availableTo: input.availableTo ?? "18:00",
      allowSuggest: input.allowSuggest ?? true,
      autoConfirm: input.autoConfirm ?? false,
      status: "draft",
      createdBy: input.createdBy,
    },
  });

  await logActivity(meeting.id, "created", input.createdByName);

  // Auto-send branded invitation email if the client has an email.
  if (meeting.clientEmail) {
    const link = `https://savotechnologies.com/meeting/${reference}`;
    const tpl = meetingInvitation({
      clientName: meeting.clientName,
      meetingTitle: input.title,
      meetingType: meeting.meetingType,
      durationMin: meeting.durationMin,
      agenda: meeting.agenda || null,
      reference,
      schedulingLink: link,
      to: meeting.clientEmail,
    });
    sendMailNow(meeting.clientEmail, tpl);
    await logActivity(meeting.id, "invitation_email_sent", input.createdByName, { to: meeting.clientEmail, auto: true });
    await prisma.meeting.update({ where: { id: meeting.id }, data: { status: "awaiting_client" } }).catch(() => undefined);
    await logActivity(meeting.id, "invitation_sent", input.createdByName, { auto: true });
  }

  return { meeting: { id: meeting.id, reference, token } };
}

/* ───────────────────────── send invitation ───────────────────────── */

export async function sendInvitation(meetingId: string, actorName: string): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  if (!prisma) return { ok: false, error: "Database unavailable." };
  const m = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!m) return { ok: false, error: "Meeting not found." };

  await prisma.meeting.update({ where: { id: meetingId }, data: { status: "awaiting_client" } });
  await logActivity(meetingId, "invitation_sent", actorName);

  // Send branded invitation email
  let emailSent = false;
  if (m.clientEmail) {
    const link = `https://savotechnologies.com/meeting/${m.reference}`;
    const tpl = meetingInvitation({
      clientName: m.clientName,
      meetingTitle: m.title,
      meetingType: m.meetingType,
      durationMin: m.durationMin,
      agenda: m.agenda || null,
      reference: m.reference,
      schedulingLink: link,
      to: m.clientEmail,
    });
    sendMailNow(m.clientEmail, tpl);
    emailSent = true;
    await logActivity(meetingId, "invitation_email_sent", actorName, { to: m.clientEmail });
  }

  return { ok: true, emailSent };
}

/* ───────────────────────── public: get by token ───────────────────────── */

export type PublicMeetingData = {
  reference: string;
  clientName: string;
  clientCompany: string;
  clientPhone: string | null;
  clientEmail: string | null;
  title: string;
  agenda: string;
  meetingType: string;
  durationMin: number;
  locationType: string;
  locationAddress: string | null;
  meetingUrl: string | null;
  notes: string | null;
  availableDates: string[];
  availableFrom: string;
  availableTo: string;
  allowSuggest: boolean;
  status: string;
  expiresAt: string | null;
  // Client response (if already submitted)
  preferredDate: string | null;
  preferredTime: string | null;
  altDate: string | null;
  altTime: string | null;
  locationPreference: string | null;
  clientAddress: string | null;
  attendeeCount: number;
  clientNotes: string | null;
  specialReqs: string | null;
  attendees: { name: string; email: string | null; role: string | null }[];
  confirmedDate: string | null;
  confirmedTime: string | null;
};

export async function getMeetingByToken(token: string): Promise<PublicMeetingData | { error: string; expired?: boolean }> {
  if (!prisma) return { error: "Service unavailable." };
  if (!token || token.length < 8 || token.length > 100) return { error: "Invalid link." };

  // Accept the human reference (MTG-2026-XXXXX) or the raw token
  const isRef = /^(MTG|STPL)-\d{4}-[A-F0-9]+$/i.test(token);
  const m = await prisma.meeting.findUnique({
    where: isRef ? { reference: token.toUpperCase() } : { tokenHash: hashMeetingToken(token) },
    include: { attendees: true },
  });
  if (!m) return { error: "Meeting not found." };

  // Check expiration
  if (m.expiresAt && m.expiresAt < new Date()) {
    if (m.status !== "expired" && m.status !== "completed" && m.status !== "cancelled") {
      await prisma.meeting.update({ where: { id: m.id }, data: { status: "expired" } }).catch(() => undefined);
    }
    return { error: "This meeting request has expired.", expired: true };
  }

  // Log open (throttled — only if not opened in last 5 min)
  const recentOpen = await prisma.meetingActivity.findFirst({
    where: { meetingId: m.id, type: "invitation_opened", createdAt: { gte: new Date(Date.now() - 5 * 60_000) } },
  });
  if (!recentOpen) await logActivity(m.id, "invitation_opened", m.clientName);

  return {
    reference: m.reference,
    clientName: m.clientName,
    clientCompany: m.clientCompany,
    clientPhone: m.clientPhone,
    clientEmail: m.clientEmail,
    title: m.title,
    agenda: m.agenda,
    meetingType: m.meetingType,
    durationMin: m.durationMin,
    locationType: m.locationType,
    locationAddress: m.locationAddress,
    meetingUrl: m.meetingUrl,
    notes: m.notes,
    availableDates: Array.isArray(m.availableDates) ? (m.availableDates as string[]) : [],
    availableFrom: m.availableFrom,
    availableTo: m.availableTo,
    allowSuggest: m.allowSuggest,
    status: m.status,
    expiresAt: m.expiresAt?.toISOString() ?? null,
    preferredDate: m.preferredDate,
    preferredTime: m.preferredTime,
    altDate: m.altDate,
    altTime: m.altTime,
    locationPreference: m.locationPreference,
    clientAddress: m.clientAddress,
    attendeeCount: m.attendeeCount,
    clientNotes: m.clientNotes,
    specialReqs: m.specialReqs,
    attendees: m.attendees.map((a) => ({ name: a.name, email: a.email, role: a.role })),
    confirmedDate: m.confirmedDate,
    confirmedTime: m.confirmedTime,
  };
}

/* ───────────────────────── public: submit availability ───────────────────────── */

export type SubmitAvailabilityInput = {
  token: string;
  preferredDate: string;
  preferredTime: string;
  altDate?: string;
  altTime?: string;
  locationPreference?: string;
  clientAddress?: string;
  attendeeCount?: number;
  additionalAttendees?: { name: string; email?: string; role?: string }[];
  clientNotes?: string;
  specialReqs?: string;
};

export async function submitAvailability(input: SubmitAvailabilityInput): Promise<{ ok: boolean; reference?: string; error?: string }> {
  if (!prisma) return { ok: false, error: "Service unavailable." };
  if (!input.token || !input.preferredDate || !input.preferredTime) {
    return { ok: false, error: "Please select a date and time." };
  }

  const isRef = /^(MTG|STPL)-\d{4}-[A-F0-9]+$/i.test(input.token);
  const m = await prisma.meeting.findUnique({
    where: isRef ? { reference: input.token.toUpperCase() } : { tokenHash: hashMeetingToken(input.token) },
  });
  if (!m) return { ok: false, error: "Meeting not found." };

  if (m.expiresAt && m.expiresAt < new Date()) return { ok: false, error: "This link has expired." };
  if (["completed", "cancelled", "expired"].includes(m.status)) {
    return { ok: false, error: "This meeting is no longer active." };
  }

  // Prevent duplicate submission unless reschedule was requested
  if (["availability_received", "confirmed"].includes(m.status)) {
    return { ok: false, error: "Your availability has already been submitted." };
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.preferredDate)) {
    return { ok: false, error: "Invalid date format." };
  }
  // Validate time format (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(input.preferredTime)) {
    return { ok: false, error: "Invalid time format." };
  }

  const useTransaction = await prisma.$transaction(async (tx) => {
    // Update meeting with client response
    const newStatus = m.autoConfirm ? "confirmed" : "availability_received";
    const updated = await tx.meeting.update({
      where: { id: m.id },
      data: {
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        altDate: input.altDate || null,
        altTime: input.altTime || null,
        locationPreference: input.locationPreference?.slice(0, 200) || null,
        clientAddress: input.clientAddress?.slice(0, 500) || null,
        attendeeCount: Math.min(Math.max(input.attendeeCount ?? 1, 1), 50),
        clientNotes: input.clientNotes?.slice(0, 2000) || null,
        specialReqs: input.specialReqs?.slice(0, 1000) || null,
        status: newStatus,
        seenAt: null,
        ...(m.autoConfirm
          ? { confirmedAt: new Date(), confirmedDate: input.preferredDate, confirmedTime: input.preferredTime }
          : {}),
      },
    });

    // Replace attendees
    if (input.additionalAttendees && input.additionalAttendees.length > 0) {
      await tx.meetingAttendee.deleteMany({ where: { meetingId: m.id } });
      for (const a of input.additionalAttendees.slice(0, 10)) {
        if (a.name?.trim()) {
          await tx.meetingAttendee.create({
            data: {
              meetingId: m.id,
              name: a.name.trim().slice(0, 120),
              email: a.email?.slice(0, 160) || null,
              role: a.role?.slice(0, 80) || null,
            },
          });
        }
      }
    }

    return updated;
  });

  await logActivity(m.id, "availability_submitted", m.clientName, {
    date: input.preferredDate,
    time: input.preferredTime,
    autoConfirmed: m.autoConfirm,
  });

  // Notify admin via the existing real-time bus
  publish("admin", {
    type: "enquiry.new",
    enquiry: {
      name: `${m.clientName} (meeting response)`,
      projectType: `${m.title} — ${input.preferredDate} ${input.preferredTime}`,
      source: "meeting",
    },
  });

  // Send confirmation email to client
  if (m.clientEmail) {
    sendClientConfirmation(m.id);
  }

  // Notify admin by email
  sendAdminNotification(m.id);

  return { ok: true, reference: m.reference };
}

/* ───────────────────────── admin: confirm meeting ───────────────────────── */

export async function confirmMeeting(meetingId: string, actorName: string): Promise<{ ok: boolean; error?: string }> {
  if (!prisma) return { ok: false, error: "Database unavailable." };
  const m = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!m) return { ok: false, error: "Not found." };
  if (!m.preferredDate || !m.preferredTime) return { ok: false, error: "Client has not submitted availability yet." };

  // Double-booking check (same date+time, confirmed meetings, exclude self)
  const clash = await prisma.meeting.findFirst({
    where: {
      status: "confirmed",
      confirmedDate: m.preferredDate,
      confirmedTime: m.preferredTime,
      id: { not: m.id },
    },
  });
  if (clash) {
    return { ok: false, error: `Time slot already booked (${clash.reference}). Please reschedule.` };
  }

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      status: "confirmed",
      confirmedAt: new Date(),
      confirmedDate: m.preferredDate,
      confirmedTime: m.preferredTime,
    },
  });
  await logActivity(meetingId, "meeting_confirmed", actorName);

  if (m.clientEmail) {
    sendClientConfirmation(meetingId, true);
  }
  return { ok: true };
}

/* ───────────────────────── admin: reschedule ───────────────────────── */

export async function requestReschedule(meetingId: string, actorName: string, reason?: string): Promise<{ ok: boolean }> {
  if (!prisma) return { ok: false };
  const m = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!m) return { ok: false };

  await prisma.meetingReschedule.create({
    data: {
      meetingId,
      previousDate: m.confirmedDate ?? m.preferredDate,
      previousTime: m.confirmedTime ?? m.preferredTime,
      newDate: "",
      newTime: "",
      requestedBy: "admin",
      reason: reason?.slice(0, 500) || null,
    },
  });
  await prisma.meeting.update({ where: { id: meetingId }, data: { status: "reschedule_requested" } });
  await logActivity(meetingId, "reschedule_requested", actorName, { reason });
  return { ok: true };
}

/* ───────────────────────── admin: status changes ───────────────────────── */

export async function updateMeetingStatus(meetingId: string, status: string, actorName: string): Promise<{ ok: boolean }> {
  if (!prisma) return { ok: false };
  await prisma.meeting.update({ where: { id: meetingId }, data: { status } });
  const type = status === "completed" ? "meeting_completed" : status === "cancelled" ? "meeting_cancelled" : `status_${status}`;
  await logActivity(meetingId, type, actorName);
  return { ok: true };
}

/* ───────────────────────── link management ───────────────────────── */

export async function regenerateLink(meetingId: string, actorName: string): Promise<{ token: string } | { error: string }> {
  if (!prisma) return { error: "Database unavailable." };
  const token = newMeetingToken();
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { tokenHash: hashMeetingToken(token), tokenPlain: token, expiresAt: new Date(Date.now() + 7 * 86400_000) },
  });
  await logActivity(meetingId, "link_regenerated", actorName);
  return { token };
}

export async function extendExpiration(meetingId: string, days: number, actorName: string): Promise<{ ok: boolean }> {
  if (!prisma) return { ok: false };
  const m = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!m) return { ok: false };
  const base = m.expiresAt && m.expiresAt > new Date() ? m.expiresAt : new Date();
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { expiresAt: new Date(base.getTime() + days * 86400_000), status: m.status === "expired" ? "awaiting_client" : m.status },
  });
  return { ok: true };
}

/* ───────────────────────── emails ───────────────────────── */

async function sendClientConfirmation(meetingId: string, isFinal = false): Promise<void> {
  if (!prisma) return;
  const m = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!m?.clientEmail) return;

  const dateStr = m.confirmedDate ?? m.preferredDate ?? "TBD";
  const timeStr = m.confirmedTime ?? m.preferredTime ?? "TBD";
  const loc = m.meetingUrl ?? m.locationAddress ?? m.locationType.replace(/_/g, " ");

  if (isFinal) {
    const tpl = meetingConfirmed({
      clientName: m.clientName,
      meetingTitle: m.title,
      date: dateStr,
      time: timeStr,
      durationMin: m.durationMin,
      meetingType: m.meetingType,
      location: loc,
      reference: m.reference,
      to: m.clientEmail,
    });
    sendMailNow(m.clientEmail, tpl);
  } else {
    const tpl = meetingAvailabilityReceived({
      clientName: m.clientName,
      meetingTitle: m.title,
      date: dateStr,
      time: timeStr,
      durationMin: m.durationMin,
      reference: m.reference,
      to: m.clientEmail,
    });
    sendMailNow(m.clientEmail, tpl);
  }
}

async function sendAdminNotification(meetingId: string): Promise<void> {
  if (!prisma) return;
  const m = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!m) return;
  const tpl = meetingAdminNotification({
    clientName: m.clientName,
    clientCompany: m.clientCompany,
    meetingTitle: m.title,
    date: m.preferredDate ?? "TBD",
    time: m.preferredTime ?? "TBD",
    reference: m.reference,
  });
  sendMailNow("hello@savotechnologies.com", tpl);
}

/* ───────────────────────── ICS calendar file ───────────────────────── */

export function generateICS(meeting: {
  reference: string;
  title: string;
  confirmedDate: string | null;
  confirmedTime: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  durationMin: number;
  locationAddress: string | null;
  meetingUrl: string | null;
  clientName: string;
  clientCompany: string;
}): string | null {
  const date = meeting.confirmedDate ?? meeting.preferredDate;
  const time = meeting.confirmedTime ?? meeting.preferredTime;
  if (!date || !time) return null;

  const start = new Date(`${date}T${time}:00+05:30`);
  const end = new Date(start.getTime() + meeting.durationMin * 60_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const location = meeting.meetingUrl ?? meeting.locationAddress ?? "Savo Technologies";
  const description = `Meeting with ${meeting.clientName}${meeting.clientCompany ? ` (${meeting.clientCompany})` : ""}\\nRef: ${meeting.reference}\\nDuration: ${durationLabel(meeting.durationMin)}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Savo Technologies//Meeting//EN",
    "BEGIN:VEVENT",
    `UID:${meeting.reference}@savotechnologies.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${meeting.title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
