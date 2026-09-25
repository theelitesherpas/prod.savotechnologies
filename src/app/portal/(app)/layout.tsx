import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SavoLogo } from "@/components/shared/savo-logo";
import { getClientUser } from "@/lib/client-auth";
import { clientLogoutAction } from "../actions";

/**
 * Authenticated portal chrome: slim header (logo, client identity,
 * sign-out) over the dashboard pages. Every child page can rely on an
 * authenticated client — this layout enforces it.
 */

export const metadata: Metadata = {
  title: { default: "Client Portal", template: "%s · Savo Client Portal" },
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const client = await getClientUser();
  if (!client) redirect("/portal");

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="shell flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Link href="/portal/dashboard" aria-label="Client portal home">
              <SavoLogo className="h-8 w-auto text-foreground" />
            </Link>
            <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
            <p className="t-label hidden text-muted sm:block">Client Portal</p>
          </div>
          <div className="flex items-center gap-5">
            <p className="t-caption hidden text-muted sm:block">
              {client.name}
              {client.company ? <span className="text-muted/60"> · {client.company}</span> : null}
            </p>
            <form action={clientLogoutAction}>
              <button
                type="submit"
                className="t-sm font-medium text-muted transition-colors hover:text-accent"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav aria-label="Portal" className="shell flex gap-7 border-t border-border">
          {[
            { href: "/portal/dashboard", label: "Overview" },
            { href: "/portal/projects", label: "Projects" },
            { href: "/portal/invoices", label: "Payments" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="t-sm -mb-px border-b-2 border-transparent py-3 font-medium text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-6">
        <div className="shell flex flex-wrap items-center justify-between gap-3">
          <p className="t-caption text-muted">
            © {new Date().getFullYear()} Savo Technologies Private Limited
          </p>
          <p className="t-caption text-muted">
            Need help? <a href="mailto:hello@savotechnologies.com" className="text-foreground underline-offset-4 hover:text-accent hover:underline">hello@savotechnologies.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
