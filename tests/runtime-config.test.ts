import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
const script=fileURLToPath(new URL("../scripts/verify-runtime-env.mjs",import.meta.url));
const live={NODE_ENV:"production",NEXT_PUBLIC_CONTENT_MODE:"production",MAIL_DELIVERY_MODE:"off",ENQUIRY_IP_SALT:"test-only-private-salt-at-least-32-characters",DATABASE_URL:"postgresql://u:private-db-password@localhost/test?connection_limit=2&pool_timeout=10"};
function run(profile:string,e:Record<string,string|undefined>={}){return spawnSync(process.execPath,[script,profile],{env:{PATH:process.env.PATH,NODE_ENV:"test",...e},encoding:"utf8"});}
afterEach(()=>vi.unstubAllEnvs());
describe("redacted release preflight",()=>{
 it("allows safe preview without optional integrations",()=>{expect(run("preview").status).toBe(0);});
 it("allows explicitly configured live, without connecting to its database",()=>{expect(run("live",live).status).toBe(0);});
 it("rejects absent live essentials without echoing secrets",()=>{
  const r=run("live",{...live,DATABASE_URL:"invalid-private-db-password",ENQUIRY_IP_SALT:"too-short-secret"});expect(r.status).toBe(1);expect(r.stderr).toContain("LIVE_DATABASE_URL_REQUIRED");expect(r.stderr).not.toContain("private-db-password");expect(r.stderr).not.toContain("too-short-secret");
 });
 it.each(["connection_limit","pool_timeout"])("requires positive explicit DB %s",key=>{const url=new URL(live.DATABASE_URL);url.searchParams.delete(key);expect(run("live",{...live,DATABASE_URL:url.href}).status).toBe(1);});
 it.each(["0","-1","NaN","1.2"])("rejects invalid DB connection budget %s",value=>{const url=new URL(live.DATABASE_URL);url.searchParams.set("connection_limit",value);expect(run("live",{...live,DATABASE_URL:url.href}).status).toBe(1);});
 it.each([{MAIL_DELIVERY_MODE:"live"},{NEXT_PUBLIC_INDEXABLE:"true"},{NEXT_PUBLIC_RECAPTCHA_SITE_KEY:"site-only"},{RECAPTCHA_SECRET_KEY:"secret-only"},{MAIL_USER:"only-user"},{MAIL_PORT:"999999"},{MAIL_DELIVERY_MODE:"invalid"}])("rejects unsafe/partial preview configuration",e=>{expect(run("preview",e).status).toBe(1);});
 it("requires explicit live mail intention",()=>{const e={...live,MAIL_DELIVERY_MODE:""};expect(run("live",e).stderr).toContain("LIVE_MAIL_MODE_EXPLICIT_REQUIRED");});
 it("never exposes SMTP credentials on errors",()=>{const r=run("live",{...live,MAIL_DELIVERY_MODE:"live",MAIL_PASS:"private-smtp-password"});expect(r.status).toBe(1);expect(r.stderr).not.toContain("private-smtp-password");});
 it("rejects unknown profile",()=>{expect(run("production").status).toBe(2);});
});
describe("public/server config separation",()=>{
 it("public config has no private values even on the server",async()=>{
  vi.stubEnv("DATABASE_URL","postgresql://u:private-secret@localhost/test");vi.stubEnv("ENQUIRY_IP_SALT","private-secret");vi.resetModules();const {env}=await import("@/lib/env");expect(Object.keys(env).sort()).toEqual(["NEXT_PUBLIC_GA_ID","NEXT_PUBLIC_SITE_URL"]);expect(JSON.stringify(env)).not.toContain("private-secret");
 });
 it("blank optional DATABASE_URL is treated as unconfigured",async()=>{vi.stubEnv("DATABASE_URL","");vi.resetModules();const {serverEnv}=await import("@/lib/server-env");expect(serverEnv.DATABASE_URL).toBeUndefined();});
 it("invalid server configuration errors contain field names, not URL credentials",async()=>{vi.stubEnv("DATABASE_URL","mysql://user:private-secret@localhost/test");vi.resetModules();await expect(import("@/lib/server-env")).rejects.toThrow("Invalid server configuration: DATABASE_URL");});
 it("the preflight script reads no dotenv files",()=>{expect(execFileSync(process.execPath,[script,"preview"],{env:{NODE_ENV:"test"},encoding:"utf8"})).toContain("passed configuration checks only");});
});
