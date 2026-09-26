import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { EmployeeLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Employee Portal · Savo Technologies",
  robots: { index: false, follow: false },
};

/** Public employee portal login. */
export default async function EmployeePortalPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  void prisma;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-1 w-8 bg-accent" />
          <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-muted">
            Savo Technologies
          </p>
        </div>

        <div className="rounded-[14px] border border-line bg-white shadow-[0_20px_60px_rgb(10_10_14/0.08)]">
          <div className="border-b border-line px-8 pb-6 pt-8 text-center">
            <h1 className="text-[1.375rem] font-bold tracking-tight text-ink">
              Employee Portal
            </h1>
          </div>

          <div className="px-8 py-7">
            {e ? (
              <p
                role="alert"
                className="t-caption mb-5 rounded-md border border-error/30 bg-error/[0.05] px-3.5 py-2.5 text-center text-error"
              >
                {decodeURIComponent(e)}
              </p>
            ) : null}

            <EmployeeLoginForm />

            <div className="mt-6 border-t border-line pt-5 text-center">
              <p className="text-[0.75rem] leading-relaxed text-muted">
                Need help signing in?{" "}
                <a
                  href="mailto:hr@savotechnologies.com"
                  className="font-semibold text-accent transition-colors hover:underline"
                >
                  hr@savotechnologies.com
                </a>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[0.6875rem] tracking-wide text-muted">
          <Link href="/" className="transition-colors hover:text-foreground">savotechnologies.com</Link>
          <span className="mx-2 text-line">·</span>
          <Link href="/portal" className="transition-colors hover:text-foreground">Client Portal</Link>
        </p>
      </div>
    </main>
  );
}
