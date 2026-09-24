"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  BUDGET_RANGES,
  CONTACT_TOPICS,
  enquirySchema,
  flattenFieldErrors,
  type EnquiryFieldErrors,
  type EnquiryInput,
} from "@/schemas/enquiry";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Contact page form (version-1 content: topic chips, minimal fields,
 * honeypot). Posts to the shared /api/enquiries pipeline with
 * source "contact", so submissions land in the same admin inbox.
 */
export function ContactForm() {
  const [topic, setTopic] = useState<(typeof CONTACT_TOPICS)[number]>("New project");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<EnquiryFieldErrors>({});
  const [serverMessage, setServerMessage] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const startedRef = useRef(false);

  function onStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    track("enquiry_form_start", { form: "contact" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setServerMessage("");

    const raw = Object.fromEntries(new FormData(e.currentTarget).entries());
    const parsed = enquirySchema.safeParse({ ...raw, projectType: topic });
    if (!parsed.success) {
      setErrors(flattenFieldErrors(parsed.error));
      const firstKey = Object.keys(parsed.error.flatten().fieldErrors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }
    setErrors({});
    setStatus("submitting");
    track("enquiry_form_submit", { form: "contact", topic });

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, source: "contact" }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: EnquiryFieldErrors;
      };
      if (res.ok && json.ok) {
        setStatus("success");
        track("enquiry_form_success", { form: "contact" });
        return;
      }
      if (res.status === 400 && json.fieldErrors) {
        setErrors(json.fieldErrors);
        setStatus("idle");
        return;
      }
      setServerMessage(
        json.error ?? "Something went wrong sending your message. Please try again in a moment.",
      );
      setStatus("error");
      track("enquiry_form_error", { form: "contact", status: res.status });
    } catch {
      setServerMessage("Network error — please check your connection and try again.");
      setStatus("error");
      track("enquiry_form_error", { form: "contact", status: "network" });
    }
  }

  if (status === "success") {
    return (
      <div className="py-4" role="status">
        <span aria-hidden="true" className="mb-6 block h-3 w-3 bg-accent" />
        <p className="t-h3 mb-3">Message received.</p>
        <p className="t-body text-muted">
          A senior consultant replies within one business day. If it is urgent,
          WhatsApp or the phone line beside this form reaches a human faster.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-7">
      {/* Topic chips */}
      <fieldset>
        <legend className="t-label mb-3 block text-muted">What is this about?</legend>
        <div className="flex flex-wrap gap-2">
          {CONTACT_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={topic === t}
              onClick={() => setTopic(t)}
              className={cn(
                "t-sm rounded-[2px] border px-4 py-2.5 font-semibold transition-colors duration-300 ease-[var(--ease-out-expo)]",
                topic === t
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
        <Field
          label="Your name"
          name="name"
          errors={errors}
          onFocus={onStarted}
          autoComplete="name"
          placeholder="Aarav Sharma"
        />
        <Field
          label="Email"
          name="email"
          type="email"
          errors={errors}
          onFocus={onStarted}
          autoComplete="email"
          placeholder="you@company.com"
        />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          errors={errors}
          onFocus={onStarted}
          autoComplete="tel"
          placeholder="+91 00000 00000"
          required={false}
        />
        <Field
          label="Company"
          name="company"
          errors={errors}
          onFocus={onStarted}
          autoComplete="organization"
          placeholder="Company Pvt. Ltd. (optional)"
          required={false}
        />
      </div>

      {/* Budget is only relevant for new-project conversations */}
      {topic === "New project" ? (
        <div>
          <label htmlFor="ct-budget" className="t-label mb-1 block text-muted">
            Estimated budget
          </label>
          <div className="relative">
            <select id="ct-budget" name="budget" className="field pr-8" defaultValue="" onFocus={onStarted}>
              <option value="">Select a range (optional)</option>
              {BUDGET_RANGES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M2 4l4 4 4-4" />
            </svg>
          </div>
        </div>
      ) : null}

      <Field
        label="Your message"
        name="message"
        errors={errors}
        onFocus={onStarted}
        placeholder="What are you thinking about? A sentence or two is plenty to start."
        textarea
      />

      {/* Honeypot — invisible to humans, irresistible to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {status === "error" && serverMessage ? (
        <p role="alert" className="t-sm text-error">
          {serverMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="group/btn inline-flex h-[3.25rem] items-center justify-center gap-2.5 rounded-[2px] bg-foreground px-7 text-base font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent disabled:pointer-events-none disabled:opacity-50"
        >
          {status === "submitting" ? "Sending…" : "Send message"}
          <svg
            aria-hidden="true"
            viewBox="0 0 14 14"
            className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
          </svg>
        </button>
        <p className="t-caption max-w-xs text-muted">
          One business day reply, NDA on request, and your details never leave
          Savo Technologies.
        </p>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Field                                                               */
/* ------------------------------------------------------------------ */

type FieldProps = {
  label: string;
  name: keyof EnquiryInput;
  errors: EnquiryFieldErrors;
  onFocus: () => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  textarea?: boolean;
  required?: boolean;
};

function Field({
  label,
  name,
  errors,
  onFocus,
  placeholder,
  type = "text",
  autoComplete,
  textarea,
  required = true,
}: FieldProps) {
  const id = `ct-${name}`;
  const errorId = `${id}-error`;
  const error = errors[name];
  return (
    <div>
      <label htmlFor={id} className="t-label mb-1 block text-muted">
        {label}
        {required ? <span aria-hidden="true" className="text-accent"> *</span> : null}
      </label>
      {textarea ? (
        <textarea
          id={id}
          name={name}
          className="field"
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onFocus={onFocus}
          rows={5}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          className="field"
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onFocus={onFocus}
        />
      )}
      {error ? (
        <p id={errorId} className="t-caption mt-1.5 text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
