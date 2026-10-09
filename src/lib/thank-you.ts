import { withBasePath } from "@/lib/utils";

/**
 * Post-submission routing to the /thank-you confirmation page.
 *
 * Only a server-issued reference (crypto-random, stored with the enquiry
 * before the response was sent) earns the redirect — anything else keeps
 * the caller's inline success state, so legacy/honeypot paths never land
 * on a page that would claim a receipt it cannot prove.
 *
 * location.replace (not push) keeps the form out of history: back returns
 * to where the visitor came from, never to a submitted form whose
 * resubmission would duplicate the enquiry.
 */
export function redirectToThankYou(reference: unknown): boolean {
  if (typeof window === "undefined" || typeof reference !== "string" || !reference) {
    return false;
  }
  window.location.replace(
    withBasePath(`/thank-you?ref=${encodeURIComponent(reference)}`),
  );
  return true;
}
