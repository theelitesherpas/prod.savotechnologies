"use client";

import { useState } from "react";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ROLES, ROLE_FILTERS, CAREERS_EMAIL, roleSlug } from "@/constants/careers";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Open roles — filterable hairline rows in the v6 accordion idiom
 * (services pattern: rotating plus, grid-rows 0fr→1fr panels).
 * "Apply for this role" deep-links the apply page with the role preselected.
 */
export function OpenRoles() {
  const [filter, setFilter] = useState<"all" | "eng" | "design" | "ops">("all");
  const [openTitle, setOpenTitle] = useState<string | null>(ROLES[0]?.title ?? null);

  const visible = ROLES.filter((r) => filter === "all" || r.cat === filter);

  return (
    <Section id="openings" index="Open Roles" labelledBy="openings-heading">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-14">
        <Reveal>
          <h2 id="openings-heading" className="t-dl">
            Six seats, one standard.
          </h2>
        </Reveal>
        {/* Filters */}
        <Reveal delay={100}>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter roles by team">
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => {
                  setFilter(f.key);
                  track("role_filter_click", { filter: f.key });
                }}
                className={cn(
                  "t-sm rounded-[2px] border px-4 py-2.5 font-semibold transition-colors duration-300 ease-[var(--ease-out-expo)]",
                  filter === f.key
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal delay={120}>
        <ul className="border-t border-border">
          {visible.map((role) => {
            const isOpen = openTitle === role.title;
            const panelId = `role-panel-${roleSlug(role.title)}`;
            return (
              <li key={role.title} className="border-b border-border">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => {
                      const next = isOpen ? null : role.title;
                      setOpenTitle(next);
                      if (next) track("role_open", { role: next });
                    }}
                    className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 py-6 text-left sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:py-7"
                  >
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "t-h2 block break-words transition-colors duration-300",
                          isOpen ? "text-foreground" : "text-foreground/75 group-hover:text-foreground",
                        )}
                      >
                        {role.title}
                      </span>
                      <span className="t-label mt-1.5 block text-muted">{role.track}</span>
                    </span>
                    <span className="t-sm col-span-2 text-muted sm:col-span-1 sm:text-right">
                      {role.exp} · <span className="tnum">{role.band}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative h-3.5 w-3.5 justify-self-end transition-transform duration-500 ease-[var(--ease-out-expo)]",
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
                    <div className="pb-9 sm:pl-[3.4rem]">
                      <p className="t-body max-w-2xl text-muted">{role.blurb}</p>

                      <div className="mt-7 grid gap-8 sm:grid-cols-2">
                        <div>
                          <p className="t-label mb-4 text-muted">What you will do</p>
                          <ul className="space-y-3">
                            {role.duties.map((d) => (
                              <li key={d} className="t-sm flex gap-3 text-muted">
                                <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 bg-accent/70" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="t-label mb-4 text-muted">What you bring</p>
                          <ul className="space-y-3">
                            {role.brings.map((b) => (
                              <li key={b} className="t-sm flex gap-3 text-muted">
                                <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 border border-accent/70" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                        <Link
                          href={`/careers/apply/?role=${roleSlug(role.title)}`}
                          onClick={() => track("apply_click", { role: role.title })}
                          className="group/btn inline-flex h-[3rem] items-center justify-center gap-2.5 rounded-[2px] bg-foreground px-6 text-[0.9375rem] font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
                        >
                          Apply for this role
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
                        <p className="t-caption text-muted">
                          Full time · Remote (India) · Indore
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Reveal>

      {/* No matching role */}
      <Reveal delay={160}>
        <p className="t-sm mt-8 max-w-xl text-muted">
          No matching role today?{" "}
          <Link
            href="/careers/apply/"
            className="link-underline font-semibold text-foreground"
          >
            Send a general application
          </Link>{" "}
          — or write to{" "}
          <a href={`mailto:${CAREERS_EMAIL}`} className="link-underline font-semibold text-foreground">
            {CAREERS_EMAIL}
          </a>{" "}
          and tell us what you would want to build here.
        </p>
      </Reveal>
    </Section>
  );
}
