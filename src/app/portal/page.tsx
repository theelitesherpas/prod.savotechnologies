import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SavoLogo } from "@/components/shared/savo-logo";
import { getClientUser } from "@/lib/client-auth";
import { clientLoginAction } from "./actions";

/**
 * Client portal — sign-in. Signed-in clients go straight to their
 * dashboard; everyone else gets the login interface.
 */

export const metadata: Metadata = {
  title: "Client Portal · Savo Technologies",
  description: "Sign in to your Savo Technologies client portal — project status, milestones and payments in one place.",
  robots: { index: false, follow: false },
};

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (await getClientUser()) redirect("/portal/dashboard");
  const { e } = await searchParams;

  return (
    <div className="chapter-ink flex min-h-dvh items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <Link href="/" aria-label="Savo Technologies, home">
            <SavoLogo className="h-10 w-auto text-foreground" />
          </Link>
          <p className="t-label text-muted">Client Portal</p>
        </div>

        <div className="border border-border bg-surface p-7 sm:p-9">
          <h1 className="t-h3">Sign in to your workspace</h1>
          <p className="t-caption mt-2 text-muted">
            Project status, milestones, deliverables and payments — the same view our delivery leads use.
          </p>

          {e ? (
            <p role="alert" className="t-sm mt-5 border-l-2 border-accent bg-[rgb(232_73_15/0.08)] px-4 py-3 text-foreground/90">
              {e === "invalid" ? "Please enter a valid email and password." : e}
            </p>
          ) : null}

          <form action={clientLoginAction} className="mt-7 space-y-5" noValidate>
            <div>
              <label htmlFor="pt-email" className="t-label mb-1.5 block text-muted">
                Email
              </label>
              <input
                id="pt-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                required
                maxLength={120}
                spellCheck={false}
                className="field"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="pt-password" className="t-label mb-1.5 block text-muted">
                Password
              </label>
              <input
                id="pt-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
                className="field"
                placeholder="Your portal password"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[2px] bg-accent px-6 text-[0.9375rem] font-semibold text-on-accent transition-colors duration-300 hover:bg-accent-hover"
            >
              Sign in
              <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
              </svg>
            </button>
          </form>

          <p className="t-caption mt-6 text-muted">
            Trouble signing in?{" "}
            <a href="mailto:hello@savotechnologies.com" className="text-foreground underline-offset-4 hover:text-accent hover:underline">
              hello@savotechnologies.com
            </a>
          </p>
        </div>

        <p className="t-caption mt-8 text-center text-muted">
          <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
            ← Back to savotechnologies.com
          </Link>
        </p>
      </div>
    </div>
  );
}
