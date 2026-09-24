import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Footer call-back requests. Stored beside project enquiries with
 * projectType "Callback"; email stays null (phone-channel lead).
 */

const COUNTRY_RULES: Record<string, { dial: string; min: number; max: number }> = {
  India: { dial: "+91", min: 10, max: 10 },
  "United States": { dial: "+1", min: 10, max: 10 },
  "United Kingdom": { dial: "+44", min: 10, max: 10 },
  "United Arab Emirates": { dial: "+971", min: 9, max: 9 },
  "Saudi Arabia": { dial: "+966", min: 9, max: 9 },
  Qatar: { dial: "+974", min: 8, max: 8 },
  Kuwait: { dial: "+965", min: 8, max: 8 },
  Oman: { dial: "+968", min: 8, max: 8 },
  Bahrain: { dial: "+973", min: 8, max: 8 },
  Australia: { dial: "+61", min: 9, max: 9 },
  Canada: { dial: "+1", min: 10, max: 10 },
  Germany: { dial: "+49", min: 10, max: 11 },
  Netherlands: { dial: "+31", min: 9, max: 9 },
  France: { dial: "+33", min: 9, max: 9 },
  Singapore: { dial: "+65", min: 8, max: 8 },
  "New Zealand": { dial: "+64", min: 9, max: 10 },
  "South Africa": { dial: "+27", min: 9, max: 9 },
  Ireland: { dial: "+353", min: 9, max: 9 },
  Other: { dial: "+", min: 7, max: 12 },
};

const callbackSchema = z.object({
  name: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().refine((c) => c in COUNTRY_RULES, "Please choose a country."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{7,16}$/, "Please enter a valid phone number."),
  website: z.string().max(500).optional().or(z.literal("")),
});

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Unsupported request format." }, { status: 415 });
  }

  const ip = clientIp(req);
  const limit = rateLimit(`callback:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 4000) {
      return NextResponse.json({ ok: false, error: "Request too large." }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = callbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot — silent success for bots.
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  // Validate national number length against the chosen country.
  const rules = COUNTRY_RULES[data.country];
  const digits = data.phone.replace(/\D/g, "");
  const national = rules.dial === "+" ? digits : digits.replace(rules.dial.replace("+", ""), "");
  if (national.length < rules.min || national.length > rules.max) {
    return NextResponse.json(
      { ok: false, error: `Phone number length doesn't match ${data.country}.` },
      { status: 400 },
    );
  }

  if (!prisma) {
    return NextResponse.json(
      { ok: false, error: "Request storage is not configured on this server." },
      { status: 503 },
    );
  }

  try {
    await prisma.projectEnquiry.create({
      data: {
        name: data.name || "Callback request",
        email: null,
        company: null,
        projectType: "Callback",
        budget: null,
        message: `Callback request · ${data.country} · ${data.phone}`,
        source: "footer-callback",
        userAgent: req.headers.get("user-agent")?.slice(0, 255) ?? null,
        ipHash: ip === "unknown" ? null : createHash("sha256")
          .update(`${env.ENQUIRY_IP_SALT}:${ip}`)
          .digest("hex")
          .slice(0, 32),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not store your request. Please try again shortly." },
      { status: 500 },
    );
  }
}
