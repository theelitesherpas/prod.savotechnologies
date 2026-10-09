"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CopyReference — the enquiry reference plate for the thank-you page.
 * Mono typeset value (it will be read aloud and retyped, so it keeps
 * tabular figures), a quiet copy control, and an accessible
 * "Reference copied" confirmation that never shifts layout.
 */

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Non-secure contexts / older browsers: the classic selection fallback.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyReference({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function handleCopy() {
    if (await copyText(value)) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2600);
    }
  }

  return (
    <div className="mt-10 inline-flex w-full max-w-xl flex-col gap-4 border border-border bg-surface px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:py-6">
      <div className="min-w-0">
        <p className="t-label text-muted">Your enquiry reference</p>
        <p className="t-h3 tnum mt-1.5 truncate font-mono text-[1.05rem] tracking-[0.08em] text-foreground">
          {value}
        </p>
      </div>
      <div className="shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Reference copied" : `Copy enquiry reference ${value}`}
          className="inline-flex h-11 min-w-[9.5rem] items-center justify-center gap-2 rounded-[2px] border border-border px-5 text-sm font-semibold text-foreground transition-colors duration-300 ease-[var(--ease-out-expo)] hover:border-accent hover:text-accent"
        >
          {copied ? (
            <>
              <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M1 7.5 5 11.5 13 2.5" />
              </svg>
              Reference copied
            </>
          ) : (
            <>
              <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="4.5" y="4.5" width="8" height="8" />
                <path d="M9.5 4.5v-3h-8v8h3" />
              </svg>
              Copy reference
            </>
          )}
        </button>
        {/* Live confirmation for screen readers (button text swaps are silent) */}
        <span aria-live="polite" className="sr-only">
          {copied ? "Reference copied" : ""}
        </span>
      </div>
    </div>
  );
}
