"use server";

import { z } from "zod";
import { getAdminUser } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { reserveBusinessId, BusinessIdError } from "@/lib/business-ids";

export type DraftIdResult = { ok: true; id: string; used: boolean } | { ok: false; error: string };
/** POST only, authenticated and section-scoped. Never allocate on a page GET or
 * prefetch; browsers call this when an actual creation form is mounted. */
export async function reserveBusinessIdAction(type: string, requestKey: string): Promise<DraftIdResult> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Your session expired. Sign in again to reserve an ID." };
  if (!canAccess(user, "clients")) return { ok: false, error: "You do not have permission to create these records." };
  const input = z.object({ type: z.enum(["CS", "PR", "IN"]), requestKey: z.string().uuid() }).safeParse({ type, requestKey });
  if (!input.success) return { ok: false, error: "Invalid draft request. Reload the creation form." };
  if (!rateLimit(`business-id-draft:${user.id}`, 120, 60_000).ok) return { ok: false, error: "Too many reservation requests. Wait a minute and retry." };
  try {
    const draft = await reserveBusinessId(input.data.type, user.id, input.data.requestKey);
    return { ok: true, id: draft.businessId, used: draft.consumedAt !== null };
  } catch (error) {
    return { ok: false, error: error instanceof BusinessIdError ? error.message : "Your ID could not be reserved. Please retry." };
  }
}
