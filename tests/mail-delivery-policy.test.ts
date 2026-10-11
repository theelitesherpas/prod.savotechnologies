import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({transport:vi.fn(),send:vi.fn(),log:vi.fn()}));
vi.mock("nodemailer",()=>({default:{createTransport:m.transport}}));
vi.mock("@/lib/prisma",()=>({prisma:null}));
vi.mock("@/lib/logger",()=>({logger:{info:m.log,error:m.log}}));
beforeEach(()=>{vi.clearAllMocks();vi.resetModules();vi.stubEnv("MAIL_HOST","smtp.invalid");vi.stubEnv("MAIL_DELIVERY_MODE","");vi.stubEnv("NODE_ENV","test");vi.stubEnv("NEXT_PUBLIC_CONTENT_MODE","demo");m.transport.mockReturnValue({sendMail:m.send});m.send.mockResolvedValue({});});
afterEach(()=>vi.unstubAllEnvs());
const template={subject:"private customer subject",html:"private message",text:"private message"};
describe("explicit email delivery policy",()=>{
 it.each([
  {mode:"",node:"production",content:"production"},
  {mode:"off",node:"production",content:"production"},
  {mode:"live",node:"test",content:"production"},
  {mode:"live",node:"production",content:"demo"},
  {mode:"invalid",node:"production",content:"production"},
 ])("never creates SMTP transport in disabled/demo/test states",async e=>{vi.stubEnv("MAIL_DELIVERY_MODE",e.mode);vi.stubEnv("NODE_ENV",e.node);vi.stubEnv("NEXT_PUBLIC_CONTENT_MODE",e.content);const {sendMail}=await import("@/lib/mail");expect(await sendMail("private@example.test",template)).toBe(false);expect(m.transport).not.toHaveBeenCalled();expect(JSON.stringify(m.log.mock.calls)).not.toContain("private");});
 it("allows an explicitly enabled production send",async()=>{vi.stubEnv("MAIL_DELIVERY_MODE","live");vi.stubEnv("NODE_ENV","production");vi.stubEnv("NEXT_PUBLIC_CONTENT_MODE","production");const {sendMail}=await import("@/lib/mail");expect(await sendMail("private@example.test",template)).toBe(true);expect(m.send).toHaveBeenCalledTimes(1);expect(JSON.stringify(m.log.mock.calls)).not.toContain("private");});
 it("send failure is false, recoverable and does not log provider/recipient content",async()=>{vi.stubEnv("MAIL_DELIVERY_MODE","live");vi.stubEnv("NODE_ENV","production");vi.stubEnv("NEXT_PUBLIC_CONTENT_MODE","production");m.send.mockRejectedValueOnce(new Error("private-provider-credential"));const {sendMail}=await import("@/lib/mail");expect(await sendMail("private@example.test",template)).toBe(false);expect(JSON.stringify(m.log.mock.calls)).not.toContain("private");expect(await sendMail("private@example.test",template)).toBe(true);});
});
