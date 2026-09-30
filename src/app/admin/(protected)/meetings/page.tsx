import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MeetingsApp } from "./meetings-app";

export const metadata: Metadata = { title: "Meetings" };
export const dynamic = "force-dynamic";

/** Admin → Client Portal → Meetings: scheduling dashboard. */
export default async function MeetingsPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return <MeetingsApp me={{ id: user.id, name: user.name, role: user.role }} />;
}
