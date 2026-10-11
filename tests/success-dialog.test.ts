import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

vi.mock("react", async (original) => ({
  ...await original<typeof React>(),
  useSyncExternalStore: () => true,
}));
vi.mock("react-dom", () => ({ createPortal: (children: React.ReactNode) => children }));
import { SuccessDialog } from "../src/components/shared/success-dialog";
import { CAREERS_EMAIL, HIRING_STEPS } from "../src/constants/careers";

function renderDialog(overrides: Partial<React.ComponentProps<typeof SuccessDialog>> = {}) {
  vi.stubGlobal("document", { body: {} });
  const { children = "Thank you, Test. Your application has been submitted to Savo. The next steps depend on the role and the fit.", ...props } = overrides;
  const dialogProps: React.ComponentProps<typeof SuccessDialog> = {
    children,
    open: true,
    onClose: () => {},
    eyebrow: "Application · AI / ML Engineer",
    title: "Application received.",
    email: "test.applicant@example.com",
    steps: HIRING_STEPS.slice(0, 3),
    contactEmail: CAREERS_EMAIL,
    ...props,
  };
  return renderToStaticMarkup(React.createElement(SuccessDialog, dialogProps));
}

describe("Career submission confirmation styling", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("preserves the exact receipt, dynamic role/email, and hiring steps", () => {
    const html = renderDialog();
    expect(html).toContain("Application · AI / ML Engineer");
    expect(html).toContain("Application received.");
    expect(html).toContain("Thank you, Test. Your application has been submitted to Savo. The next steps depend on the role and the fit.");
    expect(html).toContain("A confirmation is on its way to");
    expect(html).toContain("test.applicant@example.com");
    for (const step of HIRING_STEPS.slice(0, 3)) {
      expect(html).toContain(step.step);
      expect(html).toContain(step.title);
      expect(html).toContain(step.text);
    }
    expect(html).toContain(`href="mailto:${CAREERS_EMAIL}"`);
    expect(html).toContain("Questions meanwhile?");
    expect(html).toContain(">Done</button>");
    expect(html).toContain('role="dialog" aria-modal="true" aria-labelledby="success-title"');
  });
  it("preserves optional content and the inert closed state", () => {
    const html = renderDialog({ open: false, email: undefined, contactEmail: undefined, steps: [], primaryLabel: "Close" });
    expect(html).toContain('inert=""');
    expect(html).not.toContain("A confirmation is on its way to");
    expect(html).not.toContain("Questions meanwhile?");
    expect(html).not.toContain("<ol");
    expect(html).toContain(">Close</button>");
  });
  it("uses scoped current-site typography, surfaces, and red rather than legacy theme helpers", () => {
    const source = readFileSync("src/components/shared/success-dialog.tsx", "utf8");
    const css = readFileSync("src/components/shared/success-dialog.module.css", "utf8");
    expect(source).not.toMatch(/t-label|t-h2|font-mono|var\(--success\)|bg-background/);
    expect(css).toContain("--receipt-background: #fff");
    expect(css).toContain("--receipt-accent: #df2525");
    expect(css).toContain("font-family: var(--font-serif)");
    expect(css).toContain("font-family: var(--font-sans)");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(source).toContain('e.key === "Escape"');
    expect(source).toContain('e.key === "Tab"');
    expect(source).toContain("lockScroll(true)");
  });
});
