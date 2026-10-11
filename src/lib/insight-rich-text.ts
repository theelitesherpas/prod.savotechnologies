const ALLOWED_TAGS = new Set([
  "p", "h2", "h3", "h4", "blockquote", "ul", "ol", "li",
  "strong", "b", "em", "i", "u", "s", "del", "sub", "sup", "a", "span", "br",
]);
const DROP_CONTENT_TAGS = new Set(["script", "style", "iframe", "object", "embed", "svg", "math"]);
const SIZE_CLASSES = new Set(["insight-size-small", "insight-size-medium", "insight-size-large", "insight-size-xlarge"]);
const FONT_SIZES: Record<string, string | undefined> = {
  "1": "insight-size-small",
  "2": "insight-size-small",
  "3": undefined,
  "4": "insight-size-medium",
  "5": "insight-size-large",
  "6": "insight-size-xlarge",
  "7": "insight-size-xlarge",
};

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function decodeText(value: string) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

export function isSafeInsightHref(raw: string) {
  const href = decodeText(raw).trim();
  return /^(?:https?:\/\/|mailto:|\/(?!\/|\\))[^\s<>]*$/i.test(href) ? href : null;
}

/**
 * A narrow, dependency-free sanitizer for the Insights rich-text subset.
 * It strips attributes by default, allows only semantic formatting, and
 * drops executable/embed content before it reaches dangerouslySetInnerHTML.
 */
export function sanitizeInsightRichHtml(input: string): string {
  const tokens = input.match(/<!--[\s\S]*?-->|<\/?[a-z][^>]*>|[^<]+|</gi) ?? [];
  const output: string[] = [];
  const stack: string[] = [];
  const dropping: string[] = [];

  for (const token of tokens) {
    if (token.startsWith("<!--")) continue;
    const match = /^<\s*(\/?)\s*([a-z][a-z0-9-]*)\b([^>]*)>$/i.exec(token);
    if (!match) {
      if (!dropping.length) output.push(token === "<" ? "&lt;" : token);
      continue;
    }

    const closing = !!match[1];
    const sourceTag = match[2].toLowerCase();
    const attributes = match[3];
    const selfClosing = /\/\s*$/.test(attributes);

    if (dropping.length) {
      if (DROP_CONTENT_TAGS.has(sourceTag) && !closing && !selfClosing) dropping.push(sourceTag);
      else if (closing && sourceTag === dropping[dropping.length - 1]) dropping.pop();
      continue;
    }
    if (DROP_CONTENT_TAGS.has(sourceTag)) {
      if (!closing && !selfClosing) dropping.push(sourceTag);
      continue;
    }

    const tag = sourceTag === "div" ? "p"
      : sourceTag === "b" ? "strong"
      : sourceTag === "i" ? "em"
      : sourceTag === "del" ? "s"
      : sourceTag === "font" ? "span"
      : sourceTag;
    if (!ALLOWED_TAGS.has(tag)) continue;

    if (closing) {
      if (tag === "br") continue;
      const index = stack.lastIndexOf(tag);
      if (index < 0) continue;
      while (stack.length > index) output.push(`</${stack.pop()!}>`);
      continue;
    }

    if (tag === "br") {
      output.push("<br>");
      continue;
    }

    let safeAttributes = "";
    if (tag === "a") {
      const hrefMatch = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attributes);
      const href = hrefMatch ? isSafeInsightHref(hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? "") : null;
      if (href) safeAttributes = ` href="${escapeAttribute(href)}"`;
    } else if (tag === "span") {
      const sizeMatch = sourceTag === "font"
        ? /\bsize\s*=\s*["']?([1-7])["']?/i.exec(attributes)
        : /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attributes);
      const sizeClass = sourceTag === "font"
        ? FONT_SIZES[sizeMatch?.[1] ?? ""]
        : (sizeMatch?.[1] ?? sizeMatch?.[2] ?? "").split(/\s+/).find((name) => SIZE_CLASSES.has(name));
      if (sizeClass) safeAttributes = ` class="${sizeClass}"`;
    }

    output.push(`<${tag}${safeAttributes}>`);
    if (!selfClosing) stack.push(tag);
  }

  while (stack.length) output.push(`</${stack.pop()!}>`);
  return output.join("").trim();
}

/** Safe readable text used for required-field checks and table-of-contents labels. */
export function insightRichHtmlToText(input: string): string {
  return decodeText(sanitizeInsightRichHtml(input).replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Adds stable in-page anchors to already-sanitized authored headings. */
export function addInsightHeadingIds(html: string, startAt: number, idPrefix = "article-section-") {
  const headings: { title: string; id: string }[] = [];
  let index = startAt;
  const renderedHtml = html.replace(/<(h[2-4])>([\s\S]*?)<\/\1>/gi, (_whole, tag: string, inner: string) => {
    const id = `${idPrefix}${index++}`;
    const title = insightRichHtmlToText(inner);
    if (title) headings.push({ title, id });
    return `<${tag.toLowerCase()} id="${id}">${inner}</${tag.toLowerCase()}>`;
  });
  return { html: renderedHtml, headings, nextIndex: index };
}
