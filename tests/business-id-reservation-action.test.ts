import { beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({user:vi.fn(),reserve:vi.fn(),limit:vi.fn()}));
vi.mock("@/lib/auth",()=>({getAdminUser:m.user}));
vi.mock("@/lib/rate-limit",()=>({rateLimit:m.limit}));
vi.mock("@/lib/business-ids",async original=>({...await original<typeof import("@/lib/business-ids")>(),reserveBusinessId:m.reserve}));
import { reserveBusinessIdAction } from "@/app/admin/(protected)/business-ids/actions";
import { BusinessIdError } from "@/lib/business-ids";
const key="11111111-1111-4111-8111-111111111111";
beforeEach(()=>{vi.resetAllMocks();m.user.mockResolvedValue({id:"admin-owner-123",role:"admin"});m.limit.mockReturnValue({ok:true});m.reserve.mockResolvedValue({businessId:"STPLIN05148",consumedAt:null});});
describe("authenticated pre-creation ID action",()=>{
 it("returns an exact reserved ID scoped to the current administrator",async()=>{expect(await reserveBusinessIdAction("IN",key)).toEqual({ok:true,id:"STPLIN05148",used:false});expect(m.reserve).toHaveBeenCalledWith("IN","admin-owner-123",key);});
 it("recognizes a consumed browser draft without silently reusing its ID",async()=>{m.reserve.mockResolvedValue({businessId:"STPLIN05148",consumedAt:new Date()});expect(await reserveBusinessIdAction("IN",key)).toMatchObject({ok:true,used:true});});
 it("never allocates anonymously",async()=>{m.user.mockResolvedValue(null);expect(await reserveBusinessIdAction("IN",key)).toMatchObject({ok:false});expect(m.reserve).not.toHaveBeenCalled();});
 it("enforces the same client-section permission as creation",async()=>{m.user.mockResolvedValue({id:"editor-fixture",role:"editor",permissions:["content"]});expect(await reserveBusinessIdAction("IN",key)).toMatchObject({ok:false});expect(m.reserve).not.toHaveBeenCalled();});
 it.each([["LD",key],["EM",key],["IN","not-a-draft-key"]])("rejects unsupported/untrusted input %s",async(type,token)=>{expect(await reserveBusinessIdAction(type,token)).toMatchObject({ok:false});expect(m.reserve).not.toHaveBeenCalled();});
 it("rate-limits before reserving a new number",async()=>{m.limit.mockReturnValue({ok:false});expect(await reserveBusinessIdAction("IN",key)).toMatchObject({ok:false});expect(m.reserve).not.toHaveBeenCalled();});
 it("exposes safe exhaustion/recovery guidance rather than raw database errors",async()=>{m.reserve.mockRejectedValue(new BusinessIdError("EXHAUSTED","Invoice range exhausted. Contact an administrator."));expect(await reserveBusinessIdAction("IN",key)).toMatchObject({ok:false,error:expect.stringContaining("exhausted")});m.reserve.mockRejectedValue(new Error("private database details"));expect(JSON.stringify(await reserveBusinessIdAction("IN",key))).not.toContain("private database");});
});
