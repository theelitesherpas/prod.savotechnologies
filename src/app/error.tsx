"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary — v6 styled, never exposes internals.
 * The error object is logged client-side for diagnostics only.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route-error]", error.message, error.digest ?? "");
  }, [error]);

  return (
    <section className="chapter-ink flex min-h-[100svh] items-center bg-background text-foreground">
      <div className="shell py-24">
        <div className="mb-12 flex items-center gap-4">
          <span className="t-label tnum text-muted">500</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>
        <h1 className="t-statement max-w-[16ch]">
          Something interrupted this page
          <span aria-hidden="true" className="text-accent">.</span>
        </h1>
        <p className="t-body-lg mt-8 max-w-lg text-muted">
          An unexpected error occurred while rendering. Try again — if it
          persists, the homepage still carries the full picture and the
          enquiry desk is open.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <button
            onClick={reset}
            className="inline-flex h-[3.25rem] items-center rounded-[2px] bg-foreground px-7 text-base font-semibold text-background transition-colors duration-300 hover:bg-accent hover:text-on-accent"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-[3.25rem] items-center rounded-[2px] border border-foreground/30 px-7 text-base font-semibold transition-colors duration-300 hover:border-foreground"
          >
            Back to the homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
