/**
 * Shared admin-account logic used by both the Panel users management
 * (admin edits any profile) and self-service flows: password policy,
 * display-name propagation to every published surface, and email-change
 * notifications. One implementation, every entry point connected.
 */

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMailNow } from "@/lib/mail";
import { logger } from "@/lib/logger";
import { verifyPassword } from "@/lib/auth";

export const accountNameSchema = z.string().trim().min(2).max(120);
export const accountEmailSchema = z.string().trim().toLowerCase().email().max(160);
export const accountPasswordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200)
  .regex(/[a-zA-Z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

/** Verify a password hash (uniform timing, null-safe). */
export async function passwordMatches(hash: string | null | undefined, password: string): Promise<boolean> {
  if (!hash) return false;
  return verifyPassword(password, hash);
}

/**
 * Propagate a display-name change to every surface the name was published
 * on: live-chat bylines ("X from Savo", internal notes), system messages
 * ("Assigned to X", "Conversation closed by X", "Unassigned by X") and
 * conversation-event actor names. Live surfaces (nav card, agent lists,
 * assignment dropdowns, audit joins) read the AdminUser row directly and
 * update automatically. Includes the Savo AI assistant surface: agent
 * bylines inside visitor conversations are covered by the same sweep.
 */
export async function propagateAdminName(userId: string, oldName: string, newName: string): Promise<void> {
  if (!prisma || oldName === newName) return;
  try {
    await prisma.chatMessage.updateMany({
      where: { agentId: userId, senderName: `${oldName} from Savo` },
      data: { senderName: `${newName} from Savo` },
    });
    await prisma.chatMessage.updateMany({
      where: { agentId: userId, senderName: oldName },
      data: { senderName: newName },
    });
    for (const template of [`Assigned to ${oldName}`, `Conversation closed by ${oldName}`, `Unassigned by ${oldName}`]) {
      await prisma.chatMessage.updateMany({
        where: { type: "system", body: template },
        data: { body: template.replace(oldName, newName) },
      });
    }
    await prisma.conversationEvent.updateMany({
      where: { actorId: userId },
      data: { actorName: newName },
    });
  } catch (err) {
    logger.warn("admin_account.name_propagation_failed", { message: err instanceof Error ? err.message : "unknown" });
  }
}

/** Email-change notification to both addresses (fire-and-forget). */
export function notifyEmailChanged(name: string, oldEmail: string, newEmail: string): void {
  const build = (to: string, which: "old" | "new") => ({
    subject: "Your Savo admin sign-in email was changed",
    text: `Hello ${name},\n\nThe sign-in email for your Savo admin account was changed ${which === "old" ? `from ${oldEmail} to ${newEmail}` : `to ${newEmail} (this address)`}. The change was made by an administrator from the panel.\n\nIf this wasn't expected, contact your administrator immediately.\n\nSavo Technologies`,
    html: `<div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.6"><p>Hello ${name},</p><p>The sign-in email for your <strong>Savo admin</strong> account was changed ${which === "old" ? `from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>` : `to <strong>${newEmail}</strong> (this address)`}.</p><p>If this wasn't expected, contact your administrator immediately.</p><p>Savo Technologies</p></div>`,
  });
  sendMailNow(oldEmail, build(oldEmail, "old"));
  sendMailNow(newEmail, build(newEmail, "new"));
}
