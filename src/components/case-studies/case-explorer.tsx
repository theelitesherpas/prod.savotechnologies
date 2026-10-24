"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * CASE EXPLORER (master spec Part 15) - world-class case study discovery.
 *
 * Elegant, typography-first filtering across every published study:
 * discipline, industry, technology, platform and AI. Client-side and
 * instant; the full list is small and static at render time.
 *
 * Design contract: hairline chips, mono labels, no heavy cards - the
 * entries read as an index of record, not a shop grid.
 */

export type ExplorerEntry = {
  slug: string;
  name: string;
  discipline: string;
  disciplines: string[];
  industry: string;
  technologies: string[];
  platforms: string[];
  level: string;
  isAi: boolean;
};

type FilterKey = "all" | "ai" | "discipline" | "industry" | "technology" | "platform";

const DISCIPLINE_LABELS: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  ai: "AI & Agents",
  software: "Software & SaaS",
  design: "Design",
  growth: "Growth",
};

export function CaseExplorer({ entries }: { entries: ExplorerEntry[] }) {
  const [active, setActive] = useState<{ key: FilterKey; value: string }>({ key: "all", value: "all" });

  const facets = useMemo(() => {
    const disciplines = new Map<string, string>();
    const industries = new Set<string>();
    const technologies = new Set<string>();
    const platforms = new Set<string>();
    for (const e of entries) {
      e.disciplines.forEach((d) => disciplines.set(d, DISCIPLINE_LABELS[d] ?? d));
      if (e.industry) e.industry.split("·").forEach((i) => i.trim() && industries.add(i.trim()));
      e.technologies.forEach((t) => technologies.add(t));
      e.platforms.forEach((p) => platforms.add(p));
    }
    return {
      disciplines: [...disciplines.entries()],
      industries: [...industries].sort(),
      technologies: [...technologies].sort(),
      platforms: [...platforms].sort(),
    };
  }, [entries]);

  const filtered = useMemo(() => {
    if (active.key === "all") return entries;
    if (active.key === "ai") return entries.filter((e) => e.isAi);
    if (active.key === "discipline") return entries.filter((e) => e.disciplines.includes(active.value));
    if (active.key === "industry") return entries.filter((e) => e.industry.includes(active.value));
    if (active.key === "technology") return entries.filter((e) => e.technologies.includes(active.value));
    if (active.key === "platform") return entries.filter((e) => e.platforms.includes(active.value));
    return entries;
  }, [entries, active]);

  const chip = (key: FilterKey, value: string, label: string) => {
    const isActive = active.key === key && active.value === value;
    return (
      <button
        key={`${key}:${value}`}
        type="button"
        aria-pressed={isActive}
        onClick={() => {
          if (!isActive) track("case_filter", { facet: key, value });
          setActive(isActive ? { key: "all", value: "all" } : { key, value });
        }}
        className={cn(
          "t-sm border px-3.5 py-1.5 transition-colors",
          isActive
            ? "border-accent bg-accent text-on-accent"
            : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
        )}
      >
        {label}
      </button>
    );
  };

  const hasFacet = (key: FilterKey, value: string) => {
    if (active.key === "all") return true;
    if (active.key === "ai") return true;
    if (active.key !== key) return true;
    return active.value === value;
  };

  return (
    <section aria-labelledby="explorer-heading" className="border-y border-border bg-surface">
      <div className="shell py-14 sm:py-18">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 id="explorer-heading" className="t-h3">
            Explore the portfolio.
          </h2>
          <p aria-live="polite" className="t-label text-muted">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            {active.key !== "all" ? ` · ${active.value}` : ""}
          </p>
        </div>

        <div className="space-y-4" role="group" aria-label="Filter case studies">
          <div className="flex flex-wrap items-center gap-2">
            <span className="t-label w-24 shrink-0 text-muted">Filter</span>
            {chip("all", "all", "Everything")}
            {chip("ai", "ai", "AI work")}
          </div>
          {facets.disciplines.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="t-label w-24 shrink-0 text-muted">Discipline</span>
              {facets.disciplines.filter(([id]) => hasFacet("discipline", id)).map(([id, label]) => chip("discipline", id, label))}
            </div>
          ) : null}
          {facets.industries.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="t-label w-24 shrink-0 text-muted">Industry</span>
              {facets.industries.filter((i) => hasFacet("industry", i)).slice(0, 12).map((i) => chip("industry", i, i))}
            </div>
          ) : null}
          {facets.technologies.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="t-label w-24 shrink-0 text-muted">Technology</span>
              {facets.technologies.filter((t) => hasFacet("technology", t)).slice(0, 12).map((t) => chip("technology", t, t))}
            </div>
          ) : null}
          {facets.platforms.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="t-label w-24 shrink-0 text-muted">Platform</span>
              {facets.platforms.filter((p) => hasFacet("platform", p)).map((p) => chip("platform", p, p))}
            </div>
          ) : null}
        </div>

        <ul className="mt-10 divide-y divide-border border-y border-border">
          {filtered.map((e) => (
            <li key={e.slug}>
              <Link
                href={`/case-studies/${e.slug}`}
                onClick={() => track("case_study_open", { slug: e.slug })}
                className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-x-5 gap-y-1 py-5 transition-colors hover:bg-background sm:grid-cols-[auto_1fr_auto_auto]"
              >
                <span className="t-label text-muted">{e.disciplines.map((d) => DISCIPLINE_LABELS[d] ?? d).join(" · ")}</span>
                <span className="t-body font-medium underline-offset-4 group-hover:underline">{e.name}</span>
                <span className="t-sm col-span-3 text-muted sm:col-span-1 sm:max-w-[36ch] sm:truncate">{e.industry}</span>
                <span aria-hidden="true" className="t-label text-muted transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="py-8">
              <p className="t-sm text-muted">
                No entries match this filter yet. Verified engagements are published as their outcomes are confirmed.
              </p>
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}
