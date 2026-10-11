import { requireAdminPage } from "@/lib/permissions";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { fmtISTFull } from "@/lib/datetime";

/**
 * CONTENT INVENTORY (master spec Part 99).
 *
 * URL-level inventory of managed content: every collection row with its
 * lifecycle status, author, dates and review state. The governance
 * surface for Part 108's cadence (facts quarterly, core services twice
 * yearly, etc.).
 */

export const metadata: Metadata = { title: "Content inventory" };

const COLLECTION_LABELS: Record<string, string> = {
  "case-studies": "Case studies",
  insights: "Insights",
  careers: "Careers",
  hire: "Hire roles",
  "ai-services": "AI services",
  agents: "AI agents",
};

export default async function ContentInventoryPage() {
  await requireAdminPage("/admin/content-inventory");
  if (!prisma) {
    return (
      <>
        <PageHeader title="Content inventory" />
        <p className="t-sm text-muted">Database not configured, set DATABASE_URL.</p>
      </>
    );
  }

  const rows = await prisma.contentItem.findMany({
    orderBy: [{ collection: "asc" }, { order: "asc" }],
    select: {
      collection: true,
      slug: true,
      title: true,
      contentStatus: true,
      active: true,
      authorName: true,
      updatedAt: true,
    },
  });

  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.contentStatus] = (acc[r.contentStatus] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Content inventory"
        description="Every managed content item with its lifecycle status and review dates (spec Part 99)."
      />

      <dl className="mb-8 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
        {["draft", "demo", "review", "verified", "published"].map((s) => (
          <div key={s} className="bg-background p-4">
            <dt className="t-label text-muted capitalize">{s}</dt>
            <dd className="t-h3 mt-1 font-serif">{byStatus[s] ?? 0}</dd>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <EmptyState
          title="No managed content"
          message="Collections populate as content is created in the admin modules."
        />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                {["Collection", "Title / slug", "Status", "Active", "Author", "Updated"].map((h) => (
                  <th key={h} className="t-label px-4 py-3 text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.collection}:${r.slug}`} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 text-[0.8125rem]">{COLLECTION_LABELS[r.collection] ?? r.collection}</td>
                  <td className="px-4 py-3">
                    <p className="text-[0.8125rem] font-medium">{r.title}</p>
                    <p className="t-caption text-muted">/{r.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="t-caption rounded-full bg-foreground/[0.06] px-2 py-1 font-semibold capitalize">
                      {r.contentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[0.8125rem]">{r.active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-[0.8125rem]">{r.authorName || " - "}</td>
                  <td className="px-4 py-3 text-[0.8125rem] text-muted">{fmtISTFull(r.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
