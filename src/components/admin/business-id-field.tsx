"use client";

import { useEffect, useRef, useState } from "react";
import { reserveBusinessIdAction } from "@/app/admin/(protected)/business-ids/actions";

type DraftType = "CS" | "PR" | "IN";
type Result = { type: DraftType; resetKey: number; attempt: number; id?: string; error?: string };
/** A durable, copyable ID BEFORE creation. Session storage retains this browser
 * draft across refreshes; the server scopes its idempotency key to the actor. */
export function BusinessIdField({ type, label, id, resetKey = 0 }: { type: DraftType; label: string; id: string; resetKey?: number }) {
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [copiedId, setCopiedId] = useState("");
  const [copyError, setCopyError] = useState("");
  const requestKey = useRef<string | null>(null);
  const current = result?.type === type && result.resetKey === resetKey && result.attempt === attempt ? result : null;
  const businessId = current?.id ?? "";
  const storageKey = `savo:business-id-draft:${type}`;

  useEffect(() => {
    let active = true;
    function key(usedKey?: string): string {
      let stored = requestKey.current;
      try { stored = sessionStorage.getItem(storageKey) || stored; } catch { /* in-memory fallback */ }
      if (!stored || stored === usedKey) {
        stored = crypto.randomUUID(); // idempotency token, NEVER a business ID
        try { sessionStorage.setItem(storageKey, stored); } catch { /* keep this form open */ }
      }
      requestKey.current = stored;
      return stored;
    }
    async function load() {
      try {
        let token = key();
        for (let i = 0; i < 3; i++) {
          const response = await reserveBusinessIdAction(type, token);
          if (!active) return;
          if (!response.ok) { setResult({ type, resetKey, attempt, error: response.error }); return; }
          if (!response.used) { setResult({ type, resetKey, attempt, id: response.id }); return; }
          token = key(token); // successfully saved drafts need a NEW reservation
        }
        throw new Error("Draft changed in another tab.");
      } catch {
        if (active) setResult({ type, resetKey, attempt, error: "Unable to reserve an ID. Please retry, or reload if this draft changed in another tab." });
      }
    }
    void load();
    return () => { active = false; };
  }, [type, resetKey, attempt, storageKey]);

  async function copy() {
    try { await navigator.clipboard.writeText(businessId); setCopiedId(businessId); setCopyError(""); }
    catch { setCopyError("Select the ID above and copy it manually."); }
  }
  return <div className="min-w-0" aria-busy={!current}>
    <label className="adm-label mb-1.5 block" htmlFor={id}>{label}</label>
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <input id={id} readOnly value={businessId || (current?.error ? "ID unavailable" : "Reserving your ID…")} className="adm-input min-w-0 w-full tnum sm:flex-1" aria-describedby={`${id}-help`} data-business-id-input/>
      <button type="button" disabled={!businessId} onClick={copy} aria-label={`Copy ID: ${label}`} className="min-h-11 shrink-0 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50">Copy ID</button>
    </div>
    <input type="hidden" name="reservedBusinessId" value={businessId}/>
    <input type="hidden" name="businessReservationRequired" value="1"/>
    <p id={`${id}-help`} className="mt-2 text-xs leading-relaxed text-muted" role={current?.error ? "alert" : "status"} aria-live="polite">
      {current?.error ? current.error : !businessId ? "Reserving the exact ID you will use when you save." : `${copiedId === businessId ? "Copied. " : ""}This exact ID is reserved for this draft. You can use it now; saving keeps it. Unused reservations are not recycled.`}
    </p>
    {copyError && businessId ? <p className="mt-1 text-xs text-muted" role="status">{copyError}</p> : null}
    {current?.error ? <button type="button" className="mt-2 min-h-11 rounded-lg border border-border px-3 text-sm font-medium" onClick={() => setAttempt(value => value + 1)}>Retry reserving ID</button> : null}
    <noscript><p>Enable JavaScript to reserve an ID before creating this record.</p></noscript>
  </div>;
}
