import { ImageResponse } from "next/og";

/**
 * Default social card (1200×630) for every route that does not define its
 * own og:image (industry detail pages override with photography).
 * Statically generated at build time - no runtime cost. Visual language
 * mirrors the site's design system: warm paper, blue-black ink, one
 * vermilion signal, mono measurement labels.
 */

export const alt =
  "Savo Technologies, web, mobile, AI and digital product development";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f7f5f0",
          padding: "72px 84px",
          fontFamily: "sans-serif",
        }}
      >
        {/* mono positioning label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#565449",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: 14, height: 14, backgroundColor: "#d9480f", display: "flex" }} />
          Savo Technologies · Engineering Dossier
        </div>

        {/* headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#17171a",
            fontSize: 68,
            lineHeight: 1.12,
            letterSpacing: -1,
            maxWidth: 900,
            fontWeight: 600,
          }}
        >
          <div>We design and engineer</div>
          <div style={{ display: "flex" }}>
            what&apos;s next<span style={{ color: "#d9480f" }}>.</span>
          </div>
        </div>

        {/* capability line */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(23,23,26,0.2)",
            paddingTop: 28,
            color: "#565449",
            fontSize: 24,
            letterSpacing: 2,
          }}
        >
          <div style={{ display: "flex", gap: 36 }}>
            <span>WEB</span>
            <span>·</span>
            <span>MOBILE</span>
            <span>·</span>
            <span>AI</span>
            <span>·</span>
            <span>SOFTWARE</span>
            <span>·</span>
            <span>DESIGN</span>
          </div>
          <div style={{ color: "#17171a", fontSize: 24 }}>savotechnologies.com</div>
        </div>
      </div>
    ),
    size,
  );
}
