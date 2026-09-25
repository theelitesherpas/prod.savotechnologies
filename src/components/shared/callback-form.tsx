"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { COUNTRY_PHONE_RULES, CALLBACK_COUNTRIES } from "@/lib/phone";
import { track } from "@/lib/analytics";
import { useCaptcha, CaptchaGate, captchaBlocked } from "@/components/shared/captcha";
import { withBasePath } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Footer call-back request: ONE attached control — a compact country
 * dropdown (flag + ISD) joined to the national-number input on the same
 * row. The input stays disabled until a country is chosen, then accepts
 * only digits, hard-capped at the country's maximum length (the same
 * rules validate server-side in /api/callback).
 */

type Status = "idle" | "submitting" | "success" | "error";

export function CallbackForm() {
  const [countryName, setCountryName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const captcha = useCaptcha();
  const [captchaErr, setCaptchaErr] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const rule = countryName ? COUNTRY_PHONE_RULES[countryName] : null;
  // Digits only, hard-capped at the selected country's maximum.
  const digits = rule ? phone.replace(/\D/g, "").slice(0, rule.max) : "";
  const valid = !!rule && digits.length >= rule.min;
  const digitsHint = rule ? (rule.min === rule.max ? `${rule.min} digits` : `${rule.min}–${rule.max} digits`) : "";

  /* Close the country menu on outside click / Escape. */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function chooseCountry(c: string) {
    setCountryName(c);
    setOpen(false);
    setPhone("");
    setTouched(false);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (status === "submitting") return;
    if (!rule || !valid) return;
    setStatus("submitting");
    setCaptchaErr(null);
    if (captchaBlocked(captcha)) {
      setCaptchaErr("Please complete the human verification.");
      return;
    }
    track("enquiry_form_submit", { type: "callback" });

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(withBasePath("/api/callback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: (fd.get("cb-name") as string) || "",
          country: countryName,
          phone: `${rule.dial}${digits}`,
          website: (fd.get("cb-website") as string) || "",
          captchaToken: captcha.token,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        captcha.refresh();
        setStatus("success");
        track("enquiry_form_success", { type: "callback" });
      } else {
        setError(json.error ?? "Could not send your request. Please try again.");
        setStatus("error");
      }
    } catch {
      setError("Network error, please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="flex h-full flex-col justify-center border border-border bg-surface p-6">
        <span aria-hidden="true" className="mb-4 block h-2.5 w-2.5 bg-accent" />
        <p className="t-h4">Request received.</p>
        <p className="t-sm mt-2 text-muted">
          A senior consultant will call {rule?.flag} {rule?.dial} {digits} within two business hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid min-w-0 gap-6">
      {/* ONE row: compact country dropdown ┃ number input */}
      <div className="min-w-0">
        <label htmlFor="cb-phone" className="t-label mb-1.5 block text-muted">
          Country &amp; phone <span aria-hidden="true" className="text-accent">*</span>
        </label>
        <div
          className={cn(
            "flex items-stretch border-b transition-colors duration-300",
            touched && !valid
              ? "border-error"
              : "border-border focus-within:border-accent hover:border-foreground/30",
          )}
        >
          {/* Country — compact flag + dial, full list opens upward */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={countryName ?? "Select country"}
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "flex h-full cursor-pointer items-center gap-2 py-2.5 pl-0 pr-2 text-[0.9375rem] font-semibold transition-colors",
                countryName ? "text-foreground" : "text-muted",
              )}
            >
              {rule ? (
                <>
                  <span aria-hidden="true" className="text-base leading-none">{rule.flag}</span>
                  <span className="tnum">{rule.dial}</span>
                </>
              ) : (
                <span>Country</span>
              )}
              <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                className={cn("h-3 w-3 text-muted transition-transform duration-300", open && "rotate-180")}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 8l4-4 4 4" />
              </svg>
            </button>
            {open ? (
              <ul
                role="listbox"
                aria-label="Country"
                className="absolute bottom-full left-0 z-30 mb-2 max-h-72 w-64 overflow-y-auto border border-border bg-background py-1 shadow-[0_16px_40px_rgb(10_10_14/0.18)]"
              >
                {CALLBACK_COUNTRIES.map((c) => {
                  const r = COUNTRY_PHONE_RULES[c];
                  return (
                    <li key={c} role="option" aria-selected={c === countryName}>
                      <button
                        type="button"
                        onClick={() => chooseCountry(c)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[0.875rem] transition-colors",
                          c === countryName
                            ? "bg-surface-2 font-semibold text-foreground"
                            : "text-foreground/80 hover:bg-surface-2/70",
                        )}
                      >
                        <span aria-hidden="true" className="text-base leading-none">{r.flag}</span>
                        <span className="flex-1 truncate">{c}</span>
                        <span className="tnum text-muted">{r.dial}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <span aria-hidden="true" className="mx-3 h-5 w-px bg-border" />
          </div>

          {/* Number — enabled only once a country is chosen; digits capped */}
          <input
            id="cb-phone"
            name="cb-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            aria-label="Phone number"
            disabled={!rule}
            maxLength={rule ? rule.max + 2 : 0}
            className={cn(
              "min-w-0 flex-1 bg-transparent py-2.5 pr-1 tnum text-[0.9375rem] text-foreground placeholder:text-muted/70 focus:outline-none",
              !rule && "cursor-not-allowed",
            )}
            placeholder={rule ? `${digitsHint} after ${rule.dial}` : "Select your country first"}
            value={digits}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={touched && !valid}
            aria-describedby={touched && !valid ? "cb-phone-error" : undefined}
          />
        </div>
        {touched && !valid ? (
          <p id="cb-phone-error" className="t-caption mt-1.5 text-error">
            {rule
              ? `${countryName} numbers have ${digitsHint} after ${rule.dial}.`
              : "Please select your country first."}
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
            inputMode="text"
            autoComplete="name"
            maxLength={80}
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

        <CaptchaGate captcha={captcha} error={captchaErr} />
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
