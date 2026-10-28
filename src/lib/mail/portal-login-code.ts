import { shell, lead, p, spec } from "./design";
import type { MailTemplate } from "./templates";
import type { PortalKind } from "@/lib/portal-login-state";

/** Security-controlled, not admin-editable. Send with sensitive:true. */
export function portalLoginCode(kind: PortalKind, code: string): MailTemplate {
  const portal = kind === "employee" ? "employee portal" : "client portal";
  return {
    subject: `Your Savo ${portal} sign-in code`,
    html: shell({
      preheader: "Your single-use sign-in code expires in 10 minutes.",
      heading: "Your sign-in code.",
      bodyHtml: [
        lead(`Use this code to sign in to the Savo ${portal}.`),
        spec([["One-time sign-in code", code.split("").join(" ")]], { big: 0 }),
        p("This code works once and expires in 10 minutes. Enter it only on savotechnologies.com in the browser where you requested it."),
        p("Never share this code. Savo staff will never ask for it. If you did not request it, ignore this email; no sign-in has been completed.", true),
      ].join(""),
      closing: "The Savo team",
      reason: `You received this because a sign-in code was requested for your registered Savo ${portal} email.`,
    }),
    text: `Your Savo ${portal} sign-in code: ${code}\n\nSingle use. Expires in 10 minutes. Enter it only on savotechnologies.com in the browser where you requested it.\n\nNever share this code. Savo staff will never ask for it. If you did not request it, ignore this email; no sign-in has been completed.`,
  };
}
