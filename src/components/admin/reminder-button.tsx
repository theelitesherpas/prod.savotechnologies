"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import type { ReminderResult } from "@/lib/reminder-policy";

/** An email is an external side effect: native modal confirmation, focus
 * containment/Escape, pending protection and no optimistic "sent" claim. */
export function ReminderButton({ id, revision, label, description, sendAction, compact = false }: {
  id: string; revision: string; label: string; description: string;
  sendAction: (form: FormData) => Promise<ReminderResult>; compact?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId(), descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [result, submit, pending] = useActionState(async (_previous: ReminderResult | null, form: FormData) => {
    let response: ReminderResult;
    try { response = await sendAction(form); }
    catch { response = { ok: false, message: "The reminder request could not be completed. Refresh and review delivery history before retrying." }; }
    dialog.current?.close();
    setOpen(false);
    return response;
  }, null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  return <form action={submit} aria-busy={pending} className="max-w-sm">
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="revision" value={revision} />
    <button type="button" aria-haspopup="dialog" disabled={pending} onClick={() => { dialog.current?.showModal(); setOpen(true); }}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-foreground bg-foreground text-background transition-colors hover:bg-foreground/85 disabled:cursor-wait disabled:opacity-60 ${compact ? "px-3 text-xs font-semibold" : "px-4 text-sm font-semibold"}`}>
      {pending ? "Sending reminder…" : label}
    </button>
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onClose={() => setOpen(false)} onCancel={event => { if (pending) event.preventDefault(); }}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto overscroll-contain rounded-xl border border-border bg-background p-6 text-foreground shadow-xl backdrop:bg-black/45">
      <h2 id={titleId} className="text-lg font-semibold">Send a reminder email?</h2>
      <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
      <p className="mt-3 text-xs leading-relaxed text-muted">The email goes to the saved client address. A 15-minute cooldown prevents accidental repeats.</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" disabled={pending} onClick={() => dialog.current?.close()} className="adm-btn-secondary min-h-11 px-4">Cancel</button>
        <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-lg bg-foreground px-4 text-sm font-semibold text-background disabled:cursor-wait disabled:opacity-60">{pending ? "Sending…" : "Send reminder email"}</button>
      </div>
    </dialog>
    {result ? <p role={result.ok ? "status" : "alert"} className={`mt-2 max-w-xs text-xs leading-relaxed ${result.ok ? "text-muted" : "text-error"}`}>{result.message}</p> : null}
  </form>;
}
