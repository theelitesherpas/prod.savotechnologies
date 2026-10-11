"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SAVO_LETTER_PATHS, SAVO_COMPACT_VIEWBOX } from "@/components/shared/savo-logo";
import { cn } from "@/lib/utils";

/**
 * RouteLoader: the branded page-transition veil.
 *
 * Arms on internal link clicks and history navigation - but only for real
 * document transitions (pathname change). Same-document soft navigations
 * (in-page anchors, search-only filter links, hash history jumps) never arm:
 * they commit without a pathname change, so a veil there could only hang.
 * Once armed, the veil becomes visible only if the navigation takes ≥600ms,
 * so ordinary short transitions never flash it. The wordmark sweep is a CSS
 * transition (not a frame-by-frame React render); no full-screen blur layer
 * is used. The route commit completes the mark and fades the veil. A hard
 * 10s ceiling keeps a failed navigation from trapping the visitor.
 * Reduced-motion users get a static mark.
 */

export const ROUTE_LOADER_SHOW_DELAY_MS = 600; // avoid flashing the veil during ordinary short transitions
const SWEEP_MS = 2600; // CSS fill transition while the destination loads
const FILL_WHILE_LOADING = 0.86;
const COMPLETE_MS = 320; // 86% → 100% on arrival
const HOLD_MS = 240; // admire the completed wordmark
const MAX_WAIT_MS = 10_000; // hard ceiling

/** Normalize a pathname for comparison: "/services/x/" ≡ "/services/x". */
const normalizePath = (p: string) => {
  const stripped = p.replace(/\/+$/, "");
  return stripped === "" ? "/" : stripped;
};

/** Decide whether a click/popstate is a *document* navigation that should
 * arm the veil. Same-document navigations - in-page anchors (`/#services`,
 * `#context`) and search-only changes (filter links like
 * `/case-studies?category=web`) - must NOT arm: they commit without a
 * pathname change, so the completion effect would never fire and the veil
 * would hang until the 10s ceiling. Instant soft navigations don't need a
 * loader; real cross-page transitions still do. */
export function shouldArmVeil(
  target: { pathname: string; search?: string },
  current: { pathname: string; search: string },
): boolean {
  return normalizePath(target.pathname) !== normalizePath(current.pathname);
}

export function RouteLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [fill, setFill] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const armedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sweepRaf = useRef<number | null>(null);
  const startedAt = useRef(0);
  const shownAt = useRef(0);
  const finishing = useRef(false);
  /** Last committed document location, so popstate can distinguish
   * same-document history jumps (hash) from real back/forward. */
  const committed = useRef({ pathname: "", search: "" });

  const cancelTimers = useCallback(() => {
    if (armedTimer.current) clearTimeout(armedTimer.current);
    armedTimer.current = null;
    if (finishTimer.current) clearTimeout(finishTimer.current);
    finishTimer.current = null;
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = null;
    if (sweepRaf.current !== null) cancelAnimationFrame(sweepRaf.current);
    sweepRaf.current = null;
  }, []);

  const sweep = useCallback(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(reduce);
    setFill(reduce ? FILL_WHILE_LOADING : 0);
    if (!reduce) {
      // Let the initial 0% paint, then transition with CSS instead of rerendering each frame.
      sweepRaf.current = requestAnimationFrame(() => setFill(FILL_WHILE_LOADING));
    }
  }, []);

  const completeAndFade = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    cancelTimers();
    if (!shownAt.current) {
      // Never became visible: reset silently and forget this completed route.
      setVisible(false);
      setClosing(false);
      setFill(0);
      startedAt.current = 0;
      shownAt.current = 0;
      finishing.current = false;
      return;
    }
    setFill(1);
    finishTimer.current = setTimeout(() => {
      setClosing(true);
      fadeTimer.current = setTimeout(() => {
        setVisible(false);
        setClosing(false);
        setFill(0);
        shownAt.current = 0;
        startedAt.current = 0;
        finishing.current = false;
      }, 380);
    }, COMPLETE_MS + HOLD_MS);
  }, [cancelTimers]);

  /* Arm on internal link clicks (capture: before any stopPropagation) */
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
      if (!shouldArmVeil(url, window.location)) return;

      // Navigation armed: show the veil only if it takes time
      cancelTimers();
      finishing.current = false;
      shownAt.current = 0;
      setClosing(false);
      startedAt.current = performance.now();
      armedTimer.current = setTimeout(() => {
        shownAt.current = performance.now();
        setVisible(true);
        sweep();
      }, ROUTE_LOADER_SHOW_DELAY_MS);
    };
    const onPop = () => {
      // Same-document history entries (hash jumps) are not navigations.
      if (!shouldArmVeil(window.location, committed.current)) return;
      cancelTimers();
      finishing.current = false;
      shownAt.current = 0;
      setClosing(false);
      startedAt.current = performance.now();
      armedTimer.current = setTimeout(() => {
        shownAt.current = performance.now();
        setVisible(true);
        sweep();
      }, ROUTE_LOADER_SHOW_DELAY_MS);
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
    committed.current = { pathname: window.location.pathname, search: window.location.search };
    if (startedAt.current) completeAndFade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* Hard ceiling: never trap the visitor */
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
        "route-veil fixed inset-0 z-[95] flex items-center justify-center transition-opacity duration-[380ms] ease-[var(--ease-out-expo)]",
        closing ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      style={{ backgroundColor: "rgb(255 255 255 / 0.9)" }}
    >
      <svg
        viewBox={SAVO_COMPACT_VIEWBOX}
        className="h-auto w-[clamp(7.5rem,13vw,9.5rem)]"
        role="img"
        aria-label="Loading"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ghost letters: the word, waiting */}
        {SAVO_LETTER_PATHS.map((d, i) => (
          <path key={`g-${i}`} fillRule="evenodd" clipRule="evenodd" d={d} fill="rgb(0 0 0 / 0.12)" />
        ))}
        {/* Vermilion fill, revealed left to right */}
        <g style={{
          clipPath: `inset(0 ${((1 - fill) * 100).toFixed(2)}% 0 0)`,
          transition: reducedMotion ? "none" : `clip-path ${fill >= 1 ? COMPLETE_MS : SWEEP_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}>
          {/* Brand vermilion - the approved Savo red, not the legacy global accent */}
          {SAVO_LETTER_PATHS.map((d, i) => (
            <path key={`f-${i}`} fillRule="evenodd" clipRule="evenodd" d={d} fill="#ff3333" />
          ))}
        </g>
      </svg>
    </div>
  );
}
