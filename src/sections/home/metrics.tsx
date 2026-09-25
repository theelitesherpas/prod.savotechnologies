import { Reveal } from "@/components/ui/reveal";
import { METRICS } from "@/constants/content";
import { IS_DEMO } from "@/lib/content-mode";
import { getSettings } from "@/lib/settings";

/**
 * Impact metrics — CONTENT_MODE gated. Demo mode renders polished design
 * figures (DEMO DATA — NOT VERIFIED, never in JSON-LD/SEO). Production
 * renders the admin-managed verified figures (Settings → Company impact
 * metrics) with honest pending slots for anything not yet supplied —
 * no invented statistics, ever.
 */
export async function Metrics() {
  const settings = await getSettings();
  const metrics = IS_DEMO
    ? METRICS
    : [
        { value: settings.metrics.projectsDelivered || "…", label: "Projects Delivered" },
        { value: settings.metrics.clientsSupported || "…", label: "Clients Supported" },
        { value: settings.metrics.industriesServed || "…", label: "Industries Served" },
        { value: settings.metrics.marketsReached || "…", label: "Markets Reached" },
      ];

  return (
    <section aria-labelledby="impact-heading" className="chapter-ink border-y border-border bg-background text-foreground">
      <div className="shell py-16 sm:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <h2 id="impact-heading" className="t-h2">
            Impact, measured honestly.
          </h2>
          <p className="t-caption max-w-xs text-muted">
            {IS_DEMO
              ? "Preview figures shown for design evaluation — verified numbers replace them at launch."
              : "Figures appear here only once they can be verified. We don't publish numbers we can't prove."}
          </p>
        </div>

        <Reveal>
          <dl className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex flex-col bg-background p-6 sm:p-7">
                <dt className="t-label order-2 mt-4 text-muted">{metric.label}</dt>
                <dd className="order-1 t-dl flex items-start text-foreground/85">
                  {IS_DEMO ? (
                    metric.value
                  ) : (
                    <>
                      <span aria-label="figure pending verification">{metric.value}</span>
                      {metric.value === "…" ? (
                        <span aria-hidden="true" className="mt-2 ml-1 h-2 w-2 shrink-0 bg-accent/70" />
                      ) : null}
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
