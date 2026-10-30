"use client";
import { useState } from "react";
import type { EmailAttachmentInfo } from "./email-attachment-list";
/** Sender HTML stays inside an opaque-origin, script/form-disabled frame.
 * External images require explicit consent; CID image bytes are loaded through
 * the same authenticated download boundary and never embedded in list payloads. */
export function EmailMessageView({ html, text, originalText, quotedText, attachments = [], title = "Email preview" }: { html?: string | null; text?: string | null; originalText?: string | null; quotedText?: string | null; attachments?: EmailAttachmentInfo[]; title?: string }) {
 const [images, setImages] = useState<Record<string, string>>({}), [loaded, setLoaded] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState(false);
 async function showImages() {
  if (loading) return; setLoading(true); setError(false);
  try {
   const entries = await Promise.all(attachments.filter(a => a.contentId && ["image/png", "image/jpeg"].includes(a.contentType)).map(async a => {
    const response = await fetch(`/api/admin/email-attachments/${encodeURIComponent(a.id)}`, { cache: "no-store", signal: AbortSignal.timeout(20000) }); if (!response.ok) throw Error("Unavailable");
    const body = await response.arrayBuffer(); if (body.byteLength !== a.size || body.byteLength > 10_000_000) throw Error("Invalid image");
    const value = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(Error("Unreadable")); reader.readAsDataURL(new Blob([body], { type: a.contentType })); });
    return [a.contentId!, value] as const;
   }));
   setImages(Object.fromEntries(entries)); setLoaded(true);
  } catch { setError(true); }
  finally { setLoading(false); }
 }
 const source = html?.replace(/cid:([^\s"'<>\)]+)/gi, (match, raw: string) => { let cid = raw; try { cid = decodeURIComponent(raw); } catch { /* Preserve malformed references as unavailable. */ } return Object.prototype.hasOwnProperty.call(images, cid) ? images[cid] : match; });
 const csp = `default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:${loaded ? " https:" : ""}; base-uri 'none'; form-action 'none'`;
 const preview = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="referrer" content="no-referrer"><style>body{margin:16px;font:14px/1.6 Arial,sans-serif;overflow-wrap:anywhere}img{max-width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body>${source || ""}</body></html>`;
 return <div className="mt-4 min-w-0">
  {originalText ? <p className="t-caption mb-3 text-muted">Formatting repaired for an older message. The original stored text remains available below.</p> : null}
  {html ? <>
   {!loaded ? <div className="mb-3 flex flex-wrap items-center gap-2"><p className="t-caption min-w-0 flex-1 text-muted">Images are blocked for privacy. Loading remote images may notify the sender.</p><button type="button" disabled={loading} onClick={() => void showImages()} className="min-h-11 rounded-lg border border-border px-3 text-sm font-semibold">{loading ? "Loading images…" : "Load images"}</button></div> : null}
   {error ? <p role="status" className="t-caption mb-2 text-muted">Images could not be loaded. You can still read the email and download its attachments.</p> : null}
   <iframe title={title} sandbox="" srcDoc={preview} className="h-[46vh] min-h-64 w-full min-w-0 rounded-lg border border-border bg-white"/>
   {text ? <details className="mt-3"><summary className="t-caption min-h-11 cursor-pointer text-muted">View plain text</summary><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{text}</p></details> : null}
  </> : <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">{text || "(empty message)"}</p>}
  {quotedText ? <details className="mt-4 border-t border-border pt-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold text-muted">Previous correspondence</summary><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">{quotedText}</p></details> : null}
  {originalText ? <details className="mt-3"><summary className="t-caption min-h-11 cursor-pointer text-muted">View original stored text</summary><pre className="whitespace-pre-wrap break-words text-sm text-muted">{originalText}</pre></details> : null}
 </div>;
}
