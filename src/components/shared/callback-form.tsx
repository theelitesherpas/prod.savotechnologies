"use client";

import { useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";

/**
 * Footer call-back request (ported from version 1): country + phone.
 * Posts to /api/callback, which stores it beside project enquiries.
 */

type Country = {
  name: string;
  dial: string;
  min: number;
  max: number;
};

const COUNTRIES: Country[] = [
  { name: "India", dial: "+91", min: 10, max: 10 },
  { name: "United States", dial: "+1", min: 10, max: 10 },
  { name: "United Kingdom", dial: "+44", min: 10, max: 10 },
  { name: "United Arab Emirates", dial: "+971", min: 9, max: 9 },
  { name: "Saudi Arabia", dial: "+966", min: 9, max: 9 },
  { name: "Qatar", dial: "+974", min: 8, max: 8 },
  { name: "Kuwait", dial: "+965", min: 8, max: 8 },
  { name: "Oman", dial: "+968", min: 8, max: 8 },
  { name: "Bahrain", dial: "+973", min: 8, max: 8 },
  { name: "Australia", dial: "+61", min: 9, max: 9 },
  { name: "Canada", dial: "+1", min: 10, max: 10 },
  { name: "Germany", dial: "+49", min: 10, max: 11 },
  { name: "Netherlands", dial: "+31", min: 9, max: 9 },
  { name: "France", dial: "+33", min: 9, max: 9 },
  { name: "Singapore", dial: "+65", min: 8, max: 8 },
  { name: "New Zealand", dial: "+64", min: 9, max: 10 },
  { name: "South Africa", dial: "+27", min: 9, max: 9 },
  { name: "Ireland", dial: "+353", min: 9, max: 9 },
  { name: "Other", dial: "+", min: 7, max: 12 },
];

type Status = "idle" | "submitting" | "success" | "error";

export function CallbackForm() {
  const [countryName, setCountryName] = useState(COUNTRIES[0].name);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const country = COUNTRIES.find((c) => c.name === countryName) ?? COUNTRIES[0];
  const digits = phone.replace(/\D/g, "").slice(0, country.max);
  const valid = digits.length >= country.min && digits.length <= country.max;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (status === "submitting") return;
    if (!valid) return;
    setStatus("submitting");
    track("enquiry_form_submit", { type: "callback" });

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: (fd.get("cb-name") as string) || "",
          country: country.name,
          phone: `${country.dial}${digits}`,
          website: (fd.get("cb-website") as string) || "",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setStatus("success");
        track("enquiry_form_success", { type: "callback" });
      } else {
        setError(json.error ?? "Could not send your request. Please try again.");
        setStatus("error");
      }
    } catch {
      setError("Network error — please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="flex h-full flex-col justify-center border border-border bg-surface p-6">
        <span aria-hidden="true" className="mb-4 block h-2.5 w-2.5 bg-accent" />
        <p className="t-h4">Request received.</p>
        <p className="t-sm mt-2 text-muted">
          A senior consultant will call {country.dial} {digits} within two business hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="cb-country" className="t-label mb-1 block text-muted">
          Country
        </label>
        <div className="relative">
          <select
            id="cb-country"
            className="field pr-8"
            value={countryName}
            onChange={(e) => setCountryName(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.dial})
              </option>
            ))}
          </select>
          <svg aria-hidden="true" viewBox="0 0 12 12" className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4l4 4 4-4" />
          </svg>
        </div>
      </div>

      <div>
        <label htmlFor="cb-phone" className="t-label mb-1 block text-muted">
          Phone <span aria-hidden="true" className="text-accent">*</span>
        </label>
        <input
          id="cb-phone"
          name="cb-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          className="field tnum"
          placeholder={`${country.dial} · ${country.min === country.max ? country.min : `${country.min}–${country.max}`} digits`}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={touched && !valid}
          aria-describedby={touched && !valid ? "cb-phone-error" : undefined}
        />
        {touched && !valid ? (
          <p id="cb-phone-error" className="t-caption mt-1.5 text-error">
            {country.name}: {country.min === country.max ? `${country.min} digits` : `${country.min} to ${country.max} digits`}.
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="cb-name" className="t-label mb-1 block text-muted">
          Your name
        </label>
        <input
          id="cb-name"
          name="cb-name"
          type="text"
          autoComplete="name"
          className="field"
          placeholder="Optional"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="cb-website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="group/btn inline-flex h-11 w-full items-center justify-center gap-2 rounded-[2px] bg-foreground px-5 text-[0.9375rem] font-semibold text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
        >
          {status === "submitting" ? "Sending…" : "Request a call back"}
          <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
          </svg>
        </button>
      </div>

      {status === "error" ? (
        <p role="alert" className="t-caption text-error sm:col-span-2">
          {error}
        </p>
      ) : null}
    </form>
  );
}
