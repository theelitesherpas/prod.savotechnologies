import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidEnquiryReference } from "@/lib/enquiry-reference";
import { BUSINESS_ID_CONFIG as config, BUSINESS_ID_TYPES as types, formatBusinessId, parseBusinessId, businessIdCapacity, type BusinessIdType } from "@/lib/business-id-config";
const m=vi.hoisted(()=>({lock:vi.fn(),advisory:vi.fn(),update:vi.fn(),reserve:vi.fn(),transaction:vi.fn()}));
vi.mock("@/lib/prisma",()=>({prisma:{$transaction:m.transaction}}));
import { generateBusinessId, BusinessIdError, rejectManualBusinessId } from "@/lib/business-ids";
import type { Prisma } from "@prisma/client";
const tx={$queryRaw:m.lock,$executeRaw:m.advisory,businessIdCounter:{update:m.update},businessId:{create:m.reserve}} as unknown as Prisma.TransactionClient;
const state=(type:BusinessIdType)=>({type,range_start:config[type].start,range_end:config[type].end,initial_current:config[type].initialCurrent,current:config[type].initialCurrent});
beforeEach(()=>{vi.resetAllMocks();m.lock.mockResolvedValue([state("CS")]);m.transaction.mockImplementation(async work=>work(tx));});
describe("exact Savo business ID policy",()=>{
 it.each(types)("uses the specified first %s ID and five digits",type=>{
  const n=config[type].initialCurrent+1;const id=formatBusinessId(type,n);
  expect(id).toBe(`STPL${type}${String(n).padStart(5,"0")}`);expect(id).toHaveLength(11);expect(parseBusinessId(id,type)).toEqual({type,number:n});
 });
 it("matches the requested seed examples exactly",()=>{
  expect(formatBusinessId("CS",1437)).toBe("STPLCS01437");expect(formatBusinessId("PR",2684)).toBe("STPLPR02684");expect(formatBusinessId("IN",5148)).toBe("STPLIN05148");
  expect(types).toEqual(["CS","PR","IN","LD","QP","QT","CT","SA","ND","PO","RC","CN","VN","TK"]);
 });
 it("has no overlapping numeric ranges and does not allocate reserved gaps",()=>{
  for(const a of types)for(const b of types)if(a!==b)expect(config[a].end<config[b].start||config[b].end<config[a].start).toBe(true);
  expect(parseBusinessId("STPLPR01452")).toBeNull();expect(parseBusinessId("STPLIN02684")).toBeNull();
  expect(parseBusinessId("STPLEX10000")).toBeNull();expect(parseBusinessId("STPLEM01437")).toBeNull();
 });
 it.each(["STPLCS1437","stplcs01437","STPLCS014370","STPLCS01437 "," STPLCS01437","STPLCS01399","STPLCS02000","STPLIN07000","SAVO-2026-001","STPL__01437"])("rejects invalid/cross-range shape %s",value=>expect(parseBusinessId(value)).toBeNull());
 it("rejects the wrong expected category even when the ID is otherwise valid",()=>expect(parseBusinessId("STPLCS01437","PR")).toBeNull());
 it("never treats a predictable business ID as a public receipt/access token",()=>{expect(isValidEnquiryReference("STPLLD07321")).toBe(false);});
 it("treats seeds as offsets and reports finite capacity honestly",()=>{
  expect(businessIdCapacity("CS",1436)).toMatchObject({next:"STPLCS01437",remaining:563,issuedSinceCutover:0});
  expect(businessIdCapacity("CS",1999)).toMatchObject({next:null,remaining:0,needsAttention:true});
  expect(()=>formatBusinessId("CS",2000)).toThrow();expect(()=>businessIdCapacity("CS",1435)).toThrow();
 });
});
describe("transactional server-side allocator",()=>{
 it.each(types)("locks, advances and reserves the next %s ID",async type=>{
  m.lock.mockResolvedValue([state(type)]);const id=await generateBusinessId(type,tx);
  expect(id).toBe(formatBusinessId(type,config[type].initialCurrent+1));
  expect(m.lock.mock.calls[0][0].join("")).toContain("FOR UPDATE");
  expect(m.update).toHaveBeenCalledWith({where:{type},data:{current:config[type].initialCurrent+1}});
  expect(m.reserve).toHaveBeenCalledWith({data:{id,type,referenceNumber:config[type].initialCurrent+1}});
  expect(m.lock.mock.invocationCallOrder[0]).toBeLessThan(m.update.mock.invocationCallOrder[0]);expect(m.update.mock.invocationCallOrder[0]).toBeLessThan(m.reserve.mock.invocationCallOrder[0]);
 });
 it("supports durable standalone reservations without side effects in retry callbacks",async()=>{
  await expect(generateBusinessId("CS")).resolves.toBe("STPLCS01437");expect(m.transaction).toHaveBeenCalledWith(expect.any(Function),expect.objectContaining({isolationLevel:"ReadCommitted"}));
 });
 it("rejects every supplied manual reference, including non-string payloads",()=>{for(const value of ["STPLIN02684","SAVO-2026-001",123,{},new Blob(["forged"])])expect(()=>rejectManualBusinessId(value)).toThrow(/generated automatically/);expect(()=>rejectManualBusinessId(null)).not.toThrow();expect(()=>rejectManualBusinessId("")).not.toThrow();});
 it("never initializes a missing counter at runtime",async()=>{m.lock.mockResolvedValue([]);await expect(generateBusinessId("CS",tx)).rejects.toMatchObject({code:"NOT_READY"});expect(m.update).not.toHaveBeenCalled();expect(m.reserve).not.toHaveBeenCalled();});
 it("rejects an unknown type before querying the database",async()=>{await expect(generateBusinessId("EX" as BusinessIdType,tx)).rejects.toMatchObject({code:"UNKNOWN_TYPE"});expect(m.lock).not.toHaveBeenCalled();});
 it.each([{current:1435},{current:2000},{range_start:1000},{initial_current:1400}])("fails closed for corrupt/reset policy state %j",async change=>{m.lock.mockResolvedValue([{...state("CS"),...change}]);await expect(generateBusinessId("CS",tx)).rejects.toMatchObject({code:"INVALID_STATE"});expect(m.update).not.toHaveBeenCalled();});
 it("never overflows or borrows another category/gap",async()=>{m.lock.mockResolvedValue([{...state("CS"),current:1999}]);await expect(generateBusinessId("CS",tx)).rejects.toBeInstanceOf(BusinessIdError);expect(m.update).not.toHaveBeenCalled();});
});
