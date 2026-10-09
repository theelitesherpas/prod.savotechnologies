"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Thank-you page analytics: one view event per confirmed page render.
 * Carries only journey category and confirmation validity — no reference,
 * no personal data (analytics never sees enquiry content).
 */
export function ThankYouAnalytics({
  valid,
  journey,
}: {
  valid: boolean;
  journey: "careers" | "project" | "generic";
}) {
  useEffect(() => {
    track("thank_you_view", { valid, journey });
  }, [valid, journey]);
  return null;
}
