"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  CAREERS_EMAIL,
  HIRING_STEPS,
  careerProjectType,
  CTC_OPTIONS,
  EXPERIENCE_OPTIONS,
  GENERAL_APPLICATION,
  NOTICE_OPTIONS,
  roleSlug,
  type PublicRole,
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
import { SuccessDialog, type SuccessStep } from "@/components/shared/success-dialog";
import { cn, withBasePath } from "@/lib/utils";
import { CareerSkillPicker } from "./skill-picker";
import { careerApplicationSchema, careerApplicationErrors, careerPhoneSchema, type CareerApplicationErrors } from "@/schemas/career-application";
import s from "./careers.module.css";
import { CityPicker } from "./city-picker";

type Status = "idle" | "submitting" | "success" | "error";
const subscribe = () => () => {};

/**
 * Careers application (version-1 fields, v6 idiom). Posts to the shared
 * /api/enquiries pipeline with source "careers" and the role as the
 * projectType - applications land in the same admin inbox as enquiries.
 * Details the inbox schema has no column for (city, skills, links…) are
 * composed into the message, exactly like version 1.
 */
/** Same possible stages as the careers page, without a response-time promise. */
const NEXT_STEPS: SuccessStep[] = HIRING_STEPS.slice(0, 3);

export function ApplicationForm({ initialRole, roles: ROLES }: { initialRole?: string; roles: PublicRole[] }) {
  const enhanced = useSyncExternalStore(subscribe, () => true, () => false);
  const roles: readonly string[] = [...ROLES.map((r) => r.title), GENERAL_APPLICATION];
  const [role, setRole] = useState<string>(
    initialRole && roles.includes(initialRole) ? initialRole : (ROLES[0]?.title ?? GENERAL_APPLICATION),
  );
  const [skills, setSkills] = useState<string[]>([]);

  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<EnquiryFieldErrors>({});
  const [phone, setPhone] = useState("");
  const [phoneOk, setPhoneOk] = useState(true);
  const [localErrors, setLocalErrors] = useState<CareerApplicationErrors>({});
  const [skillUpdate, setSkillUpdate] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [confirmation, setConfirmation] = useState<{ name: string; email: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const captcha = useCaptcha();
  const [captchaErr, setCaptchaErr] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const startedRef = useRef(false);

  function onStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    track("enquiry_form_start", { form: "careers" });
  }

  function updateSkills(next: string[]) {
    setSkills(next);
    if (next.length) {
      setLocalErrors(current => ({ ...current, skills: undefined }));
      setSkillUpdate("");
    }
  }

  function changeRole(next: string) {
    setRole(next);
    setSkills([]);
    setSkillUpdate(skills.length ? "Your skill selections were cleared for the new role. Choose the skills that fit this application." : "");
    setLocalErrors(current => ({ ...current, skills: undefined, role: undefined }));
    onStarted();
  }

  function focusField(name: string) {
    const field = formRef.current?.querySelector<HTMLElement>(name === "phone" ? "#cr-phone" : name === "skills" ? "#cr-skill-options button, #cr-other-skill" : `[name="${name}"]`);
    if (name === "phone" && field instanceof HTMLInputElement && field.disabled) { field.parentElement?.querySelector<HTMLButtonElement>('button[aria-haspopup="listbox"]')?.focus(); return; }
    const disclosure = field?.closest("details");
    if (disclosure) disclosure.open = true;
    field?.focus();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setServerMessage("");
    setCaptchaErr(null);
    if (!phoneOk && phone.trim()) {
      setErrors({ phone: "Check the mobile number - it does not match the selected country's format." });
      focusField("phone");
      return;
    }
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const mobile = careerPhoneSchema.safeParse(data.phone ?? "");
    if (!mobile.success) { setErrors({ phone: mobile.error.issues[0]?.message ?? "Enter your mobile number." }); focusField("phone"); return; }
    const extraDetails = { hometown: data.hometown?.trim() ?? "", currentCtc: data.currentCtc ?? "", currentCompany: data.company?.trim() ?? "", currentDesignation: data.currentDesignation?.trim() ?? "", workPreference: data.workPreference ?? "", linkedin: data.linkedin?.trim() ?? "", links: data.links?.trim() ?? "", resume: data.resume?.trim() ?? "" };

    // Same career-only requirements are enforced by the shared API.
    const qualification = careerApplicationSchema.safeParse({ form: "careers", role, city: data.city, skills, experience: data.experience, notice: data.notice, consent: data.consent === "on", ...extraDetails });
    const local: CareerApplicationErrors = qualification.success ? {} : careerApplicationErrors(qualification.error);
    if (!extraDetails.hometown) local.hometown = "Enter your hometown.";
    if (!data.consent) local.consent = "Please confirm we may process your application.";
    setLocalErrors(local);

    // Compose the message: note first, then a structured details block
    const details = [
      `Role: ${role}`,
      `City: ${data.city?.trim() ?? ""}`,
      `Hometown: ${extraDetails.hometown}`,
      extraDetails.currentCtc ? `Current annual CTC: ${extraDetails.currentCtc}` : "",
      extraDetails.currentCompany ? `Current employer: ${extraDetails.currentCompany}` : "",
      extraDetails.currentDesignation ? `Current designation: ${extraDetails.currentDesignation}` : "",
      extraDetails.workPreference ? `Work preference: ${extraDetails.workPreference}` : "",
      extraDetails.linkedin ? `LinkedIn: ${extraDetails.linkedin}` : "",
      data.experience ? `Experience: ${data.experience}` : "",
      data.notice ? `Start availability: ${data.notice}` : "",
      data.ctc ? `Expected CTC: ${data.ctc}` : "",
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
      projectType: careerProjectType(role),
      message,
      website: data.website ?? "",
    });
    if (!parsed.success) {
      setErrors(flattenFieldErrors(parsed.error));
      const firstKey = Object.keys(parsed.error.flatten().fieldErrors).find((k) => k !== "message");
      focusField(firstKey ?? "notes");
      return;
    }
    setErrors({});
    if (Object.keys(local).length) {
      focusField(Object.keys(local)[0]);
      return;
    }
    if (captchaBlocked(captcha)) {
      setCaptchaErr("Please complete the human verification.");
      return;
    }
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
            ...extraDetails,
            form: "careers",
            role,
            city: data.city?.trim() ?? "",
            experience: data.experience ?? "",
            notice: data.notice ?? "",
            expectedCtc: data.ctc ?? "",
            skills,
            links: data.links?.trim() ?? "",
            consent: data.consent === "on",
            resume: data.resume?.trim() ?? "",
          },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: EnquiryFieldErrors;
        careerFieldErrors?: CareerApplicationErrors;
      };
      if (res.ok && json.ok) {
        setStatus("success");
        setConfirmation({ name: data.name ?? "", email: data.email ?? "" });
        setDialogOpen(true);
        captcha.refresh();
        track("enquiry_form_success", { form: "careers", role });
        return;
      }
      if (res.status === 400 && json.careerFieldErrors) {
        setLocalErrors(json.careerFieldErrors);
        const firstField = Object.keys(json.careerFieldErrors).find(key => ["city", "hometown", "skills", "experience", "notice", "consent", "currentCtc", "currentCompany", "currentDesignation", "workPreference", "linkedin", "links", "resume"].includes(key));
        if (firstField) {
          setStatus("idle");
          focusField(firstField);
        } else {
          setServerMessage(json.error ?? "Please check your skills and availability, then try again.");
          setStatus("error");
          focusField("role");
        }
        return;
      }
      if (res.status === 400 && json.fieldErrors) {
        setErrors(json.fieldErrors);
        setStatus("idle");
        focusField(Object.keys(json.fieldErrors)[0] === "message" ? "notes" : (Object.keys(json.fieldErrors)[0] ?? "name"));
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

  function resetForAnother() {
    setStatus("idle");
    setConfirmation(null);
    setDialogOpen(false);
    setErrors({});
    setLocalErrors({});
    setServerMessage("");
    setSkills([]);
    setSkillUpdate("");
    setPhone("");
    startedRef.current = false;
  }

  if (status === "success" && confirmation) {
    const firstName = confirmation.name.trim().split(/\s+/)[0] || "there";
    return (
      <>
        <SuccessDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          eyebrow={`Application · ${role}`}
          title="Application received."
          email={confirmation.email}
          steps={NEXT_STEPS}
          contactEmail={CAREERS_EMAIL}
        >
          Thank you{firstName !== "there" ? `, ${firstName}` : ""}. Your application has
          been submitted to Savo. The next steps depend on the role and the fit.
        </SuccessDialog>

        {/* Durable confirmation - stays after the dialog closes */}
        <div className="py-4" role="status">
          <span aria-hidden="true" className="mb-6 block h-3 w-3 bg-accent" />
          <p className="t-h3 mb-3">Application received.</p>
          <p className="t-body text-muted">
            Thank you{firstName !== "there" ? ", " + firstName : ""}. Your application was submitted
            using <span className="text-foreground">{confirmation.email}</span>. For questions, write to{" "}
            <a href={`mailto:${CAREERS_EMAIL}`} className="link-underline text-foreground">
              {CAREERS_EMAIL}
            </a>
            .
          </p>
          <button
            type="button"
            onClick={resetForAnother}
            className="mt-7 inline-flex h-12 items-center justify-center rounded-[2px] border border-border px-6 text-sm font-semibold text-foreground transition-colors duration-300 ease-[var(--ease-out-expo)] hover:border-foreground/40 hover:bg-surface"
          >
            Submit another application
          </button>
        </div>
      </>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className={s.applicationForm}>
      <p>Fields marked * are required. Compensation and links are optional.</p>
      {/* Role */}
      <fieldset>
        <legend className="t-label mb-3 block text-muted">Role</legend>
        <label htmlFor="cr-role" className="sr-only">Role</label>
        <select id="cr-role" name="role" className={s.roleSelect} value={role} disabled={status === "submitting"} onChange={e => changeRole(e.target.value)}>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </fieldset>

      <h3 id="your-details">Your details</h3>
      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
        <Field label="Full name" name="name" errors={errors} onFocus={onStarted} autoComplete="name" placeholder="Your full name" />
        <Field
          label="Email"
          name="email"
          type="email"
          errors={errors}
          onFocus={onStarted}
          autoComplete="email"
          placeholder="you@email.com"
        />
        <div className={s.phoneEntry}><label htmlFor="cr-phone" className="t-label mb-1 block">Mobile number <span aria-hidden="true" className="text-accent">*</span></label><PhoneField id="cr-phone" required label="Mobile number" value={phone} onChange={value => { setPhone(value); if (value.trim()) setErrors(current => ({ ...current, phone: undefined })); }} error={errors.phone} onValidity={setPhoneOk} onFocus={onStarted} /></div>
        <CityPicker label="Current city" name="city" required error={localErrors.city} onStarted={onStarted} onValueChange={() => setLocalErrors(current => ({ ...current, city: undefined }))} />
        <CityPicker label="Hometown" name="hometown" required error={localErrors.hometown} onStarted={onStarted} onValueChange={() => setLocalErrors(current => ({ ...current, hometown: undefined }))} />
      </div>

      <section id="availability" className={s.qualifications} aria-labelledby="availability-heading">
        <h3 id="availability-heading">Skills & availability</h3>
        {skillUpdate && <p role="status">{skillUpdate}</p>}
        <CareerSkillPicker key={role} role={role} skills={skills} onChange={updateSkills} error={localErrors.skills} onStarted={onStarted} />
        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <SelectField label="Experience" name="experience" options={EXPERIENCE_OPTIONS} defaultValue="" placeholder="Choose your experience" required error={localErrors.experience} onFocus={onStarted} onChange={() => setLocalErrors(current => ({ ...current, experience: undefined }))} />
          <SelectField label="When can you start?" name="notice" options={NOTICE_OPTIONS} defaultValue="" placeholder="Choose your availability" required error={localErrors.notice} onFocus={onStarted} onChange={() => setLocalErrors(current => ({ ...current, notice: undefined }))} />
        </div>
        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <Field label="Current employer (optional)" name="company" errors={errors} onFocus={onStarted} autoComplete="organization" placeholder="Company name" required={false} />
          <Field label="Current designation (optional)" name="currentDesignation" error={localErrors.currentDesignation} onFocus={onStarted} autoComplete="organization-title" placeholder="Your current job title" required={false} />
          <div><SelectField label="Current annual CTC (optional)" name="currentCtc" options={[...CTC_OPTIONS, "Not applicable (Fresher)", "Prefer not to disclose"]} defaultValue="" error={localErrors.currentCtc} onFocus={onStarted} /><p className={s.payHelp}>Total annual pay in INR. Freshers can choose Not applicable; you may prefer not to disclose.</p></div>
          <div><SelectField label="Expected annual CTC (optional)" name="ctc" options={CTC_OPTIONS} defaultValue="" onFocus={onStarted} /><p className={s.payHelp}>Total annual pay in INR. L means lakh.</p></div>
          <SelectField label="Work preference (optional)" name="workPreference" options={["On-site", "Hybrid", "Remote", "Open to discussion"]} defaultValue="" error={localErrors.workPreference} onFocus={onStarted} />
        </div>
        <p className={s.payHelp}>Your work preference is not a promise of a particular working arrangement.</p>
      </section>
      <h3 id="your-work">Your work</h3>
      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
        <Field
          label="Portfolio / GitHub"
          name="links"
          type="url"
          error={localErrors.links}
          errors={errors}
          onFocus={onStarted}
          placeholder="Link to your work (optional)"
          required={false}
        />
        <div><Field
          label="Resume link"
          name="resume"
          type="url"
          error={localErrors.resume}
          errors={errors}
          onFocus={onStarted}
          placeholder="Public Drive / Dropbox link (optional)"
          required={false}
        /><p className={s.payHelp}>Use “Anyone with the link can view” access.</p></div>
        <Field label="LinkedIn profile (optional)" name="linkedin" type="url" error={localErrors.linkedin} onFocus={onStarted} placeholder="https://www.linkedin.com/in/your-profile" required={false} />
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
            aria-required="true"
            aria-describedby={localErrors.consent ? "cr-consent-error" : "cr-consent-text"}
            onChange={e => { if (e.currentTarget.checked) setLocalErrors(current => ({ ...current, consent: undefined })); }}
            onFocus={onStarted}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer"
          />
          <span className={cn("t-sm text-muted", localErrors.consent && "text-error")} id="cr-consent-text">
            I agree that Savo Technologies may process my application data for
            this hiring process.
          </span>
        </label>
        {localErrors.consent ? (
          <p id="cr-consent-error" role="alert" className="t-caption mt-1.5 text-error">
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
          disabled={status === "submitting" || !enhanced}
          className={`${s.submit} group/btn inline-flex items-center justify-center gap-2.5 font-semibold transition-colors disabled:pointer-events-none`}
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
          Sending this form submits your application to Savo Technologies.
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
            aria-required={required}
            maxLength={max}
          />
          <p className="t-caption tnum mt-1 text-right text-muted">
            {len} / {max}
          </p>
        </>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          aria-required={required}
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
  onChange,
  required = false,
  error,
  placeholder = "Select if relevant",
}: {
  label: string;
  name: string;
  options: readonly string[];
  defaultValue: string;
  onFocus: () => void;
  onChange?: () => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
}) {
  const id = `cr-${name}`;
  return (
    <div>
      <label htmlFor={id} className="t-label mb-1 block text-muted">
        {label}{required && <span aria-hidden="true" className="text-accent"> *</span>}
      </label>
      <div className="relative">
        <select id={id} name={name} className="field pr-8" defaultValue={defaultValue} required={required} aria-required={required} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} onFocus={onFocus} onChange={onChange}>
          <option value="">{placeholder}</option>
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
      {error && <p id={`${id}-error`} role="alert" className="t-caption mt-1.5 text-error">{error}</p>}
    </div>
  );
}
