import { Reveal } from "@/components/ui/reveal";
import { METRICS } from "@/constants/content";

/**
 * Impact metrics. Values are deliberately rendered as pending marks,
 * SAVO publishes figures only when they can be verified. No invented
 * statistics, ever.
 */
export function Metrics() {
  return (
    <section aria-labelledby="impact-heading" className="chapter-ink border-y border-border bg-background text-foreground">
      <div className="shell py-16 sm:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <h2 id="impact-heading" className="t-h2">
            Impact, measured honestly.
          </h2>
          <p className="t-caption max-w-xs text-muted">
            Figures appear here only once they can be verified. We don&apos;t
            publish numbers we can&apos;t prove.
          </p>
        </div>

        <Reveal>
          <dl className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
            {METRICS.map((metric) => (
              <div key={metric.label} className="flex flex-col bg-background p-6 sm:p-7">
                <dt className="t-label order-2 mt-4 text-muted">{metric.label}</dt>
                <dd className="order-1 t-dl flex items-start text-foreground/30">
                  <span aria-label="figure pending verification">…</span>
                  <span aria-hidden="true" className="mt-2 ml-1 h-2 w-2 shrink-0 bg-accent/70" />
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
