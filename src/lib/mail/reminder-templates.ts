import { shell, lead, p, spec, site, escapeMailHtml as esc } from "./design";
import type { MailTemplate } from "./templates";
import { clientGreetingName } from "@/lib/client-name";
import { invoiceDate, invoiceMoney } from "@/lib/invoice-document";
import { invoicePaymentLink } from "@/lib/payment-links";
import type { InvoiceReminderKind } from "@/lib/reminder-policy";

export function invoiceReminder(opts: {
  kind: InvoiceReminderKind | "invoice_manual"; name: string; number: string;
  amount: number; currency: string; dueDate: Date | null; paymentLink?: string | null; status: string;
}): MailTemplate {
  const wording = opts.kind === "invoice_before_due" ? ["due tomorrow", "Your invoice is due tomorrow."]
    : opts.kind === "invoice_due_today" ? ["due today", "Your invoice is due today."]
      : opts.kind === "invoice_overdue" ? ["one day overdue", "Your invoice is one day overdue."]
        : ["payment reminder", "A reminder about your invoice."];
  const name = clientGreetingName(opts.name);
  const payment = invoicePaymentLink(opts);
  const amount = invoiceMoney(opts.amount, opts.currency);
  const due = opts.dueDate ? invoiceDate(opts.dueDate) : "Not specified";
  const summary = opts.kind === "invoice_manual"
    ? "Our records currently show this invoice as unpaid. Please review its details below."
    : `This is a friendly reminder that invoice ${opts.number} is ${wording[0]}. Our records currently show it as unpaid.`;
  return {
    subject: `Invoice ${opts.number} — ${wording[0]}`,
    html: shell({
      preheader: `${amount}${opts.dueDate ? ` · Due ${due}` : ""}`,
      heading: wording[1],
      bodyHtml: [lead(`Hello ${esc(name)},`), p(esc(summary)), spec([["Invoice", opts.number], ["Amount", amount], ["Due date", due]]), p("If you have already paid or need help, please contact your Savo team so we can check the payment record. No additional fee is being applied by this reminder.", true)].join(""),
      cta: { href: payment || site("/portal/invoices"), label: payment ? "Pay invoice" : "View invoices" },
      closing: "Kind regards,",
      reason: "This is a transactional reminder about an invoice on your Savo client account.",
    }),
    text: `Hello ${name},\n\n${summary}\n\nInvoice: ${opts.number}\nAmount: ${amount}\nDue date: ${due}\n\n${payment ? `Pay invoice: ${payment}` : `View invoices: ${site("/portal/invoices")}`}\n\nIf you have already paid or need help, contact your Savo team so we can check the payment record. No additional fee is being applied by this reminder.\n\nThe Savo team`,
  };
}

export function meetingReminder(opts: {
  name: string; title: string; reference: string; status: string; date: string | null;
  time: string | null; durationMin: number; location: string; link: string;
}): MailTemplate {
  const name = clientGreetingName(opts.name);
  const confirmed = opts.status === "confirmed";
  const waiting = opts.status === "availability_received";
  const copy = confirmed ? "This is a reminder about your confirmed meeting with Savo."
    : waiting ? "We have received your preferred time. The meeting is awaiting confirmation; this reminder is not a booking confirmation."
      : "A friendly reminder to choose a suitable date and time for your meeting with Savo.";
  const rows: [string, string][] = [["Meeting", opts.title], ["Reference", opts.reference], ["Status", confirmed ? "Confirmed" : waiting ? "Awaiting confirmation" : "Awaiting your availability"], ["Duration", `${opts.durationMin} minutes`]];
  if (opts.date) rows.push([confirmed ? "Date" : "Preferred date", opts.date]);
  if (opts.time) rows.push(["Time (IST)", opts.time]);
  if (confirmed && opts.location) rows.push(["Location", opts.location]);
  return {
    subject: `Meeting reminder: ${opts.title}`,
    html: shell({ preheader: copy, heading: "A reminder about your meeting.", ref: opts.reference,
      bodyHtml: [lead(`Hello ${esc(name)},`), p(copy), spec(rows), p("If your plans have changed, contact Savo and quote the meeting reference. Keep your invitation link private.", true)].join(""),
      cta: { href: opts.link, label: confirmed || waiting ? "View meeting details" : "Choose a date & time" }, closing: "Kind regards,",
      reason: "A Savo team member sent this reminder about your existing meeting invitation.",
    }),
    text: `Hello ${name},\n\n${copy}\n\n${rows.map(([key, value]) => `${key}: ${value}`).join("\n")}\n\n${opts.link}\n\nIf your plans have changed, contact Savo and quote the reference. Keep your invitation link private.\n\nThe Savo team`,
  };
}
