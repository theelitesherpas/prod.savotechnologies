import qp from 'libqp';
const looksHtml=s=>/^\s*(?:<!doctype\s+html|<(?:html|body|div|p|table)(?:\s|>))/i.test(s);
function repairLegacy(value,isHtml){
 if(!value)return value;
 let decoded=value;
 if(/=(?:C[2-9A-F]|D[0-9A-F]|E[0-9A-F]|F[0-4])=[89AB][0-9A-F]/i.test(value)||(isHtml&&/(?:href|src|style|class)=3D/i.test(value))){const candidate=qp.decode(value).toString('utf8');if(!candidate.includes('\uFFFD')||value.includes('\uFFFD'))decoded=candidate;}
 if(isHtml&&!looksHtml(decoded)&&decoded.length>=64&&/^[A-Za-z0-9+/=\s]+$/.test(decoded)){const candidate=Buffer.from(decoded.replace(/\s/g,''),'base64').toString('utf8');if(looksHtml(candidate)&&!candidate.includes('\uFFFD'))decoded=candidate;}
 return decoded;
}
/** Display repair only. Never rewrite historical messages or claim lost
 * attachments were recovered. New MIME-decoded messages aren't double-decoded. */
export function formatMessageBody(message){
 let text=message.bodyText||null,html=message.bodyHtml||null,originalText=null,quotedText=null;
 if(!(message.bodyFormatVersion>=1)){
  const cleanText=repairLegacy(text,false),cleanHtml=repairLegacy(html,true);
  if(cleanText!==text||cleanHtml!==html)originalText=text||html;
  text=cleanText;html=cleanHtml;
  if(!html&&text&&looksHtml(text)){html=text;originalText ||= message.bodyText; text=null;}
 }
 if(!html&&text){const match=/\n(?:On [^\n]{0,240}(?:\n[^\n]{0,240}){0,3}wrote:|[-_]{2,}\s*Original Message\s*[-_]{2,})[^\n]*\n/i.exec(text);if(match&&match.index>0){quotedText=text.slice(match.index+1);text=text.slice(0,match.index).trimEnd();}}
 return {bodyText:text,bodyHtml:html,originalText,quotedText};
}
