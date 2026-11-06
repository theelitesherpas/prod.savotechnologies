import type { Prisma } from "@prisma/client";

export const TRANSACTIONS_PER_PAGE = 25;
/** Fixed precision makes financial columns scan and align reliably. */
export function transactionMoney(minor: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor / 100);
}
export function transactionFilters(params: Record<string, string | string[] | undefined>) {
  const one = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const page = Number(one("page"));
  return {
    q: one("q").trim().slice(0, 160),
    source: ["razorpay", "recorded"].includes(one("source")) ? one("source") : "all",
    currency: /^[A-Z]{3}$/.test(one("currency")) ? one("currency") : "all",
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1000000) : 1,
  };
}
export type TransactionFilters = ReturnType<typeof transactionFilters>;
/** Owner scope is outside OR/search clauses and never comes from URL input. */
export function transactionWhere(clientId: string, filters: TransactionFilters): Prisma.PaymentTransactionWhereInput {
  return {
    clientId,
    ...(filters.currency !== "all" ? { currency: filters.currency } : {}),
    ...(filters.source === "razorpay" ? { source: "razorpay" } : filters.source === "recorded" ? { source: { in: ["manual", "legacy"] } } : {}),
    ...(filters.q ? { OR: ["invoiceNumber", "paymentId", "projectTitle"].map(field => ({ [field]: { contains: filters.q, mode: "insensitive" } })) } : {}),
  };
}
export function transactionPageHref(filters: TransactionFilters, page: number) {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.source !== "all") query.set("source", filters.source);
  if (filters.currency !== "all") query.set("currency", filters.currency);
  if (page > 1) query.set("page", String(page));
  return `/portal/transactions${query.size ? `?${query}` : ""}`;
}
export function transactionMethod(source: string, method: string | null) {
  if (source !== "razorpay") return source === "legacy" ? "Historical payment record" : "Manually confirmed";
  const methods: Record<string, string> = { upi: "UPI", card: "Card", netbanking: "Netbanking", wallet: "Wallet", bank_transfer: "Bank transfer", emi: "EMI", paylater: "Pay later" };
  return `Razorpay${method && methods[method] ? ` · ${methods[method]}` : ""}`;
}
