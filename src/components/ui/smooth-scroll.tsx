"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Lenis smooth scroll provider - butter-smooth inertial scrolling
 * site-wide. Integrates with GSAP ScrollTrigger when present.
 * Disabled under prefers-reduced-motion.
 */
/** Minimal structural types for the globals GSAP registers as a UMD tag. */
type GsapWindow = Window & {
  gsap?: { ticker: { add: (cb: (time: number) => void) => void; lagSmoothing: (ms: number) => void } };
  ScrollTrigger?: { update: () => void };
};

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<import("lenis").default | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let Lenis: typeof import("lenis").default;
    import("lenis").then(({ default: L }) => {
      Lenis = L;
      const lenis = new L({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
      });
      lenisRef.current = lenis;

      // integrate with ScrollTrigger if GSAP is loaded
      const w = window as GsapWindow;
      if (w.gsap) {
        const gsap = w.gsap;
        const ScrollTrigger = w.ScrollTrigger;
        if (ScrollTrigger) {
          lenis.on("scroll", ScrollTrigger.update);
          gsap.ticker.add((time: number) => lenis.raf(time * 1000));
          gsap.ticker.lagSmoothing(0);
        } else {
          function raf(time: number) {
            lenis.raf(time);
          }
          requestAnimationFrame(function loop(t: number) {
            lenis.raf(t);
            requestAnimationFrame(loop);
          });
        }
      } else {
        function raf(time: number) {
          lenis.raf(time);
        }
        requestAnimationFrame(function loop(t: number) {
          lenis.raf(t);
          requestAnimationFrame(loop);
        });
      }
    });

    return () => {
      lenisRef.current?.destroy();
    };
  }, []);

  return <>{children}</>;
}
