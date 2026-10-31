"use client";

import {
  createContext,
  cloneElement,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ReactElement,
} from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { withBasePath, cn } from "@/lib/utils";
import { isAutomaticProjectLeadModalExcludedPath } from "@/lib/lead-modal-routes";
import { SavoLogo } from "@/components/shared/savo-logo";
import { useCaptcha, CaptchaGate, captchaBlocked } from "@/components/shared/captcha";
import { BUDGET_RANGES, ENQUIRY_FIELD_LIMITS, type EnquiryFieldErrors } from "@/schemas/enquiry";
import { CALLBACK_COUNTRIES, COUNTRY_PHONE_RULES } from "@/lib/phone";
import { ArrowIcon, ChevronDownIcon } from "@/sections/home-v2/icons";
import styles from "./project-lead-modal.module.css";

/**
 * PROJECT LEAD MODAL - the premium enquiry popup.
 *
 * Shell: flex-based (row on desktop, bottom sheet on mobile) so every
 * column's height is genuinely constrained - the left trust panel and
 * the form's field area scroll internally while header + sticky CTA
 * footer stay visible at every viewport. Brand present on both (logo
 * in the ink panel; compact mark in the mobile sheet bar).
 *
 * Provider: useProjectModal().open({ service, source }) - mounted once
 * in the site layout; StartProjectButton CTAs open it with the service
 * preselected. Auto-triggers: 20s browse, 40% depth, desktop exit
 * intent - session-capped, 7d dismiss / 60d submit suppression.
 * Submissions flow through /api/enquiries with full attribution.
 */

/* ─────────────────────────── taxonomy ─────────────────────────── */

const SERVICES = [
  { id: "website", label: "New Website / Web Application", api: "Website" },
  { id: "mobile", label: "Mobile App", api: "Mobile App" },
  { id: "software", label: "Custom Software", api: "Custom Software" },
  { id: "saas", label: "SaaS Product", api: "SaaS" },
  { id: "ai", label: "AI / AI Agents", api: "AI / AI Agent" },
  { id: "ai-automation", label: "AI Automation", api: "AI Automation" },
  { id: "design", label: "UI/UX & Product Design", api: "UI/UX" },
  { id: "growth", label: "SEO / AEO / GEO & Growth", api: "Digital Marketing" },
  { id: "hire", label: "Hire Developers / Team", api: "Hire / Dedicated Team" },
  { id: "improve", label: "Existing Product Improvement", api: "Product Improvement" },
  { id: "unsure", label: "Not Sure Yet", api: "Not Sure Yet" },
  { id: "other", label: "Other", api: "Other" },
] as const;
type ServiceId = (typeof SERVICES)[number]["id"];

const STAGES = [
  "Just an idea",
  "Planning / requirements ready",
  "Design ready",
  "Development already started",
  "Need an existing project rescued",
  "Scaling an existing platform",
] as const;

const TIMELINES = ["As soon as possible", "Within 1 month", "1–3 months", "3–6 months", "6+ months", "Still planning"] as const;
const CONTACT_PREFS = ["Email", "Phone", "WhatsApp", "Video Call"] as const;

function serviceFromSource(source: string): ServiceId | undefined {
  const s = source.toLowerCase();
  if (s.includes("web")) return "website";
  if (s.includes("mobile")) return "mobile";
  if (s.includes("ai")) return "ai";
  if (s.includes("software")) return "software";
  if (s.includes("saas")) return "saas";
  if (s.includes("design") || s.includes("ui")) return "design";
  if (s.includes("growth") || s.includes("marketing") || s.includes("seo")) return "growth";
  if (s.includes("hire")) return "hire";
  return undefined;
}

export { serviceFromSource };
export type { ServiceId };

/* ─────────────────────────── context ──────────────────────────── */

type OpenOptions = { service?: ServiceId; source?: string };
type ProjectModalApi = { open: (opts?: OpenOptions) => void };
export type { ProjectModalApi, OpenOptions };
const ProjectModalContext = createContext<ProjectModalApi | null>(null);
export { ProjectModalContext };

export function useProjectModal(): ProjectModalApi {
  const ctx = useContext(ProjectModalContext);
  if (!ctx) throw new Error("useProjectModal must be used inside ProjectModalProvider");
  return ctx;
}

export type LeadTestimonialItem = { quote: string; name: string; role: string; country?: string; photo?: string };
export type LeadMetric = { value: string; label: string };

type ProviderProps = {
  children: ReactNode;
  testimonials: LeadTestimonialItem[];
  metrics: LeadMetric[];
  /** Admin master switch (Settings) - gates auto-triggers only; CTA opens always work. */
  enabled?: boolean;
};

export function ProjectModalProvider({ children, testimonials, metrics, enabled = true }: ProviderProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [preselect, setPreselect] = useState<{ service?: ServiceId; source: string }>({ source: "auto" });
  const sessionShown = useRef(false);
  const openRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) return; // admin switch off: no auto/exit triggers
    try {
      if (!sessionStorage.getItem("savo_landing")) {
        const p = new URLSearchParams(window.location.search);
        sessionStorage.setItem(
          "savo_landing",
          JSON.stringify({
            page: window.location.pathname,
            referrer: document.referrer || "",
            utm_source: p.get("utm_source") || "",
            utm_medium: p.get("utm_medium") || "",
            utm_campaign: p.get("utm_campaign") || "",
            utm_content: p.get("utm_content") || "",
            utm_term: p.get("utm_term") || "",
          }),
        );
      }
    } catch {}

    const forced = new URLSearchParams(window.location.search).has("popup");
    const dismissedAt = Number(localStorage.getItem("savo-plm-dismissed") || 0);
    const convertedAt = Number(localStorage.getItem("savo-plm-converted") || 0);
    const now = Date.now();
    if (!forced && (now - dismissedAt < 7 * 24 * 3600_000 || now - convertedAt < 60 * 24 * 3600_000)) return;

    track("lead_modal_eligible");

    let fired = false;
    const fire = (how: "auto" | "exit") => {
      // Keep automatic project-lead prompts off pages with their own contact
      // or application flow. Explicit ?popup and manual CTAs remain available.
      const taskPath = window.location.pathname.replace(/\/+$/, "") || "/";
      if (!forced && isAutomaticProjectLeadModalExcludedPath(taskPath)) return;
      // The detailed brief is also a conversion task; do not interrupt it.
      if (!forced && taskPath === withBasePath("/start-a-project")) return;
      const meetingPrefix = withBasePath("/meeting/");
      const meetingSegment = taskPath.startsWith(meetingPrefix) ? taskPath.slice(meetingPrefix.length) : "";
      if (!forced && meetingSegment && !meetingSegment.includes("/")) return;
      if (!forced && document.querySelector('[data-not-found-page="clear-native-recovery"]')) return;
      if (fired || sessionShown.current) return;
      fired = true;
      setPreselect({ source: how === "exit" ? "exit-intent" : "auto" });
      setOpen(true);
      track("lead_modal_open");
      track(how === "exit" ? "lead_modal_exit_open" : "lead_modal_auto_open");
    };

    if (forced) {
      fire("auto");
      return;
    }

    const timer = setTimeout(() => fire("auto"), 20_000);
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= 0.4) fire("auto");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const onOut = (e: MouseEvent) => {
      if (!coarse && !e.relatedTarget && e.clientY <= 0) fire("exit");
    };
    document.addEventListener("mouseout", onOut);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onOut);
    };
  }, [enabled]);

  const openModal = useCallback((opts?: OpenOptions) => {
    setPreselect({ service: opts?.service, source: opts?.source ?? "cta" });
    track("lead_modal_cta_open", { source: opts?.source ?? "cta" });
    if (!openRef.current) {
      setOpen(true);
      track("lead_modal_open");
    }
  }, []);

  useEffect(() => {
    openRef.current = open;
    if (open) sessionShown.current = true;
  }, [open]);

  const requestClose = useCallback(() => {
    setClosing(true);
    track("lead_modal_close");
    try {
      localStorage.setItem("savo-plm-dismissed", String(Date.now()));
      sessionStorage.setItem("savo-plm-session", "1");
    } catch {}
    setTimeout(() => {
      setClosing(false);
      setOpen(false);
    }, 200);
  }, []);

  const api = useMemo(() => ({ open: openModal }), [openModal]);

  return (
    <ProjectModalContext.Provider value={api}>
      {children}
      {open ? (
        <ProjectLeadModal
          closing={closing}
          onClose={requestClose}
          onConverted={() => {
            try {
              localStorage.setItem("savo-plm-converted", String(Date.now()));
            } catch {}
          }}
          preselect={preselect}
          testimonials={testimonials}
          metrics={metrics}
        />
      ) : null}
    </ProjectModalContext.Provider>
  );
}

/* ─────────────────────────── the modal ────────────────────────── */

function ProjectLeadModal({
  closing,
  onClose,
  onConverted,
  preselect,
  testimonials,
  metrics,
}: {
  closing: boolean;
  onClose: () => void;
  onConverted: () => void;
  preselect: { service?: ServiceId; source: string };
  testimonials: LeadTestimonialItem[];
  metrics: LeadMetric[];
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const [submitted, setSubmitted] = useState<{ firstName: string } | null>(null);

  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null && el.tabIndex >= 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (panelRef.current?.querySelector('[aria-haspopup="listbox"][aria-expanded="true"]')) return;
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => focusables()[0]?.focus(), 60);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      restoreFocus.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div className={styles.overlay}>
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className={cn(styles.backdrop, closing ? "pl-backdrop-out" : "pl-backdrop-in")}
      />
      {/* A clear project brief: dark introduction, white form, fixed actions.
          Desktop columns and mobile sheet share the existing submission flow. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={submitted ? "plm-success-heading" : "plm-heading"}
        className={cn(
          styles.dialog,
          closing ? "pl-modal-out" : "pl-modal-in",
        )}
      >
        <div className={styles.sheet}>
        {/* Mobile sheet bar - brand + close, always visible */}
        <div className={styles.mobileBar}>
          <SavoLogo compact className="h-5 w-auto text-foreground" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={styles.close}
          >
            <svg aria-hidden="true" viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="m3 3 8 8M11 3l-8 8" /></svg>
          </button>
        </div>

        <LeadTrustPanel testimonials={testimonials} metrics={metrics} />

        {submitted ? (
          <LeadSuccessState firstName={submitted.firstName} onClose={onClose} />
        ) : (
          <ProjectLeadForm
            preselect={preselect}
            onClose={onClose}
            onSubmitted={(firstName) => {
              setSubmitted({ firstName });
              onConverted();
            }}
          />
        )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── left: trust panel ────────────────────── */

function LeadTrustPanel({
  testimonials,
  metrics,
}: {
  testimonials: LeadTestimonialItem[];
  metrics: LeadMetric[];
}) {
  return (
    <aside className={styles.trust} data-lenis-prevent>
      <SavoLogo compact className="h-8 w-auto text-white" />
      <div className={styles.trustIntro}>
        <h2>A good project starts with a conversation.</h2>
        <p>Tell us what needs to change and where things stand today. We can help you work out the scope, the technical approach and a sensible next step.</p>
      </div>
      <div className={styles.nextSteps}>
        <h3>What happens next</h3>
        <ol>
          <li>We read your brief and consider the requirements.</li>
          <li>We get in touch to clarify the important details.</li>
          <li>We discuss the approach before agreeing the work.</li>
        </ol>
      </div>
      <LeadTestimonial items={testimonials} />
      <p className={styles.trustNote}>You do not need a finished specification. If the project involves sensitive information, ask for an NDA before sharing it.</p>
      {metrics.length > 0 ? (
        <dl className={styles.metrics}>
          {metrics.map((m) => (
            <div key={m.label}>
              <dd className="t-h4 font-serif tnum">{m.value}</dd>
              <dt className="t-caption mt-0.5 text-muted">{m.label}</dt>
            </div>
          ))}
        </dl>
      ) : null}
    </aside>
  );
}

function LeadTestimonial({ items }: { items: LeadTestimonialItem[] }) {
  const [i, setI] = useState(0);
  if (items.length === 0) return null;
  const t = items[i % items.length];
  const prev = () => setI((n) => (n - 1 + items.length) % items.length);
  const next = () => setI((n) => (n + 1) % items.length);

  return (
    <div
      className={styles.review}
      aria-roledescription="carousel"
      aria-label="Client reviews"
    >
      <div key={i} className="pl-quote-in relative p-5 sm:p-6">
        {/* Oversized serif quote glyph - the card's editorial signature */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-1 right-4 font-serif text-[4.5rem] italic leading-none text-accent/25"
        >
          &rdquo;
        </span>

        {/* Quote first - the review is the hero, not the chrome */}
        <blockquote>
          <p className="font-serif text-[1.0625rem] italic leading-[1.55] text-foreground">{t.quote}</p>
        </blockquote>

        {/* Attribution - photo + identity on a hairline */}
        <div className="mt-5 border-t border-border pt-4 text-center">
          <div className="min-w-0">
            <p className="t-sm font-semibold text-foreground">{t.name}</p>
            <p className="t-caption mt-0.5 text-muted">
              {t.role}
              {t.country ? ` · ${t.country}` : ""}
            </p>
          </div>
        </div>
      </div>
      {items.length > 1 ? (
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {items.map((_, n) => (
              <span key={n} className={cn("h-1.5 w-1.5 transition-colors", n === i ? "bg-accent" : "bg-border")} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="t-caption tnum text-muted">
              {i + 1} / {items.length}
            </span>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous review"
              className="flex h-7 w-7 items-center justify-center border border-border text-muted transition-colors hover:border-foreground hover:text-foreground"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next review"
              className="flex h-7 w-7 items-center justify-center border border-border text-muted transition-colors hover:border-foreground hover:text-foreground"
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────── right: the form ──────────────────────── */

type FormState = {
  name: string;
  email: string;
  company: string;
  country: string;
  phone: string;
  service: string;
  message: string;
  stage: string;
  budget: string;
  timeline: string;
  contactPref: string;
  whatsapp: boolean;
  website: string;
};

function ProjectLeadForm({
  preselect,
  onClose,
  onSubmitted,
}: {
  preselect: { service?: ServiceId; source: string };
  onClose: () => void;
  onSubmitted: (firstName: string) => void;
}) {
  const preselected = useMemo(() => {
    if (preselect.service) return SERVICES.find((s) => s.id === preselect.service)?.label ?? "";
    if (preselect.source !== "auto" && preselect.source !== "exit-intent") {
      return SERVICES.find((s) => s.id === serviceFromSource(preselect.source))?.label ?? "";
    }
    return "";
  }, [preselect]);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    company: "",
    country: "",
    phone: "",
    service: preselected,
    message: "",
    stage: "",
    budget: "",
    timeline: "",
    contactPref: "",
    whatsapp: false,
    website: "",
  });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [errors, setErrors] = useState<EnquiryFieldErrors>({});
  const [formError, setFormError] = useState("");
  const startedRef = useRef(false);

  /* Google reCAPTCHA v2 - visible in this modal (the site's captcha
   * stack: token attaches to the submission; the server enforces when
   * this IP's free window is spent). No site key configured → gate
   * stays hidden and submits flow on honeypot + rate limits. */
  const captcha = useCaptcha();
  const [captchaErr, setCaptchaErr] = useState<string | null>(null);
  const gate = useMemo(
    () => ({ ...captcha, required: Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) }),
    [captcha],
  );

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (!startedRef.current) {
      startedRef.current = true;
      track("lead_form_start");
    }
  };

  const showPhone = form.phone.trim().length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setErrors({});
    setFormError("");
    setCaptchaErr(null);
    if (captchaBlocked(gate)) {
      setCaptchaErr("Please complete the human verification below.");
      return;
    }
    setStatus("submitting");
    track("lead_form_submit");

    let attr: Record<string, string> = {};
    try {
      const landing = JSON.parse(sessionStorage.getItem("savo_landing") || "{}");
      attr = {
        landingPage: landing.page ?? "",
        referrer: (landing.referrer ?? "").slice(0, 300),
        utm_source: landing.utm_source ?? "",
        utm_medium: landing.utm_medium ?? "",
        utm_campaign: landing.utm_campaign ?? "",
        utm_content: landing.utm_content ?? "",
        utm_term: landing.utm_term ?? "",
      };
    } catch {}
    const device =
      typeof window !== "undefined"
        ? window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768
          ? "mobile"
          : window.innerWidth < 1024
            ? "tablet"
            : "desktop"
        : "";
    const svc = SERVICES.find((s) => s.label === form.service);

    try {
      const res = await fetch(withBasePath("/api/enquiries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          source: "lead-popup",
          captchaToken: captcha.token ?? undefined,
          phone:
            form.phone && form.country && COUNTRY_PHONE_RULES[form.country]
              ? `${COUNTRY_PHONE_RULES[form.country].dial} ${form.phone}`.trim()
              : form.phone,
          projectType: svc?.api ?? "Not Sure Yet",
          budget: form.budget || "",
          message: form.message,
          website: form.website,
          details: {
            form: "project-lead",
            leadSource: "Website Popup",
            ctaSource: preselect.source,
            sourcePage: typeof window !== "undefined" ? window.location.pathname : "",
            ...(form.stage ? { stage: form.stage } : {}),
            ...(form.timeline ? { timeline: form.timeline } : {}),
            ...(form.contactPref ? { contactPref: form.contactPref } : {}),
            ...(form.country ? { country: form.country } : {}),
            ...(form.whatsapp && showPhone ? { whatsappOptIn: "yes" } : {}),
            ...(device ? { device } : {}),
            ...attr,
          },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: EnquiryFieldErrors;
        captchaRequired?: boolean;
      };
      if (res.ok && json.ok) {
        track("lead_form_success", { service: svc?.id ?? "unknown" });
        captcha.refresh();
        onSubmitted(form.name.split(" ")[0] || "there");
        return;
      }
      track("lead_form_error", { status: res.status });
      if (json.captchaRequired) {
        setCaptchaErr("Verification expired or failed. Please complete it again.");
        captcha.reset();
        setStatus("idle");
        return;
      }
      if (json.fieldErrors) setErrors(json.fieldErrors);
      setFormError(json.error ?? "Something went wrong. Please try again.");
      setStatus("idle");
    } catch {
      track("lead_form_error", { status: "network" });
      setFormError("Network error. Your details are preserved - please try again.");
      setStatus("idle");
    }
  }

  const input = styles.input;

  return (
    <div className={styles.formPane}>
      <div className={styles.formHeader}>
        <div>
          <h2 id="plm-heading" className={styles.formTitle}>Tell us about your project.</h2>
          <p>A short brief is enough. * Required fields.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className={styles.close}
        >
          <svg aria-hidden="true" viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="m3 3 8 8M11 3l-8 8" /></svg>
        </button>
      </div>

      {/* Scrollable fields area */}
      <form id="plm-form" onSubmit={submit} noValidate data-lenis-prevent className={styles.fields}>
        <div className={styles.fieldGrid}>
          <Field id="plm-name" label="Full name *" error={errors.name}>
            <input
              id="plm-name"
              className={input}
              placeholder="Your name"
              maxLength={ENQUIRY_FIELD_LIMITS.name}
              autoComplete="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={!!errors.name}
              required
            />
          </Field>
          <Field id="plm-email" label="Work email *" error={errors.email}>
            <input
              id="plm-email"
              type="email"
              className={input}
              placeholder="you@company.com"
              maxLength={ENQUIRY_FIELD_LIMITS.email}
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              aria-invalid={!!errors.email}
              required
            />
          </Field>
        </div>

        {/* Service dropdown */}
        <div className={styles.group}>
          <Field id="plm-service" label="What can we help you with? *" error={errors.projectType}>
            <select
              id="plm-service"
              className={input}
              value={form.service}
              onChange={(e) => {
                set("service", e.target.value);
                const found = SERVICES.find((s) => s.label === e.target.value);
                if (found) track("lead_form_service_select", { service: found.id });
              }}
              aria-invalid={!!errors.projectType}
              required
            >
              <option value="">Select a service…</option>
              {SERVICES.map((s) => (
                <option key={s.id} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className={styles.group}>
          <Field id="plm-message" label="Tell us about the project *" error={errors.message}>
            <textarea
              id="plm-message"
              rows={3}
              className={`${input} resize-none`}
              placeholder="What needs to change, who will use it and any deadlines or constraints we should know about."
              maxLength={ENQUIRY_FIELD_LIMITS.message}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              aria-invalid={!!errors.message}
              required
            />
          </Field>
        </div>

        {/* Progressive disclosure */}
        <button
          type="button"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((v) => !v)}
          className={styles.optional}
        >
          <ChevronDownIcon size={16} />
          {detailsOpen ? "Hide optional details" : "Add contact and project details (optional)"}
        </button>

        {detailsOpen ? (
          <div className={styles.optionalFields}>
            <Field id="plm-company" label="Company or product (optional)">
              <input id="plm-company" className={input} placeholder="Company or product name" maxLength={ENQUIRY_FIELD_LIMITS.company} autoComplete="organization" value={form.company} onChange={(e) => set("company", e.target.value)} />
            </Field>
            <CountryPhoneField country={form.country} phone={form.phone} onCountry={(c) => set("country", c)} onPhone={(p) => set("phone", p)} />
            <Field id="plm-stage" label="Project stage">
              <select id="plm-stage" className={input} value={form.stage} onChange={(e) => set("stage", e.target.value)}>
                <option value="">Select…</option>
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field id="plm-budget" label="Estimated budget (optional)">
              <select id="plm-budget" className={input} value={form.budget} onChange={(e) => set("budget", e.target.value)}>
                <option value="">Select…</option>
                {BUDGET_RANGES.filter((b) => b !== "To be discussed").map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field id="plm-timeline" label="Preferred timeline">
              <select id="plm-timeline" className={input} value={form.timeline} onChange={(e) => set("timeline", e.target.value)}>
                <option value="">Select…</option>
                {TIMELINES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field id="plm-contact" label="Preferred contact method">
              <select id="plm-contact" className={input} value={form.contactPref} onChange={(e) => set("contactPref", e.target.value)}>
                <option value="">Select…</option>
                {CONTACT_PREFS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}

        {showPhone ? (
          <label className={styles.whatsapp}>
            <input
              type="checkbox"
              checked={form.whatsapp}
              onChange={(e) => {
                set("whatsapp", e.target.checked);
                if (e.target.checked) track("lead_whatsapp_optin");
              }}
              className="mt-1 h-4 w-4 accent-[var(--accent)]"
            />
            You may contact me on WhatsApp
          </label>
        ) : null}

        {/* Honeypot */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />

        {formError ? (
          <p role="alert" className="t-caption mt-5 text-error">
            {formError}
          </p>
        ) : null}

        <div className="h-2" aria-hidden="true" />
      </form>

      {/* Sticky CTA footer - always visible (captcha + button + micro) */}
      <div className={styles.footer}>
        <div className={styles.captcha} data-lenis-prevent>
          <CaptchaGate captcha={gate} error={captchaErr} />
        </div>
        <button
          type="submit"
          form="plm-form"
          disabled={status === "submitting"}
          className={styles.send}
        >
          {status === "submitting" ? "Sending…" : <>Send project brief <ArrowIcon size={16} /></>}
        </button>
        <div className={styles.footerMeta}>
          <Link href="/privacy-policy">Privacy policy</Link>
          <Link
            href="/start-a-project"
            onClick={() => {
              track("lead_schedule_click", { from: "modal-secondary" });
              onClose(); /* dismiss before navigating - never leave the modal mounted over the next page */
            }}
            className="t-caption font-medium text-accent-strong underline underline-offset-4 hover:text-foreground"
          >
            Prefer to talk first? <ArrowIcon size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ───────────── country & phone - the site's callback format ─────────── */

function CountryPhoneField({
  country,
  phone,
  onCountry,
  onPhone,
}: {
  country: string;
  phone: string;
  onCountry: (c: string) => void;
  onPhone: (p: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const rule = country ? COUNTRY_PHONE_RULES[country] : null;
  const filtered = query.trim()
    ? CALLBACK_COUNTRIES.filter(
        (c) =>
          c.toLowerCase().includes(query.trim().toLowerCase()) ||
          (COUNTRY_PHONE_RULES[c]?.dial ?? "").includes(query.trim()),
      )
    : CALLBACK_COUNTRIES;

  function moveCountryFocus(event: React.KeyboardEvent<HTMLElement>) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || event.nativeEvent.isComposing) return;
    if (event.target instanceof HTMLInputElement && ['Home', 'End'].includes(event.key)) return;
    const options = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
    if (!options.length) return;
    event.preventDefault();
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : event.key === 'ArrowDown' ? Math.min(current + 1, options.length - 1) : current < 0 ? options.length - 1 : Math.max(current - 1, 0);
    options[next]?.focus();
  }

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); menuRef.current?.querySelector("button")?.focus(); }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.phoneField}>
      <span>Phone / WhatsApp (optional)</span>
      <div className={styles.phoneControl}>
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-controls={open ? 'plm-country-options' : undefined}
            aria-expanded={open}
            aria-label={country || "Select country"}
            onClick={() => {
              setQuery("");
              setOpen((v) => !v);
            }}
            className={cn(
              "flex h-full cursor-pointer items-center gap-2 py-2.5 pl-0 pr-2 text-[0.9375rem] font-semibold transition-colors",
              country ? "text-foreground" : "text-muted",
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
            <span className={cn("text-muted transition-transform duration-150", open && "rotate-180")}><ChevronDownIcon size={14} /></span>
          </button>
          {open ? (
            <div className={styles.countryMenu} onKeyDown={moveCountryFocus}>
              <div className="sticky top-0 border-b border-border bg-background p-2">
                <input
                  ref={searchRef}
                  type="text"
                  role="searchbox"
                  aria-label="Search countries"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country or code…"
                  className="w-full border-0 bg-surface-2/60 px-2 py-1.5 text-[0.8438rem] outline-none placeholder:text-muted/60 focus:bg-surface-2"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <ul id="plm-country-options" role="listbox" aria-label="Country" data-lenis-prevent className="max-h-60 overflow-y-auto overscroll-contain py-1">
                {filtered.length === 0 ? (
                  <li className="px-3.5 py-3 text-[0.8125rem] text-muted" role="presentation">
                    No country matches “{query.trim()}”.
                  </li>
                ) : (
                  filtered.map((c) => {
                    const r = COUNTRY_PHONE_RULES[c];
                    return (
                      <li key={c} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={c === country}
                          tabIndex={-1}
                          onClick={() => {
                            onCountry(c);
                            setOpen(false);
                            menuRef.current?.querySelector<HTMLButtonElement>('[aria-haspopup="listbox"]')?.focus();
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
                  })
                )}
              </ul>
            </div>
          ) : null}
          <span aria-hidden="true" className="mx-3 h-5 w-px bg-border" />
        </div>
        <input
          type="tel"
          inputMode="numeric"
          aria-label="Phone number"
          placeholder={rule ? "98765 43210" : "Select country first"}
          disabled={!rule}
          maxLength={rule?.max ?? 16}
          autoComplete="tel-national"
          value={phone}
          onChange={(e) => onPhone(e.target.value.replace(/[^0-9 ]/g, ""))}
          className="w-full min-w-0 flex-1 bg-transparent py-2.5 text-[0.9375rem] text-foreground outline-none placeholder:text-muted/60 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}

function Field({
  id,
  label: lbl,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{lbl}</label>
      {isValidElement(children) ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, { "aria-describedby": error ? `${id}-error` : undefined }) : children}
      {error ? (
        <p id={`${id}-error`} className="t-caption mt-1 text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ─────────────────────── success state ────────────────────────── */

function LeadSuccessState({ firstName, onClose }: { firstName: string; onClose: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  return (
    <div data-lenis-prevent className={styles.success}>
      <span className={styles.successIcon}><svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg></span>
      <h3 id="plm-success-heading" ref={headingRef} tabIndex={-1}>Thanks, {firstName}.</h3>
      <p>Your project brief has been received. The Savo team will review what you have shared and contact you using the details you provided.</p>

      <div className="mt-8 space-y-4 border-t border-border pt-6">
        {[
          ["01", "We review your requirements"],
          ["02", "We identify the right technical approach"],
          ["03", "We contact you to discuss scope and next steps"],
        ].map(([n, text]) => (
          <div key={n} className="flex items-baseline gap-4">
            <span className="t-label tnum text-accent">{n}</span>
            <p className="t-sm text-muted">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/start-a-project"
          onClick={() => {
            track("lead_schedule_click", { from: "success" });
            onClose();
          }}
          className="inline-flex h-12 items-center justify-center bg-accent px-7 text-[0.9375rem] font-semibold text-on-accent transition-colors hover:bg-accent-hover"
        >
          Discuss the next step
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-12 items-center justify-center border border-foreground/25 px-7 text-[0.9375rem] font-semibold transition-colors hover:border-foreground hover:bg-foreground/[0.04]"
        >
          Back to the website
        </button>
      </div>
    </div>
  );
}
