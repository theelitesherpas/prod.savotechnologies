"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Lenis smooth scroll provider - butter-smooth inertial scrolling
 * site-wide. Integrates with GSAP ScrollTrigger when present.
 * Disabled under prefers-reduced-motion.
 */
/** Minimal structural types for the globals GSAP registers as a UMD tag. */
type GsapWindow = Window & {
  gsap?: { ticker: { add: (cb: (time: number) => void) => void; remove: (cb: (time: number) => void) => void; lagSmoothing: (ms: number) => void } };
  ScrollTrigger?: { update: () => void };
};

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<import("lenis").default | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let rafId: number | null = null;
    let gsapTicker: { add: (cb: (time: number) => void) => void; remove: (cb: (time: number) => void) => void; lagSmoothing: (ms: number) => void } | null = null;
    let gsapTick: ((time: number) => void) | null = null;
    let scrollUpdate: (() => void) | null = null;

    import("lenis").then(({ default: L }) => {
      if (disposed) return;
      const lenis = new L({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
      });
      lenisRef.current = lenis;

      // integrate with ScrollTrigger if GSAP is loaded
      const w = window as GsapWindow;
      if (w.gsap && w.ScrollTrigger) {
        scrollUpdate = w.ScrollTrigger.update;
        lenis.on("scroll", scrollUpdate);
        gsapTicker = w.gsap.ticker;
        gsapTick = (time: number) => lenis.raf(time * 1000);
        gsapTicker.add(gsapTick);
        gsapTicker.lagSmoothing(0);
      } else {
        const loop = (time: number) => {
          if (disposed) return;
          lenis.raf(time);
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      }
    });

    return () => {
      disposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (gsapTicker && gsapTick) gsapTicker.remove(gsapTick);
      if (scrollUpdate) lenisRef.current?.off("scroll", scrollUpdate);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
