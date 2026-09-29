"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * SuccessDialog: the confirmation moment for high-stakes form submissions
 * (applications, enquiries). A centred paper panel over the dimmed page:
 * a drawn check, the house serif headline, expectation-setting copy and
 * the condensed next steps, with the full dialog idiom the enquiry drawer
 * established (ESC, focus trap, scroll lock, aria).
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type SuccessStep = { step: string; title: string; text: string };

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

/** The drawn check: circle first, then the tick, expo-eased. Static
 *  under prefers-reduced-motion (see globals.css). */
function SuccessCheck({ size = 72 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center bg-surface-2"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" width={size * 0.62} height={size * 0.62} fill="none">
        <circle
          className="success-draw-ring"
          cx="32" cy="32" r="27"
          stroke="var(--success)" strokeOpacity="0.35"
          strokeWidth="2" strokeLinecap="round"
          strokeDasharray="170"
        />
        <path
          className="success-draw-tick"
          d="M20 33.5l8 8 16-17"
          stroke="var(--success)"
          strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="36"
        />
      </svg>
    </span>
  );
}

export function SuccessDialog({
  open,
  onClose,
  eyebrow,
  title,
  children,
  steps,
  email,
  primaryLabel = "Done",
  contactEmail,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  children: ReactNode;
  steps?: SuccessStep[];
  /** Shown as "A confirmation is on its way to {email}." */
  email?: string;
  primaryLabel?: string;
  /** Rendered as a quiet mailto under the primary action. */
  contactEmail?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  /* Portal-mount guard without setState-in-effect: false on the server
     and during hydration, true on the client after mount. */
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

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
  }, [open, onClose]);

  /* Portal to body: fixed-positioned overlays break when an ancestor
     (Reveal sections) has a transform - it becomes the containing block. */
  if (!mounted) return null;

  return createPortal(
    <div
      inert={!open}
      className={cn(
        "fixed inset-0 z-[110]",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-live="polite"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-[rgb(10_10_12/0.55)] backdrop-blur-[3px] transition-opacity duration-500 ease-[var(--ease-out-expo)]",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Panel */}
      <div className="absolute inset-0 flex items-end justify-center p-4 sm:items-center">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
          className={cn(
            "max-h-[88dvh] w-full max-w-[30rem] overflow-y-auto border border-border bg-background px-7 py-9 text-foreground shadow-[0_24px_80px_rgb(10_10_14/0.3)] transition-all duration-500 ease-[var(--ease-out-expo)] sm:px-10 sm:py-11",
            open
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-[0.97] opacity-0",
          )}
        >
          <div className="success-draw">
            <SuccessCheck />
          </div>

          <p className="t-label tnum mt-7 text-muted">{eyebrow}</p>
          <h2 id="success-title" className="t-h2 mt-2">
            {title}
          </h2>

          <div className="t-sm mt-4 text-muted">{children}</div>

          {email ? (
            <p className="t-caption mt-4 text-muted">
              A confirmation is on its way to{" "}
              <span className="font-mono text-foreground">{email}</span>.
            </p>
          ) : null}

          {steps && steps.length > 0 ? (
            <ol className="mt-7 divide-y divide-border border-y border-border">
              {steps.map((s) => (
                <li key={s.step} className="flex gap-4 py-3 first:pt-4 last:pb-4">
                  <span className="t-label tnum mt-0.5 shrink-0 text-accent">{s.step}</span>
                  <div>
                    <p className="t-sm font-semibold text-foreground">{s.title}</p>
                    <p className="t-caption mt-0.5 leading-relaxed text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          <div className="mt-8 flex flex-col gap-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-[3.25rem] items-center justify-center rounded-[2px] bg-foreground px-7 text-base font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
            >
              {primaryLabel}
            </button>
            {contactEmail ? (
              <p className="t-caption text-center text-muted">
                Questions meanwhile?{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="link-underline font-semibold text-foreground"
                >
                  {contactEmail}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
