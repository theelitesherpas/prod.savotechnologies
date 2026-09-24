import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware — cheap gates only (real authorization happens in the
 * admin layout, server actions and route handlers).
 *
 * 1. /admin/**  — requires the session cookie to exist; otherwise redirect
 *    to /admin/login (the login page itself and static assets are exempt).
 * 2. POST /api/** — when a browser sends an Origin header it must match the
 *    request host (CSRF hardening alongside SameSite cookies).
 */

const ADMIN_COOKIE = "savo_admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin gate ──────────────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // ── API cross-origin guard (mutations) ─────────────────────
  if (pathname.startsWith("/api/") && req.method === "POST") {
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        const host = req.headers.get("host");
        if (!host || originHost !== host) {
          return NextResponse.json(
            { ok: false, error: "Cross-origin request rejected." },
            { status: 403 },
          );
        }
      } catch {
        return NextResponse.json({ ok: false, error: "Invalid origin." }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
