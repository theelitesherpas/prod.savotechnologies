import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUSINESS_ID_CONFIG, BUSINESS_ID_LOCK_KEY, formatBusinessId, isBusinessIdType, parseBusinessId, type BusinessIdType } from "@/lib/business-id-config";

export class BusinessIdError extends Error {
  constructor(public readonly code: "NOT_READY" | "EXHAUSTED" | "INVALID_STATE" | "UNKNOWN_TYPE" | "INVALID_RESERVATION", message: string) { super(message); this.name = "BusinessIdError"; }
}
/** Retry the WHOLE unit of work, never just allocation. No external effects
 * inside callbacks. A failed domain write rolls back counter AND reservation. */
export function retryableBusinessTransaction(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  if (error.code === "P2034") return true;
  // Prisma wraps raw SELECT ... FOR UPDATE serialization/deadlock errors in
  // P2010, not P2034. Only these PostgreSQL SQLSTATEs warrant a full retry.
  const meta = "meta" in error ? error.meta : null;
  return error.code === "P2010" && !!meta && typeof meta === "object" && "code" in meta && ["40001", "40P01"].includes(String(meta.code));
}
export async function businessTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>, isolationLevel: Prisma.TransactionIsolationLevel = "ReadCommitted"): Promise<T> {
  if (!prisma) throw new BusinessIdError("NOT_READY", "Database unavailable.");
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(work, { isolationLevel, maxWait: 10000, timeout: 20000 }); }
    catch (error) {
      if (attempt < 5 && retryableBusinessTransaction(error)) {
        await new Promise(resolve => setTimeout(resolve, 10 * (2 ** attempt)));
        continue;
      }
      throw error;
    }
  }
}
/** One centralized server-side allocator. With tx, allocation and record insert
 * share a commit. Without tx, the returned ID is durably RESERVED even if unused.
 * Counter rows MUST be provisioned; missing/deleted state is never auto-reseeded.
 * FOR UPDATE serializes workers/processes/servers, not just this JS instance. */
export async function generateBusinessId(type: BusinessIdType, tx?: Prisma.TransactionClient): Promise<string> {
  if (!isBusinessIdType(type)) throw new BusinessIdError("UNKNOWN_TYPE", "Unknown business ID type.");
  if (!tx) return businessTransaction(transaction => generateBusinessId(type, transaction));
  const policy = BUSINESS_ID_CONFIG[type];
  await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(${BUSINESS_ID_LOCK_KEY}::bigint)`;
  const rows = await tx.$queryRaw<{ type: string; range_start: number; range_end: number; initial_current: number; current: number }[]>`
    SELECT type, range_start, range_end, initial_current, current
    FROM business_id_counters WHERE type = ${type} FOR UPDATE`;
  const row = rows[0];
  if (!row) throw new BusinessIdError("NOT_READY", "Business numbering is not initialized. Ask an administrator to run the approved database setup.");
  if (row.range_start !== policy.start || row.range_end !== policy.end || row.initial_current !== policy.initialCurrent || !Number.isSafeInteger(row.current) || row.current < policy.initialCurrent || row.current > policy.end) throw new BusinessIdError("INVALID_STATE", `The ${type} numbering policy requires administrator review. No reference was issued.`);
  if (row.current === policy.end) throw new BusinessIdError("EXHAUSTED", `${policy.label} reference range is exhausted. No record was created. Contact an administrator; reserved gaps cannot be used automatically.`);
  const number = row.current + 1, id = formatBusinessId(type, number);
  await tx.businessIdCounter.update({ where: { type }, data: { current: number } });
  await tx.businessId.create({ data: { id, type, referenceNumber: number } });
  return id;
}
/** A real pre-creation reservation, not a prediction. A repeated browser-draft
 * request reuses its ID; abandoned/consumed reservations are never recycled. */
export async function reserveBusinessId(type: BusinessIdType, ownerId: string, requestKey: string) {
  if (!isBusinessIdType(type) || !/^[A-Za-z0-9_-]{10,64}$/.test(ownerId) || !/^[a-f0-9-]{36}$/i.test(requestKey)) throw new BusinessIdError("INVALID_RESERVATION", "Invalid draft reservation request.");
  if (!prisma) throw new BusinessIdError("NOT_READY", "Database unavailable.");
  const where = { ownerId_type_requestKey: { ownerId, type, requestKey } };
  try {
    return await businessTransaction(async tx => {
      const existing = await tx.businessIdDraft.findUnique({ where });
      if (existing) return existing;
      const businessId = await generateBusinessId(type, tx);
      return tx.businessIdDraft.create({ data: { businessId, type, ownerId, requestKey } });
    });
  } catch (error) {
    // Two effects/tabs may send the same idempotency key concurrently. The
    // losing transaction rolls back its tentative number before re-reading.
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const existing = await prisma.businessIdDraft.findUnique({ where });
      if (existing) return existing;
    }
    throw error;
  }
}

/** Enlist the reserved ID's single-use claim in the DOMAIN transaction. A
 * validation/insert failure rolls the claim back, retaining the displayed ID.
 * Legacy integrations without a reservation may still use direct allocation. */
export async function claimBusinessId(form: FormData, type: BusinessIdType, ownerId: string, tx: Prisma.TransactionClient): Promise<string | null> {
  const id = form.get("reservedBusinessId");
  if (id == null || id === "") {
    if (form.get("businessReservationRequired") === "1") throw new BusinessIdError("INVALID_RESERVATION", "Please wait for your reserved ID, or retry reserving it, before saving.");
    return null;
  }
  if (!parseBusinessId(id, type)) throw new BusinessIdError("INVALID_RESERVATION", "This reserved ID does not match the record type or numeric range.");
  const result = await tx.businessIdDraft.updateMany({ where: { businessId: String(id), ownerId, type, consumedAt: null }, data: { consumedAt: new Date() } });
  if (result.count !== 1) throw new BusinessIdError("INVALID_RESERVATION", "This ID is unavailable, belongs to another administrator, or was already used. Reload the creation form to reserve a new ID.");
  return String(id);
}

export function rejectManualBusinessId(value: unknown) {
  if (value != null && (typeof value !== "string" || value.trim())) throw new Error("Business IDs are generated automatically by the server; do not submit a manual reference.");
}
export function assertUnchangedReference(submitted: string | undefined, current: string) {
  if (submitted && submitted !== current) throw new Error("Issued business references are immutable. Refresh the record; its existing reference must be retained.");
}
