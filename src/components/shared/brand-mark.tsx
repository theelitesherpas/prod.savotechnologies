import { cn } from "@/lib/utils";

/**
 * SAVO wordmark — the square node is the brand motif (it returns as the
 * nodes in the hero system, ticks in the grid, marks in the footer).
 */
export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-[0.3em]", className)}>
      <span className="font-sans text-[1.3rem] font-extrabold leading-none tracking-[-0.03em]">
        SAVO
      </span>
      <span aria-hidden="true" className="h-[0.42em] w-[0.42em] translate-y-[-0.06em] bg-accent" />
      {!compact ? (
        <span className="t-label text-muted">Technologies</span>
      ) : null}
    </span>
  );
}
