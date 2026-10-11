"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { BUDGET_RANGES, CONTACT_TOPICS, enquirySchema, ENQUIRY_FIELD_LIMITS, flattenFieldErrors, type EnquiryFieldErrors, type EnquiryInput } from "@/schemas/enquiry";
import { track } from "@/lib/analytics";
import { useCaptcha, CaptchaGate, captchaBlocked } from "@/components/shared/captcha";
import { PhoneField } from "@/components/shared/phone-field";
import { withBasePath } from "@/lib/utils";
import { TOPIC_GUIDANCE, contactAttribution } from "./contact-content";
import styles from "./contact.module.css";

const subscribe = () => () => {};
type Status = "idle" | "submitting" | "success" | "error";

/** Contact enquiries retain the shared schema, endpoint, source and topic. */
export function ContactForm({ email }: { email: string }) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const [topic, setTopic] = useState<(typeof CONTACT_TOPICS)[number]>("New project");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<EnquiryFieldErrors>({});
  const [phone, setPhone] = useState("");
  const [phoneOk, setPhoneOk] = useState(true);
  const captcha = useCaptcha();
  const [captchaErr, setCaptchaErr] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const optionalRef = useRef<HTMLDetailsElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => { if (status === "success" || status === "error") noticeRef.current?.focus(); }, [status]);

  function onStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    track("enquiry_form_start", { form: "contact" });
  }
  function clearError(name: keyof EnquiryInput) {
    setErrors(previous => { if (!previous[name]) return previous; const next = { ...previous }; delete next[name]; return next; });
  }
  function focusError(fieldErrors: EnquiryFieldErrors) {
    const first = Object.keys(fieldErrors)[0] as keyof EnquiryInput | undefined;
    if (!first) return;
    if (["phone", "company", "budget"].includes(first) && optionalRef.current) optionalRef.current.open = true;
    requestAnimationFrame(() => {
      if (first === "phone") {
        const input = formRef.current?.querySelector<HTMLInputElement>("#ct-phone");
        if (input && !input.disabled) input.focus();
        else formRef.current?.querySelector<HTMLElement>('[aria-haspopup="listbox"]')?.focus();
      } else formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    });
  }
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready || status === "submitting") return;
    setCaptchaErr(null); setServerMessage("");
    const raw = Object.fromEntries(new FormData(e.currentTarget).entries());
    const parsed = enquirySchema.safeParse({ ...raw, projectType: topic });
    if (!parsed.success) { const fields = flattenFieldErrors(parsed.error); setErrors(fields); focusError(fields); return; }
    if (!phoneOk) { const fields = { phone: "Check the number for the country you selected." }; setErrors(fields); focusError(fields); return; }
    setErrors({});
    if (captchaBlocked(captcha)) { setCaptchaErr("Please complete the human verification."); return; }
    setStatus("submitting");
    track("enquiry_form_submit", { form: "contact", topic });
    let attribution: Record<string, string> = {};
    try { attribution = contactAttribution(sessionStorage.getItem("savo_landing")); } catch { /* Storage can be unavailable; the enquiry still works. */ }
    try {
      const res = await fetch(withBasePath("/api/enquiries"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, captchaToken: captcha.token, source: "contact", details: { form: "contact", topic, ...attribution } }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fieldErrors?: EnquiryFieldErrors };
      if (res.ok && json.ok === true) { setStatus("success"); captcha.refresh(); track("enquiry_form_success", { form: "contact" }); return; }
      if (res.status === 400 && json.fieldErrors && Object.keys(json.fieldErrors).length) { setErrors(json.fieldErrors); setStatus("idle"); focusError(json.fieldErrors); track("enquiry_form_error", { form: "contact", status: res.status }); return; }
      setServerMessage(typeof json.error === "string" ? json.error : "Your message could not be sent. Please try again, or use the email link below.");
      setStatus("error"); track("enquiry_form_error", { form: "contact", status: res.status });
    } catch { setServerMessage("We couldn’t connect. Your message is still here - check your connection and try again, or email us instead."); setStatus("error"); track("enquiry_form_error", { form: "contact", status: "network" }); }
  }

  if (status === "success") return <div className={styles.success} data-contact-success ref={noticeRef} tabIndex={-1} role="status">
    <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 14h40v30H30L18 54V44h-6Z"/><path d="m22 29 7 7 14-15"/></svg>
    <h2>Thanks for the message.</h2><p>Your enquiry has been received. Keep an eye on the email address you shared for a response.</p>
    <p>Want to add something? <a href={`mailto:${email}`}>Email us</a>.</p>
    <button type="button" className={styles.textAction} onClick={() => { setTopic("New project"); setPhone(""); setPhoneOk(true); setErrors({}); setCaptchaErr(null); setServerMessage(""); startedRef.current = false; setStatus("idle"); requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("#ct-name")?.focus()); }}>Send another message<Arrow /></button>
  </div>;

  return <form ref={formRef} onSubmit={handleSubmit} noValidate className={styles.form} aria-labelledby="message-heading" aria-busy={status === "submitting"} onKeyDown={event => { if (event.target instanceof HTMLElement && event.target.closest(`.${styles.phoneWrap}`)) { if (event.key === "Enter" && event.target.getAttribute("role") === "searchbox") event.preventDefault(); if (event.key === "Escape") requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-haspopup="listbox"]')?.focus()); } }}>
    <div className={styles.formIntro}><h2 id="message-heading">Tell us a little.</h2><p>* Required. A few clear sentences are enough.</p></div>
    <fieldset className={styles.topics} disabled={status === "submitting"}><legend>What can we help with?</legend><div>{CONTACT_TOPICS.map(t => <label key={t}><input type="radio" name="projectType" value={t} checked={topic === t} onChange={() => { setTopic(t); onStarted(); }} /><span>{t}</span></label>)}</div></fieldset>
    <div className={styles.topicHint} aria-live="polite"><p>{TOPIC_GUIDANCE[topic].hint}</p>{topic === "Careers" && <Link href="/careers/apply">Go to the Careers application<Arrow /></Link>}</div>
    <div className={styles.fields}><Field label="Your name" name="name" errors={errors} onFocus={onStarted} onChange={clearError} autoComplete="name" placeholder="Your name" /><Field label="Email address" name="email" type="email" errors={errors} onFocus={onStarted} onChange={clearError} autoComplete="email" placeholder="you@company.com" /></div>
    <Field label="Your message" name="message" errors={errors} onFocus={onStarted} onChange={clearError} placeholder={TOPIC_GUIDANCE[topic].placeholder} textarea />
    <details className={styles.optional} ref={optionalRef}><summary>Add contact or project details <span>(optional)</span><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 4v12M4 10h12"/></svg></summary><div>
      <div className={styles.phoneWrap}><label htmlFor="ct-phone">Phone <span>(optional)</span></label><PhoneField id="ct-phone" value={phone} onChange={value => { setPhone(value); clearError("phone"); }} onValidity={setPhoneOk} error={errors.phone} onFocus={onStarted} /></div>
      <Field label="Company" name="company" errors={errors} onFocus={onStarted} onChange={clearError} autoComplete="organization" placeholder="Your company" required={false} />
      {topic === "New project" && <div className={styles.field}><label htmlFor="ct-budget">Budget range <span>(optional)</span></label><select id="ct-budget" name="budget" defaultValue="" onFocus={onStarted} onChange={() => clearError("budget")}><option value="">Select a range</option>{BUDGET_RANGES.map(b => <option key={b}>{b}</option>)}</select>{errors.budget && <p className={styles.fieldError}>{errors.budget}</p>}</div>}
    </div></details>
    <div aria-hidden="true" className={styles.honeypot}><label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" maxLength={ENQUIRY_FIELD_LIMITS.website} /></label></div>
    {status === "error" && <div className={styles.serverError} role="alert" tabIndex={-1} ref={noticeRef}><p>{serverMessage}</p><a href={`mailto:${email}`}>Email Savo instead<Arrow /></a></div>}
    <div className={styles.submitArea}><CaptchaGate captcha={captcha} error={captchaErr} /><button type="submit" disabled={!ready || status === "submitting"} className={styles.submit}>{status === "submitting" ? "Sending message…" : "Send message"}<Arrow /></button><p>Please don’t include sensitive information. <Link href="/privacy-policy">Privacy Policy</Link></p><noscript><p>To send this form, enable JavaScript. You can also <a href={`mailto:${email}`}>email us directly</a>.</p></noscript></div>
  </form>;
}
function Arrow() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>; }

type FieldProps = { label: string; name: keyof EnquiryInput; errors: EnquiryFieldErrors; onFocus: () => void; onChange: (name: keyof EnquiryInput) => void; placeholder?: string; type?: string; autoComplete?: string; textarea?: boolean; required?: boolean };
function Field({ label, name, errors, onFocus, onChange, placeholder, type = "text", autoComplete, textarea, required = true }: FieldProps) {
  const [len, setLen] = useState(0), id = `ct-${name}`, errorId = `${id}-error`, hintId = `${id}-hint`, error = errors[name];
  const max = ENQUIRY_FIELD_LIMITS[name as keyof typeof ENQUIRY_FIELD_LIMITS];
  const common = { id, name, required, maxLength: max, placeholder, onFocus, "aria-invalid": !!error, "aria-describedby": [error ? errorId : "", textarea ? hintId : ""].filter(Boolean).join(" ") || undefined };
  return <div className={styles.field}><label htmlFor={id}>{label}{required ? <span aria-hidden="true"> *</span> : <span> (optional)</span>}</label>
    {textarea ? <><textarea {...common} rows={4} onInput={e => { setLen(e.currentTarget.value.length); onChange(name); }} /><p className={styles.fieldHint} id={hintId}><span>At least 20 characters.</span><span>{len} / {max}</span></p></> : <input {...common} type={type} inputMode={type === "email" ? "email" : undefined} autoComplete={autoComplete} onInput={() => onChange(name)} />}
    {error && <p id={errorId} className={styles.fieldError}>{error}</p>}
  </div>;
}
