/**
 * Meeting email templates — built on the site's shared template shell.
 * Same brand fonts, wordmark, spec rows, CTA buttons, colophon and
 * sign-off as every other transactional email.
 */

import { shell, spec, p, lead, highlight } from "./templates";
import { site } from "./templates";
import type { MailTemplate } from "./templates";

const fn = (name: string) => name.split(" ")[0];
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const TYPE_LABELS: Record<string, string> = {
  in_person: "In-person meeting",
  video: "Video meeting",
  phone: "Phone call",
  office_visit: "Office visit",
  client_office: "Client office",
  custom: "Meeting",
};

const LOC_LABELS: Record<string, string> = {
  savo_office: "Savo Technologies office",
  client_office: "Your office",
  google_meet: "Google Meet",
  zoom: "Zoom",
  teams: "Microsoft Teams",
  phone: "Phone",
  custom: "Custom location",
};

/* ─────────────────── 1 · Meeting Invitation ─────────────────── */

export function meetingInvitation(opts: {
  clientName: string;
  meetingTitle: string;
  meetingType: string;
  durationMin: number;
  agenda?: string | null;
  reference: string;
  schedulingLink: string;
  to?: string;
}): MailTemplate {
  const firstName = fn(opts.clientName);
  const typeLabel = TYPE_LABELS[opts.meetingType] ?? opts.meetingType;

  return {
    subject: `Your meeting invitation: ${opts.meetingTitle}`,
    html: shell({
      preheader: `Pick a date and time that works for you. It takes less than a minute.`,
      eyebrowText: "Meeting invitation",
      ref: opts.reference,
      heading: `${firstName}, please pick a time for your meeting.`,
      bodyHtml: [
        lead(
          `You have been invited to a meeting with Savo Technologies. Please select a date and time that works best for you using the link below.`,
        ),
        spec([
          ["Meeting", opts.meetingTitle],
          ["Type", typeLabel],
          ["Duration", `${opts.durationMin} minutes`],
          ...(opts.agenda ? ([["Agenda", opts.agenda]] as [string, string][]) : []),
        ]),
        p(`It takes less than a minute to pick your slot. Once you confirm, we will lock it in and send you the details.`, true),
      ].join(""),
      cta: {
        href: opts.schedulingLink,
        label: "Pick Your Date & Time",
        sub: "Choose from the available slots, or suggest your own.",
      },
      closing: "Looking forward to it,",
      reason: "You are receiving this because a meeting was scheduled with you through savotechnologies.com.",
      unsubscribeEmail: opts.to,
    }),
    text: `Hi ${firstName},

You have been invited to a meeting with Savo Technologies.

Meeting: ${opts.meetingTitle}
Type: ${typeLabel}
Duration: ${opts.durationMin} minutes
${opts.agenda ? `Agenda: ${opts.agenda}\n` : ""}
Pick your date and time here:
${opts.schedulingLink}

It takes less than a minute. Once you confirm, we will send you the details.

Looking forward to it,
The Savo team
${site("/")}`,
  };
}

/* ─────────────────── 2 · Availability Received ─────────────────── */

export function meetingAvailabilityReceived(opts: {
  clientName: string;
  meetingTitle: string;
  date: string;
  time: string;
  durationMin: number;
  reference: string;
  to?: string;
}): MailTemplate {
  const firstName = fn(opts.clientName);

  return {
    subject: `Got it, ${firstName}. Your meeting is being confirmed.`,
    html: shell({
      preheader: `We received your availability for ${opts.meetingTitle}. Our team will confirm shortly.`,
      eyebrowText: "Availability received",
      ref: opts.reference,
      heading: `Thank you, ${firstName}. Your availability has been received.`,
      bodyHtml: [
        lead(`We have noted your preferred time for the meeting below. Our team is reviewing it and will send you a confirmation shortly.`),
        spec([
          ["Meeting", opts.meetingTitle],
          ["Your date", opts.date],
          ["Your time", `${opts.time} IST`],
          ["Duration", `${opts.durationMin} minutes`],
        ]),
        highlight(`We will confirm this slot within a few hours during business time. If anything changes, we will reach out to you directly.`),
      ].join(""),
      closing: "Kind regards,",
      reason: "You are receiving this because you submitted meeting availability through savotechnologies.com.",
      unsubscribeEmail: opts.to,
    }),
    text: `Hi ${firstName},

Thank you for picking your time. Here is what we received:

Meeting: ${opts.meetingTitle}
Date: ${opts.date}
Time: ${opts.time} IST
Duration: ${opts.durationMin} minutes

Our team will confirm this slot shortly. If anything changes, we will reach out to you directly.

Kind regards,
The Savo team
${site("/")}`,
  };
}

/* ─────────────────── 3 · Meeting Confirmed ─────────────────── */

export function meetingConfirmed(opts: {
  clientName: string;
  meetingTitle: string;
  date: string;
  time: string;
  durationMin: number;
  meetingType: string;
  location: string;
  reference: string;
  to?: string;
}): MailTemplate {
  const firstName = fn(opts.clientName);
  const typeLabel = TYPE_LABELS[opts.meetingType] ?? opts.meetingType;

  return {
    subject: `Confirmed: ${opts.meetingTitle} on ${opts.date}`,
    html: shell({
      preheader: `Your meeting is confirmed for ${opts.date} at ${opts.time} IST.`,
      eyebrowText: "Meeting confirmed",
      ref: opts.reference,
      heading: `Your meeting is confirmed, ${firstName}.`,
      bodyHtml: [
        lead(`Great news. Your meeting has been confirmed for the details below.`),
        spec([
          ["Meeting", opts.meetingTitle],
          ["Date", opts.date, ],
          ["Time", `${opts.time} IST`],
          ["Duration", `${opts.durationMin} minutes`],
          ["Type", typeLabel],
          ["Location", opts.location],
        ]),
        p(`We look forward to speaking with you. If you need to change anything, simply reply to this email and we will take care of it.`, true),
      ].join(""),
      closing: "See you soon,",
      reason: "You are receiving this because your meeting was confirmed through savotechnologies.com.",
      unsubscribeEmail: opts.to,
    }),
    text: `Hi ${firstName},

Your meeting is confirmed. Here are the details:

Meeting: ${opts.meetingTitle}
Date: ${opts.date}
Time: ${opts.time} IST
Duration: ${opts.durationMin} minutes
Type: ${typeLabel}
Location: ${opts.location}

If you need to change anything, simply reply to this email.

See you soon,
The Savo team
${site("/")}`,
  };
}

/* ─────────────────── 4 · Admin Notification ─────────────────── */

export function meetingAdminNotification(opts: {
  clientName: string;
  clientCompany?: string;
  meetingTitle: string;
  date: string;
  time: string;
  reference: string;
}): MailTemplate {
  const company = opts.clientCompany ? ` (${opts.clientCompany})` : "";
  return {
    subject: `Meeting response: ${opts.clientName} picked ${opts.date} at ${opts.time}`,
    html: shell({
      preheader: `${opts.clientName}${company} selected ${opts.date} at ${opts.time} IST.`,
      eyebrowText: "Meeting response",
      ref: opts.reference,
      heading: `${opts.clientName} has submitted their availability.`,
      bodyHtml: [
        spec([
          ["Client", `${opts.clientName}${company}`],
          ["Meeting", opts.meetingTitle],
          ["Selected date", opts.date],
          ["Selected time", `${opts.time} IST`],
        ]),
        highlight(`Open the admin panel, review the response and confirm the meeting.`),
      ].join(""),
      cta: {
        href: site("/admin/meetings"),
        label: "Review & Confirm",
        sub: "Client Portal → Meetings in the admin panel.",
      },
      closing: "Kind regards,",
      reason: "Internal notification from the Savo meeting scheduling system.",
    }),
    text: `${opts.clientName}${company} selected ${opts.date} at ${opts.time} IST for "${opts.meetingTitle}".

Open the admin panel to confirm:
${site("/admin/meetings")}

The Savo team`,
  };
}

/* ─────────────────── 5 · Reschedule Request ─────────────────── */

export function meetingRescheduleRequest(opts: {
  clientName: string;
  meetingTitle: string;
  previousDate: string;
  previousTime: string;
  reference: string;
  schedulingLink: string;
  reason?: string | null;
  to?: string;
}): MailTemplate {
  const firstName = fn(opts.clientName);
  return {
    subject: `Let's find a new time for your meeting`,
    html: shell({
      preheader: `We need to reschedule your meeting. Please pick a new date and time.`,
      eyebrowText: "Reschedule requested",
      ref: opts.reference,
      heading: `${firstName}, we need to find a new time.`,
      bodyHtml: [
        lead(`Unfortunately we need to reschedule your meeting. We apologise for the inconvenience.`),
        spec([
          ["Meeting", opts.meetingTitle],
          ["Previous date", opts.previousDate],
          ["Previous time", `${opts.previousTime} IST`],
        ]),
        ...(opts.reason ? [highlight(esc(opts.reason))] : []),
        p(`Please use the same link to pick a new date and time that works for you.`, true),
      ].join(""),
      cta: {
        href: opts.schedulingLink,
        label: "Pick a New Time",
        sub: "Your scheduling link is still active.",
      },
      closing: "Sorry for the trouble,",
      reason: "You are receiving this because your meeting was rescheduled through savotechnologies.com.",
      unsubscribeEmail: opts.to,
    }),
    text: `Hi ${firstName},

We need to reschedule your meeting.

Meeting: ${opts.meetingTitle}
Previous: ${opts.previousDate} at ${opts.previousTime} IST
${opts.reason ? `Reason: ${opts.reason}\n` : ""}
Please pick a new time using the same link:
${opts.schedulingLink}

Sorry for the trouble,
The Savo team
${site("/")}`,
  };
}
