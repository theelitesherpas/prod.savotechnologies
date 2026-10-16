/** Business references are numbering offsets, NOT counts of historical work.
 * One authoritative policy for runtime, database provisioning, validation and UI.
 * Never reset these seeds, expand ranges automatically, or consume reserved gaps.
 * Employee IDs, internal primary keys and security tokens are separate systems. */
export const BUSINESS_ID_PREFIX = "STPL";
// Shared by allocators; provisioning takes the exclusive transaction lock.
export const BUSINESS_ID_LOCK_KEY = 0x5354504c;
export const BUSINESS_ID_CONFIG = {
  CS: { label: "Clients", start: 1400, end: 1999, initialCurrent: 1436 },
  PR: { label: "Projects", start: 2000, end: 3999, initialCurrent: 2683 },
  IN: { label: "Invoices", start: 4000, end: 6999, initialCurrent: 5147 },
  LD: { label: "Leads", start: 7000, end: 7999, initialCurrent: 7320 },
  QP: { label: "Proposals", start: 8000, end: 8999, initialCurrent: 8345 },
  QT: { label: "Quotations", start: 9000, end: 9999, initialCurrent: 9427 },
  CT: { label: "Contracts", start: 11000, end: 11999, initialCurrent: 11361 },
  SA: { label: "Service agreements", start: 12000, end: 12999, initialCurrent: 12417 },
  ND: { label: "NDAs", start: 13000, end: 13999, initialCurrent: 13356 },
  PO: { label: "Purchase orders", start: 14000, end: 14999, initialCurrent: 14280 },
  RC: { label: "Payment receipts", start: 15000, end: 16999, initialCurrent: 15425 },
  CN: { label: "Credit notes", start: 17000, end: 17999, initialCurrent: 17313 },
  VN: { label: "Vendors", start: 18000, end: 18999, initialCurrent: 18242 },
  TK: { label: "Support tickets", start: 19000, end: 21999, initialCurrent: 19486 },
} as const;
export type BusinessIdType = keyof typeof BUSINESS_ID_CONFIG;
export const BUSINESS_ID_TYPES = Object.keys(BUSINESS_ID_CONFIG) as BusinessIdType[];
export function isBusinessIdType(value: unknown): value is BusinessIdType {
  return typeof value === "string" && Object.hasOwn(BUSINESS_ID_CONFIG, value);
}
export function formatBusinessId(type: BusinessIdType, number: number): string {
  if (!isBusinessIdType(type)) throw new Error("Unknown business ID type.");
  const policy = BUSINESS_ID_CONFIG[type];
  if (!Number.isSafeInteger(number) || number < policy.start || number > policy.end) throw new Error(`Reference number is outside the ${type} range.`);
  return `${BUSINESS_ID_PREFIX}${type}${String(number).padStart(5, "0")}`;
}
export function parseBusinessId(value: unknown, expectedType?: BusinessIdType): { type: BusinessIdType; number: number } | null {
  if (typeof value !== "string") return null;
  const match = /^STPL([A-Z]{2})(\d{5})$/.exec(value);
  if (!match || !isBusinessIdType(match[1]) || (expectedType !== undefined && match[1] !== expectedType)) return null;
  const type = match[1], number = Number(match[2]), policy = BUSINESS_ID_CONFIG[type];
  return number >= policy.start && number <= policy.end ? { type, number } : null;
}
export function businessIdCapacity(type: BusinessIdType, current: number) {
  const p = BUSINESS_ID_CONFIG[type];
  if (!Number.isSafeInteger(current) || current < p.initialCurrent || current > p.end) throw new Error(`Invalid ${type} counter state.`);
  const remaining = p.end - current, issuedSinceCutover = current - p.initialCurrent;
  return { current, remaining, issuedSinceCutover, next: remaining ? formatBusinessId(type, current + 1) : null, needsAttention: remaining <= Math.max(10, Math.ceil((p.end - p.initialCurrent) * .1)) };
}
/** Provisioning must fail before SQL if an edit ever overlaps another category. */
export function validateBusinessIdConfiguration() {
  const entries = BUSINESS_ID_TYPES.map(type => ({ type, ...BUSINESS_ID_CONFIG[type] })).sort((a,b) => a.start - b.start);
  entries.forEach((p,i) => {
    if (![p.start,p.end,p.initialCurrent].every(Number.isSafeInteger) || p.start < 0 || p.end > 99999 || p.initialCurrent < p.start || p.initialCurrent >= p.end || (i > 0 && entries[i-1].end >= p.start)) throw new Error(`Invalid/overlapping business ID policy: ${p.type}.`);
  });
}
validateBusinessIdConfiguration();
