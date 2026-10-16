import { beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({id:vi.fn(),enquiry:vi.fn(),report:vi.fn(),mail:vi.fn()}));
vi.mock("@/lib/prisma",()=>({prisma:{projectEnquiry:{create:m.enquiry},bugReport:{create:m.report}}}));
vi.mock("@/lib/business-ids",async original=>({...await original<typeof import("@/lib/business-ids")>(),generateBusinessId:m.id,businessTransaction:async(work:(tx:unknown)=>Promise<unknown>)=>work({projectEnquiry:{create:m.enquiry},bugReport:{create:m.report}})}));
vi.mock("@/lib/captcha",()=>({enforceCaptcha:async()=>({ok:true})}));vi.mock("@/lib/rate-limit",()=>({rateLimit:()=>({ok:true})}));
vi.mock("@/lib/mail",()=>({sendTemplateNow:m.mail,teamEmail:()=>"team@example.invalid"}));vi.mock("@/lib/livechat/pubsub",()=>({publish:vi.fn()}));vi.mock("@/lib/logger",()=>({logger:{info:vi.fn(),error:vi.fn()}}));
import { POST as enquiry } from "@/app/api/enquiries/route";
import { POST as callback } from "@/app/api/callback/route";
import { POST as report } from "@/app/api/bug-reports/route";
import { BusinessIdError } from "@/lib/business-ids";
import { clientWelcome } from "@/lib/mail/templates";
import { templateEntry } from "@/lib/mail/registry";
const req=(data:unknown)=>new Request("http://localhost/api/test",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});
beforeEach(()=>{vi.resetAllMocks();m.id.mockImplementation(async(type:string)=>type==="LD"?"STPLLD07321":"STPLTK19487");m.enquiry.mockImplementation(async({data})=>({...data,id:"enquiry-fixture"}));m.report.mockResolvedValue({});});
describe("business identification at intake boundaries",()=>{
 it("assigns LD inside the same write and ignores forged identity fields",async()=>{
  expect((await enquiry(req({name:"Test Lead",email:"lead@example.invalid",projectType:"Website",message:"A valid test enquiry body.",businessId:"STPLCS01437"}))).status).toBe(200);
  expect(m.id).toHaveBeenCalledWith("LD",expect.any(Object));expect(m.enquiry.mock.calls[0][0].data).toMatchObject({businessId:"STPLLD07321",reference:"STPLLD07321"});
  expect(m.mail.mock.calls.find(c=>c[0]==="teamEnquiry")?.[2].reference).toBe("STPLLD07321");
 });
 it("uses the independent LD sequence for callbacks too",async()=>{
  expect((await callback(req({name:"Callback test",country:"India",phone:"9876543210"}))).status).toBe(200);
  expect(m.id).toHaveBeenCalledWith("LD",expect.any(Object));expect(m.enquiry.mock.calls[0][0].data.reference).toBe("STPLLD07321");
 });
 it("does not spend a business number on honeypots or failed validation",async()=>{
  await enquiry(req({name:"Test Lead",email:"lead@example.invalid",projectType:"Website",message:"Valid message length.",website:"bot"}));await callback(req({phone:"bad"}));expect(m.id).not.toHaveBeenCalled();
 });
 it("does not number HR applications as sales leads or change employee IDs",async()=>{
  expect((await enquiry(req({name:"Applicant Test",email:"applicant@example.invalid",projectType:"General application",source:"careers:hr-intern",message:"A sufficient introduction.",details:{form:"careers",role:"HR Intern",city:"Test City",skills:["CV screening"],experience:"Fresher",notice:"To be discussed",consent:true}}))).status).toBe(200);
  expect(m.id).not.toHaveBeenCalled();expect(m.enquiry.mock.calls[0][0].data.businessId).toBeNull();
 });
 it("assigns TK only to human support requests, not automatic telemetry",async()=>{
  expect((await report(req({type:"404",message:"Synthetic",url:"https://example.invalid/missing"}))).status).toBe(201);expect(m.id).not.toHaveBeenCalled();
  expect((await report(req({type:"user_report",message:"Synthetic support",url:"https://example.invalid/contact"}))).status).toBe(201);expect(m.id).toHaveBeenCalledWith("TK",expect.any(Object));expect(m.report.mock.calls[1][0].data.businessId).toBe("STPLTK19487");
 });
 it("fails without a record or email when numbering is unavailable/exhausted",async()=>{
  m.id.mockRejectedValue(new BusinessIdError("EXHAUSTED","Test range exhausted"));expect((await enquiry(req({name:"Test Lead",email:"lead@example.invalid",projectType:"Website",message:"A valid enquiry for rejection."}))).status).toBe(503);expect(m.enquiry).not.toHaveBeenCalled();expect(m.mail).not.toHaveBeenCalled();
  expect((await report(req({type:"user_report",message:"Support test",url:"https://example.invalid/contact"}))).status).toBe(503);expect(m.report).not.toHaveBeenCalled();
 });
 it("includes assigned client IDs in welcome HTML/plain text and uses new invoice preview references",()=>{
  const mail=clientWelcome("Example","client@example.invalid","test-password","STPLCS01437");expect(mail.html).toContain("STPLCS01437");expect(mail.text).toContain("Client ID: STPLCS01437");
  for(const key of ["invoiceIssued","invoicePaid","invoiceOverdue"])expect(templateEntry(key)!.vars.number).toBe("STPLIN05148");
 });
});
