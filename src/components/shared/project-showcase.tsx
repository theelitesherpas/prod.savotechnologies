/**
 * Project showcase — the big cinematic visual band that opens a case-study
 * dossier (the appinventiv-style "hero image" moment, in the v6 grammar).
 *
 * A dark product stage: radial glow tinted from the project's own palette,
 * the bespoke mockup (or the attached hero image) blown up large and
 * centered, hairline caption row with the design-concept badge. Pure SVG /
 * CSS — scales to any viewport without losing crispness.
 */

import { ProjectMockup, type MockupSwatch } from "./project-mockup";
import { cn } from "@/lib/utils";

function parseHex(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function ProjectShowcase({
  discipline,
  palette,
  heroImage,
  isDemo,
  caption,
  title,
  className,
}: {
  discipline: string;
  palette: MockupSwatch[];
  heroImage?: { dataUrl: string; alt?: string } | null;
  isDemo?: boolean;
  caption?: string;
  title?: string;
  className?: string;
}) {
  // Glow tint: the palette's most saturated color (fallback: brand accent).
  const valid = palette.filter((p) => /^#[0-9a-fA-F]{6}$/.test(p.hex));
  let glow = "rgb(232 73 15)";
  if (valid.length >= 2) {
    const cols = valid.map((p) => ({ ...parseHex(p.hex), hex: p.hex }));
    const sat = (c: { r: number; g: number; b: number }) => Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
    const byLum = [...cols].sort(
      (a, b) => 0.2126 * a.r + 0.7152 * a.g + 0.0722 * a.b - (0.2126 * b.r + 0.7152 * b.g + 0.0722 * b.b),
    );
    const mids = byLum.slice(1, -1);
    glow = (mids.length ? [...mids].sort((a, b) => sat(b) - sat(a))[0] : byLum[1] ?? byLum[0]).hex;
  }

  return (
    <section
      aria-label={title ? `${title} showcase` : "Project showcase"}
      className={cn("relative overflow-hidden border-b border-border", className)}
      style={{ backgroundColor: "#101319" }}
    >
      {/* Stage glow — tinted from the project palette */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at 50% 0%, ${glow}33 0%, transparent 55%), radial-gradient(80% 70% at 50% 100%, ${glow}1f 0%, transparent 60%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(238 240 244 / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(238 240 244 / 0.04) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* The big visual — spans the full content column (the shell),
          aligned with every other section's content outline */}
      <div className="shell relative">
        {heroImage ? (
          // Full shell width; the 82vh cap keeps the band cinematic on
          // short screens (object-cover trims, never stretches — the
          // studio already crops to exact 16:9).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage.dataUrl}
            alt={heroImage.alt || (title ? `${title} — project visual` : "Project visual")}
            className="block max-h-[82vh] w-full rounded-[2px] border border-white/10 object-cover drop-shadow-[0_40px_80px_rgb(0_0_0/0.45)]"
          />
        ) : (
          <div className="w-full drop-shadow-[0_40px_80px_rgb(0_0_0/0.45)]">
            <ProjectMockup
              discipline={discipline}
              palette={palette}
              className="!bg-transparent"
            />
          </div>
        )}

        {/* Caption row — same column */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-5">
          <p className="t-caption flex items-center gap-3 text-white/60">
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0" style={{ backgroundColor: glow }} />
            {caption ?? "Representative product views"}
          </p>
          {isDemo ? (
            <span className="t-label border border-white/25 px-2.5 py-1.5 text-white/85 backdrop-blur-[2px]">
              Design concept
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
