import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EmployeeLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Employee Portal · Savo Technologies",
  robots: { index: false, follow: false },
};

/** Public employee portal login - employees access their record,
 *  leave balance and assigned work with their registered email. */
export default async function EmployeePortalPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  void prisma;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-[14px] border border-line bg-white p-10 shadow-sm">
        <div className="mx-auto mb-5 h-1.5 w-10 bg-accent" />
        <h1 className="t-h3 text-center text-ink">Employee Portal</h1>
        <p className="t-body mt-2 text-center text-muted">
          Sign in with your registered email to view your employment details,
          leave balance and assigned work.
        </p>
        {e ? (
          <p role="alert" className="t-caption mt-4 rounded-md border border-error/30 bg-error/[0.05] px-3 py-2 text-center text-error">
            {decodeURIComponent(e)}
          </p>
        ) : null}
        <EmployeeLoginForm />
        <p className="t-caption mt-6 text-center text-muted">
          No access yet? Contact HR at{" "}
          <a href="mailto:hr@savotechnologies.com" className="font-semibold text-accent">
            hr@savotechnologies.com
          </a>
        </p>
      </div>
    </main>
  );
}
