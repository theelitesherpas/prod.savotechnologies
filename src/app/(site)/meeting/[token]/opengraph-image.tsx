import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Schedule Your Meeting with Savo Technologies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded OG image for meeting scheduling links shared on WhatsApp/social. */
export default async function MeetingOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #17171a 0%, #1e1e22 50%, #25252a 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #c2410c, #d9480f)",
          }}
        />

        {/* Calendar icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 24,
            border: "2px solid #d9480f55",
            background: "#d9480f15",
            marginBottom: 32,
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d9480f"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.2,
            letterSpacing: -1,
          }}
        >
          Schedule Your Meeting
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#888",
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Pick a date and time that works for you
        </div>

        {/* Brand footer */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              background: "#d9480f",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              fontSize: 24,
              color: "#d9480f",
              fontWeight: 600,
              letterSpacing: 2,
            }}
          >
            SAVO TECHNOLOGIES
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
