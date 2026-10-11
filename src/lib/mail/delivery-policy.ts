import "server-only";

/** Explicit opt-in: copying SMTP credentials into a demo/preview must not send real mail. */
export function liveMailAllowed(): boolean {
  return process.env.MAIL_DELIVERY_MODE === "live" &&
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_CONTENT_MODE === "production";
}
