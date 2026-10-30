"use client";
import { useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENT_BYTES, attachmentBatchProblem, attachmentSize, safeAttachmentName } from "@/lib/mail/attachment-rules.mjs";
export function EmailAttachmentPicker() {
 const id = useId(), input = useRef<HTMLInputElement>(null), { pending } = useFormStatus();
 const [files, setFiles] = useState<File[]>([]);
 const problem = attachmentBatchProblem(files), total = files.reduce((n, f) => n + f.size, 0);
 function change(next: File[]) { setFiles(next); input.current?.setCustomValidity(attachmentBatchProblem(next) || ""); }
 function remove(index: number) {
  if (!input.current) return;
  if (typeof DataTransfer === "undefined") { input.current.value = ""; change([]); return; }
  const next = files.filter((_, i) => i !== index), data = new DataTransfer(); for (const file of next) data.items.add(file); input.current.files = data.files; change(next);
 }
 return <section aria-label="Email attachments" className="min-w-0 space-y-3">
  <div><label htmlFor={id} className="adm-label mb-1.5 block">Attachments (optional)</label><p id={`${id}-help`} className="t-caption mb-3 text-muted">Up to 10 files, 10 MB total per email. PDF, Word, Excel, PowerPoint, TXT, CSV, PNG or JPEG. Choosing files again replaces the selection. Files are cleared when you switch modes/mailboxes or reload the page.</p>
   <input ref={input} id={id} type="file" name="attachments" multiple accept={ATTACHMENT_ACCEPT} disabled={pending} aria-describedby={`${id}-help ${id}-status`} aria-invalid={!!problem} className="block min-h-11 w-full min-w-0 rounded-lg border border-border p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-2 file:text-sm file:font-semibold file:text-background" onChange={e => change(Array.from(e.currentTarget.files || []))}/>
  </div>
  {files.length ? <ul className="divide-y divide-border">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex min-w-0 items-center gap-3 py-2"><div className="min-w-0 flex-1"><p className="break-all text-sm font-medium">{safeAttachmentName(file.name)}</p><p className="t-caption text-muted">{attachmentSize(file.size)}</p></div><button type="button" disabled={pending} className="min-h-11 shrink-0 px-2 text-sm font-semibold text-muted hover:text-foreground" aria-label={`Remove ${safeAttachmentName(file.name)}`} onClick={() => remove(index)}>Remove</button></li>)}</ul> : null}
  <p id={`${id}-status`} aria-live="polite" className={`t-caption ${problem ? "text-error" : "text-muted"}`}>{problem || (files.length ? `${files.length} selected · ${attachmentSize(total)} of ${attachmentSize(MAX_ATTACHMENT_BYTES)}` : "No attachments selected.")}</p>
 </section>;
}
