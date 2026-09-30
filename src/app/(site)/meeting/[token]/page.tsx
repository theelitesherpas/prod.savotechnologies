import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMeetingByToken } from "@/lib/meeting/service";
import { MeetingScheduler } from "./scheduler";

export const dynamic = "force-dynamic";

/** Dynamic metadata: WhatsApp/social shows the meeting-specific preview. */
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const result = await getMeetingByToken(token);

  const title = "Schedule Your Meeting";
  const description =
    "error" in result
      ? "Schedule a meeting with Savo Technologies"
      : `Hi ${result.clientName.split(" ")[0]}, please pick a date and time for your meeting: ${result.title}`;

  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true },
    openGraph: {
      title: `${title} | Savo Technologies`,
      description,
      type: "website",
      siteName: "Savo Technologies",
      images: [{ url: "/images/meeting-og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Savo Technologies`,
      description,
      images: ["/images/meeting-og.png"],
    },
  };
}

/** Public meeting scheduling page — within the Savo site layout. */
export default async function MeetingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getMeetingByToken(token);

  if ("error" in result) {
    if (result.expired) {
      return (
        <div className="mx-auto max-w-lg px-4 py-20 text-center sm:py-28">
          <div className="mb-6 flex justify-center">
            <svg viewBox="0 0 24 24" className="h-12 w-12 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="t-h3">This meeting request has expired.</h1>
          <p className="t-body mt-3 text-muted">
            Please contact Savo Technologies to request a new scheduling link.
          </p>
          <a
            href="mailto:hello@savotechnologies.com"
            className="mt-6 inline-block rounded-lg border border-accent/50 bg-accent/[0.06] px-6 py-3 t-sm font-semibold text-accent transition-colors hover:border-accent"
          >
            Contact Savo
          </a>
        </div>
      );
    }
    notFound();
  }

  return <MeetingScheduler data={result} token={token} />;
}
