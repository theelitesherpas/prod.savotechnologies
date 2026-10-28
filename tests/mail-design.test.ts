import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { TEMPLATE_REGISTRY, templateEntry, bodyToHtml } from "@/lib/mail/registry";
import { shell, p, spec, prose, highlight, UNSUBSCRIBE_PLACEHOLDER } from "@/lib/mail/templates";
import baseline from "./fixtures/mail-copy-baseline.json";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-08T12:00:00Z"));
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", process.env.MAIL_PREVIEW_ORIGIN || "http://localhost:3000");
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("Savo v7 correspondence", () => {
  it.each(TEMPLATE_REGISTRY.map(entry => [entry.key, entry] as const))("%s uses the shared website identity with a contact-free footer", (_key, entry) => {
    const mail = entry.default({ ...entry.vars, __to: "preview@example.invalid" });
    expect(mail.html).toContain("Savo v7 correspondence");
    expect(mail.html).toContain("'Outfit', Arial, Helvetica, sans-serif");
    expect(mail.html).toContain("'Inter', Arial, Helvetica, sans-serif");
    expect(mail.html).toContain("#b82222");
    if (mail.html.includes('mail-button-primary')) expect(mail.html).toContain("#df2525");
    expect(mail.html).toContain('content="light dark"');
    expect(mail.html).toContain('@media (prefers-color-scheme:dark)');
    expect(mail.html).toContain('[data-ogsc] .mail-canvas');
    expect(mail.html).toContain('/images/email/logo-lockup-v2.png');
    expect(mail.html).not.toContain('/images/email/logo.png');
    expect(mail.html).toContain("#ffffff");
    expect(mail.html).toContain("#000000");
    expect(mail.html).toContain("#f7f7f7");
    expect(mail.html).not.toMatch(/Source Serif|Manrope|Fragment Mono|#d9480f|#f5f4f0|#faf4ee|#14161c/);
    expect(mail.html).toContain("<!--[if mso]>");
    expect(mail.html).toContain("width=\"600\"");
    expect(mail.html).not.toMatch(/<table(?![^>]*role="presentation")/);
    const header = mail.html.match(/<td class="mail-header"[\s\S]*?<\/table><\/td><\/tr>/)?.[0];
    expect(header, "shared email masthead exists").toBeDefined();
    expect(header).toMatch(/<td width="110" valign="middle"><a[^>]*width:110px;/);
    expect(header).toMatch(/<img [^>]*width="110" height="60"[^>]*width:110px;height:60px;/);
    expect(header).not.toContain("@");
    expect(mail.html).not.toContain("mail-header-address");
    expect(mail.html).not.toContain("mailto:");
    expect(mail.html).not.toContain("tel:+");
    expect(mail.html).not.toContain("Reply to this email to reach our team");
    const footer = mail.html.slice(mail.html.indexOf('class="mail-footer"'));
    expect(footer).not.toContain("wa.me/");
    expect(footer).not.toContain("mailto:");
    expect(Buffer.byteLength(mail.html)).toBeLessThan(100000); // Gmail clipping threshold headroom.
  });

  it("preserves original subjects and body copy apart from requested client greetings", () => {
    for (const [key, hash] of Object.entries(baseline)) {
      const entry = templateEntry(key);
      expect(entry, key).toBeDefined();
      const mail = entry!.default(entry!.vars);
      // Only fixture reference data changed; keep the approved copy baseline.
      // Honorific-aware greetings are the only intended copy change.
      const text = key === "clientWelcome"
        ? mail.text.replace(/^Hello ([^\n]+),\n\n/, (_match, name: string) => `${name.toUpperCase()}, `)
        : entry!.recipient === "client" ? mail.text.replace(/^Hello [^\n]+,\n\n/, "") : mail.text;
      const copy = `${mail.subject}\n${text}`;
      const normalized = ["invoiceIssued", "invoicePaid", "invoiceOverdue"].includes(key) ? copy.replaceAll("STPLIN05148", "SAVO-2026-014") : copy;
      expect(createHash("sha256").update(normalized).digest("hex"), key).toBe(hash);
    }
  });

  it("includes the previously unlisted meeting-reschedule template for review/composition", () => {
    const entry = templateEntry("meetingRescheduleRequest")!;
    const mail = entry.default(entry.vars);
    expect(entry.category).toBe("meetings");
    expect(mail.html).toContain(entry.vars.reference);
    expect(mail.html).toContain(entry.vars.schedulingLink);
    expect(mail.text).toContain(entry.vars.previousDate);
  });

  it("keeps escaped, readable references, headings, preheaders and signatures", () => {
    const html = shell({ preheader: "<private>", heading: "R&D <review>", ref: 'REF-"1"', bodyHtml: p("Hello"), signature: { name: "A & B", title: "Lead <Engineer>", company: "R&D", tagline: "Build <carefully>" } });
    expect(html).toContain("R&amp;D &lt;review&gt;");
    expect(html).toContain("REF-&quot;1&quot;");
    expect(html).toContain("A &amp; B");
    expect(html).toContain("Lead &lt;Engineer&gt;");
    expect(html).not.toContain("<private>");
    expect(html).toContain("mso-hide:all");
  });

  it("escapes values, preserves line breaks and omits genuinely empty records", () => {
    expect(spec([["Empty", undefined], ["Blank", ""]])).toBe("");
    const html = spec([["Company", 'R&D <script>"name"'], ["Message", "First\nSecond"]]);
    expect(html).toContain("R&amp;D &lt;script&gt;&quot;name&quot;");
    expect(html).toContain("First<br>Second");
    expect(html).not.toContain("<script>");
    expect(prose("<img src=x>\nSecond line")).toContain("&lt;img src=x&gt;<br>Second line");
    expect(highlight("<strong>Note</strong>")).toContain("<strong>Note</strong>");
  });

  it("keeps preview unsubscribe links unsigned and safely escapes CTA query strings", () => {
    const html = shell({ preheader: "Preview", heading: "Preview", bodyHtml: "Test", unsubscribeEmail: "preview@example.invalid", cta: { href: "https://example.invalid/?a=1&b=2", label: "Open & review" } });
    expect(html).toContain(UNSUBSCRIBE_PLACEHOLDER);
    expect(html).not.toContain("sig=");
    expect(html).toContain('href="https://example.invalid/?a=1&amp;b=2"');
    expect(html).toContain("Open &amp; review");
  });

  it("uses existing public wordmark and fonts, with no dependency on remote providers", () => {
    for (const path of ["images/email/logo.png", "fonts/outfit/Outfit-VariableFont_wght.ttf", "fonts/inter/Inter-VariableFont_opsz,wght.ttf", "fonts/inter/Inter-Italic-VariableFont_opsz,wght.ttf"]) expect(existsSync(`public/${path}`), path).toBe(true);
    const html = shell({ preheader: "Preview", heading: "Preview", bodyHtml: bodyToHtml("First paragraph\n\nSecond paragraph") });
    expect(html).not.toMatch(/fonts.googleapis|fonts.gstatic/);
    expect(html).toContain("max-width:600px");
    expect(html).toContain("max-width:480px");
    expect(html).toContain("mail-pitch-cell");
  });

  it("ships a self-contained opaque logo, not dark text on transparency", async () => {
    const image = sharp("public/images/email/logo-lockup-v2.png");
    const metadata = await image.metadata();
    expect(metadata.hasAlpha).toBe(false);
    expect(metadata.width).toBe(396);
    expect(metadata.height).toBe(216);
    const { data } = await image.raw().toBuffer({ resolveWithObject: true });
    // Actual pixels hold both foreground and ground; CSS inversion cannot
    // remove the contrast by changing the surrounding HTML background.
    expect(data.some(value => value === 255)).toBe(true);
    expect(data[0]).toBe(21);
  });

  it("exports sample-only browser fixtures from the actual renderers without sending anything", () => {
    const folder = "tmp/mail-redesign/fixtures";
    mkdirSync(folder, { recursive: true });
    const rows = TEMPLATE_REGISTRY.map(entry => {
      const mail = entry.default({ ...entry.vars, __to: "preview@example.invalid" });
      expect(mail.html).toContain(`${process.env.NEXT_PUBLIC_SITE_URL}/images/email/logo-lockup-v2.png`);
      writeFileSync(`${folder}/${entry.key}.html`, mail.html);
      return { key: entry.key, label: entry.label, dept: entry.dept, subject: mail.subject };
    });
    // Additional email-client edge cases are fixtures, not real email sends.
    writeFileSync(`${folder}/long-values.html`, shell({ preheader: "Synthetic layout test", heading: "A deliberately long heading for a narrow inbox and a readable record", bodyHtml: spec([["Email", `${"verylong".repeat(12)}@example.invalid`], ["URL", `https://example.invalid/${"path".repeat(40)}`], ["Message", "A very long project name ".repeat(12)]]) + prose("Line one\n\nLine three"), cta: { href: "https://example.invalid", label: "Review this longer action label" } }));
    writeFileSync(`${folder}/custom-hr.html`, shell({ preheader: "Custom HR email", heading: "Joining information", dept: "hr", bodyHtml: bodyToHtml("Hello {{employeeName}},\n\nPlease review your joining details.") }));
    writeFileSync("tmp/mail-redesign/templates.json", JSON.stringify(rows, null, 2));
    const route = readFileSync("src/app/email-preview/page.tsx", "utf8");
    expect(route).not.toMatch(/prisma|sendMail|requireAdmin|from ["']@\/lib\/mail["']/);
    expect(route).toContain('process.env.NODE_ENV !== "development"');
  });
});
