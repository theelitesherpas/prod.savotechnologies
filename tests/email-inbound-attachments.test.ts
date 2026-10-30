import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({find:vi.fn(),create:vi.fn(),unique:vi.fn(),publish:vi.fn()}));
vi.mock('@/lib/prisma',()=>({prisma:{projectEnquiry:{findFirst:m.find},emailReply:{create:m.create,findUnique:m.unique}}}));
vi.mock('@/lib/livechat/pubsub',()=>({publish:m.publish}));
vi.mock('@/lib/logger',()=>({logger:{info:vi.fn(),warn:vi.fn(),error:vi.fn()}}));
import { POST } from '@/app/api/email/inbound/route';
const secret='synthetic-attachments-secret',pdf=Buffer.from('%PDF-1.7 synthetic document');
function form(){const f=new FormData();for(const[k,v]of Object.entries({from:'Synthetic Sender <sender@example.invalid>',to:'hr@reply.savotechnologies.com',subject:'Attached documents',text:'Please see the document.'}))f.set(k,v);return f;}
const post=(f:FormData)=>POST(new Request('http://localhost/api/email/inbound',{method:'POST',headers:{'x-webhook-secret':secret},body:f}));
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('EMAIL_INBOUND_SECRET',secret);m.find.mockResolvedValue(null);m.create.mockResolvedValue({id:'reply-attachments-test'});});afterEach(()=>vi.unstubAllEnvs());
it('stores decoded file bytes atomically with the received message in the correct mailbox',async()=>{
 const f=form();f.append('attachment1',new File([pdf],'résumé.pdf',{type:'application/octet-stream'}));expect((await post(f)).status).toBe(201);
 expect(m.create.mock.calls[0][0].data).toMatchObject({dept:'hr',toEmail:'hr@savotechnologies.com',attachments:{create:[{filename:'résumé.pdf',contentType:'application/pdf',size:pdf.length,data:pdf}]}});
});
it('omits oversized files without losing the reply body or retaining the bytes',async()=>{
 const f=form();f.append('attachments',new File([Buffer.alloc(10_000_001)],'large.pdf'));expect((await post(f)).status).toBe(201);const d=m.create.mock.calls[0][0].data;expect(d.attachments).toBeUndefined();expect(d.attachmentNotice).toContain('10 MB');expect(d.bodyText).toBe('Please see the document.');
});
it('checks the combined budget, not merely each individual file',async()=>{
 const f=form();f.append('attachments',new File([Buffer.alloc(6_000_000)],'a.pdf'));f.append('attachments',new File([Buffer.alloc(4_000_001)],'b.pdf'));expect((await post(f)).status).toBe(201);expect(m.create.mock.calls[0][0].data.attachments).toBeUndefined();expect(m.create.mock.calls[0][0].data.attachmentNotice).toContain('10 MB');
});
it('omits unsupported/spoofed files with a visible notice',async()=>{
 const f=form();f.append('attachments',new File([Buffer.from('MZ unsafe')],'looks-safe.pdf'));expect((await post(f)).status).toBe(201);expect(m.create.mock.calls[0][0].data.attachments).toBeUndefined();expect(m.create.mock.calls[0][0].data.attachmentNotice).toContain('unsupported');
});
it('decodes raw MIME attachments and text using a MIME parser, not regular expressions',async()=>{
 const f=form();f.delete('text');f.set('email',`From: Sender <sender@example.invalid>\r\nTo: hr@reply.savotechnologies.com\r\nMessage-ID: <synthetic-001@example.invalid>\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="test-boundary"\r\n\r\n--test-boundary\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\nHello=20reply\r\n--test-boundary\r\nContent-Type: application/pdf\r\nContent-Disposition: attachment; filename="report.pdf"\r\nContent-Transfer-Encoding: base64\r\n\r\n${pdf.toString('base64')}\r\n--test-boundary--\r\n`);
 expect((await post(f)).status).toBe(201);expect(m.create.mock.calls[0][0].data).toMatchObject({bodyText:expect.stringContaining('Hello reply'),messageId:'<synthetic-001@example.invalid>',attachments:{create:[{data:pdf}]}});
});
it('deduplicates acknowledged/retried imports by mailbox-scoped delivery identity',async()=>{
 const f=form();f.set('deliveryKey','imap:hr:123:456');m.create.mockRejectedValue({code:'P2002'});m.unique.mockResolvedValue({id:'existing-reply'});const r=await post(f);expect(r.status).toBe(200);expect(await r.json()).toMatchObject({duplicate:true,id:'existing-reply'});expect(m.publish).not.toHaveBeenCalled();
});
it('rejects JSON attachment objects instead of treating URLs/paths as files',async()=>{
 const r=await POST(new Request('http://localhost/api/email/inbound',{method:'POST',headers:{'x-webhook-secret':secret,'content-type':'application/json'},body:JSON.stringify({attachments:[{path:'/private/secret'}]})}));expect(r.status).toBe(422);expect(m.create).not.toHaveBeenCalled();
});
it('does not acknowledge storage failures or expose file/message contents in errors',async()=>{
 const f=form();f.append('attachments',new File([pdf],'report.pdf'));m.create.mockRejectedValue(new Error('private document bytes'));const r=await post(f);expect(r.status).toBe(503);expect(await r.text()).toBe('');expect(m.publish).not.toHaveBeenCalled();
});
