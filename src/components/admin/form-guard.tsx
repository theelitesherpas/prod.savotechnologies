"use client";

import {
  useCallback,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

/**
 * FormGuard — styled, inline validation for server-action forms.
 *
 * One engine behind every admin/portal form. The constraint attributes
 * already on the markup (required, type, minLength/maxLength, min/max,
 * pattern, step) are the single source of truth; FormGuard replaces the
 * browser's default bubbles with:
 *
 *   - an error summary card at the top (role="alert"), GOV.UK style,
 *     with clickable entries that focus the offending field
 *   - aria-invalid + red border/ring + red label on each invalid field
 *   - live re-validation: an error clears the moment the field becomes
 *     valid — never making the user re-submit to find out
 *   - focus moved to the summary, first invalid field focused from there
 *
 * A `validate` prop adds cross-field/custom rules to the same surface
 * (keyed by element id, or by field name when no id exists). When JS is
 * absent the native attributes still gate the request server-side —
 * client validation is UX, the server action remains the gatekeeper.
 */

export type GuardProblem = { anchor: string; message: string };

type Validatable = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function is_validatable(el: Element): el is Validatable {
  return (
    (el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement) &&
    el.willValidate
  );
}

function fieldLabel(el: Validatable): string {
  const label = el.labels?.[0]?.textContent ?? el.getAttribute("aria-label") ?? "";
  return label.replace(/\*$/, "").trim().toLowerCase();
}

/** Human message from the native ValidityState, in the site's voice. */
function nativeProblem(el: Validatable): string | null {
  const v = el.validity;
  if (!v.valid) {
    const label = fieldLabel(el);
    const what = label || "this field";
    if (v.valueMissing) return `Enter the ${what}.`;
    if (v.typeMismatch) {
      if (el instanceof HTMLInputElement && el.type === "email")
        return "Enter an email address in the correct format, like name@company.com.";
      if (el instanceof HTMLInputElement && el.type === "url")
        return "Enter a full URL, like https://example.com.";
      return `Enter the ${what} in the correct format.`;
    }
    if (v.patternMismatch) {
      const hint = el.title;
      return hint ? hint : `Enter the ${what} in the required format.`;
    }
    if (v.tooShort) {
      const min = (el as HTMLInputElement | HTMLTextAreaElement).minLength;
      return `The ${what} is too short — at least ${min} characters.`;
    }
    if (v.tooLong) {
      const max = (el as HTMLInputElement | HTMLTextAreaElement).maxLength;
      return `The ${what} is too long — no more than ${max} characters.`;
    }
    if (v.rangeUnderflow) return `The ${what} must be ${(el as HTMLInputElement).min} or more.`;
    if (v.rangeOverflow) return `The ${what} must be ${(el as HTMLInputElement).max} or less.`;
    if (v.stepMismatch) return `The ${what} must be a valid step of ${(el as HTMLInputElement).step}.`;
    return `Check the ${what}.`;
  }
  return null;
}

export function FormGuard({
  action,
  children,
  className,
  validate,
  onValidSubmit,
}: {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
  /** Extra rules; return problems keyed by field id (or name). */
  validate?: (form: HTMLFormElement) => GuardProblem[];
  /** Runs after every check passes, before the action is allowed through. */
  onValidSubmit?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [problems, setProblems] = useState<GuardProblem[]>([]);
  const summaryRef = useRef<HTMLDivElement>(null);
  /** True once a submit has been blocked — live clearing is active then. */
  const armedRef = useRef(false);

  const anchorOf = (el: Validatable) => el.id || `name:${el.name}`;

  const markFields = useCallback((form: HTMLFormElement, errs: GuardProblem[]) => {
    const anchors = new Set(errs.map((e) => e.anchor));
    for (const el of Array.from(form.elements)) {
      if (!is_validatable(el)) continue;
      const invalid = anchors.has(anchorOf(el)) || !el.checkValidity();
      if (invalid) el.setAttribute("aria-invalid", "true");
      else el.removeAttribute("aria-invalid");
    }
  }, []);

  /** Silent re-validation as the user edits — only after a blocked submit.
     An error clears the moment its field becomes valid; custom
     (cross-field) rules re-run so related errors settle live too. */
  const refresh = useCallback(
    (form: HTMLFormElement) => {
      if (!armedRef.current) return;
      const remaining: GuardProblem[] = [];
      for (const el of Array.from(form.elements)) {
        if (!is_validatable(el)) continue;
        if (el.getAttribute("aria-invalid") !== "true") continue; // untouched, leave alone
        const msg = nativeProblem(el);
        if (msg) remaining.push({ anchor: anchorOf(el), message: msg });
      }
      if (validate)
        remaining.push(
          ...validate(form).filter((p) => !remaining.some((e) => e.anchor === p.anchor)),
        );
      setProblems(remaining);
      markFields(form, remaining);
      if (remaining.length === 0) armedRef.current = false;
    },
    [markFields, validate],
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const errs: GuardProblem[] = [];

    for (const el of Array.from(form.elements)) {
      if (!is_validatable(el)) continue;
      const msg = nativeProblem(el);
      if (msg) errs.push({ anchor: anchorOf(el), message: msg });
    }
    if (validate)
      errs.push(
        ...validate(form).filter((p) => !errs.some((e) => e.anchor === p.anchor)),
      );

    if (errs.length > 0) {
      e.preventDefault();
      armedRef.current = true;
      setProblems(errs);
      markFields(form, errs);
      // Move focus to the summary so screen readers announce it.
      requestAnimationFrame(() => {
        summaryRef.current?.focus();
        summaryRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return;
    }
    setProblems([]);
    markFields(form, []);
    onValidSubmit?.();
  }

  const focusAnchor = (anchor: string) => {
    const form = formRef.current;
    if (!form) return;
    const el =
      (anchor.startsWith("name:")
        ? (form.elements.namedItem(anchor.slice(5)) as HTMLElement | null)
        : form.querySelector<HTMLElement>(`#${CSS.escape(anchor)}`)) ?? null;
    el?.focus();
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      onSubmit={onSubmit}
      onInput={() => formRef.current && refresh(formRef.current)}
      onChange={() => formRef.current && refresh(formRef.current)}
      className={className}
    >
      {problems.length > 0 ? (
        <div
          ref={summaryRef}
          role="alert"
          tabIndex={-1}
          className="mb-6 rounded-lg border border-error/40 bg-error/[0.05] p-4 focus:outline-none"
        >
          <p className="mb-2 flex items-center gap-2 text-[0.875rem] font-bold text-error">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="8" cy="8" r="6.4" />
              <path d="M8 4.8v4" />
              <circle cx="8" cy="11.2" r="0.2" fill="currentColor" />
            </svg>
            There is a problem — the form was not saved
          </p>
          <ul className="space-y-1">
            {problems.map((p, i) => (
              <li key={`${p.anchor}-${i}`} className="text-[0.8125rem] leading-relaxed">
                <button
                  type="button"
                  onClick={() => focusAnchor(p.anchor)}
                  className="text-left font-medium text-error underline decoration-error/40 underline-offset-2 transition-colors hover:decoration-error"
                >
                  {p.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {children}
    </form>
  );
}
