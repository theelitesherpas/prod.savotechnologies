"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Image mask reveal: the frame wipes upward while the photo settles from
 * a slight over-scale. Static (fully visible) under reduced motion / no-JS.
 *
 * Same trigger geometry as Reveal (early, low threshold) plus a scroll
 * listener fallback: if the IO hasn't fired within two scroll events past
 * the element, it fires unconditionally - an image reveal must never
 * get stuck behind a threshold edge case.
 */
export function ImageReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-inview");
      return;
    }

    let fired = false;
    const reveal = () => {
      if (fired) return;
      fired = true;
      el.classList.add("is-inview");
      window.removeEventListener("scroll", onScroll, true);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal();
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.02 },
    );
    io.observe(el);

    // Fallback: after 2 scroll ticks past the element, fire regardless
    let scrollCount = 0;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        scrollCount++;
        if (scrollCount >= 2) reveal();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });

    // Also check on mount (element may already be in viewport)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      // already visible on load — brief delay so the wipe reads as motion
      const t = setTimeout(reveal, 200);
      return () => {
        clearTimeout(t);
        io.disconnect();
        window.removeEventListener("scroll", onScroll, true);
      };
    }

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("img-reveal", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
