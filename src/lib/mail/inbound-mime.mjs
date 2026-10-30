import { simpleParser } from 'mailparser';
import { MAX_ATTACHMENT_BYTES, MAX_ATTACHMENT_COUNT, MAX_MAIL_WIRE_BYTES, validateAttachment, safeContentId } from './attachment-rules.mjs';
export const OVERSIZE_NOTICE='Attachments were not imported: use up to 10 files totaling 10 MB or less per email. Ask the sender to resend smaller files.';
export const UNSUPPORTED_NOTICE='Some attachments were omitted because their file types are unsupported or invalid. Ask the sender for a supported document format.';
export function selectInboundAttachments(files) {
 if(files.length>MAX_ATTACHMENT_COUNT||files.some(f=>f.content.byteLength>MAX_ATTACHMENT_BYTES)||files.reduce((n,f)=>n+f.content.byteLength,0)>MAX_ATTACHMENT_BYTES)return {attachments:[],notice:OVERSIZE_NOTICE};
 const attachments=[];let omitted=false;
 for(const file of files)try{const checked=validateAttachment(file),cid=safeContentId(file.contentId);attachments.push({...checked,...(cid?{contentId:cid}:{})});}catch{omitted=true;}
 return {attachments,notice:omitted?UNSUPPORTED_NOTICE:null};
}
export async function parseInboundMime(source) {
 if(source.byteLength>MAX_MAIL_WIRE_BYTES)throw Error('MIME_TOO_LARGE');
 // Bound pathological multipart trees before asking the MIME parser to build
 // them. Neither the parser nor policy fetches URLs or extracts archives.
 const bytes=Buffer.from(source),raw=bytes.toString('latin1');
 if((raw.match(/^Content-(?:Type|Disposition):/gim)||[]).length>200)throw Error('MIME_TOO_COMPLEX');
 const parsed=await simpleParser(bytes,{skipHtmlToText:false,skipTextToHtml:true,skipTextLinks:true,skipImageLinks:true,maxHtmlLengthToParse:50_000});
 const selected=selectInboundAttachments(parsed.attachments.map(a=>({filename:a.filename||'attachment',content:a.content,contentId:a.contentId})));
 return {from:parsed.from?.text||'',to:(Array.isArray(parsed.to)?parsed.to.map(t=>t.text).join(','):parsed.to?.text)||'',subject:parsed.subject||'',text:(parsed.text||'').slice(0,50_000),html:typeof parsed.html==='string'?parsed.html.slice(0,50_000):null,messageId:parsed.messageId||'',inReplyTo:parsed.inReplyTo||'',...selected};
}
