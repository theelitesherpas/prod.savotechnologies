import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
const { testimonials } = vi.hoisted(() => ({ testimonials: vi.fn(async (): Promise<{ quote: string; name: string; role: string; video?: string; photo?: string }[]> => []) }));
vi.mock("../src/lib/content-items", () => ({ getManagedTestimonials: testimonials }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
import StartPage, { metadata } from "../src/app/(site)/start-a-project/page";
import { StartBrief, StartConfirmation } from "../src/sections/start/start-brief";
import { START_NEXT_STEPS, START_STEPS, START_TIMING_NOTE, emptyStartDraft, initialProjectType, optionalStartPhone, startDraftInput, startErrorStep, validateStartDraft, validateStartStep } from "../src/sections/start/start-content";
import { PROJECT_TYPES, BUDGET_RANGES, ENQUIRY_FIELD_LIMITS, enquirySchema } from "../src/schemas/enquiry";
const render = (element: React.ReactNode) => renderToStaticMarkup(element);
const valid = () => ({ ...emptyStartDraft(), name: "Test Person", email: "test@example.test", projectType: "Website", message: "We need a website for a test project." });
const source = readFileSync("src/sections/start/start-brief.tsx", "utf8");

describe("Detailed project-start flow in the approved Savo world", () => {
  it("preserves title and canonical without a fabricated completion-time or delivery guarantee in metadata", () => { expect(metadata.title).toBe("Start a Project"); expect(metadata.alternates).toEqual({ canonical: "/start-a-project" }); expect(metadata.description).toContain("three-step brief"); expect(metadata.description).not.toMatch(/two minutes|one business day/); });
  it("retains the async App Router query and honest WebPage/Breadcrumb schema", async () => { const html = render(await StartPage({ searchParams: Promise.resolve({ type: "AI Automation" }) })); expect(html).toContain('data-start-page="detailed-project-brief"'); expect((html.match(/<h1 /g) ?? [])).toHaveLength(1); const graph = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1]); expect(graph["@graph"].map((node: { "@type": string }) => node["@type"])).toEqual(["WebPage", "BreadcrumbList"]); expect(graph["@graph"][0].description).toBe(metadata.description); });
  it("reuses the homepage testimonial component with actual Published content, without demo endorsements", async () => {
    testimonials.mockResolvedValueOnce([{ name: "Test-only client", role: "Test-only role", quote: "Test-only approved quote", video: "/test-only.mp4", photo: "/test-only.webp" }]);
    const html = render(await StartPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("data-start-testimonials");
    expect(html).toContain('data-home-section="proof"');
    expect(html).toContain('src="/test-only.mp4"');
    expect(html).toContain('poster="/test-only.webp"');
    expect(html).toContain('aria-label="Video testimonial from Test-only client"');
    expect(html).toContain('controls=""');
    expect(html).toContain('playsInline=""');
    expect(html).not.toContain('autoPlay=');
    expect(html).toContain("Test-only client");
    expect(html).not.toContain("Design preview");
    expect(html).not.toContain("Client Name");
    expect(html.indexOf("data-start-testimonials")).toBeGreaterThan(html.indexOf('id="brief"'));
    expect(html.indexOf("data-start-testimonials")).toBeLessThan(html.indexOf('id="next"'));
    const empty = render(await StartPage({ searchParams: Promise.resolve({}) }));
    expect(empty).toContain("No approved stories are published yet.");
    expect(empty).not.toContain("<video");
  });
  it("accepts all thirteen original targeted project types and rejects unexpected query shapes", () => { expect(PROJECT_TYPES).toHaveLength(13); for (const type of PROJECT_TYPES) { expect(initialProjectType(type)).toBe(type); expect(emptyStartDraft(type).projectType).toBe(type); } for (const value of [undefined, null, "Bogus", "website", ["Website"], "<script>alert(1)</script>"]) expect(initialProjectType(value)).toBeUndefined(); });
  it("starts with no fabricated contact, price or message values", () => { expect(Object.values(emptyStartDraft()).every(value => value === "")).toBe(true); expect(emptyStartDraft("Other").projectType).toBe("Other"); });
  it("keeps the original three stages and renders only the first stage initially", () => { expect(START_STEPS).toEqual(["You", "The project", "Review"]); const html = render(React.createElement(StartBrief)); expect(html).toContain('data-start-step="0"'); expect(html).toContain('aria-current="step"'); expect(html).toContain("Your details."); expect(html).not.toContain('id="sb-message"'); expect(html).not.toMatch(/<button[^>]*>Send the brief/); });
  it("puts an encouraging brief workspace directly after a compact introduction", async () => {
    const html = render(await StartPage({ searchParams: Promise.resolve({}) }));
    for (const copy of ["You don’t need a finished plan.", "Start with what you know.", "Review everything before sending.", "No commitment at this stage.", "Your details are sent only when you choose ‘Send the brief’.", "Step 1 of 3", "Email address", "Before you share"]) expect(html).toContain(copy);
    expect(html).toMatch(/<summary>Before you share<\/summary>/);
    expect(html.indexOf('id="brief"')).toBeLessThan(html.indexOf('id="next"'));
    expect(html).not.toMatch(/two minutes|100% secure|trusted by/i);
    expect(html).toContain("not a guaranteed schedule");
  });
  it("offers meaningful project guidance without making optional details mandatory", () => {
    for (const copy of ["Share the idea in your own words.", "It’s okay if some details are still taking shape.", "You can leave this blank if you’re still exploring.", "Make sure it feels right.", "Nothing sent yet", "At least 20 characters."]) expect(source).toContain(copy);
    expect(source).toContain('aria-describedby={describedBy}');
    const html = render(React.createElement(StartBrief));
    expect(html).toMatch(/id="sb-email"[^>]*required=""/);
    expect(html).not.toMatch(/id="sb-company"[^>]*required=""/);
  });
  it("gates submission and navigation until hydration with an email fallback", () => { const html = render(React.createElement(StartBrief)); expect(html).toMatch(/<fieldset class="[^"]*stepBody[^"]*" disabled=""/); expect(html).toContain("<noscript>"); expect(html).toContain("email us directly"); expect(html).toContain("Enable JavaScript"); expect(html).not.toContain("method=\"post\""); });
  it("enforces contact/name/email/company limits without prematurely requiring project details", () => { expect(validateStartStep({ ...emptyStartDraft(), name: "Test Person", email: "test@example.test" }, 0)).toEqual({}); expect(validateStartStep(emptyStartDraft(), 0)).toHaveProperty("name"); expect(validateStartStep({ ...valid(), company: "x".repeat(121) }, 0)).toHaveProperty("company"); expect(validateStartStep({ ...valid(), name: "x".repeat(81) }, 0)).toHaveProperty("name"); expect(validateStartStep({ ...valid(), email: "bad" }, 0)).toHaveProperty("email"); });
  it("requires type and a meaningful project message, preserving optional budgets", () => { expect(validateStartStep(emptyStartDraft(), 1)).toHaveProperty("projectType"); expect(validateStartStep(emptyStartDraft(), 1)).toHaveProperty("message"); expect(validateStartStep(valid(), 1)).toEqual({}); for (const budget of ["", ...BUDGET_RANGES]) expect(validateStartStep({ ...valid(), budget }, 1)).toEqual({}); expect(validateStartStep({ ...valid(), budget: "fabricated budget" }, 1)).toHaveProperty("budget"); expect(validateStartStep({ ...valid(), message: "x".repeat(4001) }, 1)).toHaveProperty("message"); });
  it("treats selecting a country without digits as an empty optional phone", () => { for (const dial of ["+91", "+41", "+1"]) expect(optionalStartPhone(dial)).toBe(""); expect(startDraftInput({ ...valid(), phone: "+91" }).phone).toBe(""); expect(validateStartStep({ ...valid(), phone: "+91" }, 0)).toEqual({}); expect(optionalStartPhone("+919876543210")).toBe("+919876543210"); });
  it("blocks a partially entered country-aware phone, beyond the shared loose schema", () => { const draft = { ...valid(), phone: "+9198765" }; expect(enquirySchema.safeParse(draft).success).toBe(true); expect(validateStartDraft(draft, false)).toHaveProperty("phone"); expect(validateStartStep(draft, 0, false)).toHaveProperty("phone"); expect(validateStartDraft(valid(), false)).toEqual({}); });
  it("revalidates the complete draft before submit and normalises using the shared schema", () => { expect(validateStartDraft({ ...valid(), name: "", budget: "invalid" })).toHaveProperty("name"); expect(validateStartDraft({ ...valid(), name: "", budget: "invalid" })).toHaveProperty("budget"); const parsed = enquirySchema.parse(startDraftInput({ ...valid(), name: " Test Person ", email: "TEST@EXAMPLE.TEST", phone: "+91" })); expect(parsed.name).toBe("Test Person"); expect(parsed.email).toBe("test@example.test"); expect(parsed.phone).toBe(""); });
  it("routes errors to the correct visible stage", () => { expect(startErrorStep({ company: "error" })).toBe(0); expect(startErrorStep({ message: "error" })).toBe(1); expect(startErrorStep({ budget: "error" })).toBe(1); expect(startErrorStep({ name: "error", message: "error" })).toBe(0); expect(startErrorStep({ website: "error" })).toBe(2); });
  it("preserves original six budget choices, shared pipeline, honeypot, CAPTCHA and analytics", () => { expect(BUDGET_RANGES).toHaveLength(6); for (const value of ['withBasePath("/api/enquiries")', 'source: "start-page"', "captchaToken: captcha.token", "captchaBlocked(captcha)", "<CaptchaGate", "<PhoneField", 'name="website"', "enquiry_form_start", "enquiry_form_submit", "enquiry_form_success", "enquiry_form_error"]) expect(source).toContain(value); expect(source).not.toMatch(/localStorage|sessionStorage|\/api\/callbacks/); });
  it("prevents duplicate sends, honours Enter advancement and preserves drafts on retry", () => { expect(source).toContain("submittingRef.current = true"); expect(source).toContain("if (step < 2) { next(); return; }"); expect(source).toContain("json.ok === true"); expect(source).toContain("Your brief is still here"); expect(source).toContain("response.status === 400"); expect(source).toContain("showErrors(json.fieldErrors)"); });
  it("uses real radios, explicit budget clearing and uniquely labelled edit jumps", () => { expect(source).toContain('type="radio"'); expect(source).toContain("options={PROJECT_TYPES}"); expect(source).toContain("options={BUDGET_RANGES}"); expect(source).toContain("Clear budget selection"); expect(source).toContain("aria-label={`Edit ${label.toLowerCase()}`}"); expect(source).toContain('moveTo(1, "message")'); expect(source).toContain('querySelector<HTMLInputElement>(`input[name="${field}"]:checked`) ??'); });
  it("matches native input length, errors and hint semantics to the shared limits", () => { const html = render(React.createElement(StartBrief)); for (const field of ["name", "email", "company"] as const) expect(html).toContain(`maxLength="${ENQUIRY_FIELD_LIMITS[field]}"`); expect(source).toContain('"aria-describedby"'); expect(source).toContain("draft[name].length"); });
  it("retains the original engineer/scoping/proposal sequence with visible timing qualifications", async () => { expect(START_NEXT_STEPS).toHaveLength(3); expect(START_NEXT_STEPS[0].when).toBe("Within one business day"); expect(START_NEXT_STEPS[1].title).toBe("A free 30-minute scoping call"); const html = render(await StartPage({ searchParams: Promise.resolve({}) })); expect(html).toContain(START_TIMING_NOTE); expect(html).toContain("NDA before sending anything sensitive"); });
  it("does not add proof, a pretend attachment, a modal close or a confirmation-email guarantee", async () => { const html = render(await StartPage({ searchParams: Promise.resolve({}) })); expect(html).not.toMatch(/data-closing-cta|ISO certified|SOC 2 certified|120\+|download=|confirmation is on its way/); expect(source).not.toContain("SuccessDialog"); expect(source).toContain("Your project enquiry has been received."); });
  it("uses a polished project receipt with separate navigation buttons and no delivery promises", () => {
    const html = render(React.createElement(StartConfirmation, { email: "test@example.test", onRestart: () => {} }));
    expect(html).toContain("Thank you for sharing your vision.");
    expect(html).toContain("Your project enquiry has been received.");
    expect(html).toContain("test@example.test");
    expect(html).toContain('role="status"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('aria-label="After submitting your project"');
    expect(html.match(/<nav[\s\S]*?<\/nav>/)?.[0].match(/<a /g)).toHaveLength(3);
    for (const [href, label] of [["mailto:hello@savotechnologies.com", "Email our team"], ["/case-studies", "Explore our work"], ["/services", "Explore services"]]) {
      expect(html).toContain(`href="${href}"`);
      expect(html).toContain(label);
    }
    expect(html).toContain("Start another project");
    expect(html).not.toMatch(/brief|Want to add something|confirmation email|guaranteed|24 hours/i);
  });
  it("escapes dynamic receipt data and retains the existing reset/focus behavior", () => {
    const html = render(React.createElement(StartConfirmation, { email: "<test>@example.test", onRestart: () => {} }));
    expect(html).toContain("&lt;test&gt;@example.test");
    expect(html).not.toContain("<test>");
    expect(source).toContain("email={draft.email} noticeRef={noticeRef}");
    expect(source).toContain("setDraft(emptyStartDraft(initialType))");
    expect(source).toContain('focusField("name")');
    expect(source).toContain("response.ok && json.ok === true");
  });
  it("suppresses automatic popups on task-focused pages while leaving manual and explicit opens intact", () => { const provider = readFileSync("src/components/shared/project-lead-modal.tsx", "utf8"); expect(provider).toContain('if (!forced && isAutomaticProjectLeadModalExcludedPath(taskPath)) return;'); expect(provider).toContain('if (!forced && taskPath === withBasePath("/start-a-project")) return;'); expect(provider).toContain('if (forced) {'); expect(provider).toContain('const openModal = useCallback'); });
  it("uses scoped approved typography, accessible controls and a reduced-motion fallback", () => { const css = readFileSync("src/sections/start/start.module.css", "utf8"); for (const value of ["var(--font-serif)", "var(--font-sans)", "#df2525", "#b82222", "#f7f7f7", "1280px", "min-height:52px", "min-height:44px", "#949494", "prefers-reduced-motion:reduce"]) expect(css).toContain(value); expect(css).not.toMatch(/infinite|linear-gradient|#f7f5f0|#d9480f/i); expect(readFileSync("src/components/layout/site-header.tsx", "utf8")).toContain("/^\\/start-a-project\\/?$/.test(pathname)"); });
});
