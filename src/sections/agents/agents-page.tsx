import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { Faq } from "@/components/shared/faq";
import { AGENTS, AGENT_DEPLOY_STEPS, AGENT_FAQS } from "@/constants/agents";
import { cn } from "@/lib/utils";

/**
 * AI agents — the fleet. Paper hero with the six-persona board, agent
 * chapters as hairline accordions, the deployment spine on ink, FAQ and
 * close. Square-node agent marks, no gradients — the world's grammar.
 */

function AgentMark({ variant }: { variant: number }) {
  // Six small square-node marks — same stroke weight, distinct topology.
  const marks = [
    // sales: two nodes, connecting route
    <g key="s" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="8" y="38" width="10" height="10" />
      <rect x="42" y="8" width="10" height="10" className="fill-accent" stroke="none" />
      <path d="M18 43h14a8 8 0 0 0 8-8V18" />
    </g>,
    // support: inbox with check
    <g key="u" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M10 20h40v26H10z" />
      <path d="M10 20l20 16 20-16" />
      <path d="M24 38l6 6 12-12" className="stroke-accent" />
    </g>,
    // recruit: person + scorecard
    <g key="r" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="8" y="8" width="26" height="12" />
      <path d="M12 14h4M18 14h10" strokeLinecap="round" />
      <rect x="36" y="28" width="18" height="22" />
      <path d="M40 36l4 4 7-8" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent" />
    </g>,
    // insight: bars + trend
    <g key="i" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 50V38M24 50V28M36 50V34M48 50V20" />
      <path d="M14 24 30 14l12 6 10-12" strokeLinejoin="round" className="stroke-accent" />
    </g>,
    // content: page + pen
    <g key="c" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M14 8h24l10 10v34H14z" />
      <path d="M38 8v10h10" />
      <path d="M22 44l14-14 6 6-14 14h-6v-6Z" strokeLinejoin="round" className="stroke-accent" />
    </g>,
    // ops: pulse + node
    <g key="o" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M8 30h10l6-14 8 26 6-12h14" strokeLinejoin="round" />
      <rect x="44" y="26" width="8" height="8" className="fill-accent" stroke="none" />
    </g>,
  ];
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true" className="h-full w-full">
      {marks[variant % marks.length]}
    </svg>
  );
}

export function AgentsHero() {
  return (
    <section aria-labelledby="agents-heading" className="relative overflow-hidden">
      <div className="shell pb-20 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-24">
        {/* Rail */}
        <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-16">
          <span className="h-2 w-2 shrink-0 bg-accent" />
          <span className="t-label text-muted">
            AI
            <span className="mx-2.5 text-muted/60">·</span>
            The Agent Fleet
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <h1 id="agents-heading" className="t-statement max-w-[15ch]">
                Agents that do the work, not just the talk
                <span aria-hidden="true" className="text-accent">.</span>
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-8 max-w-xl text-muted">
                Six production-ready personas, trained on your data, guarded
                by enterprise security, deployed in two to four weeks and
                supervised like the employees they are.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={200}>
              <div className="border border-border bg-surface p-7 sm:p-8">
                <p className="t-label text-muted">The fleet, at a glance</p>
                <ul className="mt-5 border-t border-border">
                  {[
                    ["Trained on your data", "docs, systems, tone of voice"],
                    ["Guarded by design", "permissions, gates, audit logs"],
                    ["Supervised, always", "human escalation built in"],
                  ].map(([t, d]) => (
                    <li key={t} className="flex items-baseline justify-between gap-4 border-b border-border py-3.5">
                      <span className="t-sm font-semibold text-foreground/90">{t}</span>
                      <span className="t-label text-right text-muted">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Fleet board */}
        <Reveal delay={140}>
          <nav aria-label="The fleet" className="mt-16 sm:mt-20">
            <p className="t-label mb-5 text-muted">The fleet, six personas</p>
            <ul className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
              {AGENTS.map((agent, i) => (
                <li key={agent.slug}>
                  <Link
                    href={`#${agent.slug}`}
                    aria-label={`Jump to ${agent.name}`}
                    className="group flex h-full min-h-[8.5rem] flex-col justify-between gap-8 bg-background p-5 text-foreground transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-foreground hover:text-background sm:p-6"
                  >
                    <span className="h-9 w-9 text-foreground/75 transition-colors duration-300 group-hover:text-background">
                      <AgentMark variant={i} />
                    </span>
                    <div>
                      <p className="t-h4">{agent.short}</p>
                      <p className="t-caption mt-2 text-muted transition-colors duration-300 group-hover:text-background/70">
                        {agent.tags[0]} · {agent.tags[1]}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Agent chapters — hairline accordions with deliverables + tags       */
/* ------------------------------------------------------------------ */

export function AgentChapters() {
  const headingId = "fleet-heading";
  return (
    <Section id="fleet" index="The Fleet" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading="Meet the fleet."
        lead={
          <>
            Each persona is a focused operator with its own tools, rules
            and escalation path, open one to read its file.
          </>
        }
      />
      <div className="border-t border-border">
        {AGENTS.map((agent, i) => (
          <AgentChapter key={agent.slug} agent={agent} variant={i} />
        ))}
      </div>
    </Section>
  );
}

function AgentChapter({
  agent,
  variant,
}: {
  agent: (typeof AGENTS)[number];
  variant: number;
}) {
  // Static server-rendered chapters (details/summary for progressive
  // disclosure without client JS); styled in the accordion grammar.
  return (
    <details id={agent.slug} className="group scroll-mt-[calc(var(--nav-h)+2rem)] border-b border-border">
      <summary className="flex cursor-pointer list-none items-center gap-5 py-7 transition-colors select-none sm:gap-8 [&::-webkit-details-marker]:hidden">
        <span className="h-10 w-10 shrink-0 text-foreground/75 transition-colors group-open:text-accent">
          <AgentMark variant={variant} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="t-h3">{agent.name}</h3>
          <p className="t-body mt-2 max-w-xl text-muted">{agent.desc}</p>
        </div>
        <span
          aria-hidden="true"
          className="relative h-3.5 w-3.5 shrink-0 self-center text-muted transition-transform duration-500 ease-[var(--ease-out-expo)] group-open:rotate-45 group-open:text-accent"
        >
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
        </span>
      </summary>
      <div className="grid gap-10 pb-10 pt-2 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7 lg:pl-[4.5rem]">
          <p className="t-body-lg max-w-xl text-muted">{agent.detail}</p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label={`${agent.name} tags`}>
            {agent.tags.map((tag) => (
              <li key={tag} className="t-caption rounded-[2px] border border-border px-2.5 py-1 text-muted">
                {tag}
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-5 lg:pl-[4.5rem]">
          <p className="t-label text-muted">Deliverables</p>
          <ul className="mt-4 border-t border-border">
            {agent.deliverables.map((d) => (
              <li key={d} className="flex items-center gap-3.5 border-b border-border py-3">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                <span className="t-sm font-medium text-foreground/85">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/* Deployment — ink chapter, staggered steps on a spine                */
/* ------------------------------------------------------------------ */

export function AgentDeploy() {
  const headingId = "deploy-heading";
  return (
    <Section index="Deployment" chapter="ink" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading="Live in two to four weeks."
        lead={
          <>
            The same deployment path every time, scoped, grounded,
            guarded, then supervised live with evidence.
          </>
        }
      />
      <Reveal>
        <ol className="relative space-y-10 sm:space-y-12">
          <div aria-hidden="true" className="absolute bottom-2 left-[5px] top-2 w-px bg-border" />
          {AGENT_DEPLOY_STEPS.map((step, i) => (
            <li key={step.name} className={cn(i % 2 === 1 && "lg:ml-16")}>
              <div className="relative pl-8 sm:pl-10">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-[0.45rem] h-[11px] w-[11px] border border-border bg-surface"
                />
                <div className="max-w-lg">
                  <h3 className="t-h3">{step.name}</h3>
                  <p className="t-body mt-3 text-muted">{step.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ + crosslinks                                                    */
/* ------------------------------------------------------------------ */

export function AgentsFaqs() {
  const headingId = "faq-heading";
  return (
    <Section index="Questions" labelledBy={headingId} className="bg-surface-2/60">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <h2 id={headingId} className="t-dl max-w-[12ch]">
                Asked about agents.
              </h2>
              <p className="t-body mt-6 max-w-xs text-muted">
                The questions serious buyers ask before putting an agent in
                front of customers.
              </p>
            </Reveal>
          </div>
        </div>
        <div className="lg:col-span-8">
          <Faq items={[...AGENT_FAQS]} label="AI agents, frequently asked questions" />
        </div>
      </div>
    </Section>
  );
}
