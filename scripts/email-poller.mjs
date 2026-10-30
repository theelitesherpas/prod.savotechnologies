/** IMAP -> authenticated loopback inbox import. One sequential polling loop;
 * stable mailbox/UIDVALIDITY/UID delivery IDs; Seen only after persisted ack.
 * Attachments are decoded under bounded MIME limits and share app policy.
 * No auto-replies/bounces, URL secrets, raw message or recipient logging.
 */
import { ImapFlow } from 'imapflow';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { parseInboundMime, OVERSIZE_NOTICE } from '../src/lib/mail/inbound-mime.mjs';
import { MAX_MAIL_WIRE_BYTES } from '../src/lib/mail/attachment-rules.mjs';
const log=(event,meta={})=>console.log(JSON.stringify({ts:new Date().toISOString(),service:'email-poller',event,...meta}));
export async function boundedMime(content){const chunks=[];let size=0;for await(const chunk of content){size+=chunk.length;if(size>MAX_MAIL_WIRE_BYTES){content.destroy?.();return null;}chunks.push(chunk);}return Buffer.concat(chunks);}
export async function pollMailbox(mailbox,{Client=ImapFlow,post=fetch,secret=process.env.EMAIL_INBOUND_SECRET,port=process.env.APP_PORT||'4300'}={}){
 if(!secret||!/^\d{1,5}$/.test(port)||Number(port)<1||Number(port)>65535)throw Error('INBOUND_CONFIGURATION_REQUIRED');
 const client=new Client({host:process.env.IMAP_HOST||'imap.hostinger.com',port:Number(process.env.IMAP_PORT||993),secure:true,auth:{user:mailbox.user,pass:mailbox.pass},logger:false,connectionTimeout:15000,greetingTimeout:15000,socketTimeout:30000});
 let imported=0;
 try{
  await client.connect();const lock=await client.getMailboxLock('INBOX');
  try{
   const validity=String(client.mailbox?.uidValidity||'');if(!validity)throw Error('UIDVALIDITY_REQUIRED');
   const uids=await client.search({seen:false},{uid:true});
   for(const uid of (uids||[]).slice(0,20)){
    const msg=await client.fetchOne(uid,{uid:true,envelope:true,size:true},{uid:true});if(!msg)continue;
    const envelope=msg.envelope||{},sender=envelope.from?.[0];if(!sender?.address)continue;
    let parsed={text:'',html:null,attachments:[],notice:null};
    if(msg.size>MAX_MAIL_WIRE_BYTES)parsed.notice=OVERSIZE_NOTICE;
    else{
     const download=await client.download(uid,undefined,{uid:true,maxBytes:MAX_MAIL_WIRE_BYTES+1});if(!download.content)continue;
     const source=await boundedMime(download.content);
     if(!source)parsed.notice=OVERSIZE_NOTICE;
     else try{parsed=await parseInboundMime(source);}catch{parsed.notice='The MIME message could not be safely processed. Ask the sender to resend supported attachments totaling 10 MB or less.';}
    }
    const form=new FormData();form.set('from',sender.name?`${JSON.stringify(sender.name)} <${sender.address}>`:sender.address);form.set('to',mailbox.user);form.set('subject',envelope.subject||parsed.subject||'(no subject)');form.set('text',parsed.text||'(empty body)');if(parsed.html)form.set('html',parsed.html);if(envelope.messageId||parsed.messageId)form.set('messageId',envelope.messageId||parsed.messageId);if(parsed.inReplyTo)form.set('inReplyTo',parsed.inReplyTo);form.set('deliveryKey',`imap:${mailbox.dept}:${validity}:${uid}`);
    if(parsed.notice)form.set('attachmentIssue',parsed.notice===OVERSIZE_NOTICE?'oversize':'unsupported');
    const attachmentInfo={};for(const [index,file] of parsed.attachments.entries()){const key=`attachment${index}`;form.append(key,new Blob([file.content],{type:file.contentType}),file.filename);if(file.contentId)attachmentInfo[key]={'content-id':file.contentId};}if(Object.keys(attachmentInfo).length)form.set('attachment-info',JSON.stringify(attachmentInfo));
    const response=await post(`http://127.0.0.1:${port}/api/email/inbound`,{method:'POST',redirect:'error',headers:{'x-webhook-secret':secret},body:form,signal:AbortSignal.timeout(25000)});
    if(response.ok){const body=await response.json();if(body.ok!==true||!body.id)throw Error('IMPORT_ACK_INVALID');await client.messageFlagsAdd(uid,['\\Seen'],{uid:true});imported++;}
    else{log('import_not_acknowledged',{mailbox:mailbox.dept,status:response.status});break;}
   }
  }finally{lock.release();}
 }catch{log('cycle_failed',{mailbox:mailbox.dept});}
 finally{try{await client.logout();}catch{client.close?.();}}
 if(imported)log('cycle_complete',{mailbox:mailbox.dept,imported});return imported;
}
async function main(){
 if(!process.env.EMAIL_INBOUND_SECRET)throw Error('EMAIL_INBOUND_SECRET_REQUIRED');
 const mailboxes=[{dept:'hello',user:process.env.MAIL_USER||'hello@savotechnologies.com',pass:process.env.MAIL_PASS},{dept:'hr',user:process.env.MAIL_HR_USER||'hr@savotechnologies.com',pass:process.env.MAIL_HR_PASS}].filter(m=>m.pass);
 if(!mailboxes.length)throw Error('NO_IMAP_MAILBOX_CONFIGURED');
 let stopped=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{stopped=true;});
 log('started',{mailboxes:mailboxes.map(m=>m.dept)});
 while(!stopped){for(const mailbox of mailboxes){if(stopped)break;await pollMailbox(mailbox);}if(!stopped)await sleep(60000);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(()=>{log('fatal_configuration_or_runtime_error');process.exitCode=1;});
