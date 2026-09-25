"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { unsubscribeSig } from "@/lib/mail/templates";

export async function unsubscribeAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const sig = String(formData.get("sig") ?? "");
  if (!email || sig !== unsubscribeSig(email)) {
    redirect("/unsubscribe?e=invalid");
  }
  if (prisma) {
    await prisma.mailSuppress
      .upsert({
        where: { email },
        update: { reason: "user" },
        create: { email, reason: "user" },
      })
      .catch(() => undefined);
  }
  redirect(`/unsubscribe?done=1&email=${encodeURIComponent(email)}`);
}
