import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_META, isEnquiryStatus } from "@/lib/enquiry-status";
import {
  updateEnquiryStatusAction,
  saveEnquiryNotesAction,
  deleteEnquiryAction,
} from "../actions";

export const metadata: Metadata = { title: "Enquiry" };

export default async function EnquiryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; confirm?: string }>;
}) {
  const { id } = await params;
  const { saved, confirm } = await searchParams;
  const [user, enquiry] = await Promise.all([
    getAdminUser(),
    prisma
      ? prisma.projectEnquiry.findUnique({ where: { id } })
      : Promise.resolve(null),
  ]);

  if (!enquiry) notFound();

  return (
    <div>
      <Link href="/admin/enquiries" className="t-sm link-underline mb-6 inline-block text-muted">
        ← Back to inbox
      </Link>

      {saved ? (
        <p role="status" className="t-sm mb-4 border border-border bg-foreground/[0.03] px-3 py-2 text-foreground/80">
          Notes saved.
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Lead record */}
        <div className="lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h1 className="t-h3">{enquiry.name}</h1>
            <span
              className={`t-caption border px-2 py-0.5 ${
                enquiry.status === "new" ? "border-accent/50 text-accent" : "border-border text-muted"
              }`}
            >
              {isEnquiryStatus(enquiry.status) ? ENQUIRY_STATUS_META[enquiry.status].label : enquiry.status}
            </span>
          </div>

          <dl className="mb-8 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2">
            {[
              ["Email", enquiry.email ?? "—"],
              ["Phone", enquiry.phone ?? "—"],
              ["Company", enquiry.company ?? "—"],
              ["Type", enquiry.projectType],
              ["Budget", enquiry.budget ?? "—"],
              ["Source", enquiry.source],
              ["Received", enquiry.createdAt.toISOString().replace("T", " · ").slice(0, 17)],
              ["IP (hashed prefix)", enquiry.ipHash ? enquiry.ipHash.slice(0, 12) : "—"],
            ].map(([label, value]) => (
              <div key={label} className="bg-background px-4 py-3">
                <dt className="t-label mb-1 text-muted">{label}</dt>
                <dd className="t-sm break-words text-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="t-label mb-2 text-muted">Message</h2>
          <p className="t-sm mb-8 whitespace-pre-wrap break-words border border-border bg-background p-4 leading-relaxed text-foreground">
            {enquiry.message}
          </p>

          {/* Notes */}
          <form action={saveEnquiryNotesAction} className="mb-8">
            <input type="hidden" name="id" value={enquiry.id} />
            <label htmlFor="notes" className="t-label mb-2 block text-muted">
              Internal notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              maxLength={4000}
              defaultValue={enquiry.adminNotes ?? ""}
              className="w-full border border-border bg-background p-3 text-foreground outline-none transition-colors focus:border-accent"
              placeholder="Context, follow-ups, outcome…"
            />
            <button
              type="submit"
              className="mt-3 h-10 bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-accent hover:text-on-accent"
            >
              Save notes
            </button>
          </form>
        </div>

        {/* Side rail: status + danger zone */}
        <aside>
          <h2 className="t-label mb-3 text-muted">Status</h2>
          <form action={updateEnquiryStatusAction} className="mb-8 space-y-2">
            <input type="hidden" name="id" value={enquiry.id} />
            <input type="hidden" name="backTo" value={`/admin/enquiries/${enquiry.id}`} />
            {ENQUIRY_STATUSES.map((s) => (
              <button
                key={s}
                type="submit"
                name="status"
                value={s}
                aria-pressed={enquiry.status === s}
                className={`t-sm block w-full border px-3 py-2 text-left transition-colors ${
                  enquiry.status === s
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-foreground/80 hover:border-foreground/40"
                }`}
              >
                {ENQUIRY_STATUS_META[s].label}
                <span className="t-caption ml-2 text-muted">
                  {ENQUIRY_STATUS_META[s].hint}
                </span>
              </button>
            ))}
          </form>

          {user?.role === "admin" ? (
            <div className="border border-accent/40 p-4">
              <h2 className="t-label mb-2 text-accent">Danger zone</h2>
              {confirm !== "1" ? (
                <Link
                  href={`/admin/enquiries/${enquiry.id}?confirm=1`}
                  className="t-sm border border-accent/50 px-3 py-2 text-accent transition-colors hover:bg-accent hover:text-on-accent"
                >
                  Delete this enquiry…
                </Link>
              ) : (
                <form action={deleteEnquiryAction}>
                  <input type="hidden" name="id" value={enquiry.id} />
                  <input type="hidden" name="confirm" value="DELETE" />
                  <p className="t-sm mb-3 text-foreground/80">
                    Permanent. This cannot be undone.
                  </p>
                  <button
                    type="submit"
                    className="t-sm bg-accent px-3 py-2 font-semibold text-on-accent"
                  >
                    Yes, delete permanently
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
