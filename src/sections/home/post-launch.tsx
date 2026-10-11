import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";

/**
 * LAUNCH ISN'T THE FINISH LINE. (master spec Part 57)
 *
 * Post-launch positioning: monitoring, maintenance, iteration, growth.
 * Connects the Grow methodology phase to the ongoing relationship.
 */

const POST_LAUNCH: { k: string; v: string }[] = [
  { k: "Monitoring", v: "Uptime, errors and performance watched continuously. Incidents are worked, then written up." },
  { k: "Maintenance", v: "Dependencies updated deliberately, security patches applied, platform health reviewed on a cadence." },
  { k: "Iteration", v: "Analytics and user feedback drive the next version. Products that stop improving start dying." },
  { k: "Growth", v: "Search visibility, conversion and content performance measured and improved after launch, not assumed." },
];

export function PostLaunch() {
  const headingId = "post-launch-heading";
  return (
    <Section index="After launch" labelledBy={headingId} className="bg-surface-2/40">
      <SectionHeader
        id={headingId}
        heading={<>Launch isn&rsquo;t the finish line.</>}
        lead={
          <>
            The day a product ships is the first day of its real life. We
            stay for that part.
          </>
        }
      />
      <Reveal>
        <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {POST_LAUNCH.map((c) => (
            <div key={c.k} className="bg-background p-6 sm:p-7">
              <h3 className="t-h4 font-serif">{c.k}</h3>
              <p className="t-sm mt-3 leading-relaxed text-muted">{c.v}</p>
            </div>
          ))}
        </div>
      </Reveal>
      <Reveal delay={120}>
        <p className="t-sm mt-8 max-w-[70ch] text-muted">
          Support and optimisation is a defined engagement model, or a clean handover with documentation. Lock-in is
          not a retention strategy.
        </p>
      </Reveal>
    </Section>
  );
}
