import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { ServiceIcon } from "@/components/shared/service-icon";
import { HIRE_ROLES, HIRE_MODELS, HIRE_FACTS } from "@/constants/hire";
import type { HireRole } from "@/constants/hire";
import { CrewBand } from "./crew-band";

const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;

/* ================================================================== */
/* Index hero — statement, model facts strip                           */
/* ================================================================== */

export function HireHero() {
  return (
    <section aria-labelledby="hire-heading" className="relative overflow-hidden">
      <div className="shell pb-20 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-24">
        {/* Rail */}
        <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-16">
          <span className="h-2 w-2 shrink-0 bg-accent" />
          <span className="t-label text-muted">Hire Resources</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <h1 id="hire-heading" className="t-statement max-w-[15ch]">
                Senior engineers, matched in 48 hours
                <span aria-hidden="true" className="text-accent">.</span>
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-8 max-w-xl text-muted">
                Every developer is vetted by our leads, works your hours, in
                your tools, and starts with a two week paid trial. If the
                fit is wrong, you pay nothing for it.
              </p>
            </Reveal>
          </div>

          {/* The model card */}
          <div className="lg:col-span-5">
            <Reveal delay={200}>
              <div className="border border-border bg-surface p-7 sm:p-8">
                <p className="t-label text-muted">The model</p>
                <ul className="mt-5 border-t border-border">
                  {HIRE_FACTS.map((fact) => (
                    <li
                      key={fact.l}
                      className="flex items-baseline justify-between gap-4 border-b border-border py-3.5"
                    >
                      <span className="t-sm font-semibold text-foreground">{fact.v}</span>
                      <span className="t-label text-right text-muted">{fact.l}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center gap-3">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                  <p className="t-caption text-muted">No recruiter cut. No benching fees.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Roles directory — atlas grammar rows with rates                     */
/* ================================================================== */

export function HireDirectory() {
  const headingId = "roles-heading";
  return (
    <Section id="roles" index="The Roles" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading="Pick the skill you need."
        lead={
          <>
            Six disciplines, one vetting standard, transparent monthly
            rates. Each role opens into rates, skills and the hiring path.
          </>
        }
      />
      <Reveal>
        <ul className="border-t border-border">
          {HIRE_ROLES.map((role) => (
            <li key={role.slug}>
              <Link
                href={`/hire/${role.slug}`}
                aria-label={`Hire ${role.title}`}
                className="group grid gap-5 border-b border-border px-2 py-8 transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-foreground focus-visible:bg-foreground sm:grid-cols-12 sm:gap-8 sm:px-4 lg:py-9"
              >
                <ServiceIcon
                  slug={role.iconSlug as never}
                  className="h-9 w-9 shrink-0 text-foreground/75 transition-colors duration-300 group-hover:text-background [&_svg]:h-full [&_svg]:w-full"
                />
                <div className="sm:col-span-6">
                  <h3 className="t-h3 transition-colors duration-300 group-hover:text-background">
                    {role.title}
                  </h3>
                  <p className="t-body mt-3 max-w-lg text-muted transition-colors duration-300 group-hover:text-background/75">
                    {role.tagline}.
                  </p>
                </div>
                <ul
                  aria-label={`${role.title} stack`}
                  className="flex max-w-md flex-wrap content-start gap-1.5 sm:col-span-4 sm:self-center"
                >
                  {role.stack.slice(0, 5).map((item) => (
                    <li
                      key={item}
                      className="t-caption rounded-[2px] border border-border px-2.5 py-1 text-muted transition-colors duration-300 group-hover:border-background/35 group-hover:text-background/75"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <span className="hidden items-center justify-end self-center text-right sm:col-span-1 sm:flex">
                  <span className="t-label tnum text-muted transition-colors duration-300 group-hover:text-background/80">
                    {inr(role.monthly)}
                    <span className="t-caption block opacity-70">/ month</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}

/* ================================================================== */
/* Engagement models — sand band cabinet                               */
/* ================================================================== */

export function HireModels() {
  const headingId = "models-heading";
  return (
    <Section index="Engagement Models" labelledBy={headingId} className="bg-surface-2/60">
      <SectionHeader
        id={headingId}
        heading="Three ways to engage."
        lead={
          <>
            From one embedded engineer to a full delivery squad — sized to
            the work, resizable as it changes.
          </>
        }
      />
      <Reveal>
        <ul className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
          {HIRE_MODELS.map((model) => (
            <li key={model.title} className="flex flex-col gap-3.5 bg-background p-7 sm:p-8">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
              <h3 className="t-h3 pt-1">{model.title}</h3>
              <p className="t-body mt-auto text-muted">{model.text}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}

/* ================================================================== */
/* How hiring runs — paper steps                                       */
/* ================================================================== */

export function HireSteps() {
  const headingId = "steps-heading";
  const steps = HIRE_ROLES[0].process;
  return (
    <Section index="How Hiring Runs" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading="From call to first commit."
        lead={
          <>
            The same path every time — fast where it can be, careful where
            it must be.
          </>
        }
      />
      <Reveal>
        <ol className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
          {steps.map((step) => (
            <li key={step.name} className="group">
              <div className="flex items-center gap-4">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              </div>
              <h3 className="t-h3 mt-5">{step.name}</h3>
              <p className="t-sm mt-3 max-w-[26ch] text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}

export type { HireRole };

export { CrewBand };
