import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  /** Narrative wayfinding label rendered with the rail, e.g. "Services". */
  index?: string;
  chapter?: "paper" | "ink" | "accent";
  className?: string;
  children: ReactNode;
  labelledBy?: string;
};

const chapterClass: Record<NonNullable<SectionProps["chapter"]>, string> = {
  paper: "",
  ink: "chapter-ink",
  accent: "chapter-accent",
};

/**
 * Section shell: establishes the chapter (token scope), vertical rhythm
 * and the document-style rail — a square node, the section name, then a
 * hairline. Content stays semantic <section>.
 */
export function Section({
  id,
  index,
  chapter = "paper",
  className,
  children,
  labelledBy,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative bg-background text-foreground", chapterClass[chapter], className)}
    >
      <div className="shell py-20 sm:py-28 lg:py-36">
        {index ? (
          <div
            aria-hidden="true"
            className="mb-12 flex items-center gap-4 sm:mb-16"
          >
            <span className="t-label text-muted">{index}</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
