import { cn } from "@/lib/utils";

/**
 * FeatureIcon: animated infographic icons for the Key Features section.
 * Three rotating variants (index 0, 1, 2): each is a pure CSS animated SVG
 * that adds motion and personality to the feature cards without any JS cost.
 *
 *   variant 0: drawing checkmark (capability confirmed)
 *   variant 1: ascending arrow (improvement delivered)
 *   variant 2: pulsing target (goal achieved)
 */

export function FeatureIcon({ index, className }: { index: number; className?: string }) {
  const variant = index % 3;
  return (
    <div className={cn("relative", className)} aria-hidden="true">
      {variant === 0 && <CheckmarkIcon />}
      {variant === 1 && <TrendIcon />}
      {variant === 2 && <TargetIcon />}
    </div>
  );
}

/* ── Variant 0: Animated checkmark ── */
function CheckmarkIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full">
      <style>{`
        @keyframes fi-draw { from { stroke-dashoffset: 30 } to { stroke-dashoffset: 0 } }
        @keyframes fi-ring { 0% { transform: scale(0.8); opacity: 0.5 } 50% { transform: scale(1.1); opacity: 1 } 100% { transform: scale(0.8); opacity: 0.5 } }
        .fi-check { stroke-dasharray: 30; animation: fi-draw 1.5s ease-out forwards }
        .fi-ring { animation: fi-ring 2.5s ease-in-out infinite; transform-origin: 24px 24px }
      `}</style>
      {/* Background circle */}
      <circle cx="24" cy="24" r="18" fill="var(--accent)" opacity="0.08" className="fi-ring" />
      <circle cx="24" cy="24" r="18" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.3" />
      {/* Animated checkmark */}
      <path
        d="M16 24 L22 30 L34 18"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fi-check"
      />
    </svg>
  );
}

/* ── Variant 1: Ascending trend arrow ── */
function TrendIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full">
      <style>{`
        @keyframes fi-line { from { stroke-dashoffset: 40 } to { stroke-dashoffset: 0 } }
        @keyframes fi-dot { 0%,100% { opacity: 0.3 } 50% { opacity: 1 } }
        .fi-trend { stroke-dasharray: 40; animation: fi-line 1.8s ease-out forwards }
        .fi-dot1 { animation: fi-dot 2s ease-in-out infinite }
        .fi-dot2 { animation: fi-dot 2s ease-in-out infinite; animation-delay: 0.3s }
        .fi-dot3 { animation: fi-dot 2s ease-in-out infinite; animation-delay: 0.6s }
      `}</style>
      {/* Dots */}
      <circle cx="14" cy="32" r="2.5" fill="var(--accent)" className="fi-dot1" />
      <circle cx="24" cy="26" r="2.5" fill="var(--accent)" className="fi-dot2" />
      <circle cx="34" cy="16" r="2.5" fill="var(--accent)" className="fi-dot3" />
      {/* Trend line */}
      <path d="M14 32 L24 26 L34 16" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" className="fi-trend" />
      {/* Arrow head */}
      <path d="M28 16 L34 10 L40 16" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

/* ── Variant 2: Pulsing target ── */
function TargetIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full">
      <style>{`
        @keyframes fi-target-ring { 0% { r: 4; opacity: 0.8 } 100% { r: 18; opacity: 0 } }
        @keyframes fi-target-core { 0%,100% { transform: scale(1) } 50% { transform: scale(1.3) } }
        .fi-ring1 { animation: fi-target-ring 2s ease-out infinite }
        .fi-ring2 { animation: fi-target-ring 2s ease-out infinite; animation-delay: 0.7s }
        .fi-core { animation: fi-target-core 1.5s ease-in-out infinite; transform-origin: 24px 24px }
      `}</style>
      {/* Pulsing rings */}
      <circle cx="24" cy="24" r="4" fill="none" stroke="var(--accent)" strokeWidth="1.5" className="fi-ring1" />
      <circle cx="24" cy="24" r="4" fill="none" stroke="var(--accent)" strokeWidth="1.5" className="fi-ring2" />
      {/* Outer circle */}
      <circle cx="24" cy="24" r="16" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.3" />
      {/* Inner circle */}
      <circle cx="24" cy="24" r="8" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5" />
      {/* Core dot */}
      <circle cx="24" cy="24" r="4" fill="var(--accent)" className="fi-core" />
    </svg>
  );
}
