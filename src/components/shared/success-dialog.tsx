"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import styles from "./success-dialog.module.css";

/**
 * Submission confirmation in the current Savo world: white, black, and red,
 * Outfit headings and Inter copy. The existing content, dynamic fields, ESC,
 * focus trap, scroll lock, portal, and dismissal behavior are preserved.
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

function SuccessCheck() {
  return (
    <span aria-hidden="true" className={styles.check}>
      <svg viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="27" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 33.5l8 8 16-17" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
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
    <div inert={!open} className={cn(styles.overlay, !open && styles.closed)} aria-live="polite">
      <div onClick={onClose} className={styles.backdrop} />
      <div className={styles.positioner}>
        <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="success-title" className={styles.panel}>
          <SuccessCheck />
          <p className={styles.context}>{eyebrow}</p>
          <h2 id="success-title" className={styles.title}>{title}</h2>
          <div className={styles.copy}>{children}</div>
          {email ? (
            <p className={styles.email}>
              A confirmation is on its way to{" "}
              <span>{email}</span>.
            </p>
          ) : null}
          {steps && steps.length > 0 ? (
            <ol className={styles.steps}>
              {steps.map((s) => (
                <li key={s.step}>
                  <span className={styles.stepNumber}>{s.step}</span>
                  <div>
                    <p className={styles.stepTitle}>{s.title}</p>
                    <p className={styles.stepCopy}>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.done}>{primaryLabel}</button>
            {contactEmail ? (
              <p className={styles.contact}>
                Questions meanwhile?{" "}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
