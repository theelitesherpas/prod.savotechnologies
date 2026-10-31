import "server-only";
import { createHash } from "node:crypto";
import { attachmentBatchProblem, validateAttachment, safeContentId, type MailAttachment } from "./attachment-rules.mjs";
export async function attachmentsFromForm(form: FormData): Promise<MailAttachment[]> {
 if (form.getAll("attachments").some(v => typeof v === "string")) throw Error("Attach files using the file picker, not a file path or URL.");
 // An unselected native input is an empty part with no filename. React's
 // Busboy decoder appends that Blob with an undefined filename: Node 22 calls
 // it "undefined", newer Node versions call it "blob". Neither is an upload.
 // Keep rejecting actual named empty documents and every nonempty file.
 const files = form.getAll("attachments").filter((v): v is File => typeof v !== "string" && !(v.size === 0 && (!v.name || (v.type === "application/octet-stream" && (v.name === "undefined" || v.name === "blob")))));
 const problem = attachmentBatchProblem(files); if (problem) throw Error(problem);
 const attachments: MailAttachment[] = [];
 for (const file of files) attachments.push(validateAttachment({ filename: file.name, content: new Uint8Array(await file.arrayBuffer()) }));
 return attachments;
}
export function attachmentRows(files: MailAttachment[]) {
 const problem = attachmentBatchProblem(files.map(f => ({ name: f.filename, size: f.size }))); if (problem) throw Error(problem);
 return files.map(f => { const checked = validateAttachment(f); return { filename: checked.filename, contentType: checked.contentType, ...(safeContentId(f.contentId) ? { contentId: safeContentId(f.contentId) } : {}), size: checked.size, data: Buffer.from(checked.content), sha256: createHash("sha256").update(checked.content).digest("hex") }; });
}
export const attachmentMetadataSelect = { id: true, filename: true, contentType: true, contentId: true, size: true } as const;
