/**
 * Admin live-chat API guard, session check plus the live-chat section
 * grant, in one helper every admin route shares.
 */

import { getAdminUser, type AdminSessionUser } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";

export async function requireChatAgent(): Promise<AdminSessionUser | null> {
  const user = await getAdminUser();
  if (!user) return null;
  if (!canAccess(user, "live-chat")) return null;
  return user;
}

export function agentInfo(user: AdminSessionUser): { id: string; name: string } {
  return { id: user.id, name: user.name };
}
