"use client";

import { useContext } from "react";
import { track } from "@/lib/analytics";
import {
  ProjectModalContext,
  serviceFromSource,
  type ServiceId,
  type ProjectModalApi,
} from "@/components/shared/project-lead-modal";

/**
 * StartProjectButton: inline CTA that opens the premium project lead
 * modal with the relevant service preselected (e.g. a web service page
 * opens it with "Website / Web Application" chosen). Rendered on every
 * page, so it never throws when the provider is absent - it simply
 * becomes inert outside the site layout.
 */
export function StartProjectButton({
  label = "Start a Similar Project",
  source = "case-study",
  service,
}: {
  label?: string;
  source?: string;
  /** Explicit service preselect; otherwise inferred from the source string. */
  service?: ServiceId;
}) {
  const modal = useContext(ProjectModalContext) as ProjectModalApi | null;

  return (
    <button
      type="button"
      onClick={() => {
        track("start_project_click", { source });
        modal?.open({ service: service ?? serviceFromSource(source) ?? undefined, source });
      }}
      className="inline-flex h-11 items-center rounded-[2px] border border-foreground/25 px-6 text-[0.9375rem] font-semibold transition-colors hover:border-foreground hover:bg-foreground/[0.04]"
    >
      {label}
    </button>
  );
}
