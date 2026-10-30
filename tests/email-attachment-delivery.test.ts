import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({transport:vi.fn(),smtp:vi.fn(),archive:vi.fn(),update:vi.fn(),events:[] as string[]}));
vi.mock('nodemailer',()=>({default:{createTransport:m.transport}}));
vi.mock('@/lib/prisma',()=>({prisma:{sentEmail:{create:m.archive,update:m.update}}}));
vi.mock('@/lib/logger',()=>({logger:{info:vi.fn(),warn:vi.fn(),error:vi.fn()}}));
const file={filename:'report.pdf',contentType:'application/pdf',content:Buffer.from('%PDF-1.7 synthetic'),size:18};
const tpl={subject:'Synthetic document',html:'<p>Synthetic message</p>',text:'Synthetic message'};
beforeEach(()=>{
 vi.resetModules();vi.clearAllMocks();m.events.length=0;
 for(const[k,v]of Object.entries({NODE_ENV:'production',NEXT_PUBLIC_CONTENT_MODE:'production',MAIL_DELIVERY_MODE:'live',MAIL_HOST:'127.0.0.1',MAIL_PORT:'2525',MAIL_SECURE:'false',MAIL_USER:'hello@example.invalid',MAIL_PASS:'synthetic-password'}))vi.stubEnv(k,v);
 m.transport.mockReturnValue({sendMail:m.smtp});m.archive.mockImplementation(async()=>{m.events.push('archive');return{id:'sent-synthetic'};});m.smtp.mockImplementation(async()=>{m.events.push('smtp');return{accepted:['recipient@example.invalid']};});m.update.mockResolvedValue({});
});afterEach(()=>vi.unstubAllEnvs());
it('persists the exact attachments before SMTP and records acceptance afterward',async()=>{
 const {deliverMail}=await import('@/lib/mail');const result=await deliverMail('recipient@example.invalid',tpl,'hello',{attachments:[file],requireAcceptance:true});expect(result.status).toBe('accepted');expect(m.events).toEqual(['archive','smtp']);
 const row=m.archive.mock.calls[0][0].data;expect(row.deliveryStatus).toBe('pending');expect(row.attachments.create[0].data).toEqual(file.content);expect(m.smtp.mock.calls[0][0].attachments[0].content).toEqual(row.attachments.create[0].data);expect(m.smtp.mock.calls[0][0].messageId).toBe(row.messageId);expect(m.update).toHaveBeenCalledWith({where:{id:'sent-synthetic'},data:{deliveryStatus:'sent'}});
});
it('does not send if attachment archival fails',async()=>{
 const {deliverMail}=await import('@/lib/mail');m.archive.mockRejectedValue(new Error('database offline'));expect(await deliverMail('recipient@example.invalid',tpl,'hello',{attachments:[file]})).toMatchObject({status:'not_sent',reason:'ATTACHMENT_ARCHIVE_UNAVAILABLE'});expect(m.smtp).not.toHaveBeenCalled();
});
it('retains ambiguous SMTP outcomes for review rather than claiming sent or auto-retrying',async()=>{
 const {deliverMail}=await import('@/lib/mail');m.smtp.mockRejectedValue(Object.assign(new Error('lost acknowledgement'),{code:'ECONNRESET',command:'DATA'}));expect((await deliverMail('recipient@example.invalid',tpl,'hello',{attachments:[file]})).status).toBe('uncertain');expect(m.update).toHaveBeenCalledWith(expect.objectContaining({data:{deliveryStatus:'uncertain'}}));expect(m.smtp).toHaveBeenCalledTimes(1);
});
it('records a rejected recipient as not sent',async()=>{
 const {deliverMail}=await import('@/lib/mail');m.smtp.mockResolvedValue({accepted:[],rejected:['recipient@example.invalid']});expect((await deliverMail('recipient@example.invalid',tpl,'hello',{attachments:[file],requireAcceptance:true})).status).toBe('not_sent');expect(m.update).toHaveBeenCalledWith(expect.objectContaining({data:{deliveryStatus:'not_sent'}}));
});
it('never attaches files to authentication/security messages',async()=>{
 const {deliverMail}=await import('@/lib/mail');expect((await deliverMail('recipient@example.invalid',tpl,'hello',{attachments:[file],sensitive:true})).status).toBe('not_sent');expect(m.archive).not.toHaveBeenCalled();expect(m.smtp).not.toHaveBeenCalled();
});
it('delivery off creates neither SMTP transport nor attachment archive',async()=>{
 vi.stubEnv('MAIL_DELIVERY_MODE','off');const {deliverMail}=await import('@/lib/mail');expect((await deliverMail('recipient@example.invalid',tpl,'hello',{attachments:[file]})).status).toBe('not_sent');expect(m.transport).not.toHaveBeenCalled();expect(m.archive).not.toHaveBeenCalled();
});
