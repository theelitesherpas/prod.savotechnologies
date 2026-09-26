"use client";

/**
 * Global error boundary - replaces the full document when the root layout
 * itself throws. Minimal by design (no shared chrome can be assumed).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[global-error]", error.message, error.digest ?? "");

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          background: "#f5f4f0",
          color: "#101319",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: "34rem", padding: "2rem" }}>
          <p style={{ letterSpacing: "0.08em", fontSize: "0.75rem", opacity: 0.6, margin: 0 }}>
            SAVO TECHNOLOGIES
          </p>
          <h1 style={{ fontSize: "1.75rem", margin: "1rem 0" }}>
            The site hit an unexpected error.
          </h1>
          <p style={{ opacity: 0.7, lineHeight: 1.6 }}>
            Nothing was lost, reload the page or return in a moment. If the
            problem persists, reach us at hello@savotechnologies.com.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              height: "3rem",
              padding: "0 1.75rem",
              background: "#101319",
              color: "#f5f4f0",
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
