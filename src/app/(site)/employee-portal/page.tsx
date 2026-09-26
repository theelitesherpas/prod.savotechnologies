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
    <main className="flex min-h-dvh items-center justify-center bg-[#f5f4f0] px-4 py-16">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-1.5 w-12 items-center justify-center rounded-full bg-[#d9480f]" />
          <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.24em] text-[#9a9ea4]">
            Savo Technologies
          </p>
          <p className="mt-2 font-serif text-[0.8125rem] italic text-[#6a6e75]">
            Bold Brands. Built by Savo.
          </p>
        </div>

        {/* Login card */}
        <div className="overflow-hidden rounded-[14px] border border-[#e3e1da] bg-white shadow-[0_24px_70px_rgb(10_10_14/0.10)]">
          {/* Top accent bar */}
          <div className="h-[5px] bg-[#d9480f]" />

          <div className="px-8 pb-8 pt-7">
            <div className="text-center">
              <p className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.18em] text-[#6a6e75]">
                Internal Access
              </p>
              <h1 className="mt-2 font-serif text-[1.5rem] font-bold tracking-tight text-[#14161c]">
                Employee Portal
              </h1>
              <div className="mx-auto mt-3 h-px w-16 bg-[#e3e1da]" />
              <p className="mt-3 text-[0.8438rem] leading-relaxed text-[#6a6e75]">
                Sign in to your Savo account
              </p>
            </div>

            {e ? (
              <p
                role="alert"
                className="mt-5 rounded-[8px] border border-[#b3261e]/25 bg-[#b3261e]/[0.04] px-3.5 py-2.5 text-center text-[0.8125rem] font-medium text-[#b3261e]"
              >
                {decodeURIComponent(e)}
              </p>
            ) : null}

            <div className="mt-6">
              <EmployeeLoginForm />
            </div>

            {/* Footer */}
            <div className="mt-7 border-t border-[#e3e1da] pt-5">
              <p className="text-center text-[0.75rem] text-[#9a9ea4]">
                Trouble signing in?{" "}
                <a
                  href="mailto:hr@savotechnologies.com"
                  className="font-semibold text-[#d9480f] transition-colors hover:underline"
                >
                  Contact HR
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Links below card */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[0.6875rem] text-[#9a9ea4]">
          <Link href="/" className="transition-colors hover:text-[#14161c]">savotechnologies.com</Link>
          <span className="text-[#e3e1da]">|</span>
          <Link href="/portal" className="transition-colors hover:text-[#14161c]">Client Portal</Link>
        </div>
      </div>
    </main>
  );
}
