"use client";

import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { useProjectModal } from "@/components/shared/project-lead-modal";
import { ClosingArrow, ClosingCta } from "@/components/shared/closing-cta";
import { track } from "@/lib/analytics";

export function FinalCTA() {
  const { open } = useEnquiry();
  const { open: openProject } = useProjectModal();

  return (
    <ClosingCta
      id="start"
      headingId="cta-heading"
      title="Tell us what you have in mind."
      description="Share the problem you are trying to solve, the product you want to build or the system you need to improve. We can then talk through what is involved and a sensible place to start."
    >
      <button
        type="button"
        onClick={() => {
          track("start_project_click", { location: "final-cta" });
          openProject({ source: "final-cta" });
        }}
      >
        Start a Project<ClosingArrow />
      </button>
      <button type="button" onClick={() => open("final-cta-talk")}>
        Let&apos;s Talk<ClosingArrow />
      </button>
    </ClosingCta>
  );
}
