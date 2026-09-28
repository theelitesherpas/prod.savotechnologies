"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CountUp - animates a number from 0 to the target when it enters the
 * viewport. Handles "50+", "150+" (strips the + suffix, counts, adds it
 * back). Finishes cleanly with no over-bounce (expo.out).
 * Static for reduced-motion, no-JS, and non-numeric values.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(value);
  /* Rare value changes reset display via the React-recommended render-time
     adjustment, so reduced-motion stays static without setState-in-effect. */
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setDisplay(value);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // only animate pure numeric + optional suffix
    const match = value.match(/^(\d+)(.*)$/);
    if (!match) return;

    const target = parseInt(match[1], 10);
    const suffix = match[2];
    if (target === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();

        const dur = 1400;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(2, -10 * t); // expo.out
          setDisplay(Math.round(target * eased) + suffix);
          if (t < 1) requestAnimationFrame(tick);
          else setDisplay(value); // land exactly on the real value
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
