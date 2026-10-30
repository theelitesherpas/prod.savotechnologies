import { attachmentSize } from "@/lib/mail/attachment-rules.mjs";
export type EmailAttachmentInfo = { id: string; filename: string; contentType: string; contentId?: string | null; size: number };
export function EmailAttachmentList({ files = [], notice }: { files?: EmailAttachmentInfo[]; notice?: string | null }) {
 if (!files.length && !notice) return null;
 return <section aria-label="Message attachments" className="mt-5 min-w-0 border-t border-border pt-4">
  <h3 className="text-sm font-semibold">Attachments{files.length ? ` (${files.length})` : ""}</h3>
  {notice ? <p role="status" className="mt-2 text-sm text-muted">{notice}</p> : null}
  {files.length ? <><ul className="mt-2 divide-y divide-border">{files.map(file => <li key={file.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-2"><div className="min-w-0 flex-1"><p className="break-all text-sm font-medium">{file.filename}</p><p className="t-caption text-muted">{attachmentSize(file.size)}</p></div><a href={`/api/admin/email-attachments/${file.id}`} download className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border px-3 text-sm font-semibold">Download<span className="sr-only"> {file.filename}</span></a></li>)}</ul><p className="t-caption mt-2 text-muted">Files are not virus-scanned. Download only documents you expect and scan them before opening.</p></> : null}
 </section>;
}
