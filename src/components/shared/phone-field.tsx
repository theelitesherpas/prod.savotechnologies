"use client";

import { useEffect, useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  /* Focus the search as soon as the menu opens. */
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  /* Close the country menu on outside click / Escape. */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const chooseCountry = (c: string) => {
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
        <div ref={menuRef} className="relative flex items-center">
        {/* Closed: flag + dial only. Open: full country list with names. */}
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={country || "Select country code"}
          onClick={() => {
            setQuery("");
            setOpen((v) => !v);
          }}
          className={cn(
            "flex h-full cursor-pointer items-center gap-1.5 bg-transparent py-2.5 pr-2 text-[0.9375rem] font-semibold outline-none",
            country ? "text-foreground" : "text-muted",
          )}
        >
          {country && rule ? (
            <>
              <span aria-hidden="true" className="text-base leading-none">{rule.flag}</span>
              <span className="tnum">{rule.dial}</span>
            </>
          ) : (
            <span>Code</span>
          )}
          <svg aria-hidden="true" viewBox="0 0 10 6" className={cn("h-[5px] w-[9px] text-muted transition-transform duration-300", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M1 1l4 4 4-4" />
          </svg>
        </button>
        {open ? (
          <div className="absolute left-0 top-full z-30 mt-1 w-72 border border-border bg-background shadow-[0_16px_40px_rgb(10_10_14/0.18)]">
            {/* Search — find a country by name or dial code */}
            <div className="sticky top-0 border-b border-border bg-background p-2">
              <input
                ref={searchRef}
                type="text"
                role="searchbox"
                aria-label="Search countries"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or code…"
                className="field !rounded-none !border-0 bg-surface-2/60 px-2 py-1.5 text-[0.8438rem]"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <ul
              role="listbox"
              aria-label="Country"
              className="max-h-60 overflow-y-auto py-1"
            >
              {(() => {
                const q = query.trim().toLowerCase();
                const all = Object.keys(COUNTRY_PHONE_RULES).sort();
                const list = q
                  ? all.filter((c) => {
                      const r = COUNTRY_PHONE_RULES[c];
                      return (
                        c.toLowerCase().includes(q) ||
                        r.dial.replace("+", "").startsWith(q.replace("+", "").replace(/\D/g, "")) ||
                        r.dial.includes(q)
                      );
                    })
                  : all;
                if (list.length === 0) {
                  return (
                    <li className="px-3.5 py-3 text-[0.8125rem] text-muted" role="presentation">
                      No country matches “{query.trim()}”.
                    </li>
                  );
                }
                return list.map((c) => {
                  const r = COUNTRY_PHONE_RULES[c];
                  return (
                    <li key={c} role="option" aria-selected={c === country}>
                      <button
                        type="button"
                        onClick={() => {
                          chooseCountry(c);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[0.875rem] transition-colors",
                          c === country
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
                });
              })()}
            </ul>
          </div>
        ) : null}
      </div>
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
          className="field !border-0 flex-1 rounded-none pl-2 disabled:cursor-not-allowed disabled:placeholder:text-muted/70"
        />
      </div>
      {shown ? (
        <p role="alert" className="t-caption mt-1.5 text-error">
          {shown}
        </p>
      ) : hint ? (
        <p className="t-caption mt-1.5 text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Effect-free bridge: notify the parent after render (not during). */
function reportValidity(cb: ((ok: boolean) => void) | undefined, ok: boolean) {
  if (cb) queueMicrotask(() => cb(ok));
}
