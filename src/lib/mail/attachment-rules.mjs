/** Shared browser/server/poller policy. MB is decimal: 10 MB = 10,000,000 bytes.
 * Files are never executed/extracted or treated as proof of a trusted sender. */
export const MAX_ATTACHMENT_BYTES = 10_000_000;
export const MAX_ATTACHMENT_COUNT = 10;
export const MAX_MAIL_WIRE_BYTES = 16_000_000;
export const ATTACHMENT_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg';
const mime = { pdf:'application/pdf', doc:'application/msword', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls:'application/vnd.ms-excel', xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ppt:'application/vnd.ms-powerpoint', pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation', txt:'text/plain', csv:'text/csv', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg' };
export function safeAttachmentName(raw) {
 const name=String(raw || 'attachment').normalize('NFKC').split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069\uD800-\uDFFF]/gu,'_').replace(/["<>:|?*]/g,'_').trim().replace(/^\.+/,'');
 return Array.from(name).slice(-180).join('') || 'attachment';
}
export function attachmentBatchProblem(files) {
 if(files.length > MAX_ATTACHMENT_COUNT) return 'Attach up to 10 files, with a combined size of 10 MB or less.';
 let total=0;
 for(const file of files){ if(!Number.isSafeInteger(file.size)||file.size<=0) return 'Attachments must not be empty.'; total+=file.size; if(file.size>MAX_ATTACHMENT_BYTES||total>MAX_ATTACHMENT_BYTES)return 'Attachments must total 10 MB or less per email.'; const ext=safeAttachmentName(file.name).split('.').pop().toLowerCase();if(!mime[ext])return 'Use PDF, Word, Excel, PowerPoint, TXT, CSV, PNG or JPEG attachments.'; }
 return null;
}
export function validateAttachment(file) {
 const filename=safeAttachmentName(file.filename),content=file.content;
 const problem=attachmentBatchProblem([{name:filename,size:content?.byteLength}]);if(problem)throw Error(problem);
 const ext=filename.split('.').pop().toLowerCase(),starts=(values)=>values.every((v,i)=>content[i]===v);
 let valid=false;
 if(ext==='pdf') valid=starts([0x25,0x50,0x44,0x46,0x2d]);
 if(ext==='png') valid=starts([137,80,78,71,13,10,26,10]);
 if(ext==='jpg'||ext==='jpeg') valid=starts([255,216,255]);
 if(['doc','xls','ppt'].includes(ext)) valid=starts([208,207,17,224,161,177,26,225]);
 if(['docx','xlsx','pptx'].includes(ext)){ const s=new TextDecoder('latin1').decode(content);valid=starts([80,75,3,4])&&s.includes('[Content_Types].xml')&&s.includes(ext==='docx'?'word/':ext==='xlsx'?'xl/':'ppt/')&&!s.includes('vbaProject.bin'); }
 if(ext==='txt'||ext==='csv'){try{const s=new TextDecoder('utf-8',{fatal:true}).decode(content);valid=!s.includes('\u0000');}catch{valid=false;} }
 if(!valid)throw Error('An attachment does not match its supported file type, is unreadable, or contains an unsupported macro format.');
 return {filename,contentType:mime[ext],size:content.byteLength,content};
}
export function safeContentId(value) { if(typeof value!=='string')return undefined;const id=value.trim().replace(/^<|>$/g,'');return /^[^\s<>"'\u0000-\u001f]{1,255}$/.test(id)?id:undefined; }
export function attachmentSize(bytes){ return bytes>=1_000_000?`${(bytes/1_000_000).toFixed(bytes%1_000_000?1:0)} MB`:`${Math.ceil(bytes/1000)} KB`; }
