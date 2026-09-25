"use client";

import { useState } from "react";
import { COUNTRY_PHONE_RULES } from "@/lib/phone";
import { cn } from "@/lib/utils";

/**
 * PhoneField — country-first phone entry, one field.
 *
 * A single control: country selector (flag + dial code) fused to the
 * number input, in the site's baseline-underline field style. The
 * number input stays disabled until a country is chosen; digits are
 * filtered to numbers and hard-capped at the country's maximum, with
 * the allowed digit count shown as the helper. The composed value
 * (`+<dial><digits>`) is submitted through a hidden input of the given
 * name, so existing FormData/zod flows keep working unchanged.
 */

export function PhoneField({
  name = "phone",
  label = "Phone",
  id,
  value,
  onChange,
  error,
  hint,
  onFocus,
  onValidity,
  autoComplete = "tel",
}: {
  name?: string;
  label?: string;
  id?: string;
  /** Full value incl. dial code, e.g. "+919876543210" — controlled. */
  value: string;
  onChange: (full: string) => void;
  error?: string | null;
  hint?: string;
  onFocus?: () => void;
  /** Reports whether the current value satisfies the country rules. */
  onValidity?: (ok: boolean) => void;
  autoComplete?: string;
}) {
  const inputId = id ?? name;

  // Derive country + digits from the current value (dial prefix match).
  const entries = Object.entries(COUNTRY_PHONE_RULES).sort((a, b) =>
    b[1].dial.length - a[1].dial.length || a[0].localeCompare(b[0]),
  );
  let country = "";
  let digits = "";
  for (const [c, rule] of entries) {
    if (value.startsWith(rule.dial)) {
      country = c;
      digits = value.slice(rule.dial.length).replace(/\D/g, "");
      break;
    }
  }
  if (!country) digits = value.replace(/\D/g, "").replace(/^0+/, ""); // fallback: bare digits typed

  const rule = country ? COUNTRY_PHONE_RULES[country] : null;
  const [touched, setTouched] = useState(false);

  const setCountry = (c: string) => {
    if (!c) {
      onChange("");
      return;
    }
    const r = COUNTRY_PHONE_RULES[c];
    const keep = digits.slice(0, r.max);
    onChange(`${r.dial}${keep}`);
  };

  const setDigits = (raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, rule?.max ?? 15);
    onChange(rule ? `${rule.dial}${clean}` : clean);
  };

  const valid = !rule || digits.length === 0 ? true : digits.length >= rule.min && digits.length <= rule.max;
  reportValidity(onValidity, valid);
  const localError =
    touched && rule && digits.length > 0 && digits.length < rule.min
      ? `${country} numbers are ${rule.min}${rule.min === rule.max ? "" : `–${rule.max}`} digits.`
      : null;
  const shown = error ?? localError;

  return (
    <div>
      <input type="hidden" name={name} value={country && digits ? `${rule?.dial}${digits}` : ""} />
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="flex items-end gap-0 border-b border-foreground/20 focus-within:border-foreground/40 transition-colors">
        {/* Country + dial — part of the same visual field */}
        <div className="relative flex items-center">
          <select
            aria-label="Country code"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={cn(
              "h-full appearance-none cursor-pointer bg-transparent py-2.5 pl-0 pr-6 text-[0.9375rem] font-semibold text-foreground outline-none",
              !country && "text-muted",
            )}
            style={{ backgroundImage: "none" }}
          >
            <option value="">Code</option>
            {Object.keys(COUNTRY_PHONE_RULES)
              .sort()
              .map((c) => (
                <option key={c} value={c}>
                  {COUNTRY_PHONE_RULES[c].flag} {COUNTRY_PHONE_RULES[c].dial}
                </option>
              ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 10 6"
            className="pointer-events-none absolute right-1 h-[5px] w-[9px] text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M1 1l4 4 4-4" />
          </svg>
        </div>
        <span aria-hidden="true" className="pb-3 text-foreground/30 select-none">
          |
        </span>
        {/* Number — gated until a country is selected */}
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          disabled={!country}
          value={digits}
          onFocus={onFocus}
          onBlur={() => setTouched(true)}
          onChange={(e) => setDigits(e.target.value)}
          placeholder={country && rule ? (rule.min === rule.max ? `${rule.min} digits` : `${rule.min}–${rule.max} digits`) : "Select country first"}
          aria-invalid={shown ? "true" : undefined}
          className="field !border-0 flex-1 rounded-none disabled:cursor-not-allowed disabled:placeholder:text-muted/70"
        />
      </div>
      {shown ? (
        <p role="alert" className="t-caption mt-1.5 text-error">
          {shown}
        </p>
      ) : hint ? (
        <p className="t-caption mt-1.5 text-muted">{hint}</p>
      ) : (
        <p className="t-caption mt-1.5 text-muted">
          {country && rule ? (rule.min === rule.max ? `${rule.min} digits` : `${rule.min}–${rule.max} digits`) : "Select your country, then enter the number."}
        </p>
      )}
    </div>
  );
}

/** Effect-free bridge: notify the parent after render (not during). */
function reportValidity(cb: ((ok: boolean) => void) | undefined, ok: boolean) {
  if (cb) queueMicrotask(() => cb(ok));
}
