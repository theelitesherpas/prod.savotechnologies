import { describe, expect, it } from "vitest";
import { addInsightHeadingIds, insightRichHtmlToText, sanitizeInsightRichHtml } from "../src/lib/insight-rich-text";

describe("Insights rich-text safety and structure", () => {
  it("keeps semantic formatting and strips executable markup and styling", () => {
    const safe = sanitizeInsightRichHtml('<h2 onclick="run()">A clear <strong>heading</strong></h2><p style="color:red">Plain <em>emphasis</em><script>alert(1)</script></p>');
    expect(safe).toBe("<h2>A clear <strong>heading</strong></h2><p>Plain <em>emphasis</em></p>");
    expect(safe).not.toMatch(/onclick|style=|script|alert/);
  });

  it("allows only safe article links and maps chosen sizes to fixed classes", () => {
    const safe = sanitizeInsightRichHtml('<p><a href="https://example.com/a?x=1&amp;y=2" onclick="run()">source</a> <a href="javascript:alert(1)">unsafe</a> <font size="5">large</font></p>');
    expect(safe).toContain('<a href="https://example.com/a?x=1&amp;y=2">source</a>');
    expect(safe).toContain("<a>unsafe</a>");
    expect(safe).toContain('<span class="insight-size-large">large</span>');
    expect(safe).not.toContain("javascript:");
  });

  it("extracts readable text and adds stable TOC anchors to nested heading levels", () => {
    const html = sanitizeInsightRichHtml("<h2>First &amp; foremost</h2><p>Text<br>continues</p><h3>Second</h3>");
    expect(insightRichHtmlToText(html)).toBe("First & foremost Text continues Second");
    expect(addInsightHeadingIds(html, 4)).toMatchObject({
      headings: [
        { title: "First & foremost", id: "article-section-4" },
        { title: "Second", id: "article-section-5" },
      ],
      nextIndex: 6,
    });
  });
});
