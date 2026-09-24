"use client";

import { useEnquiry } from "@/components/shared/enquiry-dialog";

/** Footer "Start a Project" entry point (opens the enquiry drawer). */
export function FooterCta() {
  const { open } = useEnquiry();
  return (
    <button
      onClick={() => open("footer")}
      className="group/btn t-sm inline-flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-accent"
    >
      Start a Project
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
    </button>
  );
}
