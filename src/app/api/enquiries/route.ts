import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { enquirySchema, flattenFieldErrors } from "@/schemas/enquiry";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function hashIp(ip: string): string {
  return createHash("sha256").update(`${env.ENQUIRY_IP_SALT}:${ip}`).digest("hex").slice(0, 32);
}

export async function POST(req: Request) {
  // Accept only JSON bodies of a sane size.
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { ok: false, error: "Unsupported request format." },
      { status: 415 },
    );
  }

  const ip = clientIp(req);
  const limit = rateLimit(`enquiry:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Too many enquiries from this address. Please try again in ${Math.ceil(
          limit.retryAfterSeconds / 60,
        )} minute(s).`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 12_000) {
      return NextResponse.json({ ok: false, error: "Request too large." }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, fieldErrors: flattenFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot: bots that filled the invisible field get a silent "success".
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  if (!prisma) {
    return NextResponse.json(
      { ok: false, error: "Enquiry storage is not configured on this server." },
      { status: 503 },
    );
  }

  try {
    await prisma.projectEnquiry.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company || null,
        projectType: data.projectType,
        budget: data.budget || null,
        message: data.message,
        source: "homepage",
        userAgent: req.headers.get("user-agent")?.slice(0, 255) ?? null,
        ipHash: ip === "unknown" ? null : hashIp(ip),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not store your enquiry. Please try again shortly." },
      { status: 500 },
    );
  }
}
