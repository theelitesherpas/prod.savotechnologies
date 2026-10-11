"use client";

import { type ReactNode, useRef, useState } from "react";
import { insightRichHtmlToText, isSafeInsightHref, sanitizeInsightRichHtml } from "@/lib/insight-rich-text";
import styles from "./rich-article-editor.module.css";

type LegacyBlock = { h?: unknown; p?: unknown; li?: unknown; html?: unknown };

function isAllowedLink(value: string) {
  return isSafeInsightHref(value) !== null;
}

function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function initialHtml(value: LegacyBlock[]) {
  const html = value.map((block) => {
    if (typeof block.html === "string") return sanitizeInsightRichHtml(block.html);
    if (typeof block.h === "string") return `<h2>${escapeText(block.h)}</h2>`;
    if (typeof block.p === "string") return `<p>${escapeText(block.p)}</p>`;
    if (Array.isArray(block.li)) {
      const items = block.li.filter((item): item is string => typeof item === "string");
      return items.length ? `<ul>${items.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ul>` : "";
    }
    return "";
  }).join("");
  return html || "<p><br></p>";
}

function ToolbarButton({
  label,
  title,
  onClick,
  children,
}: {
  label: string;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={styles.tool}
    >
      {children}
    </button>
  );
}

/** A visual rich-text authoring surface; saves a sanitized semantic HTML subset. */
export function RichArticleEditor({
  name,
  value,
  required,
}: {
  name: string;
  value: LegacyBlock[];
  required?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [initialHtmlForEditor] = useState(() => initialHtml(value));
  const [html, setHtml] = useState(initialHtmlForEditor);
  const [hasText, setHasText] = useState(() => !!insightRichHtmlToText(initialHtmlForEditor));
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  const rememberSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (editor && selection?.rangeCount && editor.contains(selection.anchorNode)) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const updateHtml = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = editor.innerHTML;
    setHtml(next);
    setHasText(editor.innerText.trim().length > 0);
    rememberSelection();
  };

  const command = (name: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (selectionRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }
    document.execCommand(name, false, value);
    updateHtml();
  };

  const applyLink = () => {
    const href = linkValue.trim();
    if (!isAllowedLink(href)) return;
    command("createLink", href);
    setLinkOpen(false);
    setLinkValue("");
  };

  return (
    <div className={styles.root}>
      <input
        type="hidden"
        name={name}
        value={hasText ? JSON.stringify([{ html }]) : "[]"}
      />
      <div className={styles.toolbar} role="toolbar" aria-label="Article formatting tools">
        <label className={styles.controlLabel}>
          <span className="sr-only">Block style</span>
          <select
            aria-label="Block style"
            defaultValue="p"
            onMouseDown={rememberSelection}
            onChange={(event) => command("formatBlock", `<${event.currentTarget.value}>`)}
            className={styles.select}
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="blockquote">Quote</option>
          </select>
        </label>
        <span className={styles.separator} aria-hidden="true" />
        <ToolbarButton label="Bold" title="Bold" onClick={() => command("bold")}><strong>B</strong></ToolbarButton>
        <ToolbarButton label="Italic" title="Italic" onClick={() => command("italic")}><em>I</em></ToolbarButton>
        <ToolbarButton label="Underline" title="Underline" onClick={() => command("underline")}><span className={styles.underlined}>U</span></ToolbarButton>
        <label className={styles.controlLabel}>
          <span className="sr-only">Text size</span>
          <select
            aria-label="Text size"
            defaultValue="3"
            onMouseDown={rememberSelection}
            onChange={(event) => command("fontSize", event.currentTarget.value)}
            className={styles.select}
          >
            <option value="2">Small text</option>
            <option value="3">Normal text</option>
            <option value="4">Large text</option>
            <option value="5">Extra large</option>
            <option value="6">Display text</option>
          </select>
        </label>
        <span className={styles.separator} aria-hidden="true" />
        <ToolbarButton label="Bulleted list" title="Bulleted list" onClick={() => command("insertUnorderedList")}>Bullets</ToolbarButton>
        <ToolbarButton label="Numbered list" title="Numbered list" onClick={() => command("insertOrderedList")}>Numbering</ToolbarButton>
        <ToolbarButton label="Add link" title="Add link" onClick={() => { rememberSelection(); setLinkOpen((open) => !open); }}>Link</ToolbarButton>
        <ToolbarButton label="Remove formatting" title="Remove formatting" onClick={() => command("removeFormat")}>Clear</ToolbarButton>
      </div>
      {linkOpen ? (
        <div className={styles.linkForm}>
          <label htmlFor={`${name}-link`}>Link URL</label>
          <input
            id={`${name}-link`}
            type="text"
            inputMode="url"
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="https://example.com"
            className={styles.linkInput}
          />
          <button type="button" disabled={!isAllowedLink(linkValue)} onMouseDown={(event) => event.preventDefault()} onClick={applyLink} className={styles.applyLink}>Apply link</button>
        </div>
      ) : null}
      <div
        id="insight-body-field"
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Article body rich-text editor"
        aria-multiline="true"
        aria-required={required || undefined}
        aria-describedby={`${name}-editor-help`}
        data-insight-rich-editor="true"
        data-empty={!hasText ? "true" : "false"}
        data-placeholder="Write your article here. Add headings, paragraphs, lists, and inline emphasis as you go."
        onInput={updateHtml}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onBlur={rememberSelection}
        dangerouslySetInnerHTML={{ __html: initialHtmlForEditor }}
        className={styles.editor}
      />
      <p id={`${name}-editor-help`} className={styles.help}>
        Select text to format it. Use the block menu for headings and quotes, and Enter to start a new paragraph.
      </p>
    </div>
  );
}
