import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicTelemetryPath, publicTelemetryUrl } from "@/lib/telemetry-policy";
const m=vi.hoisted(()=>({analytics:vi.fn(),report:vi.fn(),geo:vi.fn(),log:vi.fn()}));
vi.mock("@/lib/prisma",()=>({prisma:{analyticsEvent:{create:m.analytics},bugReport:{create:m.report}}}));
vi.mock("@/lib/geo",()=>({lookupGeo:m.geo}));
vi.mock("@/lib/rate-limit",()=>({rateLimit:()=>({ok:true})}));
vi.mock("@/lib/logger",()=>({logger:{error:m.log,info:vi.fn()}}));
beforeEach(()=>{vi.clearAllMocks();m.analytics.mockResolvedValue({});m.report.mockResolvedValue({});(globalThis as unknown as {__salesbotSessions?:Map<string,unknown>}).__salesbotSessions?.clear();});
function req(body:unknown){return new Request("http://localhost/api/test",{method:"POST",headers:{"content-type":"application/json","user-agent":"Mozilla/5.0","x-real-ip":"203.0.113.10"},body:JSON.stringify(body)});}
describe("private telemetry policy",()=>{
 it.each(["/meeting/private-token","/admin/clients","/portal/dashboard","/employee-portal/dashboard","/unsubscribe?email=private","/insights/preview/private","/case-studies/preview/private","/%6deeting/private","/public/../meeting/private","/MEETING/private"])("omits %s",path=>{expect(publicTelemetryPath(path)).toBeNull();expect(publicTelemetryUrl(`https://example.test${path}`)).toBeNull();});
 it("strips query/hash/URL credentials on public contexts",()=>{expect(publicTelemetryPath("/about?email=private#private")).toBe("/about");expect(publicTelemetryUrl("https://user:secret@example.test/about?email=private#private")).toBe("https://example.test/about");});
 it.each(["javascript:private","file:///private","//external.test","/%broken"])("rejects malformed/nonpublic context %s",value=>{expect(publicTelemetryPath(value)).toBeNull();expect(publicTelemetryUrl(value)).toBeNull();});
});
describe("bounded public collectors",()=>{
 it("stores a public beacon without query/hash or external IP lookup",async()=>{const {POST}=await import("@/app/api/analytics/collect/route");expect((await POST(req({type:"pageview",path:"/about?email=private#private",referrer:"https://example.test/meeting/private"}))).status).toBe(204);expect(m.analytics).toHaveBeenCalledTimes(1);const data=m.analytics.mock.calls[0][0].data;expect(data.path).toBe("/about");expect(data.referrer).toBeNull();expect(data.visitorHash).toMatch(/^[a-f0-9]{32}$/);expect(JSON.stringify(data)).not.toContain("203.0.113.10");expect(m.geo).not.toHaveBeenCalled();});
 it("drops private beacons",async()=>{const {POST}=await import("@/app/api/analytics/collect/route");await POST(req({type:"pageview",path:"/meeting/private-token"}));expect(m.analytics).not.toHaveBeenCalled();});
 it("drops entire reports from private pages",async()=>{const {POST}=await import("@/app/api/bug-reports/route");expect((await POST(req({url:"https://example.test/meeting/private-token",message:"private",details:"private"}))).status).toBe(204);expect(m.report).not.toHaveBeenCalled();});
 it("preserves public reports with sanitized URL context",async()=>{const {POST}=await import("@/app/api/bug-reports/route");expect((await POST(req({type:"404",message:"not found",url:"https://example.test/missing?secret=private#private",referrer:"https://example.test/unsubscribe?email=private"}))).status).toBe(201);expect(m.report.mock.calls[0][0].data).toMatchObject({url:"https://example.test/missing",referrer:null,type:"404"});});
 it.each([null,[],"text",{padding:"x".repeat(70_000)}])("invalid/oversized collector bodies never write",async body=>{const {POST:a}=await import("@/app/api/analytics/collect/route");const {POST:b}=await import("@/app/api/bug-reports/route");expect((await a(req(body))).status).toBe(204);await b(req(body));expect(m.analytics).not.toHaveBeenCalled();expect(m.report).not.toHaveBeenCalled();});
 it("accepts bounded multilingual diagnostic details",async()=>{const {POST}=await import("@/app/api/bug-reports/route");expect((await POST(req({url:"https://example.test/about",details:"界".repeat(8000),context:{userReport:"界".repeat(2000)}}))).status).toBe(201);});
 it("does not echo persistence error payloads to logs",async()=>{m.analytics.mockRejectedValue(new Error("private-token private-email"));const {POST}=await import("@/app/api/analytics/collect/route");await POST(req({type:"pageview",path:"/about"}));expect(JSON.stringify(m.log.mock.calls)).not.toContain("private-token");});
 it("SalesBot rejects oversized input before starting a conversation",async()=>{const {POST}=await import("@/app/api/agents/salesbot/demo/route");expect((await POST(req({message:"x".repeat(40_000)}))).status).toBe(400);});
 it("SalesBot enforces capacity before inserting a new session",async()=>{
  const {POST}=await import("@/app/api/agents/salesbot/demo/route");const {newSession}=await import("@/lib/salesbot");const sessions=(globalThis as unknown as {__salesbotSessions:Map<string,unknown>}).__salesbotSessions;
  for(let i=0;i<500;i++)sessions.set(`seed-${i}`,newSession(`seed-${i}`));
  expect((await POST(req({message:"hello"}))).status).toBe(200);expect(sessions.size).toBe(500);
 });
 it("SalesBot cannot keep a session alive beyond its 30-minute absolute lifetime",async()=>{
  const {POST}=await import("@/app/api/agents/salesbot/demo/route");const {newSession}=await import("@/lib/salesbot");const sessions=(globalThis as unknown as {__salesbotSessions:Map<string,unknown>}).__salesbotSessions;
  const session=newSession("expired-session");session.createdAt=Date.now()-30*60_000;session.updatedAt=Date.now();sessions.set(session.id,session);
  const response=await POST(req({sessionId:session.id,message:"hello"}));expect((await response.json()).sessionId).not.toBe(session.id);expect(sessions.has(session.id)).toBe(false);
 });
 it("SalesBot keeps bounded history while continuing its structured state",async()=>{
  const {POST}=await import("@/app/api/agents/salesbot/demo/route");let id:string|undefined;
  for(let i=0;i<30;i++){const res=await POST(req({sessionId:id,message:"hello"}));expect(res.status).toBe(200);id=(await res.json()).sessionId;}
  const state=(globalThis as unknown as {__salesbotSessions:Map<string,{transcript:unknown[];turns:number}>}).__salesbotSessions.get(id!);expect(state?.transcript.length).toBe(40);expect(state?.turns).toBe(30);
 });
});
