import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · SAVO Admin" },
  robots: { index: false, follow: false, nocache: true },
};

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/industries", label: "Industries" },
  { href: "/admin/settings", label: "Settings" },
];

/**
 * Protected admin shell. Middleware blocks cookie-less requests at the
 * edge; this layout performs the real session check on every render.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="chapter-ink min-h-dvh bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="t-label font-bold tracking-widest text-foreground">
            SAVO<span className="text-accent">·</span>ADMIN
          </Link>
          <nav aria-label="Admin" className="flex flex-wrap items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="t-sm px-3 py-1.5 text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="t-caption hidden text-muted sm:inline">
              {user.name} · {user.role}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="t-sm border border-border px-3 py-1.5 text-foreground/70 transition-colors hover:border-accent hover:text-accent"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
