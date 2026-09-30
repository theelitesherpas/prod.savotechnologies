import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SavoLogo } from "@/components/shared/savo-logo";
import { FormGuard } from "@/components/admin/form-guard";
import { AdminLoginCaptcha } from "./login-captcha";
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
    <div className="chapter-admin flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <SavoLogo className="h-10 w-auto text-foreground" />
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-muted">
            Operations console
          </p>
        </div>

        <FormGuard action={loginAction} className="adm-card p-6 sm:p-8">
          <h1 className="mb-6 text-[1.25rem] font-bold tracking-[-0.015em] text-foreground">
            Sign in
          </h1>

          <div className="mb-5">
            <label htmlFor="email" className="adm-label mb-1.5 block">
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
              className="adm-input h-11"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="adm-label mb-1.5 block">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={200}
              className="adm-input h-11"
            />
          </div>

          <div className="mb-6 flex items-center gap-2">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 accent-[#c2410c]"
            />
            <label htmlFor="remember" className="adm-label cursor-pointer select-none">
              Keep me signed in for 30 days
            </label>
          </div>

          {e ? (
            <p
              role="alert"
              className="mb-6 flex items-center gap-2 rounded-lg border border-error/25 bg-error/[0.05] px-3.5 py-2.5 text-[0.8125rem] font-medium text-error"
            >
              {e === "rate"
                ? "Too many attempts, wait a few minutes and try again."
                : "Email or password is incorrect."}
            </p>
          ) : null}

          <AdminLoginCaptcha />
          <button
            type="submit"
            className="h-11 w-full rounded-lg bg-accent text-[0.9375rem] font-semibold text-on-accent shadow-sm transition-colors hover:bg-accent-hover"
          >
            Sign in
          </button>
        </FormGuard>

        <p className="mt-6 text-center text-[0.75rem] text-muted">
          Sessions expire after 12 hours · attempts are rate-limited
        </p>
      </div>
    </div>
  );
}
