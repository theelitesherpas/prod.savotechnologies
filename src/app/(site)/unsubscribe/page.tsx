import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { unsubscribeSig } from "@/lib/mail/unsubscribe";
import { unsubscribeAction } from "./actions";

export const metadata: Metadata = {
  title: "Unsubscribe · Savo Technologies",
  robots: { index: false, follow: false },
};

/** Public unsubscribe confirmation - one click, HMAC-signed link,
 *  instantly honoured by every future customer-facing email. */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; sig?: string; done?: string; error?: string }>;
}) {
  const { email, sig, done, error } = await searchParams;
  const clean = email?.toLowerCase().trim() ?? "";
  const valid = Boolean(clean && sig && sig === unsubscribeSig(clean));

  if (done !== undefined) {
    const suppressed = valid && prisma
      ? await prisma.mailSuppress.findUnique({ where: { email: clean } }).then(Boolean).catch(() => false)
      : false;
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <div className="w-full rounded-[14px] border border-line bg-white p-10 shadow-sm">
          <div className="mx-auto mb-5 h-1.5 w-10 bg-accent" />
          <h1 className="t-h3 text-ink">{suppressed ? "You are unsubscribed." : "We couldn’t verify the unsubscribe."}</h1>
          <p className="t-body mt-3 text-muted">
            {suppressed ? (
              <>No more automated emails from Savo Technologies to{" "}
                <span className="font-semibold text-foreground">{clean}</span>. Project and invoice emails from your portal (if any) still arrive - those are service records.</>
            ) : (
              <>We could not confirm that your email preference was saved. Please try the signed link again or{" "}
                <a href="mailto:hello@savotechnologies.com" className="font-semibold text-accent">contact our team</a>.</>
            )}
          </p>
          {suppressed ? (
            <p className="t-caption mt-6 text-muted">
              Changed your mind?{" "}
              <a href="mailto:hello@savotechnologies.com" className="font-semibold text-accent">Write to us</a>{" "}
              and we can review the preference.
            </p>
          ) : null}
        </div>
      </main>
    );
  }
  const already =
    valid && prisma ? await prisma.mailSuppress.findUnique({ where: { email: clean } }).catch(() => null) : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-[14px] border border-line bg-white p-10 shadow-sm">
        <div className="mx-auto mb-5 h-1.5 w-10 bg-accent" />
        {valid ? (
          already ? (
            <>
              <h1 className="t-h3 text-center text-ink">Already unsubscribed</h1>
              <p className="t-body mt-3 text-center text-muted">
                <span className="font-semibold text-foreground">{clean}</span> receives no automated
                emails from us.
              </p>
            </>
          ) : (
            <>
              {error === "save" ? <p className="mb-4 text-center text-[0.875rem] text-accent" role="alert">We couldn’t save your preference. Please try again.</p> : null}
              <h1 className="t-h3 text-center text-ink">Stop these emails?</h1>
              <p className="t-body mt-3 text-center text-muted">
                Confirm and <span className="font-semibold text-foreground">{clean}</span> will not
                receive any further automated emails from Savo Technologies. Project and invoice
                emails from your client portal are service records and will still arrive.
              </p>
              <form action={unsubscribeAction} className="mt-8">
                <input type="hidden" name="email" value={clean} />
                <input type="hidden" name="sig" value={sig} />
                <button
                  type="submit"
                  className="h-11 w-full rounded-[8px] bg-foreground px-5 text-[0.875rem] font-semibold text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
                >
                  Confirm unsubscribe
                </button>
              </form>
            </>
          )
        ) : (
          <>
            <h1 className="t-h3 text-center text-ink">This link is not valid</h1>
            <p className="t-body mt-3 text-center text-muted">
              Unsubscribe links are personal and expire if edited. If you want to stop emails, write
              to{" "}
              <a href="mailto:hello@savotechnologies.com" className="font-semibold text-accent">
                hello@savotechnologies.com
              </a>{" "}
              and we handle it the same day.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
