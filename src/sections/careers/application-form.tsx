"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  CAREERS_EMAIL,
  CTC_OPTIONS,
  EXPERIENCE_OPTIONS,
  GENERAL_APPLICATION,
  NOTICE_OPTIONS,
  SKILLS,
  roleSlug,
  type Role,
} from "@/constants/careers";
import {
  enquirySchema,
  ENQUIRY_FIELD_LIMITS,
  DETAILS_FIELD_LIMIT,
  flattenFieldErrors,
  type EnquiryFieldErrors,
  type EnquiryInput,
} from "@/schemas/enquiry";
import { track } from "@/lib/analytics";
import { useCaptcha, CaptchaGate, captchaBlocked } from "@/components/shared/captcha";
import { PhoneField } from "@/components/shared/phone-field";
import { cn, withBasePath } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Careers application (version-1 fields, v6 idiom). Posts to the shared
 * /api/enquiries pipeline with source "careers" and the role as the
 * projectType - applications land in the same admin inbox as enquiries.
 * Details the inbox schema has no column for (city, skills, links…) are
 * composed into the message, exactly like version 1.
 */
export function ApplicationForm({ initialRole, roles: ROLES }: { initialRole?: string; roles: Role[] }) {
  const roles: readonly string[] = [...ROLES.map((r) => r.title), GENERAL_APPLICATION];
  const [role, setRole] = useState<string>(
    initialRole && roles.includes(initialRole) ? initialRole : (ROLES[0]?.title ?? GENERAL_APPLICATION),
  );
  const [skills, setSkills] = useState<string[]>([]);

  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<EnquiryFieldErrors>({});
  const [phone, setPhone] = useState("");
  const [phoneOk, setPhoneOk] = useState(true);
  const [localErrors, setLocalErrors] = useState<{ city?: string; consent?: string }>({});
  const [serverMessage, setServerMessage] = useState("");
  const captcha = useCaptcha();
  const [captchaErr, setCaptchaErr] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const startedRef = useRef(false);

  function onStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    track("enquiry_form_start", { form: "careers" });
  }

  function toggleSkill(s: string) {
    onStarted();
    setSkills((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setServerMessage("");
    setCaptchaErr(null);
    if (!phoneOk) {
      setErrors({ phone: "Check the phone number - it does not match the selected country's format." });
      return;
    }
    if (captchaBlocked(captcha)) {
      setCaptchaErr("Please complete the human verification.");
      return;
    }

    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;

    // Local checks the shared schema doesn't know about
    const local: { city?: string; consent?: string } = {};
    if (!data.city?.trim()) local.city = "Your current city helps with logistics.";
    if (!data.consent) local.consent = "Please confirm we may process your application.";
    setLocalErrors(local);

    // Compose the message: note first, then a structured details block
    const details = [
      `City: ${data.city?.trim() ?? ""}`,
      `Experience: ${data.experience}`,
      `Notice: ${data.notice}`,
      `Expected CTC: ${data.ctc}`,
      skills.length ? `Skills: ${skills.join(", ")}` : "",
      data.links?.trim() ? `Portfolio / GitHub: ${data.links.trim()}` : "",
      data.resume?.trim() ? `Resume: ${data.resume.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const message = `${(data.notes ?? "").trim()}\n\nApplication details:\n${details}`;

    const parsed = enquirySchema.safeParse({
      name: data.name,
      email: data.email,
      phone: data.phone ?? "",
      company: data.company ?? "",
      projectType: role,
      message,
      website: data.website ?? "",
    });
    if (!parsed.success) {
      setErrors(flattenFieldErrors(parsed.error));
      const firstKey = Object.keys(parsed.error.flatten().fieldErrors).find((k) => k !== "message");
      formRef.current?.querySelector<HTMLElement>(firstKey ? `[name="${firstKey}"]` : "[name=notes]")?.focus();
      return;
    }
    if (Object.keys(local).length) {
      formRef.current?.querySelector<HTMLElement>("[name=city]")?.focus();
      return;
    }
    setErrors({});
    setStatus("submitting");
    track("enquiry_form_submit", { form: "careers", role });

    try {
      const res = await fetch(withBasePath("/api/enquiries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          captchaToken: captcha.token,
          source: `careers:${roleSlug(role)}`,
          // Structured payload - rendered as its own panel in the admin inbox.
          details: {
            form: "careers",
            role,
            city: data.city?.trim() ?? "",
            experience: data.experience ?? "",
            notice: data.notice ?? "",
            expectedCtc: data.ctc ?? "",
            skills,
            links: data.links?.trim() ?? "",
            resume: data.resume?.trim() ?? "",
          },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: EnquiryFieldErrors;
      };
      if (res.ok && json.ok) {
        setStatus("success");
        captcha.refresh();
        track("enquiry_form_success", { form: "careers", role });
        return;
      }
      if (res.status === 400 && json.fieldErrors) {
        setErrors(json.fieldErrors);
        setStatus("idle");
        return;
      }
      setServerMessage(
        json.error ?? "Something went wrong sending your application. Please try again in a moment.",
      );
      setStatus("error");
      track("enquiry_form_error", { form: "careers", status: res.status });
    } catch {
      setServerMessage("Network error, please check your connection and try again.");
      setStatus("error");
      track("enquiry_form_error", { form: "careers", status: "network" });
    }
  }

  if (status === "success") {
    return (
      <div className="py-4" role="status">
        <span aria-hidden="true" className="mb-6 block h-3 w-3 bg-accent" />
        <p className="t-h3 mb-3">Application received.</p>
        <p className="t-body text-muted">
          An engineer reads every application and replies personally within two
          business days. If it is urgent, write to{" "}
          <a href={`mailto:${CAREERS_EMAIL}`} className="link-underline text-foreground">
            {CAREERS_EMAIL}
          </a>{" "}
          directly.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-7">
      {/* Role */}
      <fieldset>
        <legend className="t-label mb-3 block text-muted">Role</legend>
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={role === r}
              onClick={() => {
                setRole(r);
                onStarted();
              }}
              className={cn(
                "t-sm rounded-[2px] border px-4 py-2.5 font-semibold transition-colors duration-300 ease-[var(--ease-out-expo)]",
                role === r
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
        <Field label="Full name" name="name" errors={errors} onFocus={onStarted} autoComplete="name" placeholder="Aarav Sharma" />
        <Field
          label="Email"
          name="email"
          type="email"
          errors={errors}
          onFocus={onStarted}
          autoComplete="email"
          placeholder="you@email.com"
        />
        <PhoneField value={phone} onChange={setPhone} error={errors.phone} onValidity={setPhoneOk} onFocus={onStarted} />
        <Field
          label="Current city"
          name="city"
          error={localErrors.city}
          onFocus={onStarted}
          autoComplete="address-level2"
          placeholder="Indore"
        />
        <div className="sm:col-span-2">
          <Field
            label="Current employer"
            name="company"
            errors={errors}
            onFocus={onStarted}
            autoComplete="organization"
            placeholder="Where you work today (optional)"
            required={false}
          />
        </div>
      </div>

      {/* Skills */}
      <fieldset>
        <legend className="t-label mb-3 block text-muted">Key skills</legend>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={skills.includes(s)}
              onClick={() => toggleSkill(s)}
              className={cn(
                "t-caption rounded-[2px] border px-3 py-1.5 font-semibold transition-colors duration-300 ease-[var(--ease-out-expo)]",
                skills.includes(s)
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Context selects */}
      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-3">
        <SelectField label="Experience" name="experience" options={EXPERIENCE_OPTIONS} defaultValue="1 to 3 years" onFocus={onStarted} />
        <SelectField label="Notice period" name="notice" options={NOTICE_OPTIONS} defaultValue="30 days" onFocus={onStarted} />
        <SelectField label="Expected CTC" name="ctc" options={CTC_OPTIONS} defaultValue="Open to discussion" onFocus={onStarted} />
      </div>

      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
        <Field
          label="Portfolio / GitHub"
          name="links"
          type="url"
          errors={errors}
          onFocus={onStarted}
          placeholder="github.com/you (optional)"
          required={false}
        />
        <Field
          label="Resume link"
          name="resume"
          type="url"
          errors={errors}
          onFocus={onStarted}
          placeholder="Drive / Dropbox link (optional)"
          required={false}
        />
      </div>

      <Field
        label="A few words about you"
        name="notes"
        errors={errors}
        onFocus={onStarted}
        placeholder="What would you want to build here?"
        textarea
        required={false}
      />

      {/* Consent */}
      <div>
        <label htmlFor="cr-consent" className="flex cursor-pointer items-start gap-3">
          <input
            id="cr-consent"
            name="consent"
            type="checkbox"
            aria-invalid={!!localErrors.consent}
            onFocus={onStarted}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer appearance-none border border-border bg-transparent transition-colors checked:border-accent checked:bg-accent"
          />
          <span className={cn("t-sm text-muted", localErrors.consent && "text-error")}>
            I agree that Savo Technologies may process my application data for
            this hiring process.
          </span>
        </label>
        {localErrors.consent ? (
          <p role="alert" className="t-caption mt-1.5 text-error">
            {localErrors.consent}
          </p>
        ) : null}
      </div>

      {/* Honeypot, invisible to humans, irresistible to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" maxLength={500} />
        </label>
      </div>

      {status === "error" && serverMessage ? (
        <p role="alert" className="t-sm text-error">
          {serverMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <CaptchaGate captcha={captcha} error={captchaErr} />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="group/btn inline-flex h-[3.25rem] items-center justify-center gap-2.5 rounded-[2px] bg-foreground px-7 text-base font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent disabled:pointer-events-none disabled:opacity-50"
        >
          {status === "submitting" ? "Sending…" : "Submit application"}
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
          Read by an engineer, personal reply within two business days. Your
          data never leaves Savo Technologies.
        </p>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Fields                                                              */
/* ------------------------------------------------------------------ */

type FieldProps = {
  label: string;
  name: string;
  errors?: EnquiryFieldErrors;
  /** Overrides errors[name] - for form-local checks like city. */
  error?: string;
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
  errors = {},
  error,
  onFocus,
  placeholder,
  type = "text",
  autoComplete,
  textarea,
  required = true,
}: FieldProps) {
  const [len, setLen] = useState(0);
  const id = `cr-${name}`;
  const errorId = `${id}-error`;
  const err = error ?? errors[name as keyof EnquiryInput];
  const max =
    ENQUIRY_FIELD_LIMITS[name as keyof typeof ENQUIRY_FIELD_LIMITS] ?? DETAILS_FIELD_LIMIT;
  const inputMode =
    type === "tel" ? "tel" : type === "url" ? "url" : type === "email" ? "email" : undefined;
  return (
    <div>
      <label htmlFor={id} className="t-label mb-1 block text-muted">
        {label}
        {required ? <span aria-hidden="true" className="text-accent"> *</span> : null}
      </label>
      {textarea ? (
        <>
          <textarea
            id={id}
            name={name}
            className="field"
            placeholder={placeholder}
            aria-invalid={!!err}
            aria-describedby={err ? errorId : undefined}
            onFocus={onFocus}
            onInput={(e) => setLen(e.currentTarget.value.length)}
            rows={4}
            maxLength={max}
          />
          <p className="t-caption tnum mt-1 text-right text-muted/70">
            {len} / {max}
          </p>
        </>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          className="field"
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!err}
          aria-describedby={err ? errorId : undefined}
          onFocus={onFocus}
          maxLength={max}
        />
      )}
      {err ? (
        <p id={errorId} className="t-caption mt-1.5 text-error">
          {err}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
  onFocus,
}: {
  label: string;
  name: string;
  options: readonly string[];
  defaultValue: string;
  onFocus: () => void;
}) {
  const id = `cr-${name}`;
  return (
    <div>
      <label htmlFor={id} className="t-label mb-1 block text-muted">
        {label}
      </label>
      <div className="relative">
        <select id={id} name={name} className="field pr-8" defaultValue={defaultValue} onFocus={onFocus}>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
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
  );
}
