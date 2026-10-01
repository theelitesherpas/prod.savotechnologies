"use client";

/**
 * Client-facing meeting scheduler — premium Savo design.
 * Client info first → meeting details → date → time → confirm.
 * Country-aware phone input, optional email, past dates blocked.
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { PublicMeetingData } from "@/lib/meeting/service";
import { COUNTRY_PHONE_RULES, validatePhone } from "@/lib/phone";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const TYPE_LABELS: Record<string, string> = {
  in_person: "In-Person Meeting", video: "Video Meeting", phone: "Phone Call",
  office_visit: "Office Visit", client_office: "Client Office", custom: "Meeting",
};
const LOC_LABELS: Record<string, string> = {
  savo_office: "Savo Technologies Office", client_office: "Client Office",
  google_meet: "Google Meet", zoom: "Zoom", teams: "Microsoft Teams",
  phone: "Phone", custom: "Custom Location",
};

function fmtDate(d: string): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  return `${DAYS[new Date(y, m-1, day).getDay()]}, ${day} ${MONTHS[m-1]} ${y}`;
}
function fmtTime(t: string): string {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
/**
 * Get the current date and time in IST (Asia/Kolkata), regardless of the
 * visitor's local timezone. Meeting slots are defined in IST, so all
 * past-date and past-time comparisons must use IST time.
 */
function getISTNow(): { date: string; hours: number; minutes: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
    const year = get("year");
    const month = get("month");
    const day = get("day");
    const hour = get("hour") === "24" ? "0" : get("hour");
    return {
      date: `${year}-${month}-${day}`,
      hours: Number(hour),
      minutes: Number(get("minute")),
    };
  } catch {
    // Fallback if Intl timezone support is unavailable
    const now = new Date();
    const utc = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return {
      date: `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`,
      hours: utc.getUTCHours(),
      minutes: utc.getUTCMinutes(),
    };
  }
}

/**
 * Generate available 30-min slots for a date, hiding past slots.
 * Both the date and the slot times are in IST — a visitor in any
 * timezone sees the same correct availability.
 */
function genSlots(from: string, to: string, date: string): string[] {
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const ist = getISTNow();
  const isTodayInIST = date === ist.date;
  const nowISTMin = ist.hours * 60 + ist.minutes;
  const out: string[] = [];
  for (let t = fh * 60 + fm; t < th * 60 + tm; t += 30) {
    // Hide slots that have already passed (IST), plus a 30-min buffer
    if (isTodayInIST && t <= nowISTMin + 30) continue;
    // Hide all slots if the date is already past in IST
    if (date < ist.date) continue;
    out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return out;
}

function Icon({ name, className }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.7-3.6 3.6-5.5 7.5-5.5s6.8 1.9 7.5 5.5" /></>,
    building: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 21v-4h6v4M9 7h.01M15 7h.01M9 11h.01M15 11h.01" /></>,
    phone: <><path d="M6.8 3.8 9 3.2c.7-.2 1.4.2 1.7.9l1 2.4c.2.6.1 1.3-.4 1.7l-1.3 1.2a12.6 12.6 0 0 0 4.6 4.6l1.2-1.3c.4-.5 1.1-.6 1.7-.4l2.4 1c.7.3 1.1 1 .9 1.7l-.6 2.2c-.2.7-.8 1.2-1.5 1.2C11.6 18.4 5.6 12.4 5.6 5.3c0-.7.5-1.3 1.2-1.5Z" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    video: <><rect x="2" y="6" width="14" height="12" rx="2" /><path d="m16 12 6-4v8l-6-4" /></>,
    cal: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    note: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] ?? paths.user}
    </svg>
  );
}

/* ─────────────────── main ─────────────────── */

export function MeetingScheduler({ data, token }: { data: PublicMeetingData; token: string }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [country, setCountry] = useState("India");
  const [phone, setPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // IST-based "today" — meeting times are in IST, so date filtering
  // must use the IST calendar date, not the visitor's local date.
  const istNow = getISTNow();
  const today = istNow.date;
  const isSuggested = selectedDate && !data.availableDates.includes(selectedDate);
  const needsEmail = !data.clientEmail;
  const needsAddress = ["client_office","savo_office","in_person","office_visit","custom"].includes(data.locationType) && !data.locationAddress;
  const needsPhone = !data.clientPhone;
  const locationDisplay = data.meetingUrl ?? (data.locationAddress ? data.locationAddress : LOC_LABELS[data.locationType] ?? data.locationType);
  const phoneRule = COUNTRY_PHONE_RULES[country];
  const phoneCheck = phone.trim() ? validatePhone(country, phone) : null;
  const canSubmit = selectedDate && selectedTime && !submitting;

  const slots = useMemo(
    () => selectedDate ? genSlots(data.availableFrom, data.availableTo, selectedDate) : [],
    [data.availableFrom, data.availableTo, selectedDate]
  );

  const submit = async () => {
    if (!canSubmit) return;
    if (needsPhone && !phoneCheck?.ok) { setError("Please enter a valid phone number."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/meeting/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token, preferredDate: selectedDate, preferredTime: selectedTime,
          ...(phoneCheck?.ok ? { clientPhone: phoneCheck.normalized } : {}),
          ...(clientEmail.trim() ? { clientEmail: clientEmail.trim() } : {}),
          ...(clientAddress.trim() ? { clientAddress: clientAddress.trim() } : {}),
          ...(notes.trim() ? { clientNotes: notes.trim() } : {}),
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (json.ok) setSubmitted(true);
      else setError(json.error ?? "Something went wrong. Please try again.");
    } catch { setError("Network error. Please try again."); }
    setSubmitting(false);
  };

  /* ── Success ── */
  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:py-20">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-2/30">
          <div className="bg-emerald-500/[0.06] px-8 py-10 text-center sm:px-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h1 className="t-h3">Thank you, {data.clientName.split(" ")[0]}.</h1>
            <p className="t-body mt-2 text-muted">Your availability has been received.</p>
          </div>
          <div className="bg-background p-6 sm:p-8">
            <DetailRow icon="cal" k="Date" v={fmtDate(selectedDate)} />
            <DetailRow icon="clock" k="Time" v={`${fmtTime(selectedTime)} IST`} />
            <DetailRow icon="clock" k="Duration" v={`${data.durationMin} minutes`} />
            <DetailRow icon="video" k="Meeting Type" v={TYPE_LABELS[data.meetingType] ?? data.meetingType} />
            <DetailRow icon="pin" k="Location" v={locationDisplay} />
            {data.clientCompany ? <DetailRow icon="building" k="Company" v={data.clientCompany} /> : null}
            <DetailRow icon="note" k="Reference" v={data.reference} />
            {(data.clientEmail || clientEmail) ? (
              <p className="mt-5 border-t border-border pt-4 text-center text-[0.8125rem] text-muted">
                A confirmation has been sent to <strong>{data.clientEmail || clientEmail}</strong>.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  /* ── Already responded ── */
  if (data.preferredDate && data.status !== "reschedule_requested") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:py-20">
        <div className="rounded-2xl border border-border bg-surface-2/40 p-8 text-center sm:p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
            <Icon name="clock" className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="t-h3">Your availability has been submitted.</h1>
          <p className="t-body mt-2 text-muted">Our team will confirm your meeting shortly.</p>
          <div className="mt-6 rounded-xl border border-border bg-background p-5 text-left">
            <DetailRow icon="cal" k="Date" v={fmtDate(data.confirmedDate ?? data.preferredDate ?? "")} />
            <DetailRow icon="clock" k="Time" v={`${fmtTime(data.confirmedTime ?? data.preferredTime ?? "")} IST`} />
            <div className="mt-3 flex items-center justify-center">
              <span className={cn("rounded-full px-3 py-1 text-[0.75rem] font-semibold", data.confirmedDate ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>
                {data.confirmedDate ? "✓ Confirmed" : "Awaiting confirmation"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Scheduler form ── */
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-accent/[0.06]">
          <Icon name="cal" className="h-8 w-8 text-accent" />
        </div>
        <h1 className="t-h2">Schedule Your Meeting</h1>
        <p className="t-body-lg mt-2 text-muted">Please select a date and time that works best for you.</p>
      </div>

      {/* ═══ 1 · Your Information ═══ */}
      <section className="mb-5 overflow-hidden rounded-2xl border border-border bg-surface-2/30">
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="flex items-center gap-2.5 text-[0.9375rem] font-bold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <Icon name="user" className="h-4 w-4 text-accent" />
            </span>
            Your Information
          </h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow icon="user" k="Name" v={data.clientName} />
            {data.clientCompany ? <DetailRow icon="building" k="Company" v={data.clientCompany} /> : null}
            {data.clientPhone ? <DetailRow icon="phone" k="Phone" v={data.clientPhone} /> : null}
            {data.clientEmail ? <DetailRow icon="mail" k="Email" v={data.clientEmail} /> : null}
          </div>
        </div>
      </section>

      {/* ═══ 2 · Meeting Details ═══ */}
      <section className="mb-5 overflow-hidden rounded-2xl border border-border bg-surface-2/30">
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="flex items-center gap-2.5 text-[0.9375rem] font-bold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <Icon name="note" className="h-4 w-4 text-accent" />
            </span>
            Meeting Details
          </h2>
        </div>
        <div className="px-6 py-5">
          <h3 className="mb-4 text-[1.0625rem] font-bold text-foreground">{data.title}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow icon="video" k="Meeting Type" v={TYPE_LABELS[data.meetingType] ?? data.meetingType} />
            <DetailRow icon="clock" k="Duration" v={`${data.durationMin} minutes`} />
            <div className="sm:col-span-2"><DetailRow icon="pin" k="Location" v={locationDisplay} /></div>
            {data.agenda ? <div className="sm:col-span-2"><DetailRow icon="note" k="Agenda" v={data.agenda} /></div> : null}
          </div>
        </div>
      </section>

      {/* ═══ 3 · Date picker ═══ */}
      <section className="mb-5 rounded-2xl border-2 border-border bg-background p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-[0.9375rem] font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[0.8125rem] font-bold text-white">3</span>
          Select a Date <span className="text-accent">*</span>
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {data.availableDates.filter((d) => d >= today).map((d) => {
            const dt = new Date(d + "T00:00:00");
            return (
              <button
                key={d}
                onClick={() => { setSelectedDate(d); setSelectedTime(""); }}
                className={cn(
                  "min-w-[5.5rem] rounded-xl border-2 px-3 py-3 text-center transition-all duration-200 ease-[var(--ease-out-expo)]",
                  selectedDate === d
                    ? "border-accent bg-accent/[0.08] text-accent shadow-sm"
                    : "border-border bg-surface-2/30 text-foreground hover:border-accent/40 hover:bg-accent/[0.03]",
                )}
              >
                <span className="block text-[0.6875rem] font-medium text-muted">{DAYS[dt.getDay()]}</span>
                <span className="block text-[1.375rem] font-bold leading-tight">{dt.getDate()}</span>
                <span className="block text-[0.6875rem] text-muted">{MONTHS[dt.getMonth()].slice(0, 3)}</span>
              </button>
            );
          })}
          {data.allowSuggest ? (
            <div className="flex flex-col gap-1.5 rounded-xl border-2 border-dashed border-border px-4 py-3">
              <label htmlFor="suggest-date" className="cursor-pointer text-[0.8125rem] font-semibold text-muted">
                Suggest a different date
              </label>
              <input
                id="suggest-date"
                type="date"
                min={today}
                value={isSuggested ? selectedDate : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  if (v < today) {
                    e.target.value = "";
                    setError("Please pick today or a future date (IST).");
                    setTimeout(() => setError(null), 3000);
                    return;
                  }
                  setSelectedDate(v);
                  setSelectedTime("");
                  setError(null);
                }}
                className="rounded-lg border border-border bg-surface-2/30 px-3 py-2 text-[0.875rem] text-foreground outline-none focus:border-accent"
              />
              <p className="text-[0.6875rem] text-muted">Pick any future date, we will confirm it with you.</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* ═══ 4 · Time picker ═══ */}
      {selectedDate ? (
        <section className="mb-5 rounded-2xl border-2 border-border bg-background p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-[0.9375rem] font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[0.8125rem] font-bold text-white">4</span>
            Select a Time <span className="text-accent">*</span>
            <span className="ml-1 text-[0.75rem] font-normal text-muted">IST</span>
          </h2>
          {slots.length === 0 ? (
            <p className="py-4 text-center text-[0.875rem] text-muted">No available times left for this date. Please pick another date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {slots.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={cn(
                    "rounded-xl border-2 py-3.5 text-[0.9375rem] font-semibold transition-all duration-200",
                    selectedTime === t
                      ? "border-accent bg-accent text-white shadow-sm"
                      : "border-border text-foreground hover:border-accent/50 hover:text-accent",
                  )}
                >
                  {fmtTime(t)}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <p className="mb-5 rounded-xl border border-dashed border-border bg-surface-2/20 py-4 text-center text-[0.875rem] text-muted">
          Select a date above to see available times.
        </p>
      )}

      {/* ═══ 5 · Contact details (only what's missing) ═══ */}
      {selectedTime && (needsEmail || needsAddress || needsPhone || isSuggested) ? (
        <section className="mb-5 rounded-2xl border-2 border-border bg-background p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-[0.9375rem] font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[0.8125rem] font-bold text-white">5</span>
            Contact Details
          </h2>
          <div className="grid gap-4">
            {/* Phone — only if admin didn't provide one */}
            {needsPhone ? (
              <div>
                <label className="mb-1.5 block text-[0.8125rem] font-semibold text-muted">
                  Phone Number <span className="text-accent">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={country}
                    onChange={(e) => { setCountry(e.target.value); setPhone(""); }}
                    className="w-40 shrink-0 rounded-xl border-2 border-border bg-surface-2/30 px-3 py-3 text-[0.875rem] outline-none focus:border-accent"
                  >
                    {Object.entries(COUNTRY_PHONE_RULES).slice(0, 20).map(([name, rule]) => (
                      <option key={name} value={name}>
                        {rule.flag} {rule.dial} {name.length > 14 ? name.slice(0, 13) + "…" : name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const rule = COUNTRY_PHONE_RULES[country];
                      let v = e.target.value.replace(/[^\d+ ]/g, "");
                      const digits = v.replace(/\D/g, "");
                      if (rule && digits.length > rule.max) v = digits.slice(0, rule.max);
                      setPhone(v);
                    }}
                    maxLength={phoneRule ? phoneRule.max + phoneRule.dial.length + 1 : 18}
                    placeholder={phoneRule ? `${phoneRule.min}–${phoneRule.max} digits` : "Phone number"}
                    aria-label="Phone number"
                    aria-invalid={!!phone.trim() && phoneCheck?.ok !== true}
                    className="min-w-0 flex-1 rounded-xl border-2 border-border bg-surface-2/30 px-4 py-3 text-[0.9375rem] outline-none transition-colors focus:border-accent aria-[invalid=true]:border-red-400"
                  />
                </div>
                {phone.trim() && phoneCheck && !phoneCheck.ok ? (
                  <p className="mt-1 text-[0.75rem] text-red-500">{phoneCheck.error}</p>
                ) : null}
              </div>
            ) : null}

            {/* Email — optional */}
            {needsEmail ? (
              <div>
                <label className="mb-1.5 block text-[0.8125rem] font-semibold text-muted">
                  Email Address <span className="text-[0.6875rem] font-normal text-muted">(optional)</span>
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="name@company.com (optional)"
                  className="w-full rounded-xl border-2 border-border bg-surface-2/30 px-4 py-3 text-[0.9375rem] outline-none transition-colors focus:border-accent"
                />
                <p className="mt-1 text-[0.6875rem] text-muted">We&apos;ll send your meeting confirmation to this address.</p>
              </div>
            ) : null}

            {/* Address */}
            {needsAddress ? (
              <div>
                <label className="mb-1.5 block text-[0.8125rem] font-semibold text-muted">
                  Meeting Address {data.locationType === "client_office" ? <span className="text-accent">*</span> : null}
                </label>
                <input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Full address for the meeting"
                  className="w-full rounded-xl border-2 border-border bg-surface-2/30 px-4 py-3 text-[0.9375rem] outline-none transition-colors focus:border-accent"
                />
              </div>
            ) : null}

            {isSuggested ? (
              <p className="rounded-xl bg-accent/[0.04] px-4 py-3 text-[0.8125rem] text-muted">
                You selected <strong className="text-foreground">{fmtDate(selectedDate)}</strong> (your suggestion). Our team will confirm this date with you.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Notes */}
      {selectedTime ? (
        <section className="mb-5 rounded-2xl border border-border bg-surface-2/30 p-5 sm:p-6">
          <label className="mb-1.5 block text-[0.8125rem] font-semibold text-muted">Notes / message <span className="text-[0.6875rem] font-normal text-muted">(optional)</span></label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything you'd like us to know…"
            className="w-full resize-none rounded-xl border-2 border-border bg-background px-4 py-3 text-[0.9375rem] outline-none transition-colors focus:border-accent" />
        </section>
      ) : null}

      {/* Error */}
      {error ? (
        <div className="mb-4 rounded-xl border-2 border-red-500/30 bg-red-500/[0.04] px-5 py-3.5 text-[0.9375rem] text-red-600">{error}</div>
      ) : null}

      {/* Submit */}
      {canSubmit ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full rounded-2xl border border-accent bg-accent text-[1.0625rem] font-bold text-white shadow-lg transition-all duration-300 ease-[var(--ease-out-expo)] hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
          style={{ paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
        >
          Confirm My Availability
        </button>
      ) : null}

      {/* Confirmation modal */}
      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            <div className="border-b border-border bg-surface-2/40 px-6 py-4">
              <h3 className="text-[1.0625rem] font-bold">Confirm your meeting</h3>
            </div>
            <div className="p-6">
              <DetailRow icon="user" k="Meeting with" v="Savo Technologies" />
              <DetailRow icon="cal" k="Date" v={fmtDate(selectedDate)} />
              <DetailRow icon="clock" k="Time" v={`${fmtTime(selectedTime)} IST`} />
              <DetailRow icon="clock" k="Duration" v={`${data.durationMin} minutes`} />
              <DetailRow icon="pin" k="Location" v={locationDisplay} />
              <div className="mt-6 flex gap-2.5">
                <button onClick={() => setShowConfirm(false)} className="flex-1 rounded-xl border-2 border-border py-3.5 text-[0.9375rem] font-semibold text-muted transition-colors hover:text-foreground">Back</button>
                <button onClick={() => void submit()} disabled={submitting} className="flex-1 rounded-xl border border-accent bg-accent py-3.5 text-[0.9375rem] font-bold text-white transition-all hover:brightness-110 disabled:opacity-50">
                  {submitting ? "Submitting…" : "Confirm Availability"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({ icon, k, v }: { icon: string; k: string; v: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/40 py-2.5 last:border-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2/60">
        <Icon name={icon} className="h-4 w-4 text-muted" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">{k}</p>
        <p className="mt-0.5 text-[0.9375rem] font-medium text-foreground">{v}</p>
      </div>
    </div>
  );
}
