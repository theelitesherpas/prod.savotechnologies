import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONTACT_QUESTIONS } from "../src/sections/contact/contact-content";

vi.mock("../src/components/shared/callback-form", () => ({ CallbackForm: () => <form data-callback-form="true" /> }));
import { SiteFooter } from "../src/components/layout/site-footer";

const heading = "Prefer a call about your project?";

function callbackPanel() {
  const markup = renderToStaticMarkup(<SiteFooter contact={{ email: "hello@example.test", phone: "+91 0000000000", phoneE164: "+910000000000" }} />);
  const panel = markup.match(/<section[^>]*aria-labelledby="footer-callback-heading"[\s\S]*?<\/section>/)?.[0];
  expect(panel).toBeDefined();
  return panel!;
}

describe("Footer callback audience and guidance", () => {
  it("keeps callback guidance concise and focused on projects", () => {
    const panel = callbackPanel();
    expect(panel).toContain(`<h3 id="footer-callback-heading">${heading}</h3>`);
    expect(panel).toContain("Leave your number and country");
    expect(panel).toContain("discuss your project");
    expect(panel).not.toContain("For project and client enquiries only.");
    expect(panel).not.toContain("the goal, the scope and how we can help");
    expect(panel).not.toContain("Would you prefer a call?");
  });

  it("redirects career enquiries to the existing Careers page in one short note", () => {
    const panel = callbackPanel();
    expect(panel).toContain("For careers, visit our");
    expect(panel).toMatch(/<a[^>]*href="\/careers"[^>]*>Careers page<\/a>/);
    expect(panel.indexOf('href="/careers"')).toBeLessThan(panel.indexOf("<form"));
  });

  it("keeps the contact FAQ aligned with the footer heading and availability caveat", () => {
    const answer = CONTACT_QUESTIONS.find(item => item.q === "Can I call or message instead?")!.a;
    expect(answer).toContain(heading);
    expect(answer).toContain("project callback request");
    expect(answer).toContain("availability");
  });
});
