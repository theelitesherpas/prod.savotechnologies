"use client";

import Link from "next/link";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { ClosingArrow, ClosingCta } from "@/components/shared/closing-cta";
import { track } from "@/lib/analytics";

/** Shared closing presentation; each page retains its enquiry source and copy. */
export function DetailCta({
  headingId,
  heading,
  lead,
  location,
  secondaryLabel = "Let's Talk",
  secondaryHref,
}: {
  headingId: string;
  heading: string;
  lead: string;
  location: string;
  secondaryLabel?: string;
  /** When set, the secondary control links instead of opening the drawer. */
  secondaryHref?: string;
}) {
  const { open } = useEnquiry();

  return (
    <ClosingCta headingId={headingId} title={heading} description={lead}>
      <button
        type="button"
        onClick={() => {
          track("start_project_click", { location });
          open(location);
        }}
      >
        Start a Project<ClosingArrow />
      </button>
      {secondaryHref ? (
        <Link href={secondaryHref}>{secondaryLabel}<ClosingArrow /></Link>
      ) : (
        <button type="button" onClick={() => open(`${location}-talk`)}>
          {secondaryLabel}<ClosingArrow />
        </button>
      )}
    </ClosingCta>
  );
}
