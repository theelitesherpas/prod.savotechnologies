import { Reveal } from "@/components/ui/reveal";

/**
 * Sector flow plate — the per-industry infographic. Blueprint figure on
 * the ink chapter: a chain of square nodes on a drawing hairline that
 * ink themselves in as the section reveals. Five stages, label + note,
 * horizontal on wide screens, stacked below.
 */
export function FlowPlate({
  nodes,
  caption,
}: {
  nodes: { label: string; note: string }[];
  caption: string;
}) {
  return (
    <Reveal>
      <figure
        aria-label={caption}
        className="blueprint relative border border-border bg-surface p-6 sm:p-9"
      >
        <figcaption className="t-label flex items-center justify-between text-muted">
          <span>{caption}</span>
          <span aria-hidden="true" className="flex gap-1.5">
            <span className="h-1.5 w-1.5 bg-accent" />
            <span className="h-1.5 w-1.5 bg-border" />
            <span className="h-1.5 w-1.5 bg-border" />
          </span>
        </figcaption>

        <ol className="relative mt-10 grid gap-8 sm:grid-cols-5 sm:gap-6 lg:gap-8">
          {/* Spine, desktop */}
          <span
            aria-hidden="true"
            className="absolute left-0 right-0 top-[5px] hidden h-px bg-border sm:block"
          />
          {/* Draw-on signal */}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 1"
            preserveAspectRatio="none"
            className="absolute left-0 right-0 top-[5px] hidden h-px w-full sm:block"
          >
            <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="currentColor" strokeWidth="0.5" className="text-accent" pathLength={1} data-draw />
          </svg>

          {nodes.map((node, i) => {
            const isLast = i === nodes.length - 1;
            return (
              <li key={node.label} className="relative flex flex-col gap-4">
                <span
                  aria-hidden="true"
                  className={`relative z-10 h-2.5 w-2.5 shrink-0 border bg-surface ${
                    isLast ? "border-accent" : "border-border"
                  }`}
                />
                <div>
                  <p className={`t-sm font-semibold ${isLast ? "text-accent" : "text-foreground"}`}>
                    {node.label}
                  </p>
                  <p className="t-label mt-1.5 text-muted">{node.note}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="t-caption mt-8 text-muted">
          Engineered stage by stage, instrumented, access-controlled and documented.
        </p>
      </figure>
    </Reveal>
  );
}
