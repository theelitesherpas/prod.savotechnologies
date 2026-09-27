import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware - cheap gates only (real authorization happens in the
 * admin layout, server actions and route handlers).
 *
 * 1. /admin/**  - requires the session cookie to exist; otherwise redirect
 *    to /admin/login (the login page itself and static assets are exempt).
 * 2. POST /api/** - when a browser sends an Origin header it must match the
 *    request host (CSRF hardening alongside SameSite cookies).
 * 3. Content Signals - every public HTML response carries the W3C-track
 *    Content Signals (contentsignals.org) as a Link header, declaring that
 *    Savo's marketing content permits search indexing, AI input (RAG /
 *    answer engines) and AI training. This is the machine-readable AI
 *    permission layer Cloudflare's AI Crawl Control reads.
 * 4. Markdown negotiation - requests carrying `Accept: text/markdown`
 *    (AI agents; browsers never send it) receive a clean Markdown
 *    rendering of the page's main content instead of dense HTML - the
 *    origin-side equivalent of Cloudflare's "Markdown for Agents".
 */

const ADMIN_COOKIE = "savo_admin";

/** Signals Savo publishes for its public marketing content. */
const CONTENT_SIGNALS = "permits-search permits-ai-input permits-ai-training";

/** Paths that never take part in markdown negotiation or signals. */
const NON_CONTENT = /^\/(_next\/|api\/|admin\/?|portal\/?|employee-portal\/?|unsubscribe\/?)/;

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

  // ── Forward the pathname for server-side guards ────────────
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname + req.nextUrl.search);

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

  // ── Markdown negotiation (agents only) ─────────────────────
  const accept = req.headers.get("accept") ?? "";
  if (
    req.method === "GET" &&
    !NON_CONTENT.test(pathname) &&
    accept.includes("text/markdown") &&
    !accept.includes("text/html")
  ) {
    return renderMarkdown(req);
  }

  // ── Content Signals on public page responses ───────────────
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (!NON_CONTENT.test(pathname)) {
    res.headers.set(
      "Link",
      `<${new URL(pathname, req.url).href}>; rel="${CONTENT_SIGNALS}"`,
    );
  }
  return res;
}

/* ───────────────────── Markdown rendering ─────────────────────── */

async function renderMarkdown(req: NextRequest): Promise<NextResponse> {
  try {
    // Fetch the page as a browser would - Accept: text/html keeps the
    // sub-request out of this branch (no recursion).
    const page = await fetch(req.url, {
      headers: { accept: "text/html", "user-agent": req.headers.get("user-agent") ?? "" },
      redirect: "follow",
    });
    if (!page.ok) return new NextResponse(null, { status: page.status });
    const html = await page.text();
    const url = new URL(req.url);
    const md = htmlToMarkdown(html, url);
    if (!md) return new NextResponse(null, { status: 204 });

    return new NextResponse(md, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=600, s-maxage=3600",
        "X-Robots-Tag": "noindex", // the HTML canonical remains the indexable resource
        Link: `<${url.href}>; rel="${CONTENT_SIGNALS}"`,
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'",
  "&#39;": "'", "&nbsp;": " ", "&rsquo;": "'", "&lsquo;": "'", "&ldquo;": '"',
  "&rdquo;": '"', "&middot;": "·", "&mdash;": "—", "&ndash;": "–", "&hellip;": "…",
};

const decode = (s: string) =>
  s.replace(/&(amp|lt|gt|quot|#x27|#39|nbsp|rsquo|lsquo|ldquo|rdquo|middot|mdash|ndash|hellip);/g, (m) => ENTITIES[m] ?? m);

const flat = (s: string) =>
  decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/** Focused HTML → Markdown conversion for the site's semantic markup. */
function htmlToMarkdown(html: string, pageUrl: URL): string {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  const desc =
    html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] ??
    html.match(/<meta\s+content="([^"]*)"\s+name="description"/i)?.[1] ?? "";

  let s = html.match(/<main[^>]*>([\s\S]*)<\/main>/i)?.[1] ?? "";
  if (!s) return "";

  // Drop non-content regions entirely.
  s = s.replace(/<(script|style|svg|noscript|iframe|form|nav|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<(div|span|ul|ol|section|article|figure|table|thead|tbody|dl)[^>]*>/gi, "");

  // Links first (absolute, so agents can follow).
  s = s.replace(/<a\b[^>]*href="([^"#]*)"([^>]*)>([\s\S]*?)<\/a>/gi, (_m, href: string, _rest: string, text: string) => {
    const t = flat(text);
    if (!t || href.startsWith("javascript:") || href.startsWith("mailto:")) return t;
    try {
      return `[${t}](${new URL(href, pageUrl.origin + "/").href})`;
    } catch {
      return t;
    }
  });

  // Headings.
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level: string, text: string) =>
    `\n\n${"#".repeat(Number(level))} ${flat(text)}\n`);

  // Lists.
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, text: string) => `\n- ${flat(text)}`);

  // Emphasis.
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, text: string) => `**${flat(text)}**`);
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, text: string) => `_${flat(text)}_`);

  // Block-level closers and breaks become newlines; remaining tags strip.
  s = s.replace(/<\/(p|div|section|article|li|ul|ol|blockquote|figcaption|table|tr|h[1-6]|dl|dt|dd)>/gi, "\n");
  s = s.replace(/<(br|hr)\s*\/?>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = decode(s);

  // Normalize whitespace: one space inside lines, max one blank line between them.
  s = s
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!s) return "";

  const header = [
    title ? `# ${decode(title)}` : "",
    desc ? `> ${decode(desc)}` : "",
    `Source: ${pageUrl.href}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return `${header}\n\n---\n\n${s}`;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images/|fonts/|icons/|favicon.ico|icon.svg|apple-icon|manifest.webmanifest|robots.txt|sitemap.xml|llms.txt|llms-full.txt|opengraph-image|ads.txt).*)",
  ],
};
