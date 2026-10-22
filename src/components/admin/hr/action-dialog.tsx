"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Native modal supplies focus containment, Escape handling, inert background and focus restoration. */
export function CandidateActionDialog({ label, title, description, children, primary = false, danger = false }: {
  label: string; title: string; description?: string; children: ReactNode; primary?: boolean; danger?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null), titleId = useId(), descriptionId = useId();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  const pending = () => Boolean(dialog.current?.querySelector('button[type="submit"]:disabled'));
  function close() { if (!pending()) dialog.current?.close(); }
  return <>
    <button type="button" aria-haspopup="dialog" onClick={() => { dialog.current?.showModal(); dialog.current?.querySelector<HTMLElement>('select, input:not([type="hidden"]), textarea, button[type="submit"]')?.focus(); setOpen(true); }}
      className={`${primary ? "adm-btn-primary" : "adm-btn-ghost"} w-full justify-center ${danger ? "border-error/40 text-error hover:border-error hover:text-error" : ""}`}>{label}</button>
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
      onClose={() => setOpen(false)} onCancel={event => { if (pending()) event.preventDefault(); }}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter(node => node.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/45">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <h2 id={titleId} className="text-lg font-bold">{title}</h2>
        <button type="button" aria-label={`Close ${title}`} onClick={close} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 5 10 10M15 5 5 15" /></svg>
        </button>
      </div>
      <div className="p-5">{description ? <p id={descriptionId} className="mb-5 text-sm leading-6 text-muted">{description}</p> : null}{children}
        <button type="button" onClick={close} className="mt-4 text-sm font-semibold text-muted underline underline-offset-4 hover:text-foreground">Cancel</button>
      </div>
    </dialog>
  </>;
}
