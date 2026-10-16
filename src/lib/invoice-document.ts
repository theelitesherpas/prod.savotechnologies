/** Shared invoice document contract. Amounts remain integer minor units;
 * no conversion, inferred taxes, bank details or fabricated payment lines. */
export const CLIENT_INVOICE_STATUSES = ["sent", "paid", "overdue", "cancelled"] as const;
export type ClientInvoiceStatus = (typeof CLIENT_INVOICE_STATUSES)[number];
export const INVOICE_STATUS_LABEL: Record<ClientInvoiceStatus, string> = {
  sent: "Unpaid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export type InvoiceDocument = {
  number: string;
  amount: number;
  currency: string;
  status: ClientInvoiceStatus;
  issuedAt: Date;
  dueDate: Date | null;
  paidAt: Date | null;
  notes: string;
  paymentLink?: string | null;
  client: { name: string; company: string; email: string; businessId?: string | null };
  project: { code: string; title: string } | null;
};

export function invoiceBalances(invoice: Pick<InvoiceDocument, "amount" | "status">) {
  return {
    total: invoice.amount,
    paid: invoice.status === "paid" ? invoice.amount : 0,
    due: invoice.status === "sent" || invoice.status === "overdue" ? invoice.amount : 0,
  };
}

/** Always keep two decimal places in a financial document. ISO code removes
 * ambiguity between currencies which share the same symbol (e.g. USD/AED). */
export function invoiceMoney(minor: number, currency: string): string {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error("Invalid invoice amount");
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Invalid invoice currency");
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency, currencyDisplay: "code",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function invoiceDate(value: Date | null): string {
  return value ? value.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  }) : "Not specified";
}

/** ASCII-only quoted filename: never allow CRLF, quotes or path separators. */
export function invoiceFilename(number: string): string {
  const reference = number.replace(/[^A-Za-z0-9_-]/g, "-").replace(/-+/g, "-").slice(0, 64) || "invoice";
  return `Savo-Invoice-${reference}.pdf`;
}
