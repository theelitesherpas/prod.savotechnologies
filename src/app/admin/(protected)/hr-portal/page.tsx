import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, StatTile, Chip } from "@/components/admin/ui";
import {
  shortlistEnquiryAction,
  rejectEnquiryAction,
} from "../enquiries/career-actions";

export const metadata: Metadata = { title: "HR portal" };
export const dynamic = "force-dynamic";

const CAREER_STATUS: Record<string, { label: string; tone: "default" | "accent" | "success" | "warning" | "muted" }> = {
  shortlisted: { label: "Shortlisted", tone: "accent" },
  interview_scheduled: { label: "Interview scheduled", tone: "warning" },
  rejected: { label: "Rejected", tone: "muted" },
  hired: { label: "Hired", tone: "success" },
};

/** HR portal - recruitment pipeline for career enquiries. */
export default async function HRPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; e?: string }>;
}) {
  const { tab, e } = await searchParams;
  if (!prisma) {
    return (
      <div className="max-w-6xl">
        <PageHeader title="HR portal" />
        <Notice kind="alert">Database unavailable.</Notice>
      </div>
    );
  }

  // All career enquiries (form: "careers" in data)
  const careerEnquiries = await prisma.projectEnquiry.findMany({
    where: { data: { path: ["form"], equals: "careers" } },
    orderBy: { createdAt: "desc" },
  });

  const active = tab ?? "pipeline";
  const shortlisted = careerEnquiries.filter((enq) => enq.careerStatus === "shortlisted");
  const scheduled = careerEnquiries.filter((enq) => enq.careerStatus === "interview_scheduled");
  const rejected = careerEnquiries.filter((enq) => enq.careerStatus === "rejected");
  const hired = careerEnquiries.filter((enq) => enq.careerStatus === "hired");
  const newApps = careerEnquiries.filter((enq) => !enq.careerStatus);

  const list =
    active === "shortlisted" ? shortlisted :
    active === "scheduled" ? scheduled :
    active === "rejected" ? rejected :
    active === "hired" ? hired :
    active === "new" ? newApps :
    careerEnquiries.filter((enq) => !enq.careerStatus || ["shortlisted", "interview_scheduled"].includes(enq.careerStatus ?? ""));

  const role = (data: unknown) => {
    if (data && typeof data === "object" && "role" in data) return String((data as Record<string, unknown>).role ?? "-").slice(0, 40);
    return "-";
  };

  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "-";

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="HR portal"
        description="Recruitment pipeline for career enquiries - shortlist, schedule interviews, reject and hire, with automatic emails at every step."
      />
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatTile label="New applications" value={newApps.length} icon="inbox" href="/admin/hr-portal?tab=new" accent={newApps.length > 0} />
        <StatTile label="Shortlisted" value={shortlisted.length} icon="user" href="/admin/hr-portal?tab=shortlisted" />
        <StatTile label="Interviews scheduled" value={scheduled.length} icon="sun" href="/admin/hr-portal?tab=scheduled" />
        <StatTile label="Hired" value={hired.length} icon="check" href="/admin/hr-portal?tab=hired" />
        <StatTile label="Rejected" value={rejected.length} icon="close" href="/admin/hr-portal?tab=rejected" />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["pipeline", "Active pipeline"],
          ["new", `New (${newApps.length})`],
          ["shortlisted", `Shortlisted (${shortlisted.length})`],
          ["scheduled", `Interviews (${scheduled.length})`],
          ["hired", `Hired (${hired.length})`],
          ["rejected", `Rejected (${rejected.length})`],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/hr-portal?tab=${key}`}
            className={`inline-flex h-9 items-center rounded-lg border px-3.5 text-[0.8125rem] font-semibold transition-colors ${
              active === key
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Candidate list */}
      <div className="adm-card overflow-x-auto">
        {list.length === 0 ? (
          <p className="t-sm p-6 text-center text-muted">
            No candidates in this stage yet.
          </p>
        ) : (
          <table className="adm-hairline-table w-full min-w-[48rem]">
            <thead>
              <tr>
                <th className="px-4 py-2.5 text-left text-[0.75rem] font-semibold text-muted">Candidate</th>
                <th className="px-4 py-2.5 text-left text-[0.75rem] font-semibold text-muted">Role</th>
                <th className="px-4 py-2.5 text-left text-[0.75rem] font-semibold text-muted">Applied</th>
                <th className="hidden px-4 py-2.5 text-left text-[0.75rem] font-semibold text-muted lg:table-cell">Interview</th>
                <th className="px-4 py-2.5 text-center text-[0.75rem] font-semibold text-muted">Status</th>
                <th className="px-4 py-2.5 text-right text-[0.75rem] font-semibold text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((enq) => {
                const meta = enq.careerStatus ? CAREER_STATUS[enq.careerStatus] : null;
                const isNew = !enq.careerStatus;
                return (
                  <tr key={enq.id}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/enquiries/${enq.id}`} className="text-[0.875rem] font-semibold text-foreground hover:text-accent">
                        {enq.name}
                      </Link>
                      <span className="block max-w-[14rem] truncate text-[0.75rem] text-muted">{enq.email}</span>
                    </td>
                    <td className="px-4 py-3 text-[0.8125rem]">{role(enq.data)}</td>
                    <td className="px-4 py-3 text-[0.75rem] text-muted">{fmtDate(enq.createdAt)}</td>
                    <td className="hidden px-4 py-3 text-[0.75rem] lg:table-cell">
                      {enq.interviewDate ? (
                        <>
                          <span className="font-semibold text-foreground">{fmtDate(enq.interviewDate)}</span>
                          {enq.interviewer ? <span className="block text-muted">{enq.interviewer}</span> : null}
                        </>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {meta ? (
                        <Chip tone={meta.tone}>{meta.label}</Chip>
                      ) : (
                        <Chip tone="default">New</Chip>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {isNew ? (
                          <>
                            <form action={shortlistEnquiryAction}>
                              <input type="hidden" name="id" value={enq.id} />
                              <button
                                type="submit"
                                className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-[0.6875rem] font-bold text-background transition-colors hover:bg-accent"
                              >
                                Shortlist
                              </button>
                            </form>
                            <form action={rejectEnquiryAction}>
                              <input type="hidden" name="id" value={enq.id} />
                              <button
                                type="submit"
                                className="inline-flex h-8 items-center rounded-lg border border-error/40 px-3 text-[0.6875rem] font-bold text-error transition-colors hover:bg-error hover:text-white"
                              >
                                Reject
                              </button>
                            </form>
                          </>
                        ) : enq.careerStatus === "shortlisted" ? (
                          <>
                            <Link
                              href={`/admin/enquiries/${enq.id}`}
                              className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-[0.6875rem] font-bold text-on-accent transition-colors hover:bg-accent-hover"
                            >
                              Schedule interview
                            </Link>
                            <form action={rejectEnquiryAction}>
                              <input type="hidden" name="id" value={enq.id} />
                              <button
                                type="submit"
                                className="inline-flex h-8 items-center rounded-lg border border-error/40 px-3 text-[0.6875rem] font-bold text-error transition-colors hover:bg-error hover:text-white"
                              >
                                Reject
                              </button>
                            </form>
                          </>
                        ) : enq.careerStatus === "interview_scheduled" ? (
                          <Link
                            href={`/admin/enquiries/${enq.id}`}
                            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-[0.6875rem] font-semibold text-muted hover:border-foreground/40"
                          >
                            View details
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/enquiries/${enq.id}`}
                            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-[0.6875rem] font-semibold text-muted hover:border-foreground/40"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="t-caption mt-2 text-muted">
        Every action sends the corresponding email automatically: shortlist - acknowledgment, reject - rejection email, interview - invitation with meeting link.
      </p>
    </div>
  );
}
