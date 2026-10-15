/**
 * Savo v7 correspondence — a considered brand letter, not stacked wireframe bands.
 * Shared by every client/HR default, custom message and saved body override.
 * A self-contained raster lockup keeps its contrast even when inboxes recolour
 * HTML. Explicit dark palettes enhance supporting clients; inline tables and
 * Arial remain the Outlook/stripped-CSS fallback. No dispatch/copy changes.
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
/** Compatibility alias; the correspondence system uses no serif face. */
export const SERIF = DISPLAY;
export const MONO = "Consolas, 'Courier New', monospace";
export const escapeMailHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
const esc = escapeMailHtml;
export const site = (path = "/") => `https://savotechnologies.com${path}`;
/** Signed only at the server sending boundary, never in client previews. */
export const UNSUBSCRIBE_PLACEHOLDER = `${site("/unsubscribe")}#mail-signature-required`;

function origin(): string {
  return (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "https://savotechnologies.com").replace(/\/$/, "");
}

/** Semantic classes plus narrowly matched legacy inline colours cover bespoke
 * pitch/HR/override content, not just the new shared primitives. */
function darkRules(prefix = ""): string {
  const rule = (selectors: string, declarations: string) =>
    `${selectors.split(",").map(s => `${prefix}${s.trim()}`).join(",")}{${declarations}}`;
  return [
    rule(".mail-page,.mail-ground", "background-color:#101112!important;"),
    rule(".mail-canvas,.mail-hero,.mail-body", "background-color:#1b1d20!important;border-color:#34363b!important;"),
    rule(".mail-header", "background-color:#151515!important;"),
    rule(".mail-title,.mail-strong,.mail-body h2,.mail-body h3", "color:#f4f4f5!important;"),
    rule('.mail-body [style*="color:#000000"]', "color:#f4f4f5!important;"),
    rule('.mail-body,.mail-copy,.mail-note,.mail-body [style*="color:#333333"]', "color:#d6d8dc!important;"),
    rule('.mail-muted,.mail-context,.mail-body [style*="color:#626262"],.mail-body [style*="color:#666666"]', "color:#b1b5bd!important;"),
    rule(".mail-panel,.mail-footer", "background-color:#25282d!important;border-color:#3c4047!important;"),
    rule('.mail-body [bgcolor="#ffffff"]', "background-color:#1b1d20!important;"),
    rule('.mail-body a:not(.mail-button),.mail-body [style*="color:#b82222"],.mail-body [style*="color:#df2525"]', "color:#ff9999!important;"),
    rule(".mail-footer-copy,.mail-footer a", "color:#c2c5cb!important;"),
    rule(".mail-footer-title", "color:#f4f4f5!important;"),
    rule(".mail-button-primary", "background-color:#df2525!important;border-color:#df2525!important;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;"),
    rule(".mail-button-secondary", "background-color:#25282d!important;border-color:#666a73!important;color:#f4f4f5!important;"),
  ].join("\n");
}

function emailCss(): string {
  return `
:root{color-scheme:light dark;supported-color-schemes:light dark;}
@font-face{font-family:Outfit;font-style:normal;font-weight:100 900;font-display:swap;src:url('${origin()}/fonts/outfit/Outfit-Variable.dc1f873e.latin.woff2') format('woff2');}
@font-face{font-family:Inter;font-style:normal;font-weight:100 900;font-display:swap;src:url('${origin()}/fonts/inter/Inter-Variable.163f2f69.latin.woff2') format('woff2');}
@font-face{font-family:Inter;font-style:italic;font-weight:100 900;font-display:swap;src:url('${origin()}/fonts/inter/Inter-Italic-Variable.0e543362.latin.woff2') format('woff2');}
body{margin:0!important;padding:0!important;}table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}td{word-wrap:break-word;}img{border:0;outline:none;text-decoration:none;}a{color:#b82222;}p{margin:0 0 18px;}h2,h3{font-family:${DISPLAY};color:#000000;font-weight:500;}
a:focus-visible{outline:3px solid #b82222;outline-offset:3px;}.mail-header a:focus-visible{outline-color:#ff9999;}::selection{background:#df2525;color:#ffffff;}
.mail-body a{overflow-wrap:anywhere;word-break:break-word;}.mail-button:hover{filter:brightness(.92);}
@media only screen and (max-width:480px){.mail-outer{padding:12px 8px!important;}.mail-header{padding:16px 14px!important;}.mail-hero{padding:26px 20px 0!important;}.mail-body{padding:24px 20px 28px!important;}.mail-footer{padding:24px 20px!important;}.mail-title{font-size:29px!important;line-height:1.17!important;}.mail-spec-label,.mail-spec-value{display:block!important;width:auto!important;}.mail-spec-label{padding-bottom:4px!important;}.mail-spec-value{padding-top:0!important;padding-bottom:14px!important;}.mail-panel-inner{padding:6px 18px!important;}.mail-pitch-cell{display:block!important;width:100%!important;padding:14px 0!important;}.mail-dual-cell{display:block!important;width:100%!important;padding:0 0 12px!important;}.mail-button-table{width:100%!important;}.mail-button{display:block!important;text-align:center!important;}.mail-header-note{font-size:12px!important;}.mail-note{padding:18px!important;}.mail-footer-links{line-height:2.2!important;}}
@media (prefers-color-scheme:dark){${darkRules()}}
${darkRules("[data-ogsc] ")}
`;
}

export const p = (s: string, last = false) =>
  `<p class="mail-copy" style="margin:${last ? "0" : "0 0 18px"};font-family:${SANS};font-size:15px;line-height:1.8;color:#333333;text-align:left;overflow-wrap:anywhere;word-break:break-word;">${s}</p>`;
export const lead = (s: string) =>
  `<p class="mail-copy" style="margin:0 0 24px;font-family:${SANS};font-size:16px;line-height:1.85;color:#333333;text-align:left;overflow-wrap:anywhere;word-break:break-word;">${s}</p>`;

/** A calm details panel: generous rows instead of a stack of wireframe rules. */
export function spec(rows: [string, string | undefined][], opts?: { big?: number }): string {
  const items = rows.filter(([, value]) => value !== undefined && value !== "");
  if (!items.length) return "";
  return `<table role="presentation" class="mail-panel" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f7f7f7" style="margin:24px 0;table-layout:fixed;background:#f7f7f7;border-radius:12px;border-collapse:separate;"><tr><td class="mail-panel-inner" style="padding:10px 22px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;">${items.map(([key, value], i) => {
    if (opts?.big === i) return `<tr><td colspan="2" style="padding:16px 0;"><p class="mail-muted" style="margin:0 0 8px;font-family:${SANS};font-size:13px;line-height:1.6;color:#626262;">${esc(key)}</p><p class="mail-strong" style="margin:0;font-family:${DISPLAY};font-size:38px;font-weight:500;line-height:1.15;letter-spacing:-.025em;color:#000000;overflow-wrap:anywhere;word-break:break-word;font-variant-numeric:tabular-nums;">${esc(value ?? "-")}</p></td></tr>`;
    return `<tr><td class="mail-spec-label mail-muted" width="34%" valign="top" style="width:34%;padding:11px 14px 11px 0;font-family:${SANS};font-size:13px;line-height:1.75;color:#626262;">${esc(key)}</td><td class="mail-spec-value mail-strong" width="66%" valign="top" style="width:66%;padding:11px 0;font-family:${SANS};font-size:15px;line-height:1.6;font-weight:600;color:#000000;overflow-wrap:anywhere;word-break:break-word;font-variant-numeric:tabular-nums;">${esc(value ?? "-").replace(/\r?\n/g, "<br>")}</td></tr>`;
  }).join("")}</table></td></tr></table>`;
}

export function highlight(html: string): string {
  return `<table role="presentation" class="mail-panel" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f7f7f7" style="margin:24px 0;table-layout:fixed;background:#f7f7f7;border-radius:12px;border-collapse:separate;"><tr><td class="mail-note" style="padding:22px;font-family:${SANS};font-size:15px;line-height:1.8;color:#333333;text-align:left;overflow-wrap:anywhere;word-break:break-word;">${html}</td></tr></table>`;
}
export function prose(text: string): string {
  return highlight(esc(text).replace(/\r?\n/g, "<br>"));
}

export function mailCta(href: string, label: string, sub?: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" class="mail-button-table" style="margin:28px 0 0;max-width:100%;border-collapse:separate;"><tr><td align="center" bgcolor="#df2525" style="background:#df2525;border-radius:8px;mso-padding-alt:16px 24px;">
<a class="mail-button mail-button-primary" href="${esc(href)}" style="display:block;padding:16px 24px;border:1px solid #df2525;border-radius:8px;font-family:${SANS};font-size:14px;line-height:20px;font-weight:600;text-decoration:none;color:#ffffff;background:#df2525;background-image:linear-gradient(#df2525,#df2525);mso-padding-alt:0;text-align:center;">${esc(label)}&nbsp;&nbsp;&rarr;</a>
</td></tr></table>${sub ? `<p class="mail-muted" style="margin:12px 0 0;font-family:${SANS};font-size:12px;line-height:1.7;color:#626262;">${esc(sub)}</p>` : ""}`;
}

type Signature = { name: string; title: string; company?: string; tagline?: string };
function signOff(closing: string, isHr: boolean, signature?: Signature): string {
  return `<div style="margin-top:32px;text-align:left;">
<p class="mail-copy" style="margin:0 0 6px;font-family:${SANS};font-size:14px;line-height:1.8;color:#333333;">${esc(closing)}</p>
${signature ? `<p class="mail-strong" style="margin:0;font-family:${SANS};font-size:16px;font-weight:600;line-height:1.6;color:#000000;">${esc(signature.name)}</p><p class="mail-muted" style="margin:3px 0 0;font-family:${SANS};font-size:13px;line-height:1.7;color:#626262;">${esc(signature.title)}</p>${signature.company ? `<p class="mail-muted" style="margin:2px 0 0;font-family:${SANS};font-size:13px;line-height:1.7;color:#626262;">${esc(signature.company)}</p>` : ""}${signature.tagline ? `<p style="margin:8px 0 0;font-family:${SANS};font-size:13px;line-height:1.7;color:#b82222;">${esc(signature.tagline)}</p>` : ""}` : `<p class="mail-strong" style="margin:0;font-family:${SANS};font-size:15px;font-weight:600;line-height:1.7;color:#000000;">${isHr ? "The Savo team - Human Resources" : "The Savo team"}</p><p class="mail-muted" style="margin:4px 0 0;font-family:${SANS};font-size:12px;line-height:1.7;color:#626262;">Reply to this email to reach our team</p>`}
</div>`;
}

/** Every default, custom email and saved body override uses this shell. */
export function shell(opts: {
  preheader: string;
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
  const footerLink = "color:#626262;text-decoration:underline;text-underline-offset:3px;";
  return `<!doctype html><html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><meta name="format-detection" content="telephone=no,date=no,address=no,email=no"><title>${esc(opts.heading || opts.preheader)}</title><style>${emailCss()}</style><!--[if mso]><style>body,table,td,p,a,h1,h2,h3{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]--></head>
<body class="mail-page" style="margin:0;padding:0;background:#f7f7f7;font-family:${SANS};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<!-- Savo v7 correspondence. THESIS: a cohesive brand letter, not wireframe bands. OWN-WORLD: official opaque white-on-charcoal lockup, Outfit/Inter, red actions. STORY: sender, message, details, next step, human reply. FIRST VIEWPORT: compact dark masthead above one continuous reading surface. FORM: fluid 600px email-safe tables; explicit light/dark palettes. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. -->
<div style="display:none!important;font-size:1px;line-height:1px;color:#f7f7f7;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(opts.preheader)}</div>
<table role="presentation" class="mail-ground" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f7f7f7" style="width:100%;background:#f7f7f7;"><tr><td class="mail-outer" align="center" style="padding:36px 12px;">
<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" class="mail-canvas" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%;max-width:600px;table-layout:fixed;background:#ffffff;border:1px solid #e8e8e8;border-radius:16px;border-collapse:separate;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,.04);">
<tr><td class="mail-header" bgcolor="#151515" style="padding:20px 30px;background:#151515;background-image:linear-gradient(#151515,#151515);border-radius:15px 15px 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;"><tr><td width="132" valign="middle"><a href="${site()}" style="display:block;width:132px;"><img src="${origin()}/images/email/logo-lockup-v2.png" width="132" height="72" alt="Savo Technologies" style="display:block;width:132px;height:72px;border:0;color:#ffffff;background:#151515;"></a></td><td class="mail-header-note" align="right" valign="middle" style="padding-left:12px;font-family:${SANS};font-size:13px;line-height:1.6;font-weight:600;color:#ffffff;">${isHr ? "People &amp; careers" : "Client services"}</td></tr></table></td></tr>
${opts.heading ? `<tr><td class="mail-hero" bgcolor="#ffffff" style="padding:34px 36px 0;background:#ffffff;"><h1 class="mail-title" style="margin:0;font-family:${DISPLAY};font-size:36px;font-weight:500;line-height:1.15;letter-spacing:-.03em;color:#000000;text-align:left;overflow-wrap:anywhere;word-break:break-word;">${esc(opts.heading)}</h1>${context ? `<p class="mail-context" style="margin:14px 0 0;font-family:${SANS};font-size:12px;line-height:1.8;color:#626262;overflow-wrap:anywhere;word-break:break-word;">${context}</p>` : ""}</td></tr>` : ""}
<tr><td class="mail-body" bgcolor="#ffffff" style="padding:26px 36px 36px;background:#ffffff;font-family:${SANS};font-size:15px;line-height:1.8;color:#333333;text-align:left;overflow-wrap:anywhere;word-break:break-word;">
${opts.bodyHtml}
${opts.cta ? mailCta(opts.cta.href, opts.cta.label, opts.cta.sub) : ""}
${signOff(opts.closing ?? "Kind regards,", isHr, opts.signature)}
</td></tr>
<tr><td class="mail-footer" bgcolor="#f7f7f7" style="padding:28px 36px;background:#f7f7f7;border-radius:0 0 15px 15px;text-align:left;">
<p class="mail-footer-title" style="margin:0 0 16px;font-family:${DISPLAY};font-size:21px;font-weight:500;line-height:1.3;letter-spacing:-.015em;color:#000000;">${esc(SITE.tagline)}</p>
<p class="mail-footer-copy" style="margin:0 0 6px;font-family:${SANS};font-size:13px;line-height:1.8;color:#626262;"><a href="mailto:${contactEmail}" style="${footerLink}">${contactEmail}</a></p>
<p class="mail-footer-copy" style="margin:0 0 12px;font-family:${SANS};font-size:13px;line-height:1.8;color:#626262;"><a href="tel:${phoneE164}" style="${footerLink}">${phone}</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="https://wa.me/${phoneE164.replace("+", "")}" style="${footerLink}">WhatsApp</a></p>
<p class="mail-footer-copy mail-footer-links" style="margin:0 0 18px;font-family:${SANS};font-size:12px;line-height:2;color:#626262;"><a href="${site()}" style="${footerLink}">savotechnologies.com</a><br><a href="https://www.linkedin.com/company/savotechnologies/" style="${footerLink}">LinkedIn</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="https://www.instagram.com/savotechnologies/" style="${footerLink}">Instagram</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="https://www.facebook.com/savotechnologies" style="${footerLink}">Facebook</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="https://www.youtube.com/@savotechnologies" style="${footerLink}">YouTube</a></p>
<p class="mail-footer-copy" style="margin:0;font-family:${SANS};font-size:11px;line-height:1.8;color:#626262;">&copy; ${new Date().getFullYear()} ${esc(SITE.legalName)} &middot; Indore &middot; Zürich<br>${esc(opts.reason ?? "You are receiving this because you contacted Savo Technologies.")}${opts.unsubscribeEmail ? `<br><a href="${UNSUBSCRIBE_PLACEHOLDER}" style="${footerLink}">Unsubscribe</a>` : ""}</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}
