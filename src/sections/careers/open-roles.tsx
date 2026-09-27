"use client";

import { useState } from "react";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ROLE_FILTERS, CAREERS_EMAIL, roleSlug, type PublicRole } from "@/constants/careers";
import { SITE } from "@/constants/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Open roles - filterable hairline rows in the v6 accordion idiom
 * (services pattern: rotating plus, grid-rows 0fr→1fr panels).
 * "Apply for this role" deep-links the apply page with the role preselected.
 */
export function OpenRoles({ roles: ROLES }: { roles: PublicRole[] }) {
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
                      {role.exp} · Full time
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

      {/* No matching role - the HR desk */}
      <Reveal delay={160}>
        <div className="mt-12 border border-border bg-surface">
          <div className="grid gap-px border-b border-border bg-border sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div className="bg-background p-7 sm:p-8">
              <p className="t-label text-accent-strong">The HR desk</p>
              <h3 className="t-h3 mt-4">No matching role today?</h3>
              <p className="t-sm mt-3 text-muted">
                Send{" "}
                <Link href="/careers/apply/" className="link-underline font-semibold text-foreground">
                  a general application
                </Link>{" "}
                and tell us what you would want to build here — or reach the HR
                team directly on any channel alongside.
              </p>
            </div>

            <HrChannel
              icon={<PhoneGlyph />}
              label="Call HR"
              value={SITE.hrPhone}
              caption="Direct line to the people who hire."
              href={`tel:${SITE.hrPhoneE164}`}
            />
            <HrChannel
              icon={<WhatsAppGlyph />}
              label="WhatsApp"
              value={SITE.hrPhone}
              caption="Quick questions on roles, interviews and offers."
              href={`https://wa.me/${SITE.hrPhoneE164.replace("+", "")}?text=${encodeURIComponent(
                "Hi Savo HR — I have a question about a role/career opportunity.",
              )}`}
              external
            />
            <HrChannel
              icon={<MailGlyph />}
              label="Email"
              value={CAREERS_EMAIL}
              caption="Applications and portfolios, any time."
              href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent("Career at Savo Technologies")}`}
            />
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ── HR contact channel cell ─────────────────────────────── */

function HrChannel({
  icon,
  label,
  value,
  caption,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => track("hr_channel_click", { channel: label })}
      className="group flex flex-col justify-between gap-6 bg-background p-7 transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-foreground focus-visible:bg-foreground sm:p-8"
    >
      <span className="flex items-center justify-between gap-4">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center border border-border text-foreground transition-colors duration-300 group-hover:border-background/30 group-hover:text-background"
        >
          {icon}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 14 14"
          className="h-3.5 w-3.5 text-muted transition-all duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-[4px] group-hover:text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
        </svg>
      </span>
      <span>
        <span className="t-label block text-muted transition-colors duration-300 group-hover:text-background/70">{label}</span>
        <span className="t-h4 mt-2 block break-words transition-colors duration-300 group-hover:text-background">{value}</span>
        <span className="t-caption mt-2 block text-muted transition-colors duration-300 group-hover:text-background/70">{caption}</span>
      </span>
    </a>
  );
}

/* Hairline icons, one stroke grammar (1.7px, currentColor). */

function PhoneGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z" />
    </svg>
  );
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.5A8.4 8.4 0 1 1 21 11.5Z" />
      <path d="M9.2 8.6c.6 2.5 3.7 5.6 6.2 6.2l.9-1.4-2.1-1-.9.7c-.9-.4-2-1.5-2.4-2.4l.7-.9-1-2.1-1.4.9Z" />
    </svg>
  );
}

function MailGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </svg>
  );
}
