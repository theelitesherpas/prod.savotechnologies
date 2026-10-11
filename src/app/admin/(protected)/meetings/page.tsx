import { requireAdminPage } from "@/lib/permissions";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { MeetingsApp } from "./meetings-app";

export const metadata: Metadata = { title: "Meetings" };
export const dynamic = "force-dynamic";

/** Admin → Client Portal → Meetings: scheduling dashboard. */
export default async function MeetingsPage() {
  await requireAdminPage("/admin/meetings");
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return <MeetingsApp me={{ id: user.id, name: user.name, role: user.role }} />;
}
