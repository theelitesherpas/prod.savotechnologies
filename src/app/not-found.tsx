"use client";

import Link from "next/link";
import { useEffect } from "react";
import { report404 } from "@/lib/report";

/**
 * Designed fallback for future routes (services, industries, hire, careers,
 * legal…) - v6 rolls out section by section, so menu architecture can ship
 * ahead of the pages without a broken experience.
 */
export default function NotFound() {
  useEffect(() => {
    report404();
  }, []);
  return (
    <section className="chapter-ink flex min-h-[100svh] items-center bg-background text-foreground">
      <div className="shell py-24">
        <div className="mb-12 flex items-center gap-4">
          <span className="t-label tnum text-muted">404</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>
        <h1 className="t-statement max-w-[16ch]">
          This page is still in production
          <span aria-hidden="true" className="text-accent">.</span>
        </h1>
        <p className="t-body-lg mt-8 max-w-lg text-muted">
          The new Savo site is rolling out section by section. The page you
          requested is on the roadmap, in the meantime, the homepage carries
          the full picture, or start your project directly.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/"
            className="group/btn inline-flex h-[3.25rem] items-center gap-2.5 rounded-[2px] bg-foreground px-7 text-base font-semibold text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
          >
            Back to the homepage
            <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:-translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M13 7H2M6.5 2.5 2 7l4.5 4.5" />
            </svg>
          </Link>
          <Link
            href="/#start"
            className="inline-flex h-[3.25rem] items-center rounded-[2px] border border-foreground/30 px-7 text-base font-semibold transition-colors duration-300 hover:border-foreground hover:bg-foreground/[0.05]"
          >
            Start a Project
          </Link>
        </div>
      </div>
    </section>
  );
}
