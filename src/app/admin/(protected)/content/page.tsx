import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { COLLECTION_KEYS, CONTENT_COLLECTIONS } from "@/lib/content-registry";
import { AdminIcon } from "@/components/admin/icons";

export const metadata: Metadata = { title: "Website content" };

/**
 * Content hub - the submenu's landing page. One card per managed
 * collection plus the two dedicated (services/industries), each with its
 * live row count and fallback state.
 */
export default async function ContentHubPage() {
  const counts = prisma
    ? await prisma.contentItem
        .groupBy({ by: ["collection"], _count: { _all: true } })
        .then((rows) => Object.fromEntries(rows.map((r) => [r.collection, r._count._all])))
        .catch(() => ({}) as Record<string, number>)
    : ({} as Record<string, number>);

  const dedicated = [
    {
      href: "/admin/services",
      label: "Services",
      icon: "layers" as const,
      note: "Header Services panel, homepage sections and the /services/ directory.",
      count: prisma ? await prisma.service.count({ where: { active: true } }).catch(() => 0) : 0,
    },
    {
      href: "/admin/industries",
      label: "Industries",
      icon: "grid" as const,
      note: "Header Industries panel, homepage atlas and the /industries/ pages.",
      count: prisma ? await prisma.industry.count({ where: { active: true } }).catch(() => 0) : 0,
    },
  ];

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-[1.375rem] font-bold leading-tight tracking-[-0.015em] text-foreground">
          Website content
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.875rem] leading-relaxed text-muted">
          Every dynamic collection on the public site. Collections fall back to the coded
          defaults until rows exist - import them from each collection page to start editing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dedicated.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="adm-card group flex flex-col gap-3 p-5 transition-colors duration-200 hover:border-foreground/25"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <AdminIcon name={c.icon} className="h-5 w-5" />
              </span>
              <span className="text-[0.9375rem] font-bold text-foreground group-hover:text-accent">{c.label}</span>
              <span className="tnum ml-auto rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[0.6875rem] font-semibold text-muted">
                {c.count}
              </span>
            </div>
            <p className="text-[0.8125rem] leading-relaxed text-muted">{c.note}</p>
          </Link>
        ))}
        {COLLECTION_KEYS.map((key) => {
          const def = CONTENT_COLLECTIONS[key];
          const count = counts[key] ?? 0;
          return (
            <Link
              key={key}
              href={`/admin/content/${key}`}
              className="adm-card group flex flex-col gap-3 p-5 transition-colors duration-200 hover:border-foreground/25"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <AdminIcon name={def.icon} className="h-5 w-5" />
                </span>
                <span className="text-[0.9375rem] font-bold text-foreground group-hover:text-accent">{def.label}</span>
                {count > 0 ? (
                  <span className="tnum ml-auto rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[0.6875rem] font-semibold text-muted">
                    {count}
                  </span>
                ) : (
                  <span className="ml-auto rounded-full bg-warning/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-warning">
                    defaults
                  </span>
                )}
              </div>
              <p className="text-[0.8125rem] leading-relaxed text-muted">{def.publicNote}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
