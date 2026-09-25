"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * First-party analytics beacon — one pageview per route change, sent to
 * /api/analytics/collect with sendBeacon (fire-and-forget, survives
 * navigation). Bot UAs are filtered server-side; no raw IP or UA is
 * stored — only a daily salted hash for unique-visitor counts.
 */
export function AnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    const device =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(max-width: 767px)").matches
          ? "mobile"
          : window.matchMedia("(max-width: 1279px)").matches
            ? "tablet"
            : "desktop"
        : null;

    const payload = JSON.stringify({
      type: "pageview",
      path: pathname,
      referrer: document.referrer || undefined,
      device,
      lang: navigator.language || undefined,
    });

    try {
      const url = "/api/analytics/collect";
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      } else {
        void fetch(url, { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      // Never let analytics break the page.
    }
  }, [pathname]);

  return null;
}
