/**
 * Savo v7 correspondence: the website's white / black / red identity,
 * translated to a readable 600px letter, not a miniature landing page.
 * Outlook gets fixed-width ghost tables and Arial; capable clients get
 * Outfit headings and Inter reading. Core layout and colour are inline.
 */
import { SITE } from "@/constants/site";

export const MAIL_COLORS = {
  paper: "#f7f7f7",
  soft: "#f7f7f7",
  ink: "#000000",
  body: "#333333",
  muted: "#626262",
  faint: "#666666",
  accent: "#df2525",
  line: "#e8e8e8",
  card: "#ffffff",
} as const;

export const DISPLAY = "'Outfit', Arial, Helvetica, sans-serif";
export const SANS = "'Inter', Arial, Helvetica, sans-serif";
/** Compatibility alias for callers of the old email API; no serif face is used. */
export const SERIF = DISPLAY;
/** Only for genuine code, never for labels or ornamental metadata. */
export const MONO = "Consolas, 'Courier New', monospace";
export const escapeMailHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const esc = escapeMailHtml;
export const site = (path = "/") => `https://savotechnologies.com${path}`;
/** Signed only at the server sending boundary, never in client previews. */
export const UNSUBSCRIBE_PLACEHOLDER = `${site("/unsubscribe")}#mail-signature-required`;

function origin(): string {
  return (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "https://savotechnologies.com").replace(/\/$/, "");
}

function emailCss(): string {
  return `
@font-face{font-family:Outfit;font-style:normal;font-weight:100 900;font-display:swap;src:url('${origin()}/fonts/outfit/Outfit-Variable.dc1f873e.latin.woff2') format('woff2');}
@font-face{font-family:Inter;font-style:normal;font-weight:100 900;font-display:swap;src:url('${origin()}/fonts/inter/Inter-Variable.163f2f69.latin.woff2') format('woff2');}
@font-face{font-family:Inter;font-style:italic;font-weight:100 900;font-display:swap;src:url('${origin()}/fonts/inter/Inter-Italic-Variable.0e543362.latin.woff2') format('woff2');}
body{margin:0!important;padding:0!important;}table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}td{word-wrap:break-word;}img{border:0;outline:none;text-decoration:none;}a{color:#b82222;}p{margin:0 0 16px;}h2,h3{font-family:${DISPLAY};color:#000000;font-weight:500;}::selection{background:#000000;color:#ffffff;}
a:focus-visible{outline:3px solid #b82222;outline-offset:3px;}.mail-footer a:focus-visible{outline-color:#ff6b6b;}
@media only screen and (max-width:480px){.mail-outer{padding:12px 0!important;}.mail-header,.mail-hero,.mail-body,.mail-footer{padding-left:20px!important;padding-right:20px!important;}.mail-title{font-size:28px!important;line-height:1.2!important;}.mail-spec-label,.mail-spec-value{display:block!important;width:auto!important;}.mail-spec-label{padding-bottom:3px!important;border-bottom:0!important;}.mail-spec-value{padding-top:0!important;}.mail-pitch-cell{display:block!important;width:100%!important;padding:12px 0!important;}.mail-dual-cell{display:block!important;width:100%!important;padding:0 0 12px!important;}.mail-button-table{width:100%!important;}.mail-button{display:block!important;text-align:center!important;}.mail-header-note{font-size:12px!important;}.mail-note{padding:16px!important;}}
`;
}

export const p = (s: string, last = false) =>
  `<p style="margin:${last ? "0" : "0 0 16px"};font-family:${SANS};font-size:16px;line-height:1.75;color:#333333;text-align:left;overflow-wrap:anywhere;word-break:break-word;">${s}</p>`;
export const lead = (s: string) =>
  `<p style="margin:0 0 24px;font-family:${SANS};font-size:16px;line-height:1.8;color:#333333;text-align:left;overflow-wrap:anywhere;word-break:break-word;">${s}</p>`;

/** Paired record rows; large amounts use their own full-width row. */
export function spec(rows: [string, string | undefined][], opts?: { big?: number }): string {
  const items = rows.filter(([, value]) => value !== undefined && value !== "");
  if (!items.length) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;table-layout:fixed;background:#f7f7f7;" bgcolor="#f7f7f7"><tr><td style="padding:8px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;">${items.map(([key, value], i) => {
    const rule = i < items.length - 1 ? "border-bottom:1px solid #e8e8e8;" : "";
    if (opts?.big === i) return `<tr><td colspan="2" style="padding:16px 0;${rule}"><p style="margin:0 0 5px;font-family:${SANS};font-size:13px;line-height:1.6;color:#626262;">${esc(key)}</p><p style="margin:0;font-family:${DISPLAY};font-size:34px;font-weight:500;line-height:1.2;color:#000000;overflow-wrap:anywhere;word-break:break-word;font-variant-numeric:tabular-nums;">${esc(value ?? "-")}</p></td></tr>`;
    return `<tr><td class="mail-spec-label" width="35%" valign="top" style="width:35%;padding:13px 12px 13px 0;${rule}font-family:${SANS};font-size:13px;line-height:1.7;color:#626262;">${esc(key)}</td><td class="mail-spec-value" width="65%" valign="top" style="width:65%;padding:13px 0;${rule}font-family:${SANS};font-size:15px;line-height:1.6;font-weight:500;color:#000000;overflow-wrap:anywhere;word-break:break-word;font-variant-numeric:tabular-nums;">${esc(value ?? "-").replace(/\r?\n/g, "<br>")}</td></tr>`;
  }).join("")}</table></td></tr></table>`;
}

/** A quiet note, not a coloured warning or implied success state. */
export function highlight(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;table-layout:fixed;background:#f7f7f7;" bgcolor="#f7f7f7"><tr><td class="mail-note" style="padding:20px;font-family:${SANS};font-size:15px;line-height:1.75;color:#333333;text-align:left;overflow-wrap:anywhere;word-break:break-word;">${html}</td></tr></table>`;
}

export function prose(text: string): string {
  return highlight(esc(text).replace(/\r?\n/g, "<br>"));
}

export function mailCta(href: string, label: string, sub?: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" class="mail-button-table" style="margin:28px 0 0;max-width:100%;"><tr><td align="center" bgcolor="#df2525" style="background:#df2525;border-radius:6px;mso-padding-alt:14px 22px;">
<a class="mail-button" href="${esc(href)}" style="display:block;padding:14px 22px;border:1px solid #df2525;border-radius:6px;font-family:${SANS};font-size:14px;line-height:20px;font-weight:600;text-decoration:none;color:#ffffff;background:#df2525;mso-padding-alt:0;text-align:center;">${esc(label)}&nbsp;&nbsp;&rarr;</a>
</td></tr></table>${sub ? `<p style="margin:12px 0 0;font-family:${SANS};font-size:12px;line-height:1.7;color:#626262;">${esc(sub)}</p>` : ""}`;
}

type Signature = { name: string; title: string; company?: string; tagline?: string };
function signOff(closing: string, isHr: boolean, signature?: Signature): string {
  return `<div style="margin-top:32px;text-align:left;">
<p style="margin:0 0 6px;font-family:${SANS};font-size:15px;line-height:1.7;color:#333333;">${esc(closing)}</p>
${signature ? `<p style="margin:0;font-family:${SANS};font-size:16px;font-weight:600;line-height:1.6;color:#000000;">${esc(signature.name)}</p><p style="margin:2px 0 0;font-family:${SANS};font-size:13px;line-height:1.7;color:#626262;">${esc(signature.title)}</p>${signature.company ? `<p style="margin:2px 0 0;font-family:${SANS};font-size:13px;line-height:1.7;color:#626262;">${esc(signature.company)}</p>` : ""}${signature.tagline ? `<p style="margin:8px 0 0;font-family:${SANS};font-size:13px;line-height:1.7;color:#b82222;">${esc(signature.tagline)}</p>` : ""}` : `<p style="margin:0;font-family:${SANS};font-size:15px;font-weight:600;line-height:1.7;color:#000000;">${isHr ? "The Savo team - Human Resources" : "The Savo team"}</p><p style="margin:4px 0 0;font-family:${SANS};font-size:12px;line-height:1.7;color:#626262;">Reply to this email to reach our team</p>`}
</div>`;
}

/** Every default, custom email and admin override uses this same shell. */
export function shell(opts: {
  preheader: string;
  /** Existing API name; rendered as context BELOW the title, not an eyebrow. */
  eyebrowText?: string;
  ref?: string;
  heading: string;
  bodyHtml: string;
  cta?: { href: string; label: string; sub?: string };
  closing?: string;
  reason?: string;
  unsubscribeEmail?: string;
  signature?: Signature;
  dept?: "hello" | "hr";
}): string {
  const isHr = opts.dept === "hr";
  const contactEmail = isHr ? "hr@savotechnologies.com" : SITE.email;
  const phone = isHr ? SITE.hrPhone : SITE.phone;
  const phoneE164 = isHr ? SITE.hrPhoneE164 : SITE.phoneE164;
  const context = [opts.eyebrowText, opts.ref].filter(Boolean).map(t => esc(t!)).join(" &middot; ");
  const footerLink = "color:#b0b0b0;text-decoration:underline;text-underline-offset:3px;";
  return `<!doctype html><html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(opts.heading || opts.preheader)}</title><style>${emailCss()}</style><!--[if mso]><style>body,table,td,p,a,h1,h2,h3{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]--></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:${SANS};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<!-- Savo v7 correspondence: website identity; readable records; inline email-safe layout. -->
<div style="display:none!important;font-size:1px;line-height:1px;color:#f7f7f7;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f7f7f7" style="width:100%;background:#f7f7f7;"><tr><td class="mail-outer" align="center" style="padding:32px 12px;">
<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" class="mail-canvas" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%;max-width:600px;table-layout:fixed;background:#ffffff;">
<tr><td class="mail-header" style="padding:24px 32px;background:#ffffff;" bgcolor="#ffffff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="104" valign="middle"><a href="${site()}" style="display:inline-block;"><img src="${origin()}/images/email/logo.png" width="96" height="46" alt="Savo Technologies" style="display:block;width:96px;height:46px;border:0;background:#ffffff;"></a></td><td class="mail-header-note" align="right" valign="middle" style="font-family:${SANS};font-size:13px;line-height:1.6;color:#b82222;">${isHr ? "Human Resources" : "Savo Technologies"}</td></tr></table></td></tr>
${opts.heading ? `<tr><td class="mail-hero" bgcolor="#000000" style="padding:32px;background:#000000;"><h1 class="mail-title" style="margin:0;font-family:${DISPLAY};font-size:32px;font-weight:500;line-height:1.2;letter-spacing:-0.025em;color:#ffffff;text-align:left;overflow-wrap:anywhere;word-break:break-word;">${esc(opts.heading)}</h1>${context ? `<p style="margin:14px 0 0;font-family:${SANS};font-size:13px;line-height:1.7;color:#b0b0b0;overflow-wrap:anywhere;word-break:break-word;">${context}</p>` : ""}</td></tr>` : ""}
<tr><td class="mail-body" bgcolor="#ffffff" style="padding:32px;background:#ffffff;font-family:${SANS};font-size:16px;line-height:1.75;color:#333333;text-align:left;overflow-wrap:anywhere;word-break:break-word;">
${opts.bodyHtml}
${opts.cta ? mailCta(opts.cta.href, opts.cta.label, opts.cta.sub) : ""}
${signOff(opts.closing ?? "Kind regards,", isHr, opts.signature)}
</td></tr>
<tr><td class="mail-footer" bgcolor="#111111" style="padding:28px 32px;background:#111111;text-align:left;">
<p style="margin:0 0 18px;font-family:${DISPLAY};font-size:23px;font-weight:500;line-height:1.25;color:#ffffff;">${esc(SITE.tagline)}</p>
<p style="margin:0 0 6px;font-family:${SANS};font-size:13px;line-height:1.8;color:#b0b0b0;"><a href="mailto:${contactEmail}" style="${footerLink}">${contactEmail}</a></p>
<p style="margin:0 0 14px;font-family:${SANS};font-size:13px;line-height:1.8;color:#b0b0b0;"><a href="tel:${phoneE164}" style="${footerLink}">${phone}</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="https://wa.me/${phoneE164.replace("+", "")}" style="${footerLink}">WhatsApp</a></p>
<p style="margin:0 0 14px;font-family:${SANS};font-size:12px;line-height:2;color:#b0b0b0;"><a href="${site()}" style="${footerLink}">savotechnologies.com</a><br><a href="https://www.linkedin.com/company/savotechnologies/" style="${footerLink}">LinkedIn</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="https://www.instagram.com/savotechnologies/" style="${footerLink}">Instagram</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="https://www.facebook.com/savotechnologies" style="${footerLink}">Facebook</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="https://www.youtube.com/@savotechnologies" style="${footerLink}">YouTube</a></p>
<p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.8;color:#b0b0b0;">&copy; ${new Date().getFullYear()} ${esc(SITE.legalName)} - Indore &middot; Zürich<br>${esc(opts.reason ?? "You are receiving this because you contacted Savo Technologies.")}${opts.unsubscribeEmail ? `<br><a href="${UNSUBSCRIBE_PLACEHOLDER}" style="color:#ffffff;text-decoration:underline;">Unsubscribe</a>` : ""}</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}
