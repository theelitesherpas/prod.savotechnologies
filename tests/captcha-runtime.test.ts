import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captchaConfiguration, enforceCaptcha, enforceLoginCaptcha } from "@/lib/captcha";
vi.mock("@/lib/rate-limit",()=>({rateLimit:vi.fn(),rateCount:()=>0,clearRateLimit:vi.fn()}));
vi.mock("@/lib/logger",()=>({logger:{error:vi.fn()}}));
beforeEach(()=>{vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY","");vi.stubEnv("RECAPTCHA_SECRET_KEY","");vi.stubGlobal("fetch",vi.fn());});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe("CAPTCHA configuration and network bounds",()=>{
 it("keeps an explicitly unconfigured integration optional",async()=>{expect(captchaConfiguration()).toBe("off");expect(await enforceCaptcha("ip",null)).toEqual({ok:true});expect(fetch).not.toHaveBeenCalled();});
 it.each(["NEXT_PUBLIC_RECAPTCHA_SITE_KEY","RECAPTCHA_SECRET_KEY"])("partial %s setup fails safely for both forms and logins",async key=>{vi.stubEnv(key,"test-only");expect(captchaConfiguration()).toBe("invalid");expect((await enforceCaptcha("ip",null)).ok).toBe(false);expect((await enforceLoginCaptcha("admin","ip",null)).ok).toBe(false);expect(fetch).not.toHaveBeenCalled();});
 it("requires a token for every configured public form, including the first submission",async()=>{vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY","test-site");vi.stubEnv("RECAPTCHA_SECRET_KEY","test-secret");expect(await enforceCaptcha("ip",null)).toEqual({ok:false,captchaRequired:true});expect(fetch).not.toHaveBeenCalled();});
 it("uses HTTPS, a timeout and no raw IP transmission",async()=>{
  vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY","test-site");vi.stubEnv("RECAPTCHA_SECRET_KEY","test-secret");vi.mocked(fetch).mockResolvedValue(Response.json({success:true}));expect(await enforceCaptcha("203.0.113.10","test-token-12345")).toEqual({ok:true});
  const [url,init]=vi.mocked(fetch).mock.calls[0];expect(url).toBe("https://www.google.com/recaptcha/api/siteverify");expect(init?.signal).toBeInstanceOf(AbortSignal);expect(init?.cache).toBe("no-store");expect(String(init?.body)).not.toContain("remoteip");expect(String(init?.body)).not.toContain("203.0.113.10");
 });
 it.each(["true",false,null])( "requires boolean provider success, not truthiness",async success=>{vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY","site");vi.stubEnv("RECAPTCHA_SECRET_KEY","secret");vi.mocked(fetch).mockResolvedValue(Response.json({success}));expect((await enforceCaptcha("ip","test-token-12345")).ok).toBe(false);});
 it("rejects provider HTTP failure despite a success payload",async()=>{vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY","site");vi.stubEnv("RECAPTCHA_SECRET_KEY","secret");vi.mocked(fetch).mockResolvedValue(Response.json({success:true},{status:503}));expect((await enforceCaptcha("ip","test-token-12345")).ok).toBe(false);});
 it("recovers with an honest error on network timeout",async()=>{vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY","site");vi.stubEnv("RECAPTCHA_SECRET_KEY","secret");vi.mocked(fetch).mockRejectedValue(new Error("private-provider-details"));const result=await enforceCaptcha("ip","test-token-12345");expect(result.ok).toBe(false);expect(JSON.stringify(result)).not.toContain("private-provider-details");});
});
