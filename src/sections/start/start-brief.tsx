"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  BUDGET_RANGES,
  PROJECT_TYPES,
  enquirySchema,
  flattenFieldErrors,
  type EnquiryFieldErrors,
} from "@/schemas/enquiry";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * The brief — the detailed start-a-project wizard. Three steps (you, the
 * project, review) posting to the standard /api/enquiries pipeline with
 * the shared Zod schema, honeypot and analytics events.
 */

type Status = "idle" | "submitting" | "success" | "error";

const STEPS = ["You", "The project", "Review"] as const;

type Draft = {
  name: string;
  email: string;
  company: string;
  phone: string;
  projectType: string;
  budget: string;
  message: string;
  website: string; // honeypot
};

const EMPTY: Draft = {
  name: "",
  email: "",
  company: "",
  phone: "",
  projectType: "",
  budget: "",
  message: "",
  website: "",
};

export function StartBrief() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<EnquiryFieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const startedRef = useRef(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onFirstInput = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("enquiry_form_start", { form: "start-page" });
    }
  };

  function validateStep(current: number): boolean {
    const partial: Partial<Record<keyof Draft, unknown>> = {};
    if (current === 0) {
      partial.name = draft.name;
      partial.email = draft.email;
      partial.phone = draft.phone || undefined;
      const check = enquirySchema.pick({ name: true, email: true, phone: true }).safeParse({
        name: draft.name,
        email: draft.email,
        phone: draft.phone || undefined,
      });
      if (!check.success) {
        setErrors(flattenFieldErrors(check.error as never));
        return false;
      }
    }
    if (current === 1) {
      const check = enquirySchema.pick({ projectType: true, message: true }).safeParse({
        projectType: draft.projectType,
        message: draft.message,
      });
      if (!check.success) {
        setErrors(flattenFieldErrors(check.error as never));
        return false;
      }
    }
    setErrors({});
    return true;
  }

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    if (!validateStep(0) || !validateStep(1)) {
      setStep(0);
      return;
    }
    setServerMessage("");
    setStatus("submitting");
    track("enquiry_form_submit", { form: "start-page" });

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, source: "start-page" }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: EnquiryFieldErrors;
      };
      if (res.ok && json.ok) {
        setStatus("success");
        track("enquiry_form_success", { form: "start-page" });
        return;
      }
      if (res.status === 400 && json.fieldErrors) {
        setErrors(json.fieldErrors);
        setStatus("idle");
        setStep(0);
        return;
      }
      setServerMessage(json.error ?? "Something went wrong sending your brief. Please try again in a moment.");
      setStatus("error");
      track("enquiry_form_error", { status: res.status, form: "start-page" });
    } catch {
      setServerMessage("Network error — please check your connection and try again.");
      setStatus("error");
      track("enquiry_form_error", { status: "network", form: "start-page" });
    }
  }

  /* ---------------- success ---------------- */
  if (status === "success") {
    return (
      <div role="status" className="border border-border bg-surface p-10 sm:p-14">
        <span aria-hidden="true" className="mb-7 block h-3 w-3 bg-accent" />
        <p className="t-h2">Brief received.</p>
        <p className="t-body-lg mt-4 max-w-lg text-muted">
          A senior engineer — not a sales rep — reads it today and replies
          within one business day. If it is urgent, the phone line answers
          faster.
        </p>
        <div className="mt-9 border-t border-border pt-6">
          <p className="t-label text-muted">While you wait</p>
          <p className="t-sm mt-2 text-muted">
            Explore <Link href="/case-studies" className="link-underline text-foreground">how work gets filed</Link>, or
            browse <Link href="/services" className="link-underline text-foreground">the services</Link> your brief will land in.
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- wizard ---------------- */
  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      {/* Progress rail + step body */}
      <div className="lg:col-span-8">
        {/* Progress */}
        <ol className="mb-10 flex items-center gap-4" aria-label="Brief steps">
          {STEPS.map((label, i) => {
            const state = i < step ? "done" : i === step ? "current" : "todo";
            return (
              <li key={label} className="flex flex-1 items-center gap-3">
                <span
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "h-2 w-2 shrink-0 transition-colors duration-300",
                    state === "todo" ? "border border-border bg-transparent" : "bg-accent",
                  )}
                />
                <span
                  className={cn(
                    "t-label whitespace-nowrap transition-colors",
                    state === "current" ? "text-foreground" : "text-muted",
                  )}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 ? <span aria-hidden="true" className="h-px flex-1 bg-border" /> : null}
              </li>
            );
          })}
        </ol>

        {/* Step: You */}
        {step === 0 ? (
          <div className="workbench-panel space-y-8">
            <div>
              <p className="t-label text-accent">Step — you</p>
              <h3 className="t-h2 mt-3">Who is building with us?</h3>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field id="sb-name" label="Your name" required error={errors.name}>
                <input
                  id="sb-name" name="name" className="field" value={draft.name} autoComplete="name"
                  onChange={(e) => set("name", e.target.value)} onFocus={onFirstInput}
                  placeholder="Priya Sharma" aria-invalid={!!errors.name}
                />
              </Field>
              <Field id="sb-email" label="Work email" required error={errors.email}>
                <input
                  id="sb-email" name="email" type="email" className="field" value={draft.email} autoComplete="email"
                  onChange={(e) => set("email", e.target.value)} onFocus={onFirstInput}
                  placeholder="priya@company.com" aria-invalid={!!errors.email}
                />
              </Field>
              <Field id="sb-company" label="Company" error={errors.company}>
                <input
                  id="sb-company" name="company" className="field" value={draft.company} autoComplete="organization"
                  onChange={(e) => set("company", e.target.value)} onFocus={onFirstInput}
                  placeholder="Company or product name"
                />
              </Field>
              <Field id="sb-phone" label="Phone (optional)" error={errors.phone}>
                <input
                  id="sb-phone" name="phone" type="tel" className="field" value={draft.phone} autoComplete="tel"
                  onChange={(e) => set("phone", e.target.value)} onFocus={onFirstInput}
                  placeholder="+91 …" aria-invalid={!!errors.phone}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {/* Step: The project */}
        {step === 1 ? (
          <div className="workbench-panel space-y-9">
            <div>
              <p className="t-label text-accent">Step — the project</p>
              <h3 className="t-h2 mt-3">What are we building?</h3>
            </div>

            <ChipGroup
              label="Project type" required error={errors.projectType}
              options={PROJECT_TYPES as unknown as string[]}
              selected={draft.projectType}
              onSelect={(v) => { onFirstInput(); set("projectType", v); }}
            />

            <ChipGroup
              label="Estimated budget" optional
              options={BUDGET_RANGES as unknown as string[]}
              selected={draft.budget}
              onSelect={(v) => { onFirstInput(); set("budget", draft.budget === v ? "" : v); }}
            />

            <Field id="sb-message" label="The brief" required error={errors.message} hint="Goals, constraints, what success looks like — at least 20 characters.">
              <textarea
                id="sb-message" name="message" rows={6} className="field resize-y" value={draft.message}
                onChange={(e) => set("message", e.target.value)} onFocus={onFirstInput}
                placeholder="We are building… The main problem is… Success looks like…"
                aria-invalid={!!errors.message}
              />
            </Field>
          </div>
        ) : null}

        {/* Step: Review */}
        {step === 2 ? (
          <div className="workbench-panel">
            <div>
              <p className="t-label text-accent">Step — review</p>
              <h3 className="t-h2 mt-3">Read it back, then send.</h3>
            </div>
            <dl className="mt-9 border-t border-border">
              <ReviewRow label="Name" value={draft.name} onEdit={() => setStep(0)} />
              <ReviewRow label="Email" value={draft.email} onEdit={() => setStep(0)} />
              {draft.company ? <ReviewRow label="Company" value={draft.company} onEdit={() => setStep(0)} /> : null}
              {draft.phone ? <ReviewRow label="Phone" value={draft.phone} onEdit={() => setStep(0)} /> : null}
              <ReviewRow label="Project type" value={draft.projectType} onEdit={() => setStep(1)} />
              {draft.budget ? <ReviewRow label="Budget" value={draft.budget} onEdit={() => setStep(1)} /> : null}
              <ReviewRow label="Brief" value={draft.message} onEdit={() => setStep(1)} preline />
            </dl>

            {/* Honeypot */}
            <input
              type="text" name="website" value={draft.website} tabIndex={-1} autoComplete="off"
              onChange={(e) => set("website", e.target.value)}
              className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true"
            />

            {status === "error" ? (
              <p role="alert" className="t-sm mt-6 border border-error/40 bg-error/5 px-4 py-3 text-error">
                {serverMessage}
              </p>
            ) : null}

            <button
              type="submit" disabled={status === "submitting"}
              className="group/btn mt-9 inline-flex h-[3.25rem] items-center justify-center gap-2.5 rounded-[2px] bg-foreground px-8 text-base font-semibold text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent disabled:pointer-events-none disabled:opacity-50"
            >
              {status === "submitting" ? "Sending the brief…" : "Send the brief"}
              {status === "submitting" ? null : (
                <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                </svg>
              )}
            </button>
            <p className="t-caption mt-4 text-muted">
              Nothing binding. NDA available before you share anything sensitive.
            </p>
          </div>
        ) : null}

        {/* Step controls */}
        {step < 2 ? (
          <div className="mt-10 flex items-center gap-4">
            {step > 0 ? (
              <button
                type="button" onClick={() => setStep((s) => s - 1)}
                className="inline-flex h-11 items-center rounded-[2px] border border-border px-6 text-sm font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                Back
              </button>
            ) : null}
            <button
              type="button" onClick={next}
              className="group/btn inline-flex h-[3.25rem] items-center justify-center gap-2.5 rounded-[2px] bg-foreground px-8 text-base font-semibold text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
            >
              Continue
              <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button" onClick={() => setStep(1)}
            className="mt-6 t-sm font-semibold text-muted transition-colors hover:text-foreground"
          >
            ← Back to the project
          </button>
        )}
      </div>

      {/* Side rail — the promise */}
      <aside className="lg:col-span-4">
        <div className="border border-border bg-surface p-7 lg:sticky lg:top-28 sm:p-8">
          <p className="t-label text-muted">The promise</p>
          <ul className="mt-5 border-t border-border">
            {[
              ["Reply within one business day", "a senior engineer reads every brief"],
              ["Scoped by builders", "the person who replies can build it"],
              ["NDA on request", "before anything sensitive is shared"],
              ["Nothing binding", "the brief costs two minutes, that is all"],
            ].map(([t, d]) => (
              <li key={t} className="border-b border-border py-3.5">
                <div className="flex items-center gap-3.5">
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                  <span className="t-sm font-semibold text-foreground/90">{t}</span>
                </div>
                <p className="t-caption mt-1.5 pl-5 text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function Field({
  id, label, error, hint, optional, required, children,
}: {
  id: string; label: string; error?: string; hint?: string; optional?: boolean; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="t-label text-muted">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
        {optional ? <span className="ml-2 opacity-60">(optional)</span> : null}
      </label>
      <div className="mt-2.5">{children}</div>
      {hint && !error ? <p className="t-caption mt-2 text-muted">{hint}</p> : null}
      {error ? <p className="t-caption mt-2 text-error">{error}</p> : null}
    </div>
  );
}

function ChipGroup({
  label, options, selected, onSelect, error, optional, required,
}: {
  label: string; options: string[]; selected: string; onSelect: (v: string) => void; error?: string; optional?: boolean; required?: boolean;
}) {
  return (
    <fieldset>
      <legend className="t-label mb-3.5 text-muted">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
        {optional ? <span className="ml-2 opacity-60">(optional)</span> : null}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected === opt;
          return (
            <button
              key={opt} type="button" aria-pressed={active} onClick={() => onSelect(opt)}
              className={cn(
                "t-sm rounded-[2px] border px-4 py-2.5 font-medium transition-colors duration-300 ease-[var(--ease-out-expo)]",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {error ? <p className="t-caption mt-2.5 text-error">{error}</p> : null}
    </fieldset>
  );
}

function ReviewRow({ label, value, onEdit, preline }: { label: string; value: string; onEdit: () => void; preline?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border py-4">
      <div className="min-w-0">
        <dt className="t-label text-muted">{label}</dt>
        <dd className={cn("t-sm mt-1.5 font-medium text-foreground/90", preline && "whitespace-pre-line")}>{value}</dd>
      </div>
      <button type="button" onClick={onEdit} className="t-label shrink-0 text-accent transition-colors hover:text-accent-hover">
        Edit
      </button>
    </div>
  );
}
