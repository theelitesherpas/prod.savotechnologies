"use client";

/**
 * Client-side error reporter - sends bug reports to /api/bug-reports
 * without ever throwing or blocking the page.
 */

export type ReportOptions = {
  type: "error" | "404" | "api_error" | "user_report";
  message: string;
  details?: string;
  context?: Record<string, unknown>;
};

export function reportBug(opts: ReportOptions): void {
  try {
    const payload = JSON.stringify({
      type: opts.type,
      message: opts.message,
      details: opts.details,
      url: window.location.href,
      referrer: document.referrer || undefined,
      context: {
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timestamp: new Date().toISOString(),
        ...opts.context,
      },
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/bug-reports", new Blob([payload], { type: "application/json" }));
    } else {
      void fetch("/api/bug-reports", {
        method: "POST",
        body: payload,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      }).catch(() => undefined);
    }
  } catch {
    // Reporting must never break the page.
  }
}

/** Report an uncaught React error (from error boundaries). */
export function reportReactError(error: Error & { digest?: string }): void {
  reportBug({
    type: "error",
    message: error.message || "React render error",
    details: [
      error.stack?.slice(0, 4000) ?? "",
      error.digest ? `\nDigest: ${error.digest}` : "",
    ].join("\n"),
  });
}

/** Report a 404 (from the not-found page). */
export function report404(): void {
  reportBug({
    type: "404",
    message: `404: ${window.location.pathname}`,
  });
}

/** Report a failed API call. */
export function reportApiError(url: string, status: number, body?: string): void {
  reportBug({
    type: "api_error",
    message: `API ${status}: ${url}`,
    details: body?.slice(0, 2000),
  });
}
