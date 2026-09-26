import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * Standardized section header - every narrative section opens with the
 * same alignment: serif display heading on the left rail, lead copy on
 * the right rail, baselines shared.
 */
export function SectionHeader({
  id,
  heading,
  lead,
  headingClassName,
  leadClassName,
}: {
  id?: string;
  heading: ReactNode;
  lead?: ReactNode;
  headingClassName?: string;
  leadClassName?: string;
}) {
  return (
    <div className="mb-14 grid items-end gap-8 sm:mb-20 lg:grid-cols-12">
      <div className={cn("lg:col-span-7", headingClassName)}>
        <Reveal>
          <h2 id={id} className="t-dl">
            {heading}
          </h2>
        </Reveal>
      </div>
      {lead ? (
        <div className={cn("lg:col-span-5", leadClassName)}>
          <Reveal delay={120}>
            <div className="t-body-lg max-w-md text-muted lg:justify-self-end lg:text-right lg:pb-1.5">
              {lead}
            </div>
          </Reveal>
        </div>
      ) : null}
    </div>
  );
}
