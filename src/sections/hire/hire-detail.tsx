import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { Faq } from "@/components/shared/faq";
import { Workbench } from "@/components/shared/workbench";
import { ServiceIcon } from "@/components/shared/service-icon";
import { RatePlate } from "./rate-plate";
import type { HireRole } from "@/constants/hire";
import type { CrossLink } from "@/sections/industries/industry-detail";

/* ================================================================== */
/* The role — editorial intro + skills rows                            */
/* ================================================================== */

export function HireRoleIntro({ role }: { role: HireRole }) {
  const headingId = "role-heading";
  return (
    <Section index="The Role" labelledBy={headingId}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <Reveal>
            <h2 id={headingId} className="t-dl max-w-[14ch]">
              The role, plainly.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 max-w-[40rem] space-y-6 border-l border-border pl-8 text-muted">
              <p className="t-body-lg">{role.intro[0]}</p>
              <p className="t-body">{role.intro[1]}</p>
            </div>
          </Reveal>
        </div>
        <div className="lg:col-span-5">
          <Reveal delay={200} className="lg:sticky lg:top-28">
            <p className="t-label text-muted">What they bring</p>
            <ul className="mt-5 border-t border-border">
              {role.skills.map((skill) => (
                <li key={skill.title} className="border-b border-border py-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="t-h4 font-medium">{skill.title}</p>
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                  </div>
                  <p className="t-sm mt-2 text-muted">{skill.text}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/* What they take on — workbench (sand)                                */
/* ================================================================== */

export function HireRoleEngagements({ role }: { role: HireRole }) {
  const headingId = "engagements-heading";
  return (
    <Section index="The Workbench" labelledBy={headingId} className="bg-surface-2/60">
      <SectionHeader
        id={headingId}
        heading="What they take on."
        lead={
          <>
            The work this role lands most often — select a slot to open it.
            Every engagement runs on the same model.
          </>
        }
      />
      <Workbench
        items={role.engagements}
        slotWord={role.short}
        includedLabel="Typical engagement"
        panelId={`workbench-${role.slug}`}
      />
    </Section>
  );
}

/* ================================================================== */
/* Hero — statement left, the rate plate right (interactive), then the */
/* stack marquee                                                       */
/* ================================================================== */

export function HireRoleHero({ role }: { role: HireRole }) {
  return (
    <section aria-labelledby="hire-role-heading" className="relative overflow-hidden">
      <div className="shell pb-16 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-20">
        {/* Rail */}
        <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-14">
          <span className="h-2 w-2 shrink-0 bg-accent" />
          <span className="t-label text-muted">
            <Link href="/hire/" className="transition-colors hover:text-foreground">Hire Resources</Link>
            <span className="mx-2.5 text-muted/60">·</span>
            {role.title}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Reveal>
              <h1 id="hire-role-heading" className="t-statement max-w-[15ch]">
                {role.tagline}
                <span aria-hidden="true" className="text-accent">.</span>
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-8 max-w-xl text-muted">{role.heroLead}</p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <ServiceIcon
                  slug={role.iconSlug as never}
                  className="h-10 w-10 text-foreground/70 [&_svg]:h-full [&_svg]:w-full"
                />
                <p className="t-caption max-w-[26ch] text-muted">
                  Dedicated senior. Your tools, your standups, your repo — two week paid trial to start.
                </p>
              </div>
            </Reveal>
          </div>

          {/* The rate plate */}
          <div className="lg:col-span-5">
            <Reveal delay={160}>
              <RatePlate monthly={role.monthly} short={role.short} />
            </Reveal>
          </div>
        </div>
      </div>

      {/* Stack marquee */}
      <div className="border-y border-border py-4" aria-hidden="true">
        <div className="marquee overflow-hidden">
          <div className="marquee-track" style={{ animationDuration: "64s" }}>
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-center">
                {[...role.stack, ...role.stack].map((item, i) => (
                  <li key={`${copy}-${i}`} className="flex items-center">
                    <span className="t-label whitespace-nowrap px-7 text-muted">{item}</span>
                    <span className="h-1.5 w-1.5 shrink-0 bg-accent/70" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* Why — paper rows                                                    */
/* ================================================================== */

export function HireRoleWhy({ role }: { role: HireRole }) {
  const headingId = "why-heading";
  return (
    <Section index="Why This Route" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading="Why teams hire this way."
        lead={
          <>
            The advantages that show up in the first month — and the ones
            that compound.
          </>
        }
      />
      <Reveal>
        <ul className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2">
          {role.why.map((reason) => (
            <li key={reason.title} className="flex flex-col gap-3 bg-background p-7 sm:p-8">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
              <h3 className="t-h3 pt-1">{reason.title}</h3>
              <p className="t-body mt-auto text-muted">{reason.text}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}

/* ================================================================== */
/* FAQ — sand band, sticky heading left                                */
/* ================================================================== */

export function HireRoleFaqs({ role }: { role: HireRole }) {
  const headingId = `faq-${role.slug}-heading`;
  return (
    <Section index="Questions" labelledBy={headingId} className="bg-surface-2/60">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <h2 id={headingId} className="t-dl max-w-[12ch]">
                Asked about hiring {role.short.toLowerCase()}.
              </h2>
              <p className="t-body mt-6 max-w-xs text-muted">
                The questions teams raise before starting — answered plainly.
              </p>
              <Link
                href="/contact/"
                className="group/btn t-sm mt-8 inline-flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-accent"
              >
                A question we missed?
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
        </div>
        <div className="lg:col-span-8">
          <Faq items={role.faqs} label={`${role.title} — frequently asked questions`} />
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/* Explore further — roles + service                                   */
/* ================================================================== */

export function HireRoleCrossLinks({
  roles,
  service,
}: {
  roles: CrossLink[];
  service: CrossLink;
}) {
  const headingId = "explore-heading";
  return (
    <Section index="Explore Further" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading="Explore further."
        lead={
          <>
            Other roles that pair with this one — and the project service
            behind the same discipline.
          </>
        }
      />
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <nav aria-label="Related roles" className="lg:col-span-7">
          <Reveal>
            <p className="t-label mb-5 text-muted">Pairs well with</p>
            <ul className="border-t border-border">
              {roles.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-between gap-6 border-b border-border py-6"
                  >
                    <div>
                      <p className="t-h3 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                        {link.label}
                      </p>
                      <p className="t-caption mt-2 text-muted">{link.hint}</p>
                    </div>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 14 14"
                      className="h-4 w-4 shrink-0 text-muted transition-all duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-[4px] group-hover:text-accent"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                    </svg>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/hire/" className="group flex items-center gap-3 border-b border-border py-6">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100" />
                  <span className="t-h4 text-foreground/80 transition-colors group-hover:text-foreground">
                    All roles
                  </span>
                </Link>
              </li>
            </ul>
          </Reveal>
        </nav>
        <nav aria-label="Related service" className="lg:col-span-5">
          <Reveal delay={120}>
            <p className="t-label mb-5 text-muted">The project route</p>
            <Link
              href={service.href}
              className="group flex items-center justify-between gap-6 border-y border-border py-6"
            >
              <div>
                <p className="t-h3 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                  {service.label}
                </p>
                <p className="t-caption mt-2 text-muted">{service.hint}</p>
              </div>
              <svg
                aria-hidden="true"
                viewBox="0 0 14 14"
                className="h-4 w-4 shrink-0 text-muted transition-all duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-[4px] group-hover:text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
              </svg>
            </Link>
            <p className="t-caption mt-4 text-muted">
              Prefer a scoped project over a dedicated hire? Same discipline, different shape.
            </p>
          </Reveal>
        </nav>
      </div>
    </Section>
  );
}
