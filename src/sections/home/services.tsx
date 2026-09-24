"use client";

import { useRef, useState } from "react";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SERVICES } from "@/constants/services";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function Services() {
  const [openId, setOpenId] = useState<string | null>(SERVICES[0].id);
  const { open } = useEnquiry();
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  return (
    <Section id="services" index="04 — Services" labelledBy="services-heading">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <h2 id="services-heading" ref={headingRef} className="t-dl">
                What we build.
              </h2>
              <p className="t-body mt-6 max-w-sm text-muted">
                Six disciplines, one connected team — from the first idea to the
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
                        className="group grid w-full grid-cols-[3.5rem_1fr_auto] items-baseline gap-4 py-7 text-left sm:grid-cols-[4.5rem_1fr_auto] sm:py-8"
                      >
                        <span
                          className={cn(
                            "t-label tnum transition-colors duration-300",
                            isOpen ? "text-accent" : "text-muted",
                          )}
                        >
                          {service.index}
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
                            "relative mt-1 h-3.5 w-3.5 self-start justify-self-end transition-transform duration-500 ease-[var(--ease-out-expo)]",
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
                        <div className="pb-9 pl-[3.5rem] sm:pl-[4.5rem]">
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
                            className="group/btn t-sm -ml-1 inline-flex items-center gap-2 py-3 font-semibold text-foreground transition-colors hover:text-accent"
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
