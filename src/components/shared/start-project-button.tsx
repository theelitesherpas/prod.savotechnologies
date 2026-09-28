"use client";

import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { track } from "@/lib/analytics";

/**
 * StartProjectButton — inline CTA that opens the site's enquiry drawer
 * (side panel) instead of navigating away. Used on case-study detail
 * pages and other content pages where the user shouldn't lose context.
 */
export function StartProjectButton({
  label = "Start a Similar Project",
  source = "case-study",
}: {
  label?: string;
  source?: string;
}) {
  const { open } = useEnquiry();

  return (
    <button
      type="button"
      onClick={() => {
        track("start_project_click", { source });
        open(source);
      }}
      className="inline-flex h-11 items-center rounded-[2px] border border-foreground/25 px-6 text-[0.9375rem] font-semibold transition-colors hover:border-foreground hover:bg-foreground/[0.04]"
    >
      {label}
    </button>
  );
}
