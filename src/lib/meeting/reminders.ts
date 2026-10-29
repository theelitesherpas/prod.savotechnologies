import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientFullName } from "@/lib/client-name";
import { renderTemplate } from "@/lib/mail";
import { liveMailAllowed } from "@/lib/mail/delivery-policy";
import { claimReminder, deliverReminder, skipReminder, type ReminderResult } from "@/lib/reminder-delivery";
import { hashMeetingToken, isMeetingAccessToken } from "./service";
import { invoiceDate } from "@/lib/invoice-document";
import { meetingTimeLabel } from "@/sections/meeting/meeting-model";
import { absoluteUrl } from "@/lib/env";

const active = ["awaiting_client", "availability_received", "confirmed", "reschedule_requested"];
const include = { client: { select: { title: true, active: true, updatedAt: true } } } as const;
type Meeting = NonNullable<Awaited<ReturnType<typeof load>>>;
async function load(id: string) { return prisma!.meeting.findUnique({ where: { id }, include }); }
function eligible(m: Meeting | null, now: Date): m is Meeting {
  if (!m || !active.includes(m.status) || m.deletedAt || !m.clientEmail || (m.client && !m.client.active) || (m.expiresAt && m.expiresAt <= now)) return false;
  if (!z.string().email().max(160).safeParse(m.clientEmail).success || !isMeetingAccessToken(m.tokenPlain) || hashMeetingToken(m.tokenPlain) !== m.tokenHash) return false;
  const date = m.status === "confirmed" ? m.confirmedDate : m.preferredDate;
  const time = m.status === "confirmed" ? m.confirmedTime : m.preferredTime;
  if (m.status === "confirmed" && (!date || !time)) return false;
  if (date && time) {
    const start = new Date(`${date}T${time}:00+05:30`);
    if (!Number.isFinite(start.getTime()) || start <= now) return false;
  }
  return true;
}

export async function sendManualMeetingReminder(id: string, revision: string, actor: string, now = new Date()): Promise<ReminderResult> {
  if (!prisma || !liveMailAllowed()) return { ok: false, message: "Email reminders are unavailable. Check the server's email configuration." };
  try {
    const before = await load(id);
    if (!eligible(before, now)) return { ok: false, message: "Only active, upcoming invitations with a valid client email and unexpired link can receive reminders." };
    if (before.updatedAt.toISOString() !== revision) return { ok: false, message: "This meeting changed. Refresh its details before sending." };
    const claimed = await claimReminder({ meetingId: id }, "meeting_manual", now);
    if (!claimed.ok) return { ok: false, message: claimed.message };
    const m = await load(id);
    if (!eligible(m, now) || m.updatedAt.getTime() !== before.updatedAt.getTime()) {
      await skipReminder(claimed.claim, "MEETING_NO_LONGER_ELIGIBLE");
      return { ok: false, message: "The meeting changed or is no longer active. No reminder was sent." };
    }
    const name = clientFullName(m.clientName, m.client ? m.client.title : undefined);
    const date = m.status === "confirmed" ? m.confirmedDate : m.preferredDate;
    const time = m.status === "confirmed" ? m.confirmedTime : m.preferredTime;
    const tpl = await renderTemplate("meetingReminder", { clientName: name, meetingTitle: m.title, reference: m.reference, status: m.status,
      date: date ? invoiceDate(new Date(`${date}T00:00:00Z`)) : "", time: time ? meetingTimeLabel(time) : "", durationMin: String(m.durationMin),
      location: m.meetingUrl || m.locationAddress || m.locationType.replaceAll("_", " "), schedulingLink: absoluteUrl(`/meeting/${m.tokenPlain}`) }, m.clientEmail!);
    if (!tpl) { await skipReminder(claimed.claim, "TEMPLATE_UNAVAILABLE"); return { ok: false, message: "The reminder template is unavailable. No email was sent." }; }
    const current = await load(id);
    if (!eligible(current, now) || current.updatedAt.getTime() !== m.updatedAt.getTime() || current.client?.updatedAt.getTime() !== m.client?.updatedAt.getTime()) {
      await skipReminder(claimed.claim, "MEETING_CHANGED_BEFORE_SEND");
      return { ok: false, message: "Meeting or client details changed. Refresh before sending a reminder." };
    }
    const result = await deliverReminder(claimed.claim, m.clientEmail!, tpl, { templateKey: "meetingReminder", toName: name, sentBy: actor }, now);
    if (result.ok) await prisma.meetingActivity.create({ data: { meetingId: id, type: "reminder_email_sent", actorName: actor, meta: { deliveryId: result.deliveryId } } }).catch(() => undefined);
    return result;
  } catch { return { ok: false, message: "The reminder could not be completed. Review delivery history before retrying." }; }
}
