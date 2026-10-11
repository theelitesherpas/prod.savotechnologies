"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { enforceLoginCaptcha, recordLoginFailure, clearLoginFailures } from "@/lib/captcha";
import { clientIpFromHeaders } from "@/lib/api";
import { verifyPassword, DUMMY_PASSWORD_HASH } from "@/lib/passwords";
import { employeeAccessAllowed } from "@/lib/employee-access";

/**
 * Employee portal auth - employees log in with their registered email
 * and a password managed by HR/admin. Sessions are cookie-based with
 * hashed tokens, mirroring the client portal pattern.
 */

const COOKIE = "savo_employee";
const SESSION_DAYS = 7;

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1).max(200),
});

export async function employeeLoginAction(formData: FormData): Promise<void> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect("/employee-portal?e=Enter your email and password.");
  }
  const { email, password } = parsed.data;

  // IP extraction (same pattern as admin login)
  const hdrs = await headers();
  const ip = clientIpFromHeaders(hdrs);

  const limit = rateLimit(`employee-login:${ip}`, 10, 15 * 60 * 1000);
  const emailLimit = rateLimit(`employee-login-email:${createHash("sha256").update(email).digest("hex")}`, 10, 15 * 60 * 1000);
  if (!limit.ok || !emailLimit.ok) {
    redirect("/employee-portal?e=Too many attempts. Please wait a few minutes.");
  }

  if (!prisma) {
    redirect("/employee-portal?e=Portal not configured.");
  }

  // Progressive captcha: after 2 failed attempts, verify before processing.
  const cap = await enforceLoginCaptcha("employee", ip, formData.get("captchaToken"));
  if (!cap.ok) {
    if ("captchaRequired" in cap) {
      redirect("/employee-portal?e=Please complete the human verification.");
    }
    redirect(`/employee-portal?e=${encodeURIComponent(cap.error)}`);
  }

  const employee = await prisma.employee.findUnique({
    where: { email },
    select: { id: true, employeeCode: true, status: true,
      panelUsers: { take: 1, select: { passwordHash: true } } },
  });

  // Same asynchronous work for unknown, exited and unlinked accounts.
  const panelUser = employee?.panelUsers[0];
  const passwordOk = await verifyPassword(password, panelUser?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!employee || !employeeAccessAllowed(employee) || !panelUser || !passwordOk) {
    logger.warn("employee_auth.login_failed");
    recordLoginFailure("employee", ip);
    redirect("/employee-portal?e=Email or password is incorrect.");
  }

  clearLoginFailures("employee", ip);

  // Create session token
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);

  await prisma.employeeSession.create({
    data: {
      employeeId: employee.id,
      tokenHash,
      expiresAt: expires,
    },
  });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });

  logger.info("employee_auth.login", { employeeCode: employee.employeeCode });
  redirect("/employee-portal/dashboard");
}

export async function employeeLogoutAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && prisma) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await prisma.employeeSession.deleteMany({ where: { tokenHash } }).catch(() => undefined);
  }
  jar.delete(COOKIE);
  redirect("/employee-portal");
}
