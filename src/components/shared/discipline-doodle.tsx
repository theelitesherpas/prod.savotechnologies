import { cn } from "@/lib/utils";

/**
 * DisciplineDoodle — animated inline SVG showing what was built.
 * Each discipline has its own scene with CSS animations:
 *   web: browser window with typing cursor and scrolling lines
 *   mobile: phone with sliding screens and notification badge
 *   ai: neural network with pulsing nodes and flowing data
 *   software: dashboard with animated chart bars
 *   design: color palette being mixed
 *   growth: ascending trend arrow with expanding reach
 *
 * Pure CSS animations — no JS runtime cost, accessible (aria-hidden).
 */

export function DisciplineDoodle({
  discipline,
  className,
}: {
  discipline: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)} aria-hidden="true">
      {discipline === "web" && <WebDoodle />}
      {discipline === "mobile" && <MobileDoodle />}
      {discipline === "ai" && <AiDoodle />}
      {discipline === "software" && <SoftwareDoodle />}
      {discipline === "design" && <DesignDoodle />}
      {discipline === "growth" && <GrowthDoodle />}
    </div>
  );
}

/* ── Web: browser with typing cursor ── */
function WebDoodle() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <style>{`
        @keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes line-grow { from { width: 0 } to { width: 100% } }
        @keyframes scroll-dot { from { transform: translateY(0) } to { transform: translateY(30px) } }
        .wd-cursor { animation: cursor-blink 1s infinite }
        .wd-dot { animation: scroll-dot 2s ease-in-out infinite alternate }
      `}</style>
      <rect x="20" y="15" width="160" height="110" rx="8" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="20" y="15" width="160" height="20" rx="8" fill="var(--accent)" opacity="0.15" />
      <circle cx="35" cy="25" r="3" fill="var(--accent)" opacity="0.6" />
      <circle cx="45" cy="25" r="3" fill="var(--accent)" opacity="0.3" />
      <circle cx="55" cy="25" r="3" fill="var(--accent)" opacity="0.15" />
      <rect x="35" y="48" width="100" height="4" rx="2" fill="var(--accent)" opacity="0.5" className="wd-cursor" />
      <rect x="35" y="60" width="70" height="3" rx="1.5" fill="var(--border)" />
      <rect x="35" y="68" width="85" height="3" rx="1.5" fill="var(--border)" />
      <rect x="35" y="76" width="50" height="3" rx="1.5" fill="var(--border)" />
      <rect x="35" y="90" width="60" height="20" rx="4" fill="var(--accent)" opacity="0.12" />
      <rect x="42" y="97" width="30" height="3" rx="1.5" fill="var(--accent)" opacity="0.4" />
      <rect x="42" y="103" width="20" height="3" rx="1.5" fill="var(--accent)" opacity="0.25" />
      {/* Scroll indicator */}
      <circle cx="168" cy="50" r="3" fill="var(--accent)" opacity="0.4" className="wd-dot" />
      <rect x="160" y="40" width="16" height="60" rx="8" fill="none" stroke="var(--border)" strokeWidth="1" />
    </svg>
  );
}

/* ── Mobile: phone with sliding screens ── */
function MobileDoodle() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <style>{`
        @keyframes screen-slide { 0%,100%{transform:translateX(0)} 50%{transform:translateX(20px)} }
        @keyframes notif-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.2);opacity:0.7} }
        .md-screen { animation: screen-slide 3s ease-in-out infinite }
        .md-notif { animation: notif-pulse 2s ease-in-out infinite; transform-origin: center }
      `}</style>
      <rect x="65" y="10" width="70" height="120" rx="12" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="88" y="16" width="24" height="4" rx="2" fill="var(--border)" />
      {/* Screen content slides */}
      <g className="md-screen">
        <rect x="72" y="28" width="56" height="30" rx="4" fill="var(--accent)" opacity="0.15" />
        <rect x="78" y="35" width="30" height="3" rx="1.5" fill="var(--accent)" opacity="0.4" />
        <rect x="78" y="42" width="20" height="3" rx="1.5" fill="var(--accent)" opacity="0.25" />
      </g>
      <rect x="72" y="66" width="56" height="3" rx="1.5" fill="var(--border)" />
      <rect x="72" y="74" width="40" height="3" rx="1.5" fill="var(--border)" />
      <rect x="72" y="82" width="48" height="3" rx="1.5" fill="var(--border)" />
      {/* Home indicator */}
      <rect x="82" y="118" width="36" height="3" rx="1.5" fill="var(--border)" />
      {/* Notification badge */}
      <g className="md-notif">
        <circle cx="135" cy="25" r="8" fill="var(--accent)" />
        <text x="135" y="29" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">1</text>
      </g>
    </svg>
  );
}

/* ── AI: neural network with pulsing nodes ── */
function AiDoodle() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <style>{`
        @keyframes node-pulse { 0%,100%{r:5;opacity:1} 50%{r:7;opacity:0.6} }
        @keyframes flow-line { 0%{stroke-dashoffset:20} 100%{stroke-dashoffset:0} }
        .ai-node { animation: node-pulse 2s ease-in-out infinite }
        .ai-flow { stroke-dasharray:4 4; animation: flow-line 1.5s linear infinite }
      `}</style>
      {/* Connections */}
      <path d="M60 50 L100 35 L140 55 M60 70 L100 35 L140 55 M60 50 L100 80 L140 55 M60 70 L100 80 M100 35 L100 80"
        fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.3" className="ai-flow" />
      {/* Input nodes */}
      <circle cx="60" cy="50" r="5" fill="var(--accent)" opacity="0.6" className="ai-node" />
      <circle cx="60" cy="70" r="5" fill="var(--accent)" opacity="0.6" className="ai-node" style={{ animationDelay: "0.3s" }} />
      {/* Hidden layer */}
      <circle cx="100" cy="35" r="6" fill="var(--accent)" opacity="0.4" className="ai-node" style={{ animationDelay: "0.6s" }} />
      <circle cx="100" cy="80" r="6" fill="var(--accent)" opacity="0.4" className="ai-node" style={{ animationDelay: "0.9s" }} />
      {/* Output */}
      <circle cx="140" cy="55" r="8" fill="var(--accent)" className="ai-node" style={{ animationDelay: "1.2s" }} />
      {/* Labels */}
      <text x="140" y="100" textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="monospace" letterSpacing="2">OUTPUT</text>
      <text x="60" y="95" textAnchor="middle" fill="var(--muted)" fontSize="7" fontFamily="monospace" letterSpacing="2">INPUT</text>
    </svg>
  );
}

/* ── Software: dashboard with animated chart ── */
function SoftwareDoodle() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <style>{`
        @keyframes bar-grow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        .sw-bar { animation: bar-grow 1.5s ease-out infinite alternate; transform-origin: bottom }
      `}</style>
      <rect x="20" y="15" width="160" height="110" rx="8" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="30" y="25" width="60" height="4" rx="2" fill="var(--accent)" opacity="0.4" />
      <rect x="30" y="35" width="40" height="3" rx="1.5" fill="var(--border)" />
      {/* Chart bars */}
      <rect x="35" y="95" width="14" height="20" rx="2" fill="var(--accent)" opacity="0.7" className="sw-bar" />
      <rect x="55" y="85" width="14" height="30" rx="2" fill="var(--accent)" opacity="0.55" className="sw-bar" style={{ animationDelay: "0.2s" }} />
      <rect x="75" y="75" width="14" height="40" rx="2" fill="var(--accent)" opacity="0.4" className="sw-bar" style={{ animationDelay: "0.4s" }} />
      <rect x="95" y="60" width="14" height="55" rx="2" fill="var(--accent)" opacity="0.3" className="sw-bar" style={{ animationDelay: "0.6s" }} />
      <rect x="115" y="50" width="14" height="65" rx="2" fill="var(--accent)" opacity="0.2" className="sw-bar" style={{ animationDelay: "0.8s" }} />
      {/* Sidebar stat card */}
      <rect x="140" y="30" width="32" height="25" rx="4" fill="var(--accent)" opacity="0.1" />
      <text x="156" y="44" textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="700">98%</text>
      <text x="156" y="51" textAnchor="middle" fill="var(--muted)" fontSize="5">UPTIME</text>
    </svg>
  );
}

/* ── Design: palette with color mixing ── */
function DesignDoodle() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <style>{`
        @keyframes circle-orbit { from { transform: rotate(0deg) translateX(30px) rotate(0deg) } to { transform: rotate(360deg) translateX(30px) rotate(-360deg) } }
        .ds-orbit { animation: circle-orbit 6s linear infinite; transform-origin: 100px 65px }
        @keyframes swatch-pop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        .ds-swatch { animation: swatch-pop 3s ease-in-out infinite }
      `}</style>
      {/* Central palette shape */}
      <path d="M100 25 C120 25 135 45 135 65 C135 85 120 100 100 100 C80 100 65 85 65 65 C65 45 80 25 100 25 Z"
        fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 4" />
      {/* Orbiting color dots */}
      <g className="ds-orbit">
        <circle cx="100" cy="35" r="7" fill="var(--accent)" opacity="0.7" className="ds-swatch" />
      </g>
      <g className="ds-orbit" style={{ animationDelay: "-2s" }}>
        <circle cx="100" cy="35" r="5" fill="#3b82f6" opacity="0.5" className="ds-swatch" style={{ animationDelay: "-1s" }} />
      </g>
      <g className="ds-orbit" style={{ animationDelay: "-4s" }}>
        <circle cx="100" cy="35" r="4" fill="#10b981" opacity="0.5" className="ds-swatch" style={{ animationDelay: "-2s" }} />
      </g>
      {/* Pen tool cursor */}
      <path d="M130 90 l8 8 -4 2 -2 4 -8 -8 Z" fill="var(--accent)" opacity="0.6" />
      {/* Grid lines */}
      <line x1="30" y1="65" x2="170" y2="65" stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
      <line x1="100" y1="15" x2="100" y2="115" stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

/* ── Growth: ascending trend with expanding reach ── */
function GrowthDoodle() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <style>{`
        @keyframes trend-draw { from { stroke-dashoffset: 100 } to { stroke-dashoffset: 0 } }
        @keyframes circle-expand { 0%{r:5;opacity:0.8} 100%{r:25;opacity:0} }
        .gr-line { stroke-dasharray:100; animation: trend-draw 2s ease-out infinite }
        .gr-pulse { animation: circle-expand 2s ease-out infinite }
      `}</style>
      {/* Axis */}
      <line x1="30" y1="110" x2="170" y2="110" stroke="var(--border)" strokeWidth="1" />
      <line x1="30" y1="110" x2="30" y2="20" stroke="var(--border)" strokeWidth="1" />
      {/* Trend line */}
      <path d="M40 95 L60 80 L80 85 L100 60 L120 50 L155 25" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" className="gr-line" />
      {/* Expanding reach circles */}
      <circle cx="155" cy="25" r="5" fill="none" stroke="var(--accent)" strokeWidth="1" className="gr-pulse" />
      <circle cx="155" cy="25" r="5" fill="none" stroke="var(--accent)" strokeWidth="1" className="gr-pulse" style={{ animationDelay: "0.7s" }} />
      <circle cx="155" cy="25" r="6" fill="var(--accent)" />
      {/* Arrow head */}
      <path d="M148 28 L155 21 L162 28" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Data points */}
      <circle cx="40" cy="95" r="3" fill="var(--accent)" opacity="0.5" />
      <circle cx="60" cy="80" r="3" fill="var(--accent)" opacity="0.5" />
      <circle cx="80" cy="85" r="3" fill="var(--accent)" opacity="0.5" />
      <circle cx="100" cy="60" r="3" fill="var(--accent)" opacity="0.5" />
      <circle cx="120" cy="50" r="3" fill="var(--accent)" opacity="0.5" />
    </svg>
  );
}
