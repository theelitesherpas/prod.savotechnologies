/**
 * HR operations templates - the full employment lifecycle.
 *
 * Recruitment → offers & onboarding → employment lifecycle. Professional
 * business register, same letterhead system as the site templates:
 * salutation, substantive paragraphs, a quiet centered summary block
 * carrying the specifics, formal closing. Every value arrives as a
 * placeholder variable, so HR customises each send through the admin
 * email centre (or the tested defaults go out as-is).
 *
 * Sent from hr@savotechnologies.com (dept "hr").
 */

import {
  shell,
  lead,
  p,
  spec,
  highlight,
  prose,
  type MailTemplate,
} from "@/lib/mail/templates";


const site = (path = "/") => `https://savotechnologies.com${path}`;
const v = (vars: Record<string, string>, key: string, fallback = "-") => vars[key] || fallback;

const HR_SIGN = `Kind regards,<br>The Savo Team - Human Resources`;

/* ══════════════ RECRUITMENT ══════════════ */

/** Interview invitation (shortlisted candidate) with meeting link. */
export function interviewInvite(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Interview invitation - ${v(vars, "position")} · Savo Technologies`,
    html: shell({
      preheader: `You have been shortlisted for ${v(vars, "position")}. Interview: ${v(vars, "interviewDate")} at ${v(vars, "interviewTime")}.`,
      eyebrowText: "Interview invitation",
      ref: "HR · INTERVIEW",
      heading: "You have been shortlisted.",
      bodyHtml: [
        lead(`Dear ${v(vars, "candidateName")},<br><br>Thank you for your interest in the <strong>${v(vars, "position")}</strong> position at Savo Technologies. We are pleased to inform you that your application has been shortlisted, and we would like to invite you to an interview.`),
        spec([
          ["Date", v(vars, "interviewDate")],
          ["Time", `${v(vars, "interviewTime")} (${v(vars, "timezone", "IST")})`],
          ["Duration", v(vars, "duration", "30–45 minutes")],
          ["Mode", v(vars, "mode", "Google Meet / Microsoft Teams")],
          ["Interviewer", v(vars, "interviewer")],
        ]),
        highlight(`<strong>Joining link:</strong> <a href="${v(vars, "meetingLink", "#")}" style="color:#d9480f;">${v(vars, "meetingLink", "- link will be shared -")}</a>`),
        p(`Please join the meeting a few minutes early and ensure a stable internet connection. Should the proposed time be inconvenient, reply to this email and we will gladly reschedule.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email in relation to your application to Savo Technologies.",
    }),
    text: `Dear ${v(vars, "candidateName")},\n\nYou have been shortlisted for the ${v(vars, "position")} position at Savo Technologies.\n\nInterview details:\nDate: ${v(vars, "interviewDate")}\nTime: ${v(vars, "interviewTime")} (${v(vars, "timezone", "IST")})\nDuration: ${v(vars, "duration", "30–45 minutes")}\nInterviewer: ${v(vars, "interviewer")}\nJoin: ${v(vars, "meetingLink")}\n\nIf the time is inconvenient, reply to reschedule.\n\n${HR_SIGN}`,
  };
}

/** Interview reminder - sent ahead of the scheduled interview. */
export function interviewReminder(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Reminder - interview on ${v(vars, "interviewDate")}`,
    html: shell({
      preheader: `A reminder for your ${v(vars, "position")} interview: ${v(vars, "interviewDate")} at ${v(vars, "interviewTime")}.`,
      eyebrowText: "Interview reminder",
      ref: "HR · REMINDER",
      heading: "A reminder for your interview.",
      bodyHtml: [
        lead(`Dear ${v(vars, "candidateName")},<br><br>This is a reminder for your interview for the <strong>${v(vars, "position")}</strong> position.`),
        spec([
          ["Date", v(vars, "interviewDate")],
          ["Time", `${v(vars, "interviewTime")} (${v(vars, "timezone", "IST")})`],
          ["Join", v(vars, "meetingLink")],
        ]),
        p(`We look forward to speaking with you.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email in relation to your application to Savo Technologies.",
    }),
    text: `Dear ${v(vars, "candidateName")},\n\nReminder: your interview for the ${v(vars, "position")} position is on ${v(vars, "interviewDate")} at ${v(vars, "interviewTime")} (${v(vars, "timezone", "IST")}).\nJoin: ${v(vars, "meetingLink")}\n\n${HR_SIGN}`,
  };
}

/** Interview reschedule notice. */
export function interviewReschedule(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Interview rescheduled - ${v(vars, "position")}`,
    html: shell({
      preheader: `Your interview has been moved to ${v(vars, "newDate")} at ${v(vars, "newTime")}.`,
      eyebrowText: "Interview rescheduled",
      ref: "HR · RESCHEDULE",
      heading: "Your interview has been rescheduled.",
      bodyHtml: [
        lead(`Dear ${v(vars, "candidateName")},<br><br>Your interview for the <strong>${v(vars, "position")}</strong> position has been rescheduled. The new details are below.`),
        spec([
          ["New date", v(vars, "newDate")],
          ["New time", `${v(vars, "newTime")} (${v(vars, "timezone", "IST")})`],
          ["Join", v(vars, "meetingLink")],
        ]),
        p(`We apologise for any inconvenience and appreciate your flexibility.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email in relation to your application to Savo Technologies.",
    }),
    text: `Dear ${v(vars, "candidateName")},\n\nYour interview for the ${v(vars, "position")} position has been rescheduled to ${v(vars, "newDate")} at ${v(vars, "newTime")} (${v(vars, "timezone", "IST")}).\nJoin: ${v(vars, "meetingLink")}\n\n${HR_SIGN}`,
  };
}

/** Shortlist acknowledgment - candidate moved to the shortlist. */
export function shortlistAck(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Your application has been shortlisted - ${v(vars, "position")} - Savo Technologies`,
    html: shell({
      preheader: "Your application has progressed to the next stage.",
      eyebrowText: "Application shortlisted",
      ref: "HR - SHORTLIST",
      heading: "Your application has been shortlisted.",
      bodyHtml: [
        lead(`Dear ${v(vars, "candidateName")},<br><br>We are pleased to inform you that your application for the <strong>${v(vars, "position")}</strong> position at Savo Technologies has been shortlisted for the next stage of our hiring process.`),
        p(`Our hiring team is reviewing shortlisted profiles and will contact you within <strong>two business days</strong> to schedule an interview. Please keep an eye on your inbox.`),
        p(`If you have any questions in the meantime, simply reply to this email.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email in relation to your application to Savo Technologies.",
    }),
    text: `Dear ${v(vars, "candidateName")},

Your application for the ${v(vars, "position")} position has been shortlisted. Our hiring team will contact you within two business days to schedule an interview.

${HR_SIGN}`,
  };
}

/** Candidate rejection - respectful, keeps the door open. */
export function candidateRejection(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Your application - ${v(vars, "position")} · Savo Technologies`,
    html: shell({
      preheader: "Thank you for your application. We are unable to proceed at this time.",
      eyebrowText: "Application update",
      ref: "HR · UPDATE",
      heading: "Update on your application.",
      bodyHtml: [
        lead(`Dear ${v(vars, "candidateName")},<br><br>Thank you for the time and effort you invested in your application for the <strong>${v(vars, "position")}</strong> position at Savo Technologies.`),
        p(`After careful consideration, we are unable to proceed with your application at this time. This decision does not reflect on your capabilities - the volume and quality of applications for this role made selection genuinely difficult.`),
        p(`We would be glad to consider your profile for future openings that match your experience, and encourage you to apply again.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email in relation to your application to Savo Technologies.",
    }),
    text: `Dear ${v(vars, "candidateName")},\n\nThank you for your application for the ${v(vars, "position")} position at Savo Technologies. After careful consideration, we are unable to proceed at this time.\n\nWe would be glad to consider your profile for future openings and encourage you to apply again.\n\n${HR_SIGN}`,
  };
}

/** Bulk announcement of current job openings. */
export function jobOpeningsBroadcast(vars: Record<string, string>): MailTemplate {
  return {
    subject: `We are hiring - current openings at Savo Technologies`,
    html: shell({
      preheader: "Current openings at Savo Technologies - share with someone who fits.",
      eyebrowText: "Job openings",
      ref: "HR · OPENINGS",
      heading: "We are hiring.",
      bodyHtml: [
        lead(`Dear ${v(vars, "recipientName", "Team")},<br><br>Below are the positions currently open at Savo Technologies. If someone in your network fits a role, we would be grateful for the referral.`),
        prose(v(vars, "openingsList", "· Position - Location\n· Position - Location")),
        p(`All openings are listed with full details on our careers page. Referrals are reviewed on priority.`, true),
      ].join(""),
      cta: { href: site("/careers"), label: "View all openings" },
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of Savo Technologies hiring communications.",
    }),
    text: `Dear ${v(vars, "recipientName", "Team")},\n\nCurrent openings at Savo Technologies:\n\n${v(vars, "openingsList")}\n\nAll details: ${site("/careers")}\n\n${HR_SIGN}`,
  };
}

/* ══════════════ OFFERS & ONBOARDING ══════════════ */

/** Employee record created - the employee ID email. */
export function employeeWelcome(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Welcome to Savo Technologies - employee ID ${v(vars, "employeeCode")}`,
    html: shell({
      preheader: `Your employee ID is ${v(vars, "employeeCode")}. Joining on ${v(vars, "joiningDate")}.`,
      eyebrowText: "Employee record created",
      ref: "HR · EMPLOYEE",
      heading: "Welcome to Savo Technologies.",
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName")},<br><br>Your employee record has been created for the position of <strong>${v(vars, "position")}</strong> (${v(vars, "department")}). Please keep your employee ID for all future correspondence.`),
        spec([
          ["Employee ID", v(vars, "employeeCode")],
          ["Position", v(vars, "position")],
          ["Department", v(vars, "department")],
          ["Joining date", v(vars, "joiningDate")],
          ["Reporting to", v(vars, "reportTo")],
        ]),
        p(`<strong>Leave policy:</strong> ${v(vars, "leavePolicy", "One leave is credited for every completed month of service; unused leaves carry forward.")}`),
        p(`Your onboarding formalities and first-day details will follow in a separate email. For anything in the meantime, reply to this email - Human Resources reads it.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of your employment onboarding at Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName")},

Your employee record has been created.

Employee ID: ${v(vars, "employeeCode")}
Position: ${v(vars, "position")}
Department: ${v(vars, "department")}
Joining date: ${v(vars, "joiningDate")}
Reporting to: ${v(vars, "reportTo")}

Leave policy: ${v(vars, "leavePolicy", "One leave per completed month of service; unused leaves carry forward.")}

${HR_SIGN}`,
  };
}


/** Offer of employment. */
export function offerLetter(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Offer of employment - ${v(vars, "position")} · Savo Technologies`,
    html: shell({
      preheader: `We are pleased to offer you the position of ${v(vars, "position")}.`,
      eyebrowText: "Offer of employment",
      ref: "HR · OFFER",
      heading: "We are pleased to offer you a position.",
      bodyHtml: [
        lead(`Dear ${v(vars, "candidateName")},<br><br>Further to your interviews with our team, we are pleased to offer you the position of <strong>${v(vars, "position")}</strong> at Savo Technologies. We were impressed with your experience and look forward to welcoming you.`),
        spec([
          ["Position", v(vars, "position")],
          ["Compensation", v(vars, "ctc")],
          ["Joining date", v(vars, "joiningDate")],
          ["Reporting to", v(vars, "reportTo")],
          ["Offer valid until", v(vars, "validUntil")],
        ]),
        p(`This offer is subject to satisfactory verification of documents and employment history. To accept, reply to this email with your confirmation; the formal appointment letter follows your acceptance and verification.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email in relation to your application to Savo Technologies.",
    }),
    text: `Dear ${v(vars, "candidateName")},\n\nWe are pleased to offer you the position of ${v(vars, "position")} at Savo Technologies.\n\nCompensation: ${v(vars, "ctc")}\nJoining date: ${v(vars, "joiningDate")}\nReporting to: ${v(vars, "reportTo")}\nOffer valid until: ${v(vars, "validUntil")}\n\nThis offer is subject to satisfactory document and employment verification. To accept, reply to this email.\n\n${HR_SIGN}`,
  };
}

/** Pre-joining document verification request. */
export function documentVerification(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Document verification - ${v(vars, "position")} · Savo Technologies`,
    html: shell({
      preheader: "Please share the listed documents to complete your joining formalities.",
      eyebrowText: "Document verification",
      ref: "HR · DOCUMENTS",
      heading: "Documents required for verification.",
      bodyHtml: [
        lead(`Dear ${v(vars, "candidateName")},<br><br>To complete the joining formalities for the <strong>${v(vars, "position")}</strong> position, please share the following documents.`),
        prose(v(vars, "documents", "· Government photo ID\n· Highest qualification certificate\n· Previous employment relieving letter\n· Last three months' salary slips\n· Address proof")),
        spec([
          ["Submit by", v(vars, "deadline")],
          ["Send to", "hr@savotechnologies.com"],
        ]),
        p(`Your documents are used solely for verification and stored confidentially in line with our records policy.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of Savo Technologies hiring formalities.",
    }),
    text: `Dear ${v(vars, "candidateName")},\n\nTo complete your joining formalities for the ${v(vars, "position")} position, please share the following documents:\n\n${v(vars, "documents")}\n\nSubmit by: ${v(vars, "deadline")}\nSend to: hr@savotechnologies.com\n\n${HR_SIGN}`,
  };
}

/** Reference check with a candidate's previous employer. */
export function employmentVerification(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Employment verification request - ${v(vars, "candidateName")}`,
    html: shell({
      preheader: `A verification request regarding ${v(vars, "candidateName")}, who has applied to Savo Technologies.`,
      eyebrowText: "Employment verification",
      ref: "HR · VERIFICATION",
      heading: "Employment verification request.",
      bodyHtml: [
        lead(`Dear ${v(vars, "recipientName", "Sir/Madam")},<br><br><strong>${v(vars, "candidateName")}</strong> has applied for a position at Savo Technologies and has listed your organisation as a previous employer. We would be grateful if you could confirm the following details from your records.`),
        spec([
          ["Candidate", v(vars, "candidateName")],
          ["Tenure claimed", `${v(vars, "workedFrom")} - ${v(vars, "workedTo")}`],
          ["Designation claimed", v(vars, "designation")],
        ]),
        p(`A simple confirmation of tenure, designation and conduct - a reply to this email suffices. Any information you share is used strictly for this verification and kept confidential.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this request because the candidate listed your organisation as a previous employer.",
    }),
    text: `Dear ${v(vars, "recipientName", "Sir/Madam")},\n\n${v(vars, "candidateName")} has applied for a position at Savo Technologies and listed your organisation as a previous employer. We would be grateful for confirmation of:\n\nTenure: ${v(vars, "workedFrom")} - ${v(vars, "workedTo")}\nDesignation: ${v(vars, "designation")}\n\nA reply to this email with a simple confirmation suffices. The information is kept strictly confidential.\n\n${HR_SIGN}`,
  };
}

/** Appointment letter (post acceptance). */
export function appointmentLetter(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Appointment letter - ${v(vars, "position")} · Savo Technologies`,
    html: shell({
      preheader: `Your appointment as ${v(vars, "position")} is confirmed.`,
      eyebrowText: "Appointment letter",
      ref: "HR · APPOINTMENT",
      heading: "Your appointment is confirmed.",
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName")},<br><br>Consequent to your acceptance of our offer and satisfactory completion of verification, your appointment as <strong>${v(vars, "position")}</strong> at Savo Technologies is hereby confirmed.`),
        spec([
          ["Position", v(vars, "position")],
          ["Department", v(vars, "department")],
          ["Joining date", v(vars, "joiningDate")],
          ["Reporting to", v(vars, "reportTo")],
        ]),
        p(`The detailed terms of employment are enclosed with the formal appointment letter, carried with this email as an attachment. Kindly sign and return a copy to Human Resources.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of your employment with Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName")},\n\nYour appointment as ${v(vars, "position")} (${v(vars, "department")}) at Savo Technologies is confirmed.\n\nJoining date: ${v(vars, "joiningDate")}\nReporting to: ${v(vars, "reportTo")}\n\nThe detailed terms are enclosed with the formal letter. Kindly sign and return a copy to Human Resources.\n\n${HR_SIGN}`,
  };
}

/** First-day welcome with joining details. */
export function onboardingWelcome(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Welcome to Savo Technologies - your first day`,
    html: shell({
      preheader: `Everything you need for your first day on ${v(vars, "joiningDate")}.`,
      eyebrowText: "Welcome aboard",
      ref: "HR · ONBOARDING",
      heading: "Welcome to Savo Technologies.",
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName")},<br><br>We are delighted to welcome you as <strong>${v(vars, "position")}</strong>. Your first day details are below - everything else, your team will walk you through.`),
        spec([
          ["First day", v(vars, "joiningDate")],
          ["Report at", v(vars, "reportTime")],
          ["Location", v(vars, "officeLocation")],
          ["Buddy", v(vars, "buddy", "Assigned on arrival")],
        ]),
        p(`Carry a government photo ID for building access. Lunch is on us - your buddy will take you around.`, true),
      ].join(""),
      closing: "See you on Monday,",
      dept: "hr",
      reason: "You are receiving this email as a part of your onboarding at Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName")},\n\nWelcome to Savo Technologies as ${v(vars, "position")}.\n\nFirst day: ${v(vars, "joiningDate")}\nReport at: ${v(vars, "reportTime")}\nLocation: ${v(vars, "officeLocation")}\n\nCarry a government photo ID. Your buddy will guide you through the day.\n\n${HR_SIGN}`,
  };
}

/* ══════════════ EMPLOYMENT LIFECYCLE ══════════════ */

/** Probation confirmation. */
export function probationConfirmation(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Confirmation of employment - ${v(vars, "employeeName")}`,
    html: shell({
      preheader: "Your probation period has been successfully completed.",
      eyebrowText: "Employment confirmed",
      ref: "HR · CONFIRMATION",
      heading: "Probation successfully completed.",
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName")},<br><br>We are pleased to inform you that you have successfully completed your probation period as <strong>${v(vars, "position")}</strong>, and your employment with Savo Technologies is hereby confirmed.`),
        spec([
          ["Confirmed effective", v(vars, "confirmationDate")],
          ["Reviewed by", v(vars, "managerName")],
        ]),
        p(`Your manager has noted your contributions during this period, and the team looks forward to your continued growth with us.`, true),
      ].join(""),
      closing: "Congratulations, and kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of your employment with Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName")},\n\nYou have successfully completed your probation period as ${v(vars, "position")}, and your employment is confirmed effective ${v(vars, "confirmationDate")}.\n\n${HR_SIGN}`,
  };
}

/** Salary increment / revision. */
export function salaryIncrement(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Salary revision - effective ${v(vars, "effectiveDate")}`,
    html: shell({
      preheader: "Your revised compensation, in recognition of your contribution.",
      eyebrowText: "Salary revision",
      ref: "HR · REVISION",
      heading: "Your compensation has been revised.",
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName")},<br><br>In recognition of your contribution and performance during the review period, your compensation has been revised as follows.`),
        spec([
          ["Revised CTC", v(vars, "newCtc")],
          ["Increase", v(vars, "incrementPercent")],
          ["Effective from", v(vars, "effectiveDate")],
        ]),
        p(`The detailed revision letter follows separately for your records. Thank you for your continued commitment - we look forward to the year ahead with you.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of your employment with Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName")},\n\nYour compensation has been revised in recognition of your performance.\n\nRevised CTC: ${v(vars, "newCtc")}\nIncrease: ${v(vars, "incrementPercent")}\nEffective from: ${v(vars, "effectiveDate")}\n\n${HR_SIGN}`,
  };
}

/** Leave approval. */
export function leaveApproval(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Leave approved - ${v(vars, "fromDate")} to ${v(vars, "toDate")}`,
    html: shell({
      preheader: "Your leave request has been approved.",
      eyebrowText: "Leave approved",
      ref: "HR · LEAVE",
      heading: "Your leave has been approved.",
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName")},<br><br>Your leave request has been reviewed and approved. The details are below for your records.`),
        spec([
          ["Leave type", v(vars, "leaveType")],
          ["From", v(vars, "fromDate")],
          ["To", v(vars, "toDate")],
          ["Days", v(vars, "days")],
          ["Approved by", v(vars, "approvedBy")],
        ]),
        p(`Kindly ensure your handover is complete before proceeding on leave. We wish you a restful time.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of leave management at Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName")},\n\nYour leave has been approved.\n\nType: ${v(vars, "leaveType")}\nFrom: ${v(vars, "fromDate")}\nTo: ${v(vars, "toDate")}\nDays: ${v(vars, "days")}\nApproved by: ${v(vars, "approvedBy")}\n\n${HR_SIGN}`,
  };
}

/** Leave rejection. */
export function leaveRejection(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Leave request - unable to approve`,
    html: shell({
      preheader: "Your leave request could not be approved at this time.",
      eyebrowText: "Leave update",
      ref: "HR · LEAVE",
      heading: "Your leave request could not be approved.",
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName")},<br><br>We have reviewed your leave request for <strong>${v(vars, "fromDate")} - ${v(vars, "toDate")}</strong>. Unfortunately, we are unable to approve it at this time.`),
        spec([
          ["Leave type", v(vars, "leaveType")],
          ["Requested", `${v(vars, "fromDate")} - ${v(vars, "toDate")}`],
          ["Reason", v(vars, "reason")],
        ]),
        p(`We understand this may be inconvenient. You are welcome to discuss alternate dates with your manager, and we will do our best to accommodate them.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of leave management at Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName")},\n\nYour leave request for ${v(vars, "fromDate")} - ${v(vars, "toDate")} could not be approved.\n\nReason: ${v(vars, "reason")}\n\nYou are welcome to discuss alternate dates with your manager.\n\n${HR_SIGN}`,
  };
}

/** Performance improvement plan. */
export function pipNotice(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Performance improvement plan - ${v(vars, "employeeName")}`,
    html: shell({
      preheader: "A structured plan with our full support.",
      eyebrowText: "Performance improvement",
      ref: "HR · PIP",
      heading: "Performance improvement plan.",
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName")},<br><br>Following your performance review, we would like to work with you on a structured improvement plan. This is a supportive process - its purpose is to help you succeed in your role as <strong>${v(vars, "position")}</strong>.`),
        spec([
          ["Focus areas", v(vars, "focusAreas")],
          ["Plan duration", v(vars, "duration")],
          ["Review date", v(vars, "reviewDate")],
          ["Manager", v(vars, "managerName")],
        ]),
        p(`During this period, the support listed above - regular check-ins, mentorship and resources - is fully available to you. We are committed to your success and will review progress together on the date mentioned.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of employment processes at Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName")},\n\nFollowing your performance review, a structured improvement plan has been set for your role as ${v(vars, "position")}.\n\nFocus areas: ${v(vars, "focusAreas")}\nDuration: ${v(vars, "duration")}\nReview date: ${v(vars, "reviewDate")}\nManager: ${v(vars, "managerName")}\n\nRegular check-ins, mentorship and resources are available throughout. We are committed to your success.\n\n${HR_SIGN}`,
  };
}

/** Termination of service. */
export function terminationNotice(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Termination of service - ${v(vars, "employeeName")}`,
    html: shell({
      preheader: "Formal notice regarding the conclusion of employment.",
      eyebrowText: "Termination of service",
      ref: "HR · SEPARATION",
      heading: "Termination of service.",
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName")},<br><br>This email serves as formal notice that your employment with Savo Technologies as <strong>${v(vars, "position")}</strong> will conclude effective the date below.`),
        spec([
          ["Last working day", v(vars, "lastWorkingDay")],
          ["Notice period", v(vars, "noticePeriod")],
          ["Reason", v(vars, "reason")],
        ]),
        p(`Your full and final settlement - salary, leave balance and applicable dues - will be processed as per policy following your last working day. Company property must be returned and handover completed to <strong>${v(vars, "handoverTo")}</strong> before separation.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a formal employment communication from Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName")},\n\nThis email serves as formal notice that your employment with Savo Technologies as ${v(vars, "position")} will conclude as below.\n\nLast working day: ${v(vars, "lastWorkingDay")}\nNotice period: ${v(vars, "noticePeriod")}\nReason: ${v(vars, "reason")}\n\nFull and final settlement will be processed as per policy. Company property must be returned and handover completed to ${v(vars, "handoverTo")}.\n\n${HR_SIGN}`,
  };
}

/** Resignation acknowledgement. */
export function resignationAcknowledgement(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Resignation acknowledged - ${v(vars, "employeeName")}`,
    html: shell({
      preheader: "We acknowledge your resignation and outline the exit process.",
      eyebrowText: "Resignation acknowledged",
      ref: "HR · SEPARATION",
      heading: "Your resignation has been acknowledged.",
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName")},<br><br>We acknowledge receipt of your resignation from the position of <strong>${v(vars, "position")}</strong>. We respect your decision and thank you for your contribution to Savo Technologies.`),
        spec([
          ["Last working day", v(vars, "lastWorkingDay")],
          ["Handover to", v(vars, "handoverTo")],
          ["Exit formalities", "Exit interview · asset return · knowledge transfer"],
        ]),
        p(`Your relieving and experience letters will be issued after the completion of exit formalities and the full and final settlement.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of exit formalities at Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName")},\n\nWe acknowledge your resignation from the position of ${v(vars, "position")}.\n\nLast working day: ${v(vars, "lastWorkingDay")}\nHandover to: ${v(vars, "handoverTo")}\nExit formalities: exit interview, asset return, knowledge transfer.\n\nYour relieving and experience letters follow the settlement.\n\n${HR_SIGN}`,
  };
}

/** Relieving & experience confirmation. */
export function relievingLetter(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Relieving letter - ${v(vars, "employeeName")}`,
    html: shell({
      preheader: "Confirmation of relieving and service record.",
      eyebrowText: "Relieving letter",
      ref: "HR · SEPARATION",
      heading: "Relieving confirmation.",
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName")},<br><br>This is to confirm that you have been relieved from the position of <strong>${v(vars, "position")}</strong> at Savo Technologies, having completed all exit formalities.`),
        spec([
          ["Tenure", `${v(vars, "fromDate")} - ${v(vars, "toDate")}`],
          ["Position", v(vars, "position")],
          ["Conduct", v(vars, "conduct", "Good")],
        ]),
        p(`We thank you for your service and contribution to the organisation, and wish you the very best in your future endeavours. The formal relieving and experience letters are attached with this email.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of exit formalities at Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName")},\n\nThis is to confirm that you have been relieved from the position of ${v(vars, "position")} at Savo Technologies.\n\nTenure: ${v(vars, "fromDate")} - ${v(vars, "toDate")}\nConduct: ${v(vars, "conduct", "Good")}\n\nWe thank you for your service and wish you the best ahead. Formal letters are attached.\n\n${HR_SIGN}`,
  };
}

/** Exit interview invitation. */
export function exitInterview(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Exit interview - ${v(vars, "employeeName")}`,
    html: shell({
      preheader: "An open conversation before your last day.",
      eyebrowText: "Exit interview",
      ref: "HR · EXIT",
      heading: "Exit interview invitation.",
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName")},<br><br>As a part of your exit process, we would like to invite you to a short exit interview - an open conversation about your experience with us, and anything we can do better.`),
        spec([
          ["Date", v(vars, "exitDate")],
          ["Duration", v(vars, "duration", "30 minutes")],
          ["Join", v(vars, "meetingLink")],
        ]),
        p(`Your candid feedback shapes how we improve as a workplace. Everything you share is treated confidentially.`, true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of exit formalities at Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName")},\n\nWe invite you to a short exit interview.\n\nDate: ${v(vars, "exitDate")}\nDuration: ${v(vars, "duration", "30 minutes")}\nJoin: ${v(vars, "meetingLink")}\n\nYour candid feedback is treated confidentially.\n\n${HR_SIGN}`,
  };
}

/** Holiday announcement. */
export function holidayAnnouncement(vars: Record<string, string>): MailTemplate {
  return {
    subject: `Holiday announcement - ${v(vars, "holidayName")}`,
    html: shell({
      preheader: `The office will remain closed on ${v(vars, "holidayDate")}.`,
      eyebrowText: "Holiday announcement",
      ref: "HR · ANNOUNCEMENT",
      heading: `Holiday - ${v(vars, "holidayName")}.`,
      bodyHtml: [
        lead(`Dear ${v(vars, "employeeName", "Team")},<br><br>This is to inform you that the office will remain closed on the occasion of <strong>${v(vars, "holidayName")}</strong>.`),
        spec([
          ["Date", v(vars, "holidayDate")],
          ["Day", v(vars, "holidayDay")],
        ]),
        p(v(vars, "note", "Wishing you and your family a pleasant holiday."), true),
      ].join(""),
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this email as a part of workplace communications at Savo Technologies.",
    }),
    text: `Dear ${v(vars, "employeeName", "Team")},\n\nThe office will remain closed on the occasion of ${v(vars, "holidayName")} - ${v(vars, "holidayDate")} (${v(vars, "holidayDay")}).\n\n${HR_SIGN}`,
  };
}
