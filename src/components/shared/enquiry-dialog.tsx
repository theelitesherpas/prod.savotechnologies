"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  BUDGET_RANGES,
  PROJECT_TYPES,
  enquirySchema,
  flattenFieldErrors,
  type EnquiryFieldErrors,
  type EnquiryInput,
} from "@/schemas/enquiry";
import { track } from "@/lib/analytics";
import { cn, withBasePath } from "@/lib/utils";

type EnquiryContextValue = {
  open: (reason?: string, prefillMessage?: string) => void;
};

const EnquiryContext = createContext<EnquiryContextValue>({ open: () => {} });

/** Sections call this to open the enquiry drawer from any CTA. */
export function useEnquiry() {
  return useContext(EnquiryContext);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>();
  const [prefill, setPrefill] = useState<string | undefined>();
  const openerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((r?: string, prefillMessage?: string) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setReason(r);
    setPrefill(prefillMessage);
    setIsOpen(true);
    track("start_project_click", { location: r ?? "unspecified" });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    openerRef.current?.focus?.();
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <EnquiryContext.Provider value={value}>
      {children}
      <EnquiryDrawer isOpen={isOpen} onClose={close} reason={reason} prefill={prefill} />
    </EnquiryContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

function lockScroll(lock: boolean) {
  const root = document.documentElement;
  if (lock) {
    const sw = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (sw > 0) root.style.paddingRight = `${sw}px`;
  } else {
    root.style.overflow = "";
    root.style.paddingRight = "";
  }
}

function EnquiryDrawer({
  isOpen,
  onClose,
  reason,
  prefill,
}: {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  prefill?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);
  const askMode = reason === "ask-savo";

  useEffect(() => {
    if (!isOpen) return;
    lockScroll(true);
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [isOpen, onClose]);

  return (
    <div
      inert={!isOpen}
      className={cn(
        "fixed inset-0 z-[100]",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-[rgb(10_10_12/0.55)] backdrop-blur-[3px] transition-opacity duration-500 ease-[var(--ease-out-expo)]",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-title"
        className={cn(
          "chapter-ink absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col border-t border-border bg-background/90 text-foreground shadow-[0_-24px_80px_rgb(0_0_0/0.35)] backdrop-blur-2xl transition-transform duration-500 ease-[var(--ease-out-expo)] sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[34rem] sm:border-t-0 sm:border-l",
          isOpen
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-y-0 sm:translate-x-full",
        )}
      >
        <div className="shell flex-1 overflow-y-auto px-5 py-8 sm:px-10 sm:py-10">
          <div className="mb-8 flex items-start justify-between gap-6">
            <div>
              <p className="t-label mb-3 text-muted">
                {askMode
                  ? "Ask Savo — reply within one business day"
                  : reason
                    ? `New project — via ${reason}`
                    : "New project"}
              </p>
              <h2 id="enquiry-title" className="t-h2">
                {askMode ? "Ask us anything." : "Tell us what you're building."}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="t-label mt-1 shrink-0 border border-border px-3 py-2 text-muted transition-colors hover:border-foreground hover:text-foreground"
              aria-label="Close enquiry form"
            >
              ESC ✕
            </button>
          </div>
          <EnquiryForm key={prefill ?? "standard"} onStarted={() => (startedRef.current = true)} initialMessage={prefill} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

type Status = "idle" | "submitting" | "success" | "error";

function EnquiryForm({ onStarted, initialMessage }: { onStarted: () => void; initialMessage?: string }) {
  const placeholder = initialMessage
    ? "What would you like to know? A senior consultant replies within one business day."
    : "What are you building? What does success look like?";
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<EnquiryFieldErrors>({});
  const [serverMessage, setServerMessage] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setServerMessage("");

    const raw = Object.fromEntries(new FormData(e.currentTarget).entries());
    const parsed = enquirySchema.safeParse(raw);
    if (!parsed.success) {
      setErrors(flattenFieldErrors(parsed.error));
      const firstKey = Object.keys(parsed.error.flatten().fieldErrors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }
    setErrors({});
    setStatus("submitting");
    track("enquiry_form_submit");

    try {
      const res = await fetch(withBasePath("/api/enquiries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: EnquiryFieldErrors;
      };
      if (res.ok && json.ok) {
        setStatus("success");
        track("enquiry_form_success");
        return;
      }
      if (res.status === 400 && json.fieldErrors) {
        setErrors(json.fieldErrors);
        setStatus("idle");
        return;
      }
      setServerMessage(
        json.error ??
          "Something went wrong sending your enquiry. Please try again in a moment.",
      );
      setStatus("error");
      track("enquiry_form_error", { status: res.status });
    } catch {
      setServerMessage("Network error — please check your connection and try again.");
      setStatus("error");
      track("enquiry_form_error", { status: "network" });
    }
  }

  if (status === "success") {
    return (
      <div className="py-6" role="status">
        <span aria-hidden="true" className="mb-6 block h-3 w-3 bg-accent" />
        <p className="t-h3 mb-3">Enquiry received.</p>
        <p className="t-body text-muted">
          Thank you — a member of the Savo team will review your project and reply
          within two business days.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-7">
      <Field label="Name" name="name" errors={errors} onFocus={onStarted} autoComplete="name" placeholder="Your name" />
      <Field
        label="Business Email"
        name="email"
        type="email"
        errors={errors}
        onFocus={onStarted}
        autoComplete="email"
        placeholder="name@company.com"
      />
      <Field label="Company" name="company" errors={errors} onFocus={onStarted} autoComplete="organization" placeholder="Company name (optional)" required={false} />

      <SelectField label="Project Type" name="projectType" errors={errors} onFocus={onStarted} options={PROJECT_TYPES} placeholder="Select a project type" />

      <SelectField label="Estimated Budget" name="budget" errors={errors} onFocus={onStarted} options={BUDGET_RANGES} placeholder="Select a range (optional)" required={false} />

      <Field
        label="Message"
        name="message"
        errors={errors}
        onFocus={onStarted}
        placeholder={placeholder}
        textarea
        defaultValue={initialMessage}
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

      <button
        type="submit"
        disabled={status === "submitting"}
        className="group/btn inline-flex h-[3.25rem] w-full items-center justify-center gap-2.5 rounded-[2px] bg-foreground px-7 text-base font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent disabled:pointer-events-none disabled:opacity-50"
      >
        {status === "submitting" ? "Sending…" : "Send Enquiry"}
        <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
        </svg>
      </button>
      <p className="t-caption text-muted">
        Your details are stored securely and used only to respond to this enquiry.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Fields                                                              */
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
  defaultValue?: string;
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
  defaultValue,
}: FieldProps) {
  const errorId = `${name}-error`;
  const error = errors[name];
  return (
    <div>
      <label htmlFor={name} className="t-label mb-1 block text-muted">
        {label}
        {required ? <span aria-hidden="true" className="text-accent"> *</span> : null}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          className="field"
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onFocus={onFocus}
          rows={4}
          defaultValue={defaultValue}
        />
      ) : (
        <input
          id={name}
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

type SelectFieldProps = FieldProps & {
  options: readonly string[];
};

function SelectField({
  label,
  name,
  errors,
  onFocus,
  options,
  placeholder,
  required = true,
}: SelectFieldProps) {
  const errorId = `${name}-error`;
  const error = errors[name];
  return (
    <div>
      <label htmlFor={name} className="t-label mb-1 block text-muted">
        {label}
        {required ? <span aria-hidden="true" className="text-accent"> *</span> : null}
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          className="field pr-8"
          defaultValue=""
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onFocus={onFocus}
        >
          <option value="" disabled>
            {placeholder}
          </option>
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
      {error ? (
        <p id={errorId} className="t-caption mt-1.5 text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
