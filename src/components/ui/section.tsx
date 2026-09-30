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
 * and the document-style rail - a square node, the section name, then a
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
  /* When a className carries !py-* overrides, they must land on the
     shell (the element that owns vertical rhythm), not stack on top of
     the shell's own padding on the section element. Extract all py-*
     classes (including responsive variants) into the shell; everything
     else stays on the section. */
  const pyClasses = className?.match(/(?:!|sm:!|lg:!|md:!)py-[^\s]+/g) ?? [];
  const shellOverride = pyClasses.join(" ");
  const sectionClass = className
    ? pyClasses.reduce((acc, cls) => acc.replace(cls, "").replace(/\s{2,}/g, " ").trim(), className)
    : undefined;

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative bg-background text-foreground", chapterClass[chapter], sectionClass)}
    >
      <div
        className={cn(
          "shell py-14 sm:py-18 lg:py-22",
          shellOverride || undefined,
        )}
      >
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
