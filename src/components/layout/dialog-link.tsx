"use client";

import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { track } from "@/lib/analytics";

/** Footer link that opens the enquiry drawer (Contact Us, Get a Quote). */
export function DialogLink({ label }: { label: string }) {
  const { open } = useEnquiry();
  return (
    <button
      onClick={() => {
        track("footer_link_click", { label });
        open("footer");
      }}
      className="link-underline text-left text-[0.875rem] text-foreground/75 transition-colors hover:text-foreground"
    >
      {label}
    </button>
  );
}
