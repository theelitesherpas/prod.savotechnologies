import { expect, it } from "vitest";
import { attachmentBatchProblem, validateAttachment, safeAttachmentName, MAX_ATTACHMENT_BYTES } from "@/lib/mail/attachment-rules.mjs";
const pdf = (size=10) => { const b=Buffer.alloc(size,32); b.write('%PDF-1.7'); return b; };
it("permits the exact decimal 10 MB boundary, rejects one byte more and aggregate overflow", () => {
 expect(validateAttachment({filename:'report.pdf',content:pdf(MAX_ATTACHMENT_BYTES)}).size).toBe(MAX_ATTACHMENT_BYTES);
 expect(attachmentBatchProblem([{name:'report.pdf',size:MAX_ATTACHMENT_BYTES+1}])).toContain('10 MB');
 expect(attachmentBatchProblem([{name:'a.pdf',size:6_000_000},{name:'b.pdf',size:4_000_001}])).toContain('10 MB');
});
it("accepts multiple documents within the combined budget but rejects too many/empty files", () => {
 expect(attachmentBatchProblem([{name:'a.pdf',size:6_000_000},{name:'b.pdf',size:4_000_000}])).toBeNull();
 expect(attachmentBatchProblem(Array.from({length:11},()=>({name:'a.pdf',size:10})))).toContain('10 files');
 expect(attachmentBatchProblem([{name:'empty.pdf',size:0}])).toContain('empty');
});
it.each(['malware.exe','payload.js','tracking.html','active.svg','macro.docm','invoice.pdf.exe'])('blocks unsupported %s',name=>{
 expect(()=>validateAttachment({filename:name,content:pdf()})).toThrow();
});
it("checks file bytes rather than trusting extension or uploaded MIME", () => {
 expect(()=>validateAttachment({filename:'safe.pdf',content:Buffer.from('MZ malware')})).toThrow('does not match');
 expect(validateAttachment({filename:'safe.PDF',content:pdf()})).toMatchObject({contentType:'application/pdf'});
 expect(()=>validateAttachment({filename:'text.txt',content:Buffer.from([255,0,1])})).toThrow();
});
it("sanitizes paths, control characters, RTL spoofing and header delimiters", () => {
 expect(safeAttachmentName('../../résumé.pdf')).toBe('résumé.pdf'); expect(safeAttachmentName('C:\\docs\\report.pdf')).toBe('report.pdf');
 const name=safeAttachmentName('invoice\r\n"\u202e.pdf'); expect(name).not.toMatch(/[\r\n"\u202e]/); expect(name.length).toBeLessThanOrEqual(180);
});
it("supports ordinary image and UTF-8 text attachments without rendering them", () => {
 expect(validateAttachment({filename:'data.csv',content:Buffer.from('name,value\nexample,1')})).toMatchObject({contentType:'text/csv'});
 expect(validateAttachment({filename:'image.png',content:Buffer.from([137,80,78,71,13,10,26,10,0])})).toMatchObject({contentType:'image/png'});
});
