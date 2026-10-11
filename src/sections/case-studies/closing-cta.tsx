"use client";

import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { ClosingArrow, ClosingCta } from "@/components/shared/closing-cta";
import { track } from "@/lib/analytics";

export function CaseStudiesCta() {
  const { open } = useEnquiry();

  return (
    <ClosingCta
      headingId="cs-cta-heading"
      title="What could we build together?"
      description="Tell us what you are imagining - and the problem it needs to solve."
    >
      <button
        type="button"
        onClick={() => {
          track("start_project_click", { location: "case-studies-cta" });
          open("case-studies-cta");
        }}
      >
        Start a Project<ClosingArrow />
      </button>
      <button type="button" onClick={() => open("case-studies-cta-talk")}>
        Let&apos;s Talk<ClosingArrow />
      </button>
    </ClosingCta>
  );
}
