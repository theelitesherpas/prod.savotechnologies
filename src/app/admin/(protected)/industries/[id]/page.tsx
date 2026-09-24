import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { IndustryFields } from "@/components/admin/industry-fields";
import { updateIndustryAction, deleteIndustryAction } from "../actions";

export const metadata: Metadata = { title: "Edit industry" };

export default async function EditIndustryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; e?: string; confirm?: string }>;
}) {
  const { id } = await params;
  const { saved, e, confirm } = await searchParams;

  const [user, industry] = await Promise.all([
    getAdminUser(),
    prisma ? prisma.industry.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);
  if (!industry) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/industries" className="t-sm link-underline mb-6 inline-block text-muted">
        ← Back to industries
      </Link>

      <h1 className="t-h3 mb-6">Edit · {industry.title}</h1>

      {saved ? (
        <p role="status" className="t-sm mb-4 border border-border bg-foreground/[0.03] px-3 py-2">
          Saved. Public pages regenerate on the next request.
        </p>
      ) : null}
      {e === "dup" ? (
        <p role="alert" className="t-sm mb-4 border border-accent/40 bg-accent/5 px-3 py-2 text-accent">
          That slug is already in use by another industry.
        </p>
      ) : null}

      <form action={updateIndustryAction} className="space-y-4 border border-border bg-background p-5">
        <input type="hidden" name="id" value={industry.id} />
        <IndustryFields
          industry={{
            title: industry.title,
            slug: industry.slug,
            summary: industry.summary ?? "",
            order: industry.order,
            active: industry.active,
          }}
        />
        <button
          type="submit"
          className="h-10 bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-accent hover:text-on-accent"
        >
          Save changes
        </button>
      </form>

      {user?.role === "admin" ? (
        <div className="mt-8 border border-accent/40 p-4">
          <h2 className="t-label mb-2 text-accent">Danger zone</h2>
          {confirm !== "1" ? (
            <Link
              href={`/admin/industries/${industry.id}?confirm=1`}
              className="t-sm border border-accent/50 px-3 py-2 text-accent transition-colors hover:bg-accent hover:text-on-accent"
            >
              Delete this industry…
            </Link>
          ) : (
            <form action={deleteIndustryAction}>
              <input type="hidden" name="id" value={industry.id} />
              <button type="submit" className="t-sm bg-accent px-3 py-2 font-semibold text-on-accent">
                Yes, delete permanently
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
