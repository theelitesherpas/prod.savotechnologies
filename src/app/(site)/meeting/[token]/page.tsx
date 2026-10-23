import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ownerSocialImage } from "@/lib/social-images";
import { getMeetingByToken } from "@/lib/meeting/service";
import { istClock } from "@/sections/meeting/meeting-model";
import { MeetingUnavailable } from "@/sections/meeting/meeting-views";
import { MeetingScheduler } from "./scheduler";

export const dynamic = "force-dynamic";

/** Keep invitation/client details out of link previews; the page is not indexable. */
const TITLE = "Schedule Your Meeting";
const DESCRIPTION = "Schedule a meeting with Savo Technologies. Review your preferred date and time before sending availability.";
const MEETING_IMAGE = ownerSocialImage("meeting");
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  referrer: "no-referrer",
  robots: { index: false, follow: false, nocache: true },
  openGraph: { title: `${TITLE} | Savo Technologies`, description: DESCRIPTION, type: "website", siteName: "Savo Technologies", images: [MEETING_IMAGE] },
  twitter: { card: "summary_large_image", title: `${TITLE} | Savo Technologies`, description: DESCRIPTION, images: [MEETING_IMAGE] },
};

/** Only the high-entropy bearer token grants access; human references are not credentials. */
export default async function MeetingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let result: Awaited<ReturnType<typeof getMeetingByToken>>;
  try { result = await getMeetingByToken(token); }
  catch { return <MeetingUnavailable kind="unavailable" />; }
  if ("error" in result) {
    if (result.expired) return <MeetingUnavailable kind="expired" />;
    if (/service unavailable|database unavailable/i.test(result.error)) return <MeetingUnavailable kind="unavailable" />;
    notFound();
  }
  return <MeetingScheduler data={result} token={token} initialClock={istClock()} />;
}
