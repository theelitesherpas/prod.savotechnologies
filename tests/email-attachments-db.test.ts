/** Run only inside the disposable DB provisioned by verify-email-attachments.mjs. */
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
const enabled=process.env.EMAIL_ATTACHMENT_DB_TESTS==='1',db=new PrismaClient(),tag=randomBytes(5).toString('hex'),email=`attachment-${tag}@example.invalid`;
const reply=()=>db.emailReply.create({data:{fromEmail:email,toEmail:'hr@savotechnologies.com',subject:'Synthetic attachment',dept:'hr'}});
const sent=()=>db.sentEmail.create({data:{toEmail:email,subject:'Synthetic attachment',html:'<p>Synthetic</p>',dept:'hr'}});
const row=(size=10)=>({filename:'synthetic.pdf',contentType:'application/pdf',size,data:Buffer.alloc(size,32),sha256:'a'.repeat(64)});
describe.skipIf(!enabled)('private attachment invariants against isolated PostgreSQL',()=>{
 beforeAll(()=>{const u=new URL(process.env.DATABASE_URL!);if(!['localhost','127.0.0.1','[::1]'].includes(u.hostname)||!/^savo_email_attachments_verify_[a-f0-9]{12}$/.test(u.pathname.slice(1))||process.env.MAIL_DELIVERY_MODE==='live')throw Error('Disposable loopback DB and mail-off only');});
 afterAll(async()=>{if(enabled){await db.emailReply.deleteMany({where:{fromEmail:email}});await db.sentEmail.deleteMany({where:{toEmail:email}});}await db.$disconnect();});
 it('accepts exactly 10,000,000 bytes',async()=>{const r=await reply();expect((await db.emailAttachment.create({data:{...row(10_000_000),replyId:r.id}})).size).toBe(10_000_000);});
 it('rejects one byte over the per-message size and inconsistent stored size',async()=>{const r=await reply();await expect(db.emailAttachment.create({data:{...row(10_000_001),replyId:r.id}})).rejects.toThrow();await expect(db.emailAttachment.create({data:{...row(),size:11,replyId:r.id}})).rejects.toThrow();});
 it('serializes concurrent inserts so two six-MB files cannot bypass the aggregate budget',async()=>{const r=await reply();const results=await Promise.allSettled([db.emailAttachment.create({data:{...row(6_000_000),replyId:r.id}}),db.emailAttachment.create({data:{...row(6_000_000),replyId:r.id}})]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(await db.emailAttachment.count({where:{replyId:r.id}})).toBe(1);});
 it('enforces the count bound as well as bytes',async()=>{const r=await reply();for(let i=0;i<10;i++)await db.emailAttachment.create({data:{...row(1),replyId:r.id}});await expect(db.emailAttachment.create({data:{...row(1),replyId:r.id}})).rejects.toThrow();});
 it('requires exactly one real parent and cascades deletion without orphan bytes',async()=>{const r=await reply(),s=await sent();await expect(db.emailAttachment.create({data:row()})).rejects.toThrow();await expect(db.emailAttachment.create({data:{...row(),replyId:r.id,sentId:s.id}})).rejects.toThrow();const f=await db.emailAttachment.create({data:{...row(),replyId:r.id}});await db.emailReply.delete({where:{id:r.id}});expect(await db.emailAttachment.findUnique({where:{id:f.id}})).toBeNull();});
 it('does not allow a stored document to be replaced after archival',async()=>{const s=await sent(),f=await db.emailAttachment.create({data:{...row(),sentId:s.id}});await expect(db.emailAttachment.update({where:{id:f.id},data:{filename:'different.pdf'}})).rejects.toThrow();});
 it('deduplicates retry identities atomically',async()=>{const key=`synthetic-${tag}`;const data={fromEmail:email,toEmail:'hello@savotechnologies.com',subject:'Synthetic retry',deliveryKey:key};const results=await Promise.allSettled([db.emailReply.create({data}),db.emailReply.create({data})]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);});
 it('keeps legacy sent status and rejects unsupported delivery states',async()=>{expect((await sent()).deliveryStatus).toBe('sent');await expect(db.sentEmail.create({data:{toEmail:email,subject:'Synthetic',html:'Synthetic',deliveryStatus:'invented'}})).rejects.toThrow();});
});
