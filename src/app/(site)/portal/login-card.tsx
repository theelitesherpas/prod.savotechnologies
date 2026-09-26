"use client";

import { clientLoginAction } from "@/app/portal/actions";
import { FormGuard } from "@/components/admin/form-guard";

/**
 * Portal sign-in card - embedded in the /portal hero (right column).
 * Compact: email + password + submit, inline error from ?e=, link for
 * clients who need their credentials re-issued.
 */
export function PortalLoginCard({ error }: { error?: string }) {
  return (
    <div className="relative border border-border bg-surface p-8 sm:p-10">
      <div className="flex items-center justify-between">
        <p className="t-label text-muted">Client sign-in</p>
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-1.5 w-1.5 bg-accent schem-pulse" />
          <span className="h-1.5 w-1.5 bg-border" />
          <span className="h-1.5 w-1.5 bg-border" />
        </span>
      </div>

      <h2 className="t-h4 mt-6">Your project, live.</h2>
      <p className="t-caption mt-2 text-muted">
        Status, milestones, deliverables and payments - the same view our delivery leads use.
      </p>

      {error ? (
        <p role="alert" className="t-caption mt-5 border-l-2 border-accent bg-[rgb(232_73_15/0.08)] px-3.5 py-2.5 text-foreground/90">
          {error}
        </p>
      ) : null}

      <FormGuard action={clientLoginAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="pt-email" className="t-label mb-1.5 block text-muted">
            Email
          </label>
          <input
            id="pt-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            required
            maxLength={120}
            spellCheck={false}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="pt-password" className="t-label mb-1.5 block text-muted">
            Password
          </label>
          <input
            id="pt-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            className="field"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[2px] bg-foreground px-5 text-[0.875rem] font-semibold text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
        >
          Sign in to the portal
          <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
          </svg>
        </button>
      </FormGuard>

      <p className="t-caption mt-5 text-muted">
        First time here or locked out?{" "}
        <a href="mailto:hello@savotechnologies.com" className="text-foreground underline-offset-4 hover:text-accent hover:underline">
          hello@savotechnologies.com
        </a>
      </p>
    </div>
  );
}
