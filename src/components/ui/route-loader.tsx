"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SAVO_LETTER_PATHS, SAVO_COMPACT_VIEWBOX } from "@/components/shared/savo-logo";
import { cn } from "@/lib/utils";

/**
 * RouteLoader — the branded page-transition veil.
 *
 * Arms on internal link clicks and history navigation, but only becomes
 * VISIBLE once the navigation has actually taken time (≥ 230ms), so
 * prefetch-backed instant transitions never flash anything. While the
 * next page streams in, the compact SAVO wordmark draws its vermilion
 * fill left-to-right; when the route commits the fill completes and the
 * veil fades out. Hard 10s ceiling, and the veil blocks pointer events
 * while visible so a slow load cannot be double-navigated.
 *
 * Not annoying, by construction:
 *  - invisible for fast navigations (the delay gate)
 *  - eased sweep (fast start, gentle settle) — never a spinner's loop
 *  - completes to full before fading — the mark always finishes its word
 *  - fully static under prefers-reduced-motion
 */

const SHOW_DELAY_MS = 320; // navigation must take at least this long to show
const SWEEP_MS = 2600; // fill 0 → 86% while loading (eased)
const FILL_WHILE_LOADING = 0.86;
const COMPLETE_MS = 320; // 86% → 100% on arrival
const HOLD_MS = 240; // admire the completed wordmark
const MAX_WAIT_MS = 10_000; // hard ceiling

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export function RouteLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [fill, setFill] = useState(0);

  const armedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sweepRaf = useRef<number | null>(null);
  const startedAt = useRef(0);
  const shownAt = useRef(0);
  const finishing = useRef(false);

  const cancelTimers = useCallback(() => {
    if (armedTimer.current) clearTimeout(armedTimer.current);
    armedTimer.current = null;
    if (sweepRaf.current !== null) cancelAnimationFrame(sweepRaf.current);
    sweepRaf.current = null;
  }, []);

  const sweep = useCallback(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => {
      const elapsed = performance.now() - shownAt.current;
      setFill(reduce ? FILL_WHILE_LOADING : Math.min(1, easeOutQuart(elapsed / SWEEP_MS)) * FILL_WHILE_LOADING);
      if (elapsed < SWEEP_MS && !finishing.current) {
        sweepRaf.current = requestAnimationFrame(tick);
      }
    };
    sweepRaf.current = requestAnimationFrame(tick);
  }, []);

  const completeAndFade = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    cancelTimers();
    if (!shownAt.current) {
      // never became visible — reset silently
      setVisible(false);
      setClosing(false);
      setFill(0);
      return;
    }
    const from = fill;
    const t0 = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / COMPLETE_MS);
      setFill(reduce ? 1 : from + (1 - from) * easeOutQuart(t));
      if (t < 1) {
        sweepRaf.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setClosing(true); // triggers the CSS fade
          setTimeout(() => {
            setVisible(false);
            setClosing(false);
            setFill(0);
            shownAt.current = 0;
            finishing.current = false;
          }, 380);
        }, HOLD_MS);
      }
    };
    sweepRaf.current = requestAnimationFrame(tick);
  }, [cancelTimers, fill]);

  /* Arm on internal link clicks (capture — before any stopPropagation) */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || a.hasAttribute("download") || a.target === "_blank") return;
      if (/^(mailto:|tel:|javascript:|sms:)/i.test(href)) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && !url.hash && !window.location.hash) return;

      // Navigation armed — show the veil only if it takes time
      cancelTimers();
      finishing.current = false;
      startedAt.current = performance.now();
      armedTimer.current = setTimeout(() => {
        shownAt.current = performance.now();
        setVisible(true);
        sweep();
      }, SHOW_DELAY_MS);
    };
    const onPop = () => {
      cancelTimers();
      finishing.current = false;
      armedTimer.current = setTimeout(() => {
        shownAt.current = performance.now();
        setVisible(true);
        sweep();
      }, SHOW_DELAY_MS);
    };
    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
      window.removeEventListener("popstate", onPop);
    };
  }, [cancelTimers, sweep]);

  /* Route committed → complete the wordmark and fade */
  useEffect(() => {
    if (startedAt.current) completeAndFade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* Hard ceiling — never trap the visitor */
  useEffect(() => {
    if (!visible) return;
    const left = MAX_WAIT_MS - (performance.now() - startedAt.current);
    const t = setTimeout(completeAndFade, Math.max(0, left));
    return () => clearTimeout(t);
  }, [visible, completeAndFade]);

  useEffect(() => cancelTimers, [cancelTimers]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "route-veil fixed inset-0 z-[95] flex items-center justify-center bg-background/75 backdrop-blur-[6px] transition-opacity duration-[380ms] ease-[var(--ease-out-expo)]",
        closing ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <svg
        viewBox={SAVO_COMPACT_VIEWBOX}
        className="h-auto w-[clamp(7.5rem,13vw,9.5rem)]"
        role="img"
        aria-label="Loading"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ghost letters — the word, waiting */}
        {SAVO_LETTER_PATHS.map((d, i) => (
          <path key={`g-${i}`} fillRule="evenodd" clipRule="evenodd" d={d} fill="rgb(23 23 26 / 0.13)" />
        ))}
        {/* Vermilion fill, revealed left to right */}
        <g style={{ clipPath: `inset(0 ${((1 - fill) * 100).toFixed(2)}% 0 0)` }}>
          {SAVO_LETTER_PATHS.map((d, i) => (
            <path key={`f-${i}`} fillRule="evenodd" clipRule="evenodd" d={d} fill="var(--accent)" />
          ))}
        </g>
      </svg>
    </div>
  );
}
