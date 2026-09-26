"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { reportReactError } from "@/lib/report";

/**
 * Route-level error boundary - v6 styled, never exposes internals.
 * Automatically reports the error to the admin Bug Reports panel and
 * offers the user an optional report with what they were doing.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reported, setReported] = useState(false);
  const [note, setNote] = useState("");
  const [noteSent, setNoteSent] = useState(false);

  useEffect(() => {
    console.error("[route-error]", error.message, error.digest ?? "");
    reportReactError(error);
    setReported(true);
  }, [error]);

  const sendUserReport = () => {
    if (!note.trim()) return;
    import("@/lib/report").then(({ reportBug }) =>
      reportBug({
        type: "user_report",
        message: `User context: ${error.message || "page error"}`,
        details: note.trim().slice(0, 2000),
      }),
    );
    setNoteSent(true);
  };

  return (
    <section className="chapter-ink flex min-h-[100svh] items-center bg-background text-foreground">
      <div className="shell py-24">
        <div className="mb-12 flex items-center gap-4">
          <span className="t-label tnum text-muted">500</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
          {reported ? (
            <span className="t-caption text-muted">Reported to our team</span>
          ) : null}
        </div>
        <h1 className="t-statement max-w-[16ch]">
          Something interrupted this page
          <span aria-hidden="true" className="text-accent">.</span>
        </h1>
        <p className="t-body-lg mt-8 max-w-lg text-muted">
          An unexpected error occurred while rendering. Try again, if it
          persists, the homepage still carries the full picture and the
          enquiry desk is open.
        </p>

        {!noteSent ? (
          <div className="mt-8 max-w-md">
            <label htmlFor="bug-note" className="t-label mb-1.5 block text-muted">
              What were you doing? (helps us fix it faster)
            </label>
            <div className="flex gap-2">
              <input
                id="bug-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. submitting the contact form"
                maxLength={500}
                className="field flex-1"
              />
              <button
                type="button"
                onClick={sendUserReport}
                disabled={!note.trim()}
                className="inline-flex h-11 shrink-0 items-center rounded-[2px] border border-foreground/30 px-4 text-[0.8125rem] font-semibold transition-colors hover:border-foreground disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <p className="t-caption mt-6 text-muted">
            Thank you - your note has been sent to our engineering team.
          </p>
        )}

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
