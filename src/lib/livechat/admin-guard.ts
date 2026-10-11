/**
 * Admin live-chat API guard, session check plus the live-chat section
 * grant, in one helper every admin route shares.
 */

import { getAdminUser, type AdminSessionUser } from "@/lib/auth";
import { canAccess, type PermittedUser } from "@/lib/permissions";
import type { BusEvent } from "./pubsub";

/** Notification payloads retain the same section boundaries as their APIs. */
export function canReceiveAdminEvent(user: PermittedUser, event: Pick<BusEvent, "type">): boolean {
  if (event.type === "enquiry.new") return canAccess(user, "enquiries");
  if (event.type === "email.new") return canAccess(user, "emails");
  return canAccess(user, "live-chat");
}

export async function requireChatAgent(): Promise<AdminSessionUser | null> {
  const user = await getAdminUser();
  if (!user) return null;
  if (!canAccess(user, "live-chat")) return null;
  return user;
}

export function agentInfo(user: AdminSessionUser): { id: string; name: string } {
  return { id: user.id, name: user.name };
}
