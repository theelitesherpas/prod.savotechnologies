"use client";

import { useState, type FormEvent } from "react";
import { COUNTRY_PHONE_RULES, CALLBACK_COUNTRIES } from "@/lib/phone";
import { track } from "@/lib/analytics";
import { withBasePath } from "@/lib/utils";

/**
 * Footer call-back request: one attached control — country select (flag +
 * ISD) joined to the national number input on a shared baseline. Posts to
 * /api/callback, which validates against the same rules server-side and
 * stores it beside project enquiries.
 */

type Status = "idle" | "submitting" | "success" | "error";

export function CallbackForm() {
  const [countryName, setCountryName] = useState(CALLBACK_COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const countryNameSafe = COUNTRY_PHONE_RULES[countryName] ? countryName : CALLBACK_COUNTRIES[0];
  const rule = COUNTRY_PHONE_RULES[countryNameSafe];
  const digits = phone.replace(/\D/g, "").slice(0, rule.max);
  const valid = digits.length >= rule.min && digits.length <= rule.max;
  const digitsHint = rule.min === rule.max ? `${rule.min} digits` : `${rule.min}–${rule.max} digits`;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (status === "submitting") return;
    if (!valid) return;
    setStatus("submitting");
    track("enquiry_form_submit", { type: "callback" });

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(withBasePath("/api/callback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: (fd.get("cb-name") as string) || "",
          country: countryNameSafe,
          phone: `${rule.dial}${digits}`,
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
          A senior consultant will call {rule.flag} {rule.dial} {digits} within two business hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid min-w-0 gap-6">
      {/* Attached country + number control on one shared baseline */}
      <div className="min-w-0">
        <label htmlFor="cb-country" className="t-label mb-1.5 block text-muted">
          Country &amp; phone <span aria-hidden="true" className="text-accent">*</span>
        </label>
        <div
          className={`flex items-stretch border-b transition-colors duration-300 ${
            touched && !valid ? "border-error" : "border-border focus-within:border-accent hover:border-foreground/30"
          }`}
        >
          <div className="relative flex w-[13.5rem] max-w-[55vw] shrink-0 items-center">
            <select
              id="cb-country"
              aria-label="Country"
              className="w-full cursor-pointer appearance-none truncate bg-transparent py-2.5 pl-0 pr-7 text-[0.9375rem] font-semibold text-foreground"
              value={countryName}
              onChange={(e) => {
                setCountryName(e.target.value);
                setTouched(false);
              }}
            >
              {CALLBACK_COUNTRIES.map((name) => {
                const r = COUNTRY_PHONE_RULES[name];
                return (
                  <option key={name} value={name}>
                    {r.flag} {name} ({r.dial})
                  </option>
                );
              })}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              className="pointer-events-none absolute right-1.5 h-3 w-3 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
            <span aria-hidden="true" className="mx-3 h-5 w-px shrink-0 bg-border" />
          </div>
          <input
            id="cb-phone"
            name="cb-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            aria-label="Phone number"
            className="min-w-0 flex-1 bg-transparent py-2.5 pr-1 tnum text-[0.9375rem] text-foreground placeholder:text-muted/70 focus:outline-none"
            placeholder={`${rule.flag} ${rule.dial} · ${digitsHint}`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={touched && !valid}
            aria-describedby={touched && !valid ? "cb-phone-error" : undefined}
          />
        </div>
        {touched && !valid ? (
          <p id="cb-phone-error" className="t-caption mt-1.5 text-error">
            {countryNameSafe} numbers have {digitsHint} after {rule.dial}.
          </p>
        ) : null}
      </div>

      {/* Name + submit */}
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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
        <p role="alert" className="t-caption text-error">
          {error}
        </p>
      ) : null}
    </form>
  );
}
