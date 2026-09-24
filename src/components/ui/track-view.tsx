"use client";

import { useEffect, useRef } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

type TrackViewProps = {
  event: AnalyticsEvent;
  data?: Record<string, unknown>;
  /** Fire once after this many ms of the element being visible. */
  dwellMs?: number;
};

/**
 * Engagement beacon: fires an analytics event once the wrapped region
 * has been meaningfully visible. Render children via a wrapper div.
 */
export function TrackView({ event, data, dwellMs = 1500, children }: TrackViewProps & { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            timer = setTimeout(() => track(event, data), dwellMs);
            io.disconnect();
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- event identity is stable per usage
  }, []);

  return <div ref={ref}>{children}</div>;
}
