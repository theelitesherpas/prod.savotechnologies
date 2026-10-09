import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

/**
 * Continue exploring — the quiet close, sand band like the hiring
 * promise. One primary CTA chosen by the visitor's journey (an enquiry
 * just submitted is best served by the work; an applicant by the team's
 * shipped products), with the remaining routes as quiet links — never
 * three competing buttons.
 */

type Journey = "careers" | "project";

const ROUTES: Record<Journey, { primary: { href: string; label: string }; secondary: { href: string; label: string }[] }> = {
  project: {
    primary: { href: "/case-studies", label: "View our work" },
    secondary: [
      { href: "/services", label: "Explore our services" },
      { href: "/", label: "Return to homepage" },
    ],
  },
  careers: {
    primary: { href: "/case-studies", label: "See what the team ships" },
    secondary: [
      { href: "/careers", label: "Back to open roles" },
      { href: "/services", label: "Explore our services" },
      { href: "/", label: "Return to homepage" },
    ],
  },
};

export function ContinueExploring({ journey }: { journey: Journey }) {
  const { primary, secondary } = ROUTES[journey];

  return (
    <Section
      id="explore"
      index="Continue"
      labelledBy="explore-heading"
      className="!py-12 sm:!py-14 bg-surface-2/60"
    >
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="max-w-lg">
          <Reveal>
            <h2 id="explore-heading" className="t-h2">
              There&rsquo;s more to explore.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="t-body mt-4 text-muted">
              Discover how Savo helps businesses turn ideas into thoughtfully
              designed digital experiences.
            </p>
          </Reveal>
        </div>
        <Reveal delay={160}>
          <Link
            href={primary.href}
            className="group/btn inline-flex h-[3.25rem] items-center justify-center gap-2.5 rounded-[2px] bg-foreground px-7 text-base font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
          >
            {primary.label}
            <svg
              aria-hidden="true"
              viewBox="0 0 14 14"
              className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
            </svg>
          </Link>
        </Reveal>
      </div>

      <Reveal delay={200}>
        <ul className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-3 border-t border-border pt-5">
          {secondary.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="link-underline t-sm font-semibold text-foreground/75 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
