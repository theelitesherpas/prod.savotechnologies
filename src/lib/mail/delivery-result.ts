export type MailDeliveryResult =
  | { status: "accepted" }
  | { status: "not_sent"; reason: string; retryable: boolean }
  | { status: "uncertain"; reason: string };

/** Only retry when SMTP conclusively did NOT accept the message. A lost DATA
 * acknowledgement may mean delivery occurred; never automatically resend it. */
export function classifyMailFailure(error: unknown): MailDeliveryResult {
  const e = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const response = typeof e.responseCode === "number" ? e.responseCode : 0;
  const command = typeof e.command === "string" ? e.command.toUpperCase() : "";
  const beforeData = ["EHLO", "HELO", "AUTH", "MAIL FROM", "RCPT TO", "STARTTLS"].includes(command);
  if (response >= 400 && response <= 599 && (beforeData || command === "DATA")) {
    return { status: "not_sent", reason: "SMTP_REJECTED", retryable: response < 500 };
  }
  // A generic CONN/ECONNECTION error can also be reported after DATA. It is
  // not proof of non-delivery. Only known pre-submission failures are safe.
  if (command !== "DATA" && command !== "QUIT" && (beforeData || ["EAUTH", "EDNS", "EENVELOPE"].includes(String(e.code)) || (command === "CONN" && (e.code === "ECONNREFUSED" || e.errno === "ECONNREFUSED")))) {
    return { status: "not_sent", reason: "SMTP_NOT_SUBMITTED", retryable: e.code !== "EAUTH" && e.code !== "EENVELOPE" };
  }
  return { status: "uncertain", reason: "SMTP_CONFIRMATION_UNKNOWN" };
}
