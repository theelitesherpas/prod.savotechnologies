import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { INDUSTRIES } from "@/constants/content";
import Link from "next/link";

export function Industries() {
  return (
    <Section id="industries" index="Industries" labelledBy="industries-heading" className="!py-14 sm:!py-18 lg:!py-22">
      <SectionHeader
        id="industries-heading"
        heading="Technology without industry boundaries."
        lead={
          <>
            The fundamentals of good product thinking transfer. We adapt them
            to the realities of each sector we work in.
          </>
        }
      />

      <Reveal delay={160}>
        <ul className="mt-16 grid grid-cols-1 gap-x-10 border-t border-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {INDUSTRIES.map((industry) => (
            <li key={industry} className="group flex items-center gap-3.5 border-b border-border py-5">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100"
              />
              <span className="t-h4 font-medium text-foreground/85 transition-colors group-hover:text-foreground">
                {industry}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal delay={240}>
        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/industries"
            className="link-underline t-h4 inline-flex items-center gap-2.5 text-foreground"
          >
            Explore all industries
            <svg
              aria-hidden="true"
              viewBox="0 0 14 14"
              className="h-3.5 w-3.5 text-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
            </svg>
          </Link>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </div>
      </Reveal>
    </Section>
  );
}
