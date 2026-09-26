/**
 * Project mockup - bespoke, palette-driven product visuals for the
 * case-study detail pages (demo content policy §9: abstract interface
 * demonstrations only - never real company logos, trademarks or copied
 * dashboards).
 *
 * One component, three disciplines:
 *   web / design    → browser window with a landing page
 *   mobile          → three phone screens (home · detail · conversation)
 *   ai / software / growth → operations dashboard (sidebar, KPIs, charts)
 *
 * Every mockup is tinted from the project's own palette record, so each
 * dossier looks like its own product. Pure presentational SVG - usable on
 * the public site and inside the admin editor's live preview.
 */

import { cn } from "@/lib/utils";

export type MockupSwatch = { name: string; hex: string };

const DEFAULT_PALETTE: MockupSwatch[] = [
  { name: "Ink", hex: "#14161c" },
  { name: "Surface", hex: "#f4f2ec" },
  { name: "Accent", hex: "#e8490f" },
];

type Rgb = { r: number; g: number; b: number; hex: string };

function parseHex(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, hex: hex.toUpperCase() };
}

function resolvePalette(palette: MockupSwatch[]) {
  const valid = palette.filter((p) => /^#[0-9a-fA-F]{6}$/.test(p.hex));
  const cols = (valid.length >= 2 ? valid : DEFAULT_PALETTE).map((p) => parseHex(p.hex));
  const lum = (c: Rgb) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  const byLum = [...cols].sort((a, b) => lum(a) - lum(b));
  const bg = byLum[0];
  const ink = byLum[byLum.length - 1];
  const sat = (c: Rgb) => Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
  const mids = byLum.slice(1, -1);
  const accent = [...mids].sort((a, b) => sat(b) - sat(a))[0] ?? parseHex("#e8490f");
  const tint = (c: Rgb, alpha: number) => `rgb(${c.r} ${c.g} ${c.b} / ${alpha})`;
  const white: Rgb = { r: 255, g: 255, b: 255, hex: "#FFFFFF" };
  return { bg, ink, accent, tint, white };
}

/* ───────────────────────── Browser / landing page ────────────────────────── */

function WebMockup({ palette }: { palette: MockupSwatch[] }) {
  const { bg, ink, accent, tint } = resolvePalette(palette);
  return (
    <svg viewBox="0 0 800 600" role="img" aria-hidden="true" className="h-full w-full">
      <defs>
        <linearGradient id="pm-web-hero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={accent.hex} />
          <stop offset="1" stopColor={ink.hex} />
        </linearGradient>
      </defs>

      {/* Browser frame */}
      <rect x="42" y="34" width="716" height="532" rx="16" fill={bg.hex} stroke={tint(ink, 0.18)} strokeWidth="1.5" />
      <path d="M42 50a16 16 0 0 1 16-16h684a16 16 0 0 1 16 16v28H42Z" fill={tint(ink, 0.06)} />
      <circle cx="68" cy="48" r="4.5" fill={tint(ink, 0.25)} />
      <circle cx="85" cy="48" r="4.5" fill={tint(ink, 0.16)} />
      <circle cx="102" cy="48" r="4.5" fill={tint(ink, 0.1)} />
      <rect x="252" y="39" width="296" height="18" rx="9" fill={tint(ink, 0.07)} />
      <rect x="270" y="45" width="88" height="6" rx="3" fill={tint(ink, 0.16)} />

      {/* Nav */}
      <rect x="70" y="94" width="86" height="13" rx="3" fill={ink.hex} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={430 + i * 58} y="96" width="38" height="9" rx="3" fill={tint(ink, 0.22)} />
      ))}
      <rect x="684" y="88" width="60" height="24" rx="6" fill={accent.hex} />

      {/* Hero */}
      <rect x="70" y="148" width="300" height="22" rx="4" fill={ink.hex} />
      <rect x="70" y="184" width="240" height="22" rx="4" fill={ink.hex} />
      <rect x="70" y="226" width="270" height="9" rx="3" fill={tint(ink, 0.25)} />
      <rect x="70" y="243" width="220" height="9" rx="3" fill={tint(ink, 0.25)} />
      <rect x="70" y="274" width="118" height="34" rx="7" fill={accent.hex} />
      <rect x="198" y="274" width="98" height="34" rx="7" fill="none" stroke={tint(ink, 0.3)} strokeWidth="1.5" />
      <rect x="410" y="140" width="322" height="178" rx="12" fill="url(#pm-web-hero)" />
      <circle cx="640" cy="180" r="26" fill={bg.hex} opacity="0.18" />
      <circle cx="500" cy="270" r="16" fill={bg.hex} opacity="0.25" />
      <path d="M410 296c60-18 120-44 322-34v40a12 12 0 0 1-12 12H422a12 12 0 0 1-12-12Z" fill={bg.hex} opacity="0.12" />

      {/* Product cards */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={70 + i * 224} y="348" width="200" height="152" rx="10" fill={bg.hex} stroke={tint(ink, 0.14)} strokeWidth="1.2" />
          <rect x={82 + i * 224} y="360" width="176" height="76" rx="6" fill={i === 1 ? tint(accent, 0.85) : tint(ink, 0.08)} />
          <rect x={82 + i * 224} y="446" width="110" height="10" rx="3" fill={tint(ink, 0.35)} />
          <rect x={82 + i * 224} y="464" width="70" height="8" rx="3" fill={tint(ink, 0.18)} />
          <rect x={214 + i * 224} y="444" width="44" height="16" rx="8" fill={i === 1 ? accent.hex : tint(ink, 0.1)} />
        </g>
      ))}

      {/* Footer strip */}
      <rect x="70" y="524" width="674" height="10" rx="3" fill={tint(ink, 0.08)} />
      <rect x="70" y="524" width="180" height="10" rx="3" fill={tint(accent, 0.6)} />

      {/* Motif */}
      <rect x="742" y="18" width="16" height="16" fill={accent.hex} />
    </svg>
  );
}

/* ───────────────────────────── Phone trio ────────────────────────────────── */

function MobileMockup({ palette }: { palette: MockupSwatch[] }) {
  const { bg, ink, accent, tint } = resolvePalette(palette);
  const phones = [
    { x: 78, y: 96 },
    { x: 340, y: 56 },
    { x: 602, y: 96 },
  ];
  return (
    <svg viewBox="0 0 900 620" role="img" aria-hidden="true" className="h-full w-full">
      <defs>
        <linearGradient id="pm-mob-img" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={accent.hex} />
          <stop offset="1" stopColor={ink.hex} />
        </linearGradient>
      </defs>

      {phones.map((p, pi) => (
        <g key={pi}>
          {/* Device */}
          <rect x={p.x} y={p.y} width="220" height="452" rx="30" fill={ink.hex} />
          <rect x={p.x + 9} y={p.y + 9} width="202" height="434" rx="22" fill={bg.hex} />
          {/* Notch + status bar */}
          <rect x={p.x + 82} y={p.y + 16} width="56" height="12" rx="6" fill={ink.hex} opacity="0.85" />
          <rect x={p.x + 24} y={p.y + 22} width="26" height="7" rx="2" fill={tint(ink, 0.4)} />
          <rect x={p.x + 170} y={p.y + 22} width="18" height="7" rx="2" fill={tint(ink, 0.25)} />

          {pi === 0 && (
            <g>
              {/* Home */}
              <rect x={p.x + 24} y={p.y + 52} width="120" height="13" rx="3" fill={ink.hex} />
              <rect x={p.x + 24} y={p.y + 76} width="172" height="30" rx="15" fill={tint(ink, 0.07)} />
              <circle cx={p.x + 42} cy={p.y + 91} r="7" fill="none" stroke={tint(ink, 0.3)} strokeWidth="1.6" />
              <rect x={p.x + 58} y={p.y + 87} width="80" height="8" rx="4" fill={tint(ink, 0.14)} />
              <rect x={p.x + 24} y={p.y + 122} width="172" height="120" rx="12" fill="url(#pm-mob-img)" />
              <rect x={p.x + 36} y={p.y + 210} width="84" height="10" rx="3" fill={bg.hex} opacity="0.85" />
              <rect x={p.x + 36} y={p.y + 226} width="56" height="8" rx="3" fill={bg.hex} opacity="0.55" />
              {[0, 1].map((i) => (
                <g key={i}>
                  <rect x={p.x + 24 + i * 90} y={p.y + 258} width="82" height="92" rx="10" fill={bg.hex} stroke={tint(ink, 0.14)} strokeWidth="1.2" />
                  <rect x={p.x + 33 + i * 90} y={p.y + 267} width="64" height="42" rx="6" fill={tint(ink, 0.08)} />
                  <rect x={p.x + 33 + i * 90} y={p.y + 317} width="48" height="8" rx="3" fill={tint(ink, 0.28)} />
                  <rect x={p.x + 33 + i * 90} y={p.y + 331} width="30" height="7" rx="3" fill={tint(ink, 0.15)} />
                </g>
              ))}
              <rect x={p.x + 24} y={p.y + 366} width="172" height="46" rx="10" fill={accent.hex} />
              <rect x={p.x + 56} y={p.y + 385} width="108" height="9" rx="4" fill={bg.hex} opacity="0.9" />
              {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={p.x + 44 + i * 40} y={p.y + 428} width="24" height="5" rx="2.5" fill={tint(ink, 0.15)} />
              ))}
            </g>
          )}

          {pi === 1 && (
            <g>
              {/* Detail */}
              <rect x={p.x + 24} y={p.y + 52} width="172" height="150" rx="12" fill="url(#pm-mob-img)" />
              <circle cx={p.x + 40} cy={p.y + 68} r="11" fill={bg.hex} opacity="0.3" />
              <path d={`M${p.x + 36} ${p.y + 68}l4 4 7-8`} stroke={bg.hex} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <rect x={p.x + 24} y={p.y + 216} width="140" height="14" rx="3" fill={ink.hex} />
              <rect x={p.x + 24} y={p.y + 240} width="172" height="8" rx="3" fill={tint(ink, 0.2)} />
              <rect x={p.x + 24} y={p.y + 256} width="150" height="8" rx="3" fill={tint(ink, 0.2)} />
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <rect x={p.x + 24} y={p.y + 280 + i * 30} width="14" height="14" rx="4" fill={i === 0 ? accent.hex : tint(ink, 0.1)} />
                  <rect x={p.x + 48} y={p.y + 283 + i * 30} width={100 - i * 18} height="8" rx="3" fill={tint(ink, 0.22)} />
                </g>
              ))}
              <rect x={p.x + 24} y={p.y + 382} width="172" height="44" rx="10" fill={accent.hex} />
              <rect x={p.x + 50} y={p.y + 400} width="120" height="9" rx="4" fill={bg.hex} opacity="0.9" />
              <rect x={p.x + 24} y={p.y + 438} width="60" height="5" rx="2.5" fill={tint(ink, 0.15)} />
            </g>
          )}

          {pi === 2 && (
            <g>
              {/* Conversation */}
              <rect x={p.x + 24} y={p.y + 52} width="172" height="10" rx="3" fill={tint(ink, 0.3)} />
              <circle cx={p.x + 34} cy={p.y + 82} r="9" fill={tint(accent, 0.85)} />
              <rect x={p.x + 50} y={p.y + 78} width="70" height="9" rx="3" fill={tint(ink, 0.3)} />
              {[
                { y: 108, w: 120, me: false },
                { y: 146, w: 96, me: true },
                { y: 184, w: 132, me: false },
                { y: 222, w: 78, me: true },
              ].map((b, i) => (
                <g key={i}>
                  <rect
                    x={b.me ? p.x + 196 - b.w : p.x + 24}
                    y={p.y + b.y}
                    width={b.w}
                    height="26"
                    rx={b.me ? "13 13 3 13" : "13 13 13 3"}
                    fill={b.me ? accent.hex : tint(ink, 0.08)}
                  />
                  <rect
                    x={b.me ? p.x + 208 - b.w : p.x + 36}
                    y={p.y + b.y + 9}
                    width={b.w - 30}
                    height="8"
                    rx="4"
                    fill={b.me ? "rgb(255 255 255 / 0.85)" : tint(ink, 0.22)}
                  />
                </g>
              ))}
              <rect x={p.x + 24} y={p.y + 270} width="110" height="72" rx="10" fill={tint(ink, 0.08)} />
              <rect x={p.x + 36} y={p.y + 282} width="86" height="8" rx="3" fill={tint(ink, 0.18)} />
              <rect x={p.x + 36} y={p.y + 298} width="64" height="8" rx="3" fill={tint(ink, 0.14)} />
              <rect x={p.x + 36} y={p.y + 318} width="40" height="12" rx="6" fill={tint(accent, 0.7)} />
              <rect x={p.x + 24} y={p.y + 386} width="140" height="38" rx="19" fill={tint(ink, 0.07)} />
              <circle cx={p.x + 172} cy={p.y + 405} r="15" fill={accent.hex} />
              <path d={`M${p.x + 166} ${p.y + 405}h12M${p.x + 172} ${p.y + 399}v12`} stroke={bg.hex} strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
        </g>
      ))}

      <rect x="866" y="40" width="16" height="16" fill={accent.hex} />
    </svg>
  );
}

/* ───────────────────────────── Dashboard ─────────────────────────────────── */

function DashboardMockup({ palette }: { palette: MockupSwatch[] }) {
  const { bg, ink, accent, tint } = resolvePalette(palette);
  return (
    <svg viewBox="0 0 800 600" role="img" aria-hidden="true" className="h-full w-full">
      <defs>
        <linearGradient id="pm-dash-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent.hex} stopOpacity="0.35" />
          <stop offset="1" stopColor={accent.hex} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Window */}
      <rect x="42" y="34" width="716" height="532" rx="16" fill={bg.hex} stroke={tint(ink, 0.18)} strokeWidth="1.5" />

      {/* Sidebar */}
      <path d="M42 50a16 16 0 0 1 16-16h132v532H58a16 16 0 0 1-16-16Z" fill={ink.hex} />
      <rect x="62" y="60" width="14" height="14" rx="3" fill={accent.hex} />
      <rect x="84" y="64" width="64" height="8" rx="3" fill="rgb(255 255 255 / 0.85)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x="56" y={100 + i * 40} width="118" height="28" rx="7" fill={i === 1 ? tint(accent, 0.9) : "none"} />
          <rect x={i === 1 ? 66 : 68} y={110 + i * 40} width="12" height="12" rx="3" fill={i === 1 ? bg.hex : "rgb(255 255 255 / 0.4)"} />
          <rect x={i === 1 ? 86 : 88} y={113 + i * 40} width={62 - i * 4} height="7" rx="3" fill={i === 1 ? bg.hex : "rgb(255 255 255 / 0.45)"} />
        </g>
      ))}

      {/* Top bar */}
      <rect x="206" y="58" width="220" height="24" rx="12" fill={tint(ink, 0.06)} />
      <circle cx="224" cy="70" r="6" fill="none" stroke={tint(ink, 0.3)} strokeWidth="1.5" />
      <rect x="238" y="66" width="96" height="8" rx="4" fill={tint(ink, 0.14)} />
      <circle cx="722" cy="70" r="13" fill={tint(accent, 0.85)} />
      <circle cx="726" cy="66" r="3.5" fill={bg.hex} />
      <path d="M718 78c2-4 10-4 12 0" stroke={bg.hex} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* KPI cards */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={206 + i * 182} y="102" width="164" height="84" rx="10" fill={bg.hex} stroke={tint(ink, 0.14)} strokeWidth="1.2" />
          <rect x={220 + i * 182} y="116" width="64" height="8" rx="3" fill={tint(ink, 0.2)} />
          <rect x={220 + i * 182} y="134" width={72 + i * 12} height="20" rx="4" fill={ink.hex} />
          <rect x={296 + i * 182} y="138" width="40" height="12" rx="6" fill={i === 1 ? accent.hex : tint(accent, 0.35)} />
          <path
            d={`M${220 + i * 182} 168l8-6 8 4 8-10 8 6`}
            stroke={accent.hex}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        </g>
      ))}

      {/* Area chart */}
      <rect x="206" y="206" width="368" height="220" rx="12" fill={bg.hex} stroke={tint(ink, 0.14)} strokeWidth="1.2" />
      <rect x="222" y="222" width="90" height="9" rx="3" fill={tint(ink, 0.28)} />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="222" y1={260 + i * 38} x2="558" y2={260 + i * 38} stroke={tint(ink, 0.07)} strokeWidth="1" />
      ))}
      <path
        d="M222 402c40-6 62-44 96-58s58 10 92-16 66-70 122-84v136a10 10 0 0 1-10 10H232a10 10 0 0 1-10-10Z"
        fill="url(#pm-dash-area)"
      />
      <path
        d="M222 402c40-6 62-44 96-58s58 10 92-16 66-70 122-84"
        stroke={accent.hex}
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      {[
        { x: 318, y: 344 },
        { x: 410, y: 328 },
        { x: 532, y: 244 },
      ].map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="4" fill={bg.hex} stroke={accent.hex} strokeWidth="2.2" />
      ))}

      {/* Donut + bars */}
      <rect x="590" y="206" width="148" height="220" rx="12" fill={bg.hex} stroke={tint(ink, 0.14)} strokeWidth="1.2" />
      <rect x="606" y="222" width="64" height="9" rx="3" fill={tint(ink, 0.28)} />
      <circle cx="664" cy="296" r="38" fill="none" stroke={tint(ink, 0.1)} strokeWidth="12" />
      <circle
        cx="664"
        cy="296"
        r="38"
        fill="none"
        stroke={accent.hex}
        strokeWidth="12"
        strokeDasharray="170 239"
        strokeLinecap="round"
        transform="rotate(-90 664 296)"
      />
      <rect x="646" y="348" width="36" height="10" rx="3" fill={ink.hex} />
      <rect x="688" y="348" width="22" height="10" rx="3" fill={tint(accent, 0.5)} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={608 + i * 24}
          y={396 - [14, 26, 10, 20, 8][i]}
          width="12"
          height={[14, 26, 10, 20, 8][i]}
          rx="3"
          fill={i % 2 ? tint(accent, 0.75) : tint(ink, 0.18)}
        />
      ))}

      {/* Table */}
      <rect x="206" y="444" width="532" height="98" rx="12" fill={bg.hex} stroke={tint(ink, 0.14)} strokeWidth="1.2" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx="228" cy={470 + i * 26} r="5" fill={i === 1 ? accent.hex : tint(ink, 0.2)} />
          <rect x="244" y={466 + i * 26} width={150 - i * 22} height="8" rx="3" fill={tint(ink, 0.24)} />
          <rect x="420" y={466 + i * 26} width="60" height="8" rx="3" fill={tint(ink, 0.12)} />
          <rect x="668" y={463 + i * 26} width="52" height="14" rx="7" fill={i === 0 ? tint(accent, 0.8) : tint(ink, 0.08)} />
        </g>
      ))}

      <rect x="742" y="18" width="16" height="16" fill={accent.hex} />
    </svg>
  );
}

/* ───────────────────────────── Public surface ────────────────────────────── */

export function ProjectMockup({
  discipline,
  palette,
  className,
}: {
  discipline: string;
  palette: MockupSwatch[];
  className?: string;
}) {
  const Inner =
    discipline === "mobile"
      ? MobileMockup
      : discipline === "web" || discipline === "design"
        ? WebMockup
        : DashboardMockup;
  return (
    <div
      className={cn("flex h-full w-full items-center justify-center overflow-hidden", className)}
      style={{ backgroundColor: "rgb(16 19 25 / 0.03)" }}
    >
      <div className="h-full w-full p-4 drop-shadow-[0_24px_50px_rgb(10_10_14/0.18)] sm:p-6">
        <Inner palette={palette} />
      </div>
    </div>
  );
}
