"use client";

import { useState, type ReactNode } from "react";

/**
 * ConfirmDialog - a proper modal confirmation before destructive or
 * important actions. Renders the trigger button; on click, shows a
 * centered modal with title, description, and Cancel/Confirm buttons.
 * The form action only fires on Confirm.
 */
export function ConfirmDialog({
  label,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  children,
}: {
  label: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger" | "success";
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const confirmColor =
    tone === "danger"
      ? "bg-error text-white hover:bg-error/80"
      : tone === "success"
        ? "bg-green-600 text-white hover:bg-green-700"
        : "bg-foreground text-background hover:bg-accent";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          tone === "danger"
            ? "inline-flex h-10 items-center rounded-lg border border-error/40 px-4 text-[0.8125rem] font-bold text-error transition-colors hover:bg-error hover:text-white"
            : "inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-[0.8125rem] font-bold text-background transition-colors hover:bg-accent"
        }
      >
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  tone === "danger" ? "bg-error/10 text-error" : tone === "success" ? "bg-green-100 text-green-600" : "bg-accent/10 text-accent"
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  {tone === "danger" ? (
                    <>
                      <circle cx="10" cy="10" r="8" />
                      <path d="M10 6v5" />
                      <circle cx="10" cy="13.5" r="0.3" fill="currentColor" stroke="none" />
                    </>
                  ) : (
                    <>
                      <circle cx="10" cy="10" r="8" />
                      <path d="M7 10l2 2 4-4" />
                    </>
                  )}
                </svg>
              </span>
              <h3 id="confirm-title" className="text-[1rem] font-bold text-foreground">
                {title}
              </h3>
            </div>
            {description ? (
              <p className="mb-5 text-[0.8438rem] leading-relaxed text-muted">{description}</p>
            ) : null}
            {children}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[0.8125rem] font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                className={`inline-flex h-10 items-center rounded-lg px-5 text-[0.8125rem] font-bold transition-colors ${confirmColor}`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Wraps ConfirmDialog inside a form so the submit fires the action. */
export function ConfirmAction({
  action,
  id,
  label,
  title,
  description,
  confirmLabel,
  tone,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <ConfirmDialog
        label={label}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        tone={tone}
      />
    </form>
  );
}
