"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { report404 } from "@/lib/report";

/**
 * Designed 404 fallback — clean page with popular page links and a
 * 3-second auto-redirect to the homepage (for visitors landing on
 * outdated URLs from backlinks or old bookmarks).
 *
 * UX flow: show a clear "we've redesigned" message + countdown, then
 * redirect. The countdown cancels the instant the user interacts
 * (clicks any link), so nobody is hijacked away from a page they
 * actively chose. The HTTP response still returns a proper 404 status
 * for crawlers — the redirect is client-side only.
 */

const REDIRECT_SECONDS = 3;

const POPULAR = [
  ["Services", "/services"],
  ["Industries", "/industries"],
  ["Case Studies", "/case-studies"],
  ["Insights", "/insights"],
  ["About Savo", "/about"],
  ["Careers", "/careers"],
  ["Contact", "/contact"],
  ["Hire Developers", "/hire"],
  ["AI Agents", "/ai-agents"],
  ["AI Automation", "/ai/automation"],
] as const;

export default function NotFound() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);
  const [cancelled, setCancelled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    report404();
  }, []);

  const cancelRedirect = useCallback(() => {
    setCancelled(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (cancelled) return;
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          router.replace("/");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cancelled, router]);

  return (
    <section className="chapter-ink flex min-h-[100svh] items-center bg-background text-foreground">
      <div className="shell py-24">
        {/* Rail */}
        <div className="mb-12 flex items-center gap-4">
          <span className="t-label tnum text-muted">404</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
          {!cancelled && seconds > 0 ? (
            <span className="t-label tnum text-accent" aria-live="polite">
              Redirecting in {seconds}s
            </span>
          ) : null}
        </div>

        <h1 className="t-statement max-w-[16ch]">
          Our website has been redesigned
          <span aria-hidden="true" className="text-accent">.</span>
        </h1>

        <p className="t-body-lg mt-8 max-w-lg text-muted">
          The page you&apos;re looking for may have moved during our recent
          redesign{!cancelled && seconds > 0 ? (
            <> — taking you to the <Link href="/" className="link-underline font-semibold text-foreground">homepage</Link> in {seconds} second{seconds !== 1 ? "s" : ""}.</>
          ) : (
            <>. The links below will get you anywhere on the new site.</>
          )}
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/"
            onClick={cancelRedirect}
            className="group/btn inline-flex h-[3.25rem] items-center gap-2.5 rounded-[2px] bg-foreground px-7 text-base font-semibold text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
          >
            Go to the homepage now
            <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:-translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M13 7H2M6.5 2.5 2 7l4.5 4.5" />
            </svg>
          </Link>
          <Link
            href="/#start"
            onClick={cancelRedirect}
            className="inline-flex h-[3.25rem] items-center rounded-[2px] border border-foreground/30 px-7 text-base font-semibold transition-colors duration-300 hover:border-foreground hover:bg-foreground/[0.05]"
          >
            Start a Project
          </Link>
          {!cancelled ? (
            <button
              type="button"
              onClick={cancelRedirect}
              className="inline-flex h-[3.25rem] items-center rounded-[2px] px-5 text-base font-medium text-muted transition-colors hover:text-foreground"
            >
              Stay on this page
            </button>
          ) : null}
        </div>

        {/* Progress bar */}
        {!cancelled ? (
          <div className="mt-8 max-w-sm">
            <div className="h-0.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
              <div
                className="h-full rounded-full bg-accent transition-all duration-1000 ease-linear"
                style={{ width: `${((REDIRECT_SECONDS - seconds) / REDIRECT_SECONDS) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Quick links */}
        <div className="mt-14 border-t border-border pt-8" onClick={cancelRedirect}>
          <p className="t-label mb-4 text-muted">Popular pages on the new site</p>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {POPULAR.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="t-sm font-medium text-foreground/70 transition-colors hover:text-accent"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
