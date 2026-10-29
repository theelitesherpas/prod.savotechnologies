import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { deliverMail } from "@/lib/mail";
import type { MailTemplate } from "@/lib/mail/templates";
import type { ReminderDelivery } from "@prisma/client";
import { MANUAL_REMINDER_COOLDOWN_MS, type ReminderKind, type ReminderResult } from "@/lib/reminder-policy";
export type { ReminderResult } from "@/lib/reminder-policy";
type Target = { invoiceId: string; meetingId?: never } | { meetingId: string; invoiceId?: never };
export type ReminderClaim = ReminderDelivery & { claimToken: string };
export type ClaimResult = { ok: true; claim: ReminderClaim } | { ok: false; message: string; code: string };

/** Claims are serialized per invoice/meeting, then protected with a DB CAS.
 * No database lock is held while rendering/sending SMTP. */
export async function claimReminder(target: Target, kind: ReminderKind, now: Date, stage?: { dueOn: string; scheduledOn: string }): Promise<ClaimResult> {
  if (!prisma) return { ok: false, code: "UNAVAILABLE", message: "Reminders are temporarily unavailable." };
  const manual = kind.endsWith("manual");
  const dedupeKey = manual ? `manual:${randomUUID()}` : `${target.invoiceId}:${stage!.dueOn}:${kind}`;
  return prisma.$transaction(async tx => {
    const locked = target.invoiceId
      ? await tx.$queryRaw<{ id: string }[]>`SELECT id FROM invoices WHERE id = ${target.invoiceId} FOR UPDATE`
      : await tx.$queryRaw<{ id: string }[]>`SELECT id FROM meetings WHERE id = ${target.meetingId} FOR UPDATE`;
    if (!locked.length) return { ok: false as const, code: "NOT_FOUND", message: "Record not found." };
    await tx.reminderDelivery.updateMany({ where: { ...target, status: "sending", claimedAt: { lt: new Date(now.getTime() - 15 * 60_000) } }, data: { status: "uncertain", errorCode: "DELIVERY_CONFIRMATION_MISSING" } });
    if (manual) {
      const ambiguous = await tx.reminderDelivery.findFirst({ where: { ...target, status: { in: ["sending", "uncertain"] } } });
      if (ambiguous) return { ok: false as const, code: "UNCERTAIN", message: "A reminder is still sending or its delivery needs review. Check the delivery record before resending." };
      const recent = await tx.reminderDelivery.findFirst({ where: { ...target, OR: [{ createdAt: { gte: new Date(now.getTime() - MANUAL_REMINDER_COOLDOWN_MS) } }, { sentAt: { gte: new Date(now.getTime() - MANUAL_REMINDER_COOLDOWN_MS) } }, { claimedAt: { gte: new Date(now.getTime() - MANUAL_REMINDER_COOLDOWN_MS) } }], status: { not: "skipped" } } });
      if (recent) return { ok: false as const, code: "COOLDOWN", message: "A reminder was requested recently. Please wait 15 minutes before sending another." };
    } else {
      // A manual send and an automatic stage have different keys, but must
      // still not submit concurrently for the same invoice. Unknown sends
      // on this calendar day also require review rather than a second nudge.
      const dayStart = new Date(`${stage!.scheduledOn}T00:00:00+05:30`);
      const active = await tx.reminderDelivery.findFirst({ where: { ...target, OR: [
        { status: "sending" },
        { status: "uncertain", OR: [{ scheduledOn: stage!.scheduledOn }, { kind: "invoice_manual", claimedAt: { gte: dayStart } }] },
      ] } });
      if (active) return { ok: false as const, code: "HANDLED", message: "Another reminder is in flight or needs delivery review." };
    }
    const id = randomUUID();
    const row = await tx.reminderDelivery.upsert({ where: { dedupeKey }, update: {}, create: { id, dedupeKey, ...target, kind, dueOn: stage?.dueOn, scheduledOn: stage?.scheduledOn, messageId: `<reminder.${id}@savotechnologies.com>` } });
    if (!manual) {
      const deliveredToday = await tx.reminderDelivery.findFirst({ where: { ...target, status: "sent", sentAt: { gte: new Date(`${stage!.scheduledOn}T00:00:00+05:30`) } } });
      if (deliveredToday && ["pending", "retry"].includes(row.status)) {
        await tx.reminderDelivery.update({ where: { id: row.id }, data: { status: "skipped", errorCode: "REMINDER_ALREADY_SENT_TODAY" } });
        return { ok: false as const, code: "HANDLED", message: "A reminder already covered this calendar day." };
      }
    }
    if (!["pending", "retry"].includes(row.status) || row.attempts >= 3 || (row.nextAttemptAt && row.nextAttemptAt > now)) {
      return { ok: false as const, code: "HANDLED", message: "This reminder has already been handled or is waiting for its retry window." };
    }
    const claimToken = randomBytes(32).toString("hex");
    const changed = await tx.reminderDelivery.updateMany({ where: { id: row.id, status: row.status, attempts: row.attempts }, data: { status: "sending", attempts: { increment: 1 }, claimToken, claimedAt: now, errorCode: null, nextAttemptAt: null } });
    if (changed.count !== 1) return { ok: false as const, code: "HANDLED", message: "Another worker is handling this reminder." };
    return { ok: true as const, claim: { ...row, status: "sending", attempts: row.attempts + 1, claimToken } };
  }, { timeout: 10_000 });
}

export async function skipReminder(claim: ReminderClaim, reason: string): Promise<void> {
  await prisma!.reminderDelivery.updateMany({ where: { id: claim.id, status: "sending", claimToken: claim.claimToken }, data: { status: "skipped", errorCode: reason } });
}

/** Persist SMTP acceptance before acknowledging success. If the process dies
 * after SMTP acceptance, its claim is quarantined, never automatically replayed. */
export async function deliverReminder(claim: ReminderClaim, to: string, tpl: MailTemplate, meta: { templateKey: string; toName: string; sentBy?: string }, now: Date, automatic = false): Promise<ReminderResult> {
  let outcome;
  try { outcome = await deliverMail(to, tpl, "hello", { ...meta, messageId: claim.messageId, requireAcceptance: true }); }
  catch { outcome = { status: "uncertain" as const, reason: "DELIVERY_CONFIRMATION_UNKNOWN" }; }
  const retry = outcome.status === "not_sent" && outcome.retryable && automatic && claim.attempts < 3;
  const status = outcome.status === "accepted" ? "sent" : outcome.status === "uncertain" ? "uncertain" : retry ? "retry" : "failed";
  try {
    const changed = await prisma!.reminderDelivery.updateMany({ where: { id: claim.id, status: "sending", claimToken: claim.claimToken }, data: {
      status, errorCode: outcome.status === "accepted" ? null : outcome.reason,
      sentAt: outcome.status === "accepted" ? now : null,
      nextAttemptAt: retry ? new Date(now.getTime() + 60 * 60_000) : null,
    } });
    if (changed.count !== 1) return { ok: false, message: "Delivery confirmation could not be recorded. Please review before resending." };
  } catch { return { ok: false, message: "Delivery confirmation could not be recorded. Please review before resending." }; }
  return outcome.status === "accepted"
    ? { ok: true, message: "Reminder accepted by the mail server for delivery to the client.", deliveryId: claim.id }
    : { ok: false, message: status === "uncertain" ? "Delivery confirmation is unavailable. Review this reminder before resending." : "The reminder could not be sent. No invoice or meeting status was changed." };
}
