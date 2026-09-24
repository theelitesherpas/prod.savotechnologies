import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SavoLogo } from "@/components/shared/savo-logo";
import { getAdminUser } from "@/lib/auth";
import { loginAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin · Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  // Already signed in → straight to the panel.
  if (await getAdminUser()) redirect("/admin");

  const { e } = await searchParams;

  return (
    <div className="chapter-ink flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <SavoLogo className="h-10 w-auto text-foreground" />
          <p className="t-label text-muted">Operations Panel</p>
        </div>

        <form
          action={loginAction}
          className="border border-border bg-background p-6 sm:p-8"
          noValidate
        >
          <div className="mb-6">
            <label htmlFor="email" className="t-label mb-2 block text-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={160}
              spellCheck={false}
              className="h-11 w-full border border-border bg-transparent px-3 text-foreground outline-none transition-colors focus:border-accent"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="t-label mb-2 block text-muted">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={200}
              className="h-11 w-full border border-border bg-transparent px-3 text-foreground outline-none transition-colors focus:border-accent"
            />
          </div>

          {e ? (
            <p role="alert" className="t-sm mb-6 border border-accent/40 bg-accent/5 px-3 py-2 text-accent">
              {e === "rate"
                ? "Too many attempts, wait a few minutes and try again."
                : "Email or password is incorrect."}
            </p>
          ) : null}

          <button
            type="submit"
            className="h-11 w-full bg-foreground text-base font-semibold text-background transition-colors hover:bg-accent hover:text-on-accent"
          >
            Sign in
          </button>
        </form>

        <p className="t-caption mt-6 text-center text-muted">
          Sessions expire after 12 hours · attempts are rate-limited
        </p>
      </div>
    </div>
  );
}
