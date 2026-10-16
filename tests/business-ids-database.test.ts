/** Optional real-PostgreSQL verification. ONLY an isolated local QA schema is
 * allowed. CI/default tests skip this file; never point it at a real schema. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient, type Prisma } from "@prisma/client";
import { generateBusinessId, businessTransaction, reserveBusinessId, claimBusinessId } from "@/lib/business-ids";
import { prisma as servicePrisma } from "@/lib/prisma";
import { BUSINESS_ID_CONFIG as config, BUSINESS_ID_TYPES as types, formatBusinessId } from "@/lib/business-id-config";
import { provisionBusinessIds } from "../scripts/setup-business-ids.mjs";
const url=process.env.BUSINESS_ID_TEST_DATABASE_URL;
let p:PrismaClient,clientId:string;
const transaction=<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>)=>p.$transaction(work,{maxWait:30000,timeout:60000});
describe.skipIf(!url)("real PostgreSQL business ID invariants",()=>{
 beforeAll(async()=>{
  const u=new URL(url!);if(!["localhost","127.0.0.1","[::1]"].includes(u.hostname)||!/^savo_id_qa_\d+$/.test(u.searchParams.get("schema")||""))throw Error("Refusing non-isolated business ID database");
  if(process.env.DATABASE_URL!==url)throw Error("Service and fixture must use the same isolated test schema");
  p=new PrismaClient({datasourceUrl:url});expect((await p.$queryRaw<{schema:string}[]>`SELECT current_schema() AS schema`)[0].schema).toBe(u.searchParams.get("schema"));
  if(!servicePrisma)throw Error("Isolated service database missing");expect((await servicePrisma.$queryRaw<{schema:string}[]>`SELECT current_schema() AS schema`)[0].schema).toBe(u.searchParams.get("schema"));
 });
 afterAll(async()=>{await p?.$disconnect();await servicePrisma?.$disconnect();});
 it("issues the exact first ID in all 14 categories",async()=>{
  for(const type of types)expect(await transaction(tx=>generateBusinessId(type,tx))).toBe(formatBusinessId(type,config[type].initialCurrent+1));
  const rows=await p.businessId.findMany();expect(new Set(rows.map(r=>r.referenceNumber)).size).toBe(14);
  const c=await transaction(async tx=>tx.clientUser.create({data:{name:"Isolated ID QA only",email:"isolated@example.invalid",passwordHash:"not-a-password",businessId:await generateBusinessId("CS",tx)}}));clientId=c.id;
 });
 it("serializes 32 simultaneous project creates without duplicate/reused/skipped numbers",async()=>{
  const rows=await Promise.all(Array.from({length:32},(_,i)=>transaction(async tx=>{const code=await generateBusinessId("PR",tx);return tx.clientProject.create({data:{code,businessId:code,clientId,title:`Isolated parallel project ${i}`}});})));
  expect(new Set(rows.map(r=>r.code)).size).toBe(32);
  expect(rows.map(r=>Number(r.code.slice(-5))).sort((a,b)=>a-b)).toEqual(Array.from({length:32},(_,i)=>2685+i));
 });
 it("retries raw SQL serialization conflicts for eight parallel financial transactions",async()=>{
  const rows=await Promise.all(Array.from({length:8},(_,i)=>businessTransaction(async tx=>{const code=await generateBusinessId("PR",tx);return tx.clientProject.create({data:{code,businessId:code,clientId,title:`Serializable QA project ${i}`}});},"Serializable")));
  expect(new Set(rows.map(r=>r.code)).size).toBe(8);expect(rows.map(r=>Number(r.code.slice(-5))).sort((a,b)=>a-b)).toEqual(Array.from({length:8},(_,i)=>2717+i));
 });
 it("rolls back number and reservation when the associated record fails",async()=>{
  const before=await p.businessIdCounter.findUniqueOrThrow({where:{type:"IN"}});
  await expect(transaction(async tx=>{const number=await generateBusinessId("IN",tx);return tx.invoice.create({data:{number,businessId:number,clientId:"missing-client",amount:100}});})).rejects.toThrow();
  expect((await p.businessIdCounter.findUniqueOrThrow({where:{type:"IN"}})).current).toBe(before.current);
  expect(await p.businessId.findUnique({where:{id:formatBusinessId("IN",before.current+1)}})).toBeNull();
  expect(await transaction(tx=>generateBusinessId("IN",tx))).toBe("STPLIN05149");
 });
 it("enforces type/range and entity ownership of the ID at the database boundary",async()=>{
  for(const data of [{id:"STPLPR01452",type:"PR",referenceNumber:1452},{id:"STPLIN02684",type:"IN",referenceNumber:2684}])await expect(p.businessId.create({data})).rejects.toThrow();
  const c=await p.clientUser.findUniqueOrThrow({where:{id:clientId}});
  await expect(p.clientProject.create({data:{code:c.businessId!,businessId:c.businessId,clientId,title:"Forged cross-category reference"}})).rejects.toThrow();
 });
 it("prevents resets, deletion, mutation, and unreserved increments",async()=>{
  await expect(p.businessIdCounter.update({where:{type:"CS"},data:{current:1436}})).rejects.toThrow();
  await expect(p.businessIdCounter.delete({where:{type:"VN"}})).rejects.toThrow();
  await expect(p.businessId.update({where:{id:"STPLCS01437"},data:{id:"STPLCS01440"}})).rejects.toThrow();
  await expect(p.businessId.delete({where:{id:"STPLCS01437"}})).rejects.toThrow();
  const before=await p.businessIdCounter.findUniqueOrThrow({where:{type:"CS"}});
  await expect(transaction(tx=>tx.businessIdCounter.update({where:{type:"CS"},data:{current:{increment:1}}}))).rejects.toThrow();
  expect((await p.businessIdCounter.findUniqueOrThrow({where:{type:"CS"}})).current).toBe(before.current);
 });
 it("never reuses an ID after its associated client is deleted",async()=>{
  const c=await transaction(async tx=>tx.clientUser.create({data:{name:"Deleted QA client",email:"deleted@example.invalid",passwordHash:"not-a-password",businessId:await generateBusinessId("CS",tx)}}));
  await p.clientUser.delete({where:{id:c.id}});expect(await p.businessId.findUnique({where:{id:c.businessId!}})).not.toBeNull();
  expect(await transaction(tx=>generateBusinessId("CS",tx))).not.toBe(c.businessId);
 });
 it("preserves legacy references and forbids renumbering on update",async()=>{
  const row=await p.invoice.create({data:{clientId,number:"SAVO-2026-LEGACY",amount:100}});
  await p.invoice.update({where:{id:row.id},data:{notes:"A permitted edit"}});
  await expect(p.invoice.update({where:{id:row.id},data:{number:"STPLIN05199"}})).rejects.toThrow();
  expect((await p.invoice.findUniqueOrThrow({where:{id:row.id}})).businessId).toBeNull();
 });
 it("serializes idempotent provisioning with an in-flight allocator",async()=>{
  let release!:()=>void,started!:()=>void;
  const hold=new Promise<void>(resolve=>{release=resolve;}),ready=new Promise<void>(resolve=>{started=resolve;});
  const pending=transaction(async tx=>{const id=await generateBusinessId("QP",tx);started();await hold;return id;});
  await ready;const provisioning=provisionBusinessIds(p);await new Promise(resolve=>setTimeout(resolve,20));release();
  const [id]=await Promise.all([pending,provisioning]);expect(id).toBe("STPLQP08347");expect((await p.businessIdCounter.findUniqueOrThrow({where:{type:"QP"}})).current).toBe(8347);
 });
 it("reserves a real ID before creation and deduplicates concurrent refresh requests",async()=>{
  const owner="preview-owner-123",key="11111111-1111-4111-8111-111111111111",before=await p.businessIdCounter.findUniqueOrThrow({where:{type:"IN"}});
  const drafts=await Promise.all(Array.from({length:8},()=>reserveBusinessId("IN",owner,key)));
  expect(new Set(drafts.map(d=>d.businessId)).size).toBe(1);expect(drafts[0].businessId).toBe(formatBusinessId("IN",before.current+1));expect(drafts[0].consumedAt).toBeNull();
  expect((await p.businessIdCounter.findUniqueOrThrow({where:{type:"IN"}})).current).toBe(before.current+1);expect(await p.invoice.findUnique({where:{businessId:drafts[0].businessId}})).toBeNull();
 });
 it("saves the exact pre-reserved ID, not whichever number is next at save time",async()=>{
  const owner="preview-owner-123",key="11111111-1111-4111-8111-111111111111",draft=await reserveBusinessId("IN",owner,key);
  await reserveBusinessId("IN","other-preview-owner","22222222-2222-4222-8222-222222222222");
  const f=new FormData();f.set("reservedBusinessId",draft.businessId);f.set("businessReservationRequired","1");
  const row=await businessTransaction(async tx=>{const number=await claimBusinessId(f,"IN",owner,tx);return tx.invoice.create({data:{number:number!,businessId:number,clientId,amount:100}});},"Serializable");
  expect(row.number).toBe(draft.businessId);expect((await reserveBusinessId("IN",owner,key)).consumedAt).not.toBeNull();
  await expect(transaction(tx=>claimBusinessId(f,"IN",owner,tx))).rejects.toMatchObject({code:"INVALID_RESERVATION"});
 });
 it("rejects foreign and cross-type reservations without consuming them",async()=>{
  const draft=await reserveBusinessId("PR","preview-owner-123","33333333-3333-4333-8333-333333333333"),f=new FormData();f.set("reservedBusinessId",draft.businessId);
  await expect(transaction(tx=>claimBusinessId(f,"PR","different-owner",tx))).rejects.toMatchObject({code:"INVALID_RESERVATION"});
  await expect(transaction(tx=>claimBusinessId(f,"IN","preview-owner-123",tx))).rejects.toMatchObject({code:"INVALID_RESERVATION"});
  expect((await p.businessIdDraft.findUniqueOrThrow({where:{businessId:draft.businessId}})).consumedAt).toBeNull();
 });
 it("keeps the displayed reservation reusable after a failed domain write",async()=>{
  const owner="preview-owner-123",draft=await reserveBusinessId("IN",owner,"44444444-4444-4444-8444-444444444444"),f=new FormData();f.set("reservedBusinessId",draft.businessId);
  await expect(transaction(async tx=>{const number=await claimBusinessId(f,"IN",owner,tx);return tx.invoice.create({data:{number:number!,businessId:number,clientId:"missing-client",amount:100}});})).rejects.toThrow();
  expect((await p.businessIdDraft.findUniqueOrThrow({where:{businessId:draft.businessId}})).consumedAt).toBeNull();
  await transaction(async tx=>{const number=await claimBusinessId(f,"IN",owner,tx);return tx.invoice.create({data:{number:number!,businessId:number,clientId,amount:100}});});
 });
 it("never deletes, transfers, or recycles a held draft ID",async()=>{
  const draft=await reserveBusinessId("PR","preview-owner-123","55555555-5555-4555-8555-555555555555");
  await expect(p.businessIdDraft.delete({where:{businessId:draft.businessId}})).rejects.toThrow();
  await expect(p.businessIdDraft.update({where:{businessId:draft.businessId},data:{ownerId:"different-owner"}})).rejects.toThrow();
  expect((await reserveBusinessId("PR","preview-owner-123",draft.requestKey)).businessId).toBe(draft.businessId);
 });
 it("stops at the exact end of a range without entering PR or a reserved gap",async()=>{
  const before=await p.businessIdCounter.findUniqueOrThrow({where:{type:"CS"}});
  await transaction(async tx=>{for(let i=before.current;i<1999;i++)await generateBusinessId("CS",tx);});
  await expect(transaction(tx=>generateBusinessId("CS",tx))).rejects.toMatchObject({code:"EXHAUSTED"});
  expect(await p.businessId.findUnique({where:{id:"STPLCS02000"}})).toBeNull();
  expect(await p.businessId.count({where:{referenceNumber:{gte:10000,lte:10999}}})).toBe(0);
 },60000);
 it("re-provisioning after use/exhaustion never resets or duplicates state",async()=>{
  const before=await p.businessIdCounter.findMany({orderBy:{type:"asc"}});await provisionBusinessIds(p);
  expect(await p.businessIdCounter.findMany({orderBy:{type:"asc"}})).toEqual(before);
 });
});
