"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore, type FormEvent, type Ref } from "react";
import { BUDGET_RANGES, PROJECT_TYPES, ENQUIRY_FIELD_LIMITS, enquirySchema, type EnquiryFieldErrors } from "@/schemas/enquiry";
import { track } from "@/lib/analytics";
import { useCaptcha, CaptchaGate, captchaBlocked } from "@/components/shared/captcha";
import { PhoneField } from "@/components/shared/phone-field";
import { SITE } from "@/constants/site";
import { withBasePath } from "@/lib/utils";
import { START_STEPS, emptyStartDraft, optionalStartPhone, startDraftInput, startErrorStep, validateStartDraft, validateStartStep, type StartDraft } from "./start-content";
import { StartArrow, StartCheck } from "./start-art";
import styles from "./start.module.css";

const subscribe = () => () => {};
type Status = "idle" | "submitting" | "success" | "error";
const FIELD_ORDER = ["name", "email", "company", "phone", "projectType", "budget", "message"] as const;

/** Detailed brief only: shared schema/CAPTCHA/phone, existing endpoint and source. No persistent storage of personal drafts. */
export function StartBrief({ initialType }: { initialType?: string }) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<StartDraft>(() => emptyStartDraft(initialType));
  const [errors, setErrors] = useState<EnquiryFieldErrors>({});
  const [phoneOk, setPhoneOk] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [captchaErr, setCaptchaErr] = useState<string | null>(null);
  const captcha = useCaptcha();
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const captchaRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const submittingRef = useRef(false);
  const sending = status === "submitting";

  function onFirstInput() { if (!startedRef.current) { startedRef.current = true; track("enquiry_form_start", { form: "start-page" }); } }
  function set<K extends keyof StartDraft>(key: K, value: StartDraft[K]) {
    setDraft(previous => ({ ...previous, [key]: value }));
    setErrors(previous => { const next = { ...previous }; delete next[key]; return next; });
    onFirstInput();
  }
  function focusField(field: keyof StartDraft) {
    requestAnimationFrame(() => {
      const form = formRef.current;
      if (field === "phone") {
        const number = form?.querySelector<HTMLInputElement>("#sb-phone");
        if (number && !number.disabled) number.focus();
        else form?.querySelector<HTMLElement>('[aria-haspopup="listbox"]')?.focus();
      } else if (field === "projectType" || field === "budget") (form?.querySelector<HTMLInputElement>(`input[name="${field}"]:checked`) ?? form?.querySelector<HTMLInputElement>(`input[name="${field}"]`))?.focus();
      else form?.querySelector<HTMLElement>(`#sb-${field}`)?.focus();
    });
  }
  function moveTo(next: number, field?: keyof StartDraft) {
    if (submittingRef.current) return;
    setStep(next); setCaptchaErr(null); setServerMessage(""); setStatus("idle");
    if (field) focusField(field); else requestAnimationFrame(() => headingRef.current?.focus());
  }
  function showErrors(fields: EnquiryFieldErrors) {
    setErrors(fields); setStep(startErrorStep(fields));
    const first = FIELD_ORDER.find(field => fields[field]);
    if (first) focusField(first);
  }
  function next() {
    const fields = validateStartStep(draft, step, phoneOk);
    if (Object.keys(fields).length) { showErrors(fields); return; }
    setErrors({}); moveTo(Math.min(step + 1, 2));
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || submittingRef.current) return;
    // Enter advances the current step; it never bypasses review.
    if (step < 2) { next(); return; }
    const fields = validateStartDraft(draft, phoneOk);
    if (Object.keys(fields).length) { showErrors(fields); return; }
    const parsed = enquirySchema.safeParse(startDraftInput(draft));
    if (!parsed.success) return;
    setErrors({}); setServerMessage(""); setCaptchaErr(null);
    if (captchaBlocked(captcha)) { setCaptchaErr("Please complete the human verification."); requestAnimationFrame(() => captchaRef.current?.focus()); return; }
    submittingRef.current = true; setStatus("submitting");
    track("enquiry_form_submit", { form: "start-page" });
    try {
      const response = await fetch(withBasePath("/api/enquiries"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, captchaToken: captcha.token, source: "start-page" }),
      });
      const json = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; fieldErrors?: EnquiryFieldErrors };
      if (response.ok && json.ok === true) {
        setDraft(previous => ({ ...previous, ...parsed.data })); setStatus("success"); captcha.refresh();
        track("enquiry_form_success", { form: "start-page" });
        requestAnimationFrame(() => noticeRef.current?.focus()); return;
      }
      captcha.reset();
      track("enquiry_form_error", { status: response.status, form: "start-page" });
      if (response.status === 400 && json.fieldErrors && FIELD_ORDER.some(field => json.fieldErrors?.[field])) { setStatus("idle"); showErrors(json.fieldErrors); return; }
      setServerMessage(typeof json.error === "string" ? json.error : "Your brief could not be sent. Please try again, or email us instead.");
      setStatus("error"); requestAnimationFrame(() => noticeRef.current?.focus());
    } catch {
      captcha.reset(); setServerMessage("We couldn’t connect. Your brief is still here - check your connection and try again, or email us instead.");
      setStatus("error"); track("enquiry_form_error", { status: "network", form: "start-page" });
      requestAnimationFrame(() => noticeRef.current?.focus());
    } finally { submittingRef.current = false; }
  }

  if (status === "success") return <StartConfirmation email={draft.email} noticeRef={noticeRef} onRestart={() => { setDraft(emptyStartDraft(initialType)); setErrors({}); setPhoneOk(true); setCaptchaErr(null); setServerMessage(""); startedRef.current = false; setStep(0); setStatus("idle"); focusField("name"); }} />;

  return <form ref={formRef} noValidate onSubmit={handleSubmit} aria-labelledby="brief-heading" aria-busy={sending} className={styles.form} data-start-step={step} onKeyDown={event => {
    if (event.target instanceof HTMLElement && event.target.closest(`.${styles.phoneWrap}`)) {
      if (event.key === "Enter" && event.target.getAttribute("role") === "searchbox") event.preventDefault();
      if (event.key === "Escape") requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-haspopup="listbox"]')?.focus());
    }
  }}>
    <ol className={styles.progress} aria-label="Brief steps">{START_STEPS.map((label, index) => <li key={label} aria-current={index === step ? "step" : undefined} data-state={index < step ? "done" : index === step ? "current" : "todo"}><button type="button" disabled={!ready || index > step || sending} onClick={() => moveTo(index)}><span aria-hidden="true">{index < step ? <StartCheck /> : index + 1}</span>{label}</button></li>)}</ol>
    <div className={styles.stepHead}>
      <h3 ref={headingRef} tabIndex={-1}>{["Your details.", "What are we building?", "Make sure it feels right."][step]}</h3>
      <p>{["Let’s start with you. Tell us who to follow up with about your idea.", "Share the idea in your own words. It’s okay if some details are still taking shape.", "Here’s your brief, all together. Take a moment to check it, or edit anything you’d like."][step]}</p>
    </div>
    <p className={styles.stepMeta}><span role="status">Step {step + 1} of 3</span><span>{step < 2 ? "* Required fields" : "Nothing sent yet"}</span></p>
    <fieldset className={styles.stepBody} disabled={!ready || sending}>
      <legend className="sr-only">{START_STEPS[step]}</legend>
      {step === 0 && <div className={styles.fields}>
        <Field name="name" label="Your name" draft={draft} errors={errors} set={set} onFocus={onFirstInput} autoComplete="name" placeholder="Your name" />
        <Field name="email" label="Email address" draft={draft} errors={errors} set={set} onFocus={onFirstInput} autoComplete="email" type="email" placeholder="you@example.com" />
        <Field name="company" label="Company" draft={draft} errors={errors} set={set} onFocus={onFirstInput} autoComplete="organization" placeholder="Company or product name" optional />
        <div className={styles.phoneWrap} role="group" aria-labelledby="sb-phone-label" aria-describedby={errors.phone ? "sb-phone-error" : undefined} data-lenis-prevent><label htmlFor="sb-phone" id="sb-phone-label">Phone <span>(optional)</span></label><PhoneField id="sb-phone" value={draft.phone} onChange={value => set("phone", value)} onValidity={setPhoneOk} error={errors.phone} onFocus={onFirstInput} />{errors.phone && <span id="sb-phone-error" className="sr-only">{errors.phone}</span>}</div>
      </div>}
      {step === 1 && <div className={styles.projectFields}>
        <ChoiceGroup name="projectType" label="What do you have in mind?" hint="Choose the closest fit. ‘Not Sure Yet’ is a good place to start, too." options={PROJECT_TYPES} selected={draft.projectType} onSelect={value => set("projectType", value)} error={errors.projectType} />
        <ChoiceGroup name="budget" label="Estimated budget" hint="A rough range helps us understand the scope. You can leave this blank if you’re still exploring." options={BUDGET_RANGES} selected={draft.budget} onSelect={value => set("budget", value)} error={errors.budget} optional />
        {draft.budget && <button type="button" className={styles.clearBudget} onClick={() => set("budget", "")}>Clear budget selection</button>}
        <Field name="message" label="Tell us about your idea" draft={draft} errors={errors} set={set} onFocus={onFirstInput} placeholder="We’d like to build or improve…\nIt’s for…\nThe main challenge we want to solve is…" textarea />
      </div>}
      {step === 2 && <dl className={styles.review}>
        <ReviewRow label="Name" value={draft.name} onEdit={() => moveTo(0, "name")} />
        <ReviewRow label="Email" value={draft.email} onEdit={() => moveTo(0, "email")} />
        {draft.company && <ReviewRow label="Company" value={draft.company} onEdit={() => moveTo(0, "company")} />}
        {optionalStartPhone(draft.phone) && <ReviewRow label="Phone" value={draft.phone} onEdit={() => moveTo(0, "phone")} />}
        <ReviewRow label="Project type" value={draft.projectType} onEdit={() => moveTo(1, "projectType")} />
        <ReviewRow label="Budget" value={draft.budget || "Not specified"} onEdit={() => moveTo(1, "budget")} />
        <ReviewRow label="Brief" value={draft.message} onEdit={() => moveTo(1, "message")} />
      </dl>}
    </fieldset>
    <div className={styles.honeypot} aria-hidden="true"><label>Website<input type="text" name="website" value={draft.website} tabIndex={-1} autoComplete="off" maxLength={ENQUIRY_FIELD_LIMITS.website} onChange={event => set("website", event.target.value)} /></label></div>
    {step === 2 && <>
      {status === "error" && <div className={styles.serverError} role="alert" ref={noticeRef} tabIndex={-1}><p>{serverMessage}</p><a href={`mailto:${SITE.email}`}>Email Savo instead<StartArrow /></a></div>}
      <div ref={captchaRef} tabIndex={-1} className={styles.captchaRegion}><CaptchaGate captcha={captcha} error={captchaErr} /></div>
    </>}
    <div className={styles.controls}>
      {step > 0 && <button type="button" disabled={!ready || sending} className={styles.back} onClick={() => moveTo(step - 1)}><StartArrow back />Back</button>}
      {step < 2 ? <button type="submit" disabled={!ready} className={styles.primary}>{step === 0 ? "Continue to project" : "Review the brief"}<StartArrow /></button> : <button type="submit" disabled={!ready || sending} className={styles.primary}>{sending ? "Sending the brief…" : "Send the brief"}{!sending && <StartArrow />}</button>}
    </div>
    <p className={styles.privacy}>{step < 2 ? "Your details are sent only when you choose ‘Send the brief’." : "Sending starts a conversation, not a commitment. Please don’t include sensitive information."} <Link href="/privacy-policy">Privacy Policy</Link></p>
    <noscript><p className={styles.noJs}>Enable JavaScript to use the brief. You can also <a href={`mailto:${SITE.email}`}>email us directly</a>.</p></noscript>
  </form>;
}

/** Receipt only after confirmed API success; no delivery or scheduling guarantee. */
export function StartConfirmation({ email, onRestart, noticeRef }: { email: string; onRestart: () => void; noticeRef?: Ref<HTMLDivElement> }) {
  return <div className={styles.success} data-start-success role="status" ref={noticeRef} tabIndex={-1}>
    <StartCheck />
    <h3>Thank you for sharing your vision.</h3>
    <p>Your project enquiry has been received. We’ll use <strong>{email}</strong> to follow up on your goals and next steps.</p>
    <div className={styles.successNext}>
      <p>Continue the conversation, or explore what we can build together.</p>
      <nav className={styles.successActions} aria-label="After submitting your project">
        <a className={styles.successPrimary} href={`mailto:${SITE.email}`}>Email our team<StartArrow /></a>
        <Link className={styles.successSecondary} href="/case-studies">Explore our work<StartArrow /></Link>
        <Link className={styles.successSecondary} href="/services">Explore services<StartArrow /></Link>
      </nav>
    </div>
    <button type="button" className={styles.successRestart} onClick={onRestart}>Start another project<StartArrow /></button>
  </div>;
}

type FieldProps = { name: "name" | "email" | "company" | "message"; label: string; draft: StartDraft; errors: EnquiryFieldErrors; set: <K extends keyof StartDraft>(key: K, value: StartDraft[K]) => void; onFocus: () => void; type?: string; autoComplete?: string; placeholder?: string; optional?: boolean; textarea?: boolean };
function Field({ name, label, draft, errors, set, onFocus, type = "text", autoComplete, placeholder, optional, textarea }: FieldProps) {
  const id = `sb-${name}`, error = errors[name];
  const common = { id, name, required: !optional, value: draft[name], maxLength: ENQUIRY_FIELD_LIMITS[name], onFocus, placeholder, "aria-invalid": !!error, "aria-describedby": [textarea ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined };
  return <div className={styles.field}><label htmlFor={id}>{label}{optional ? <span> (optional)</span> : <span aria-hidden="true"> *</span>}</label>{textarea ? <><textarea {...common} rows={6} onChange={event => set(name, event.target.value)} /><p id={`${id}-hint`} className={styles.fieldHint}><span>A few sentences are enough: who it’s for, what you need, and what a good outcome looks like. At least 20 characters.</span><span>{draft[name].length} / {ENQUIRY_FIELD_LIMITS.message}</span></p></> : <input {...common} type={type} inputMode={type === "email" ? "email" : undefined} autoComplete={autoComplete} onChange={event => set(name, event.target.value)} />}{error && <p id={`${id}-error`} className={styles.fieldError}>{error}</p>}</div>;
}
function ChoiceGroup({ name, label, hint, options, selected, onSelect, error, optional }: { name: "projectType" | "budget"; label: string; hint: string; options: readonly string[]; selected: string; onSelect: (value: string) => void; error?: string; optional?: boolean }) {
  const describedBy = [`sb-${name}-hint`, error ? `sb-${name}-error` : ""].filter(Boolean).join(" ");
  return <fieldset className={styles.choiceGroup} aria-describedby={describedBy}><legend>{label}{optional ? <span> (optional)</span> : <span aria-hidden="true"> *</span>}</legend><p id={`sb-${name}-hint`} className={styles.choiceHint}>{hint}</p><div className={styles.choices}>{options.map(option => <label key={option}><input type="radio" name={name} value={option} checked={selected === option} required={!optional} aria-describedby={describedBy} onChange={() => onSelect(option)} /><span>{option}</span></label>)}</div>{error && <p id={`sb-${name}-error`} className={styles.fieldError}>{error}</p>}</fieldset>;
}
function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return <div><div><dt>{label}</dt><dd>{value}</dd></div><button type="button" className={styles.edit} onClick={onEdit} aria-label={`Edit ${label.toLowerCase()}`}>Edit<StartArrow /></button></div>;
}
