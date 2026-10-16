import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
const m=vi.hoisted(()=>({find:vi.fn(),update:vi.fn(),log:vi.fn(),transaction:vi.fn(),after:vi.fn(),render:vi.fn(),send:vi.fn()}));
vi.mock("@/lib/prisma",()=>({prisma:{$transaction:m.transaction}}));
vi.mock("next/server",()=>({after:m.after}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/mail",()=>({renderTemplate:m.render,sendMail:m.send}));
vi.mock("@/lib/logger",()=>({logger:{error:vi.fn()}}));
import { reconcileProject, projectTransaction, projectEmails } from "@/lib/project-service";
const tx={clientProject:{findUnique:m.find,update:m.update},projectUpdate:{create:m.log}} as unknown as Prisma.TransactionClient;
const sample=()=>({id:"project-123",clientId:"client-123",title:"Example project",updatedAt:new Date("2026-10-01"),currency:"USD",budget:10000,status:"in_progress",progress:0,completedByPayment:false,client:{name:"Example",email:"sample@example.invalid"},milestones:[{amount:10000,status:"pending",scope:"base"}],invoices:[{amount:10000,currency:"USD",status:"paid",clientId:"client-123"}]});
beforeEach(()=>{vi.resetAllMocks();m.find.mockResolvedValue(sample());});
describe("atomic project reconciliation",()=>{
 it("marks fully paid projects completed without falsifying unfinished module progress",async()=>{
  const events=await reconcileProject(tx,"project-123");
  expect(m.update).toHaveBeenCalledWith({where:{id:"project-123"},data:{status:"delivered",completedByPayment:true,progress:0,updatedAt:expect.any(Date)}});
  expect(events).toHaveLength(1);expect(m.log).toHaveBeenCalled();
 });
 it("ignores foreign-owner payments even when linked by legacy bad data",async()=>{
  const p=sample();p.invoices[0].clientId="other-client";m.find.mockResolvedValue(p);
  expect(await reconcileProject(tx,p.id)).toEqual([]);expect(m.update).not.toHaveBeenCalled();
 });
 it("never reactivates cancelled projects after payment",async()=>{
  const p=sample();p.status="cancelled";m.find.mockResolvedValue(p);
  expect(await reconcileProject(tx,p.id)).toEqual([]);expect(m.update).not.toHaveBeenCalled();
 });
 it("reopens payment-completed projects after a payment reversal or added scope",async()=>{
  const p=sample();p.status="delivered";p.completedByPayment=true;p.invoices[0].status="sent";m.find.mockResolvedValue(p);
  const events=await reconcileProject(tx,p.id);expect(events).toHaveLength(1);
  expect(m.update.mock.calls[0][0].data).toMatchObject({status:"in_progress",completedByPayment:false});
 });
 it("does not reopen deliberate manual completions merely because invoices are unpaid",async()=>{
  const p=sample();p.status="delivered";p.invoices[0].status="sent";m.find.mockResolvedValue(p);
  expect(await reconcileProject(tx,p.id)).toEqual([]);expect(m.update).not.toHaveBeenCalled();
 });
 it("is idempotent and does not duplicate completion emails",async()=>{
  const p=sample();p.status="delivered";p.completedByPayment=true;m.find.mockResolvedValue(p);
  expect(await reconcileProject(tx,p.id)).toEqual([]);expect(m.log).not.toHaveBeenCalled();
 });
 it("uses serializable transactions and retries serialization conflicts only",async()=>{
  m.transaction.mockRejectedValueOnce({code:"P2034"}).mockResolvedValueOnce("committed");
  const work=vi.fn();expect(await projectTransaction(work)).toBe("committed");expect(m.transaction).toHaveBeenCalledTimes(2);
  expect(m.transaction.mock.calls[0][1].isolationLevel).toBe("Serializable");
 });
 it("does not send before commit/redirect; errors in the notification do not roll back a saved project",async()=>{
  projectEmails([{key:"projectUpdate",to:"sample@example.invalid",vars:{title:"Saved"}}]);
  expect(m.send).not.toHaveBeenCalled();expect(m.after).toHaveBeenCalledTimes(1);
  m.render.mockResolvedValue({subject:"Example",html:"<p>Sample</p>",text:"Sample"});
  await m.after.mock.calls[0][0]();expect(m.send).toHaveBeenCalledTimes(1);
 });
});
