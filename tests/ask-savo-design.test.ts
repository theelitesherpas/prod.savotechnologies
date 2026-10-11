import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
import { AskSavoBar } from "../src/components/shared/ask-savo-bar";

const source = readFileSync("src/components/shared/ask-savo-bar.tsx", "utf8");
const css = readFileSync("src/components/shared/ask-savo-bar.module.css", "utf8");

describe("Ask Savo current-site drawer", () => {
  it("retains the shared dock, compact launcher and initially inert conversation", () => {
    const html = renderToStaticMarkup(React.createElement(AskSavoBar));
    expect(html).toContain('data-compact-assistant="true"');
    expect(html).toContain('data-open="false"');
    expect(html).toContain('aria-label="Open Savo Assistant"');
    expect(html).toContain('id="ask-savo-sheet" role="region" aria-label="Savo Assistant" inert=""');
    expect(html).toContain('aria-label="Minimize the Savo Assistant"');
    expect(html).toContain('aria-label="Start a new chat"');
    expect(html).toContain('aria-label="Close the Savo Assistant"');
    expect(html).toContain('id="ask-savo-input"');
    expect(html).toContain("Ask anything about Savo, or chat with us live");
  });
  it("uses homepage fonts, neutral surfaces and the existing red signal in every state", () => {
    expect(css).toContain("--background: #fff");
    expect(css).toContain("--foreground: #000");
    expect(css).toContain("--accent: #df2525");
    expect(css).toContain("font-family: var(--font-serif)");
    expect(css).toContain("font-family: var(--font-sans)");
    expect(css).toContain("background: #111");
    expect(css).toContain(".visitorMessage");
    expect(css).toContain(".assistantMessage");
    expect(css).toContain(".agentMessage");
    expect(css).toContain(".phoneFields { flex-direction: column; }");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("scrollbar-color:");
    expect(css).not.toContain("data-service-assistant");
    expect(source).not.toContain("backdrop-blur");
  });
  it("preserves the session, question, qualification, live stream and dismissal contracts", () => {
    for (const endpoint of ["/api/live-chat/session", "/api/live-chat/ask", "/api/live-chat/qualify", "/api/live-chat/message", "/api/live-chat/stream", "/api/live-chat/typing", "/api/live-chat/end", "/api/live-chat/end-request"]) expect(source).toContain(endpoint);
    for (const event of ["message.new", "status.changed", "typing", "end.requested"]) expect(source).toContain(event);
    expect(source).toContain('e.key === "Escape"');
    expect(source).toContain("contactProblem()");
    expect(source).toContain("consent: true");
    expect(source).toContain("data-lenis-prevent");
    expect(source).toContain('href="/privacy-policy"');
    expect(source).toContain("https://wa.me/917502901234");
    expect(source).toContain("This conversation has ended.");
    expect(source).toContain("Skip this question");
    expect(source).toContain("Savo specialist · live");
  });
});
