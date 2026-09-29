import type { Metadata } from "next";
import { getAdminUser } from "@/lib/auth";
import { LiveChatApp } from "./live-chat-app";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Chat",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Live Chat — the real-time visitor inbox (Savo Assistant + human chat).
 * Auth + section access are enforced by the admin layout; the page hands
 * the signed-in user to the client application.
 */
export default async function LiveChatPage() {
  const user = await getAdminUser();
  return <LiveChatApp me={{ id: user?.id ?? "", name: user?.name ?? "", role: user?.role ?? "editor" }} />;
}
