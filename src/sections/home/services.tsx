"use client";

import { useState } from "react";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SERVICES } from "@/constants/services";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Hand-drawn service icons — one stroke weight (1.5), 28px grid       */
/* ------------------------------------------------------------------ */

function IconWeb() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="22" height="18" />
      <path d="M3 10h22" />
      <path d="M6.5 7.75h.01M9.5 7.75h.01" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 15h8M7 18.5h5" strokeLinecap="round" />
    </svg>
  );
}

function IconMobile() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="3" width="12" height="22" rx="2.5" />
      <path d="M12.5 5.75h3" strokeLinecap="round" />
      <path d="M11 11h6M11 14.5h6M11 18h3.5" strokeLinecap="round" />
      <path d="M13 21.75h2" strokeLinecap="round" />
    </svg>
  );
}

function IconAI() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="11" y="11" width="6" height="6" />
      <path d="M14 3v5M14 20v5M3 14h5M20 14h5" />
      <rect x="11.75" y="3.75" width="4.5" height="4.5" />
      <rect x="11.75" y="19.75" width="4.5" height="4.5" />
      <rect x="3.75" y="11.75" width="4.5" height="4.5" />
      <rect x="19.75" y="11.75" width="4.5" height="4.5" />
    </svg>
  );
}

function IconSoftware() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 4 24 9.5 14 15 4 9.5 14 4Z" />
      <path d="m4 14 10 5.5L24 14" />
      <path d="m4 18.5 10 5.5 10-5.5" strokeLinecap="round" />
    </svg>
  );
}

function IconDesign() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 24 6.5 15.5 19 3l6 6L13.5 21.5 4 24Z" strokeLinejoin="round" />
      <path d="m15.5 6.5 6 6" />
      <path d="M6.5 15.5 12 21" strokeLinecap="round" />
    </svg>
  );
}

function IconGrowth() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 24h20" strokeLinecap="round" />
      <path d="M5 19h5v5H5zM12 13h5v11h-5zM19 6h5v18h-5z" />
      <path d="m6 10 6-4 5 3 6-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 3H23v4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SERVICE_ICONS: Record<string, () => React.JSX.Element> = {
  web: IconWeb,
  mobile: IconMobile,
  ai: IconAI,
  software: IconSoftware,
  design: IconDesign,
  growth: IconGrowth,
};

/* ------------------------------------------------------------------ */

export function Services() {
  const [openId, setOpenId] = useState<string | null>(SERVICES[0].id);
  const { open } = useEnquiry();

  return (
    <Section id="services" index="Services" labelledBy="services-heading">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <h2 id="services-heading" className="t-dl">
                What we build.
              </h2>
              <p className="t-body mt-6 max-w-sm text-muted">
                Six disciplines, one connected team, from the first idea to the
                real product, and everything after launch.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="lg:col-span-8">
          <Reveal delay={120}>
            <ul className="border-t border-border">
              {SERVICES.map((service) => {
                const isOpen = openId === service.id;
                const panelId = `service-panel-${service.id}`;
                const Icon = SERVICE_ICONS[service.id];
                return (
                  <li key={service.id} className="border-b border-border">
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => {
                          const next = isOpen ? null : service.id;
                          setOpenId(next);
                          if (next) track("service_open", { service: service.title });
                        }}
                        className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-6 text-left sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:py-7"
                      >
                        <span
                          className={cn(
                            "h-7 w-7 shrink-0 transition-colors duration-300",
                            isOpen ? "text-accent" : "text-muted group-hover:text-foreground",
                          )}
                        >
                          {Icon ? <Icon /> : null}
                        </span>
                        <span
                          className={cn(
                            "t-h2 min-w-0 break-words transition-colors duration-300",
                            isOpen ? "text-foreground" : "text-foreground/75 group-hover:text-foreground",
                          )}
                        >
                          {service.title}
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "relative mt-1 h-3.5 w-3.5 self-center justify-self-end transition-transform duration-500 ease-[var(--ease-out-expo)]",
                            isOpen ? "rotate-45" : "rotate-0 group-hover:rotate-90",
                          )}
                        >
                          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
                        </span>
                      </button>
                    </h3>

                    <div
                      id={panelId}
                      className={cn(
                        "grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)]",
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="pb-9 pl-[calc(3.25rem+2.5rem)] sm:pl-[calc(4rem+2.5rem)]">
                          <p className="t-body-lg max-w-xl text-muted">{service.positioning}</p>
                          <ul className="mt-6 flex max-w-2xl flex-wrap gap-2" aria-label={`${service.title} capabilities`}>
                            {service.capabilities.map((cap) => (
                              <li
                                key={cap}
                                className="t-caption rounded-[2px] border border-border px-2.5 py-1 text-muted"
                              >
                                {cap}
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => open(`service:${service.title}`)}
                            className="group/btn t-sm -ml-1 mt-6 inline-flex items-center gap-2 py-3 font-semibold text-foreground transition-colors hover:text-accent"
                          >
                            Discuss a {service.ctaName} project
                            <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                              <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
