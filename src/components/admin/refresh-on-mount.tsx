"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Forces a full route-tree refresh on mount (including the layout and
 * its sidebar badge counts). Used on the enquiries list so the badge
 * drops the moment you return from reading an enquiry.
 */
export function RefreshOnMount() {
  const router = useRouter();
  useEffect(() => {
    router.refresh();
  }, [router]);
  return null;
}
