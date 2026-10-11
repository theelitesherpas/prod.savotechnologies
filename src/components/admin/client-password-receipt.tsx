"use client";

import { useActionState } from "react";
import { revealClientPasswordReceiptAction, type ClientPasswordReceiptState } from "@/app/admin/(protected)/clients/actions";

const initialState: ClientPasswordReceiptState = { status: "idle" };

export function ClientPasswordReceipt({ available }: { available: boolean }) {
  const [state, action, pending] = useActionState(revealClientPasswordReceiptAction, initialState);

  if (state.status === "revealed") {
    return (
      <div className="adm-card space-y-2 p-4" role="status" aria-live="polite">
        <p className="adm-label">Client password</p>
        <p className="t-caption text-muted">Copy this value now and share it through a secure channel.</p>
        <output className="block select-all break-all rounded-md border border-border bg-[var(--surface)] px-3 py-2 font-mono text-sm text-foreground" aria-label="Client password">
          {state.password}
        </output>
      </div>
    );
  }

  if (state.status === "expired" || !available) {
    return (
      <p className="t-caption text-muted" role="status" aria-live="polite">
        The password receipt expired or was already viewed. Reset the client password to generate another one.
      </p>
    );
  }

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-[0.875rem] font-semibold text-foreground transition-colors hover:border-foreground/40 disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? "Loading password…" : "Reveal password"}
      </button>
    </form>
  );
}
