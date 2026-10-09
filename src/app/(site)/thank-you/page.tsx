import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isValidEnquiryReference } from "@/lib/enquiry-reference";
import { ThankYouHero } from "@/sections/thank-you/thank-you-hero";
import { ReviewInvite } from "@/sections/thank-you/review-invite";
import { ContinueExploring } from "@/sections/thank-you/continue-exploring";
import { ThankYouAnalytics } from "@/components/shared/thank-you-analytics";
import { ThankYouReviewInvite } from "@/components/shared/review-invite-modal";
import { CAREERS_EMAIL } from "@/constants/careers";
import { SITE } from "@/constants/site";

/**
 * Thank-you — the confirmation surface for every enquiry that lands in
 * the shared pipeline (contact, careers applications, project briefs and
 * the enquiry drawer). The page renders the received state only when the
 * ?ref= reference matches a stored enquiry; a direct visit gets an
 * honest generic state instead of a false confirmation.
 *
 * The reference is the only enquiry data on this page — no names, no
 * contact details, no internal ids. Lookup is an existence check plus
 * the source, which picks the continuation CTA. noindex/follow, never
 * in the sitemap.
 */

export const metadata: Metadata = {
  title: "Thank You",
  description:
    "Thank you for contacting Savo Technologies. Your enquiry is with our team.",
  robots: { index: false, follow: true },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  let reference: string | null = null;
  let journey: "careers" | "project" = "project";

  if (isValidEnquiryReference(ref) && prisma) {
    try {
      const row = await prisma.projectEnquiry.findUnique({
        where: { reference: ref },
        select: { source: true },
      });
      if (row) {
        reference = ref;
        journey = row.source.startsWith("careers") ? "careers" : "project";
      }
    } catch {
      // Lookup failures degrade to the generic state — the page never
      // fabricates a confirmation it cannot verify.
    }
  }

  // Careers conversations belong to the HR desk, not the general inbox.
  const contactEmail = journey === "careers" ? CAREERS_EMAIL : SITE.email;

  return (
    <>
      <ThankYouAnalytics valid={reference !== null} journey={reference ? journey : "generic"} />

      {/* 01: Ink hero — confirmation, reference docket and next steps */}
      <ThankYouHero reference={reference} journey={journey} contactEmail={contactEmail} />

      {/* 02: The Google review invitation */}
      <ReviewInvite />

      {/* 03: The quiet close */}
      <ContinueExploring journey={journey} />

      {/* Review invitation: once per session, only for verified submissions */}
      <ThankYouReviewInvite journey={reference ? journey : "generic"} />
    </>
  );
}
