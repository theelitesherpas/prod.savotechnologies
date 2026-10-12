import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 630 };
const ORIGIN = "https://savotechnologies.com";

function plain(value: string | null, fallback: string, max: number): string {
  const normalized = (value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  const chars = Array.from(normalized);
  if (chars.length <= max) return normalized;
  const cutoff = chars.slice(0, max - 1).join("").trimEnd();
  const sentenceEnd = Math.max(cutoff.lastIndexOf("."), cutoff.lastIndexOf("!"), cutoff.lastIndexOf("?"));
  if (sentenceEnd >= max * 0.35) return cutoff.slice(0, sentenceEnd + 1).trimEnd();
  const wordEnd = cutoff.lastIndexOf(" ");
  return `${(wordEnd > 0 ? cutoff.slice(0, wordEnd) : cutoff).trimEnd()}…`;
}

function pagePath(value: string | null): string {
  if (!value) return "/";
  try {
    const page = new URL(value, ORIGIN);
    return page.origin === ORIGIN ? page.pathname : "/";
  } catch {
    return "/";
  }
}

function sectionLabel(page: string): string {
  const labels: [string, string][] = [
    ["/locations/indore", "LOCATION  /  INDORE, INDIA"],
    ["/locations/switzerland", "LOCATION  /  SWITZERLAND"],
    ["/locations", "WHERE WE WORK"],
    ["/services", "SERVICES"],
    ["/industries", "INDUSTRIES"],
    ["/case-studies", "CASE STUDIES"],
    ["/insights", "INSIGHTS"],
    ["/ai-agents", "AI & INTELLIGENT SYSTEMS"],
    ["/ai", "AI & INTELLIGENT SYSTEMS"],
    ["/hire", "HIRE SPECIALISTS"],
    ["/careers", "CAREERS"],
    ["/about", "WHO WE ARE"],
    ["/contact", "CONTACT"],
    ["/enterprise", "ENTERPRISE"],
    ["/trust", "TRUST & SECURITY"],
    ["/technology", "TECHNOLOGY & ARCHITECTURE"],
    ["/company-profile", "COMPANY PROFILE"],
    ["/start-a-project", "START A PROJECT"],
    ["/privacy-policy", "PRIVACY POLICY"],
    ["/terms-and-conditions", "TERMS & CONDITIONS"],
    ["/portal", "CLIENT PORTAL"],
  ];
  if (page === "/") return "OFFICIAL WEBSITE  /  SAVO TECHNOLOGIES";
  const match = labels.find(([prefix]) => page === prefix || page.startsWith(`${prefix}/`));
  if (match) {
    const [, label] = match;
    if (["/services", "/industries", "/case-studies", "/insights", "/ai", "/ai-agents", "/hire"].includes(match[0]) && page !== match[0]) {
      const detail = page.split("/").filter(Boolean).at(-1)?.replace(/[-_]+/g, " ").toUpperCase();
      return `${label}  /  ${detail}`;
    }
    return label;
  }
  return "SAVO TECHNOLOGIES";
}

/** Branded 1200×630 page-specific Open Graph/X card; no user HTML or remote assets. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = pagePath(params.get("page"));
  const rawTitle = plain(params.get("title"), "Savo Technologies", 100);
  const title = page === "/"
    ? "Savo Technologies"
    : rawTitle.replace(/\s*[|·—–-]\s*Savo Technologies\s*$/i, "").trim() || rawTitle;
  const description = plain(params.get("description"), "Digital product and software engineering from Savo Technologies.", 154);
  const section = sectionLabel(page);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", padding: "52px 64px 42px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#080808", color: "#ffffff", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: 196, height: 88, padding: "10px 18px", display: "flex", flexDirection: "column", justifyContent: "center", background: "#ffffff", color: "#111111" }}>
          <div style={{ fontSize: 34, lineHeight: 1.05, fontWeight: 700, letterSpacing: -1.2 }}>Savo</div>
          <div style={{ marginTop: 3, fontFamily: "Arial", fontSize: 17, lineHeight: 1.1, fontWeight: 600 }}>Technologies</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, maxWidth: 720, color: "#e7e7e7", fontSize: 18, fontWeight: 500, letterSpacing: 1.4, textAlign: "right" }}>
          <span style={{ width: 9, height: 9, background: "#df2525", display: "flex", flexShrink: 0 }} />
          {section}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1040 }}>
        <div style={{ color: "#ffffff", fontSize: title.length > 62 ? 54 : title.length > 42 ? 62 : 72, lineHeight: 1.08, fontWeight: 500, letterSpacing: -1.7, overflow: "hidden" }}>{title}</div>
        <div style={{ color: "#b0b0b0", fontFamily: "Arial", fontSize: 21, lineHeight: 1.42, maxWidth: 990 }}>{description}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #333333", paddingTop: 20, color: "#c4c4c4", fontFamily: "Arial", fontSize: 17, letterSpacing: 0.3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ width: 8, height: 8, background: "#df2525", display: "flex" }} />savotechnologies.com</div>
        <div style={{ color: "#ffffff", letterSpacing: 1.5 }}>WEB  ·  MOBILE  ·  AI  ·  SOFTWARE</div>
      </div>
    </div>,
    { ...SIZE, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
