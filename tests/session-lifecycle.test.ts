import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({
 admin:vi.fn(),session:vi.fn(),sessionCreate:vi.fn(),sessionDelete:vi.fn(),sessionUpdate:vi.fn(),audit:vi.fn(),
 client:vi.fn(),clientSession:vi.fn(),clientCreate:vi.fn(),employee:vi.fn(),employeeSession:vi.fn(),employeeCreate:vi.fn(),content:vi.fn(),
 verify:vi.fn(),set:vi.fn(),log:vi.fn(),rate:vi.fn(),
}));
vi.mock("@/lib/prisma",()=>({prisma:{
 adminUser:{findUnique:m.admin},adminSession:{findUnique:m.session,create:m.sessionCreate,delete:m.sessionDelete,update:m.sessionUpdate},auditLog:{create:m.audit},
 clientUser:{findUnique:m.client},clientSession:{findUnique:m.clientSession,create:m.clientCreate},
 employee:{findUnique:m.employee},employeeSession:{findUnique:m.employeeSession,create:m.employeeCreate},contentItem:{findMany:m.content},
}}));
vi.mock("next/headers",()=>({cookies:async()=>({get:()=>({value:"test-token"}),set:m.set}),headers:async()=>new Headers({"x-real-ip":"127.0.0.1"})}));
vi.mock("next/navigation",()=>({redirect:(path:string)=>{throw new Error(`REDIRECT:${path}`);}}));
vi.mock("react",async original=>({...await original<typeof import("react")>(),cache:<T>(fn:T)=>fn}));
vi.mock("@/lib/passwords",()=>({verifyPassword:m.verify,hashPassword:vi.fn(),DUMMY_PASSWORD_HASH:"dummy",passwordFitsBcrypt:()=>true}));
vi.mock("@/lib/rate-limit",()=>({rateLimit:m.rate}));
vi.mock("@/lib/captcha",()=>({enforceLoginCaptcha:async()=>({ok:true}),recordLoginFailure:vi.fn(),clearLoginFailures:vi.fn()}));
vi.mock("@/lib/logger",()=>({logger:{warn:m.log,info:m.log}}));
const user={id:"admin-id",email:"admin@example.test",name:"Admin",role:"admin",permissions:[],passwordHash:"real",employeeId:null,employee:null};
const row=()=>({id:"session-id",expiresAt:new Date(Date.now()+60_000),createdAt:new Date(),user:{...user}});
beforeEach(()=>{vi.clearAllMocks();m.verify.mockResolvedValue(true);m.rate.mockReturnValue({ok:true});m.sessionDelete.mockResolvedValue({});m.sessionCreate.mockResolvedValue({});m.audit.mockResolvedValue({});m.content.mockResolvedValue([]);});
afterEach(()=>vi.unstubAllEnvs());
describe("admin lifecycle",()=>{
 it.each(["exited","unknown"])("denies linked %s employees before creating sessions",async status=>{
  m.admin.mockResolvedValue({...user,employeeId:"emp",employee:{status}});
  const {login}=await import("@/lib/auth");expect(await login(user.email,"password",{ip:"ip"})).toEqual({ok:false,reason:"invalid"});expect(m.sessionCreate).not.toHaveBeenCalled();
 });
 it("denies broken linked employee relations",async()=>{
  m.admin.mockResolvedValue({...user,employeeId:"emp",employee:null});const {login}=await import("@/lib/auth");expect((await login(user.email,"password",{ip:"ip"})).ok).toBe(false);
 });
 it("preserves unlinked admin login, hashed tokens and secure cookies",async()=>{
  vi.stubEnv("NODE_ENV","production");m.admin.mockResolvedValue(user);const {login}=await import("@/lib/auth");expect((await login(user.email,"password",{ip:"ip"})).ok).toBe(true);
  expect(m.sessionCreate.mock.calls[0][0].data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  expect(m.set.mock.calls[0][2]).toMatchObject({secure:true,httpOnly:true,sameSite:"lax",path:"/"});
  expect(m.rate.mock.calls[1][0]).not.toContain(user.email);
 });
 it("does dummy work and does not log account existence for unknown email",async()=>{
  m.admin.mockResolvedValue(null);const {login}=await import("@/lib/auth");await login(user.email,"password",{ip:"ip"});expect(m.verify).toHaveBeenCalledWith("password","dummy");expect(m.log).toHaveBeenCalledWith("admin.login.failed");
 });
 it.each(["exited","unknown"])("revokes effective access on existing linked %s session",async status=>{
  m.session.mockResolvedValue({...row(),user:{...user,employeeId:"emp",employee:{status}}});const {getAdminUser}=await import("@/lib/auth");expect(await getAdminUser()).toBeNull();expect(m.sessionUpdate).not.toHaveBeenCalled();
 });
 it("denies unknown role on existing session",async()=>{m.session.mockResolvedValue({...row(),user:{...user,role:"owner"}});const {getAdminUser}=await import("@/lib/auth");expect(await getAdminUser()).toBeNull();});
 it("denies exact expiration and revoked rows",async()=>{
  vi.useFakeTimers();try{const {getAdminUser}=await import("@/lib/auth");m.session.mockResolvedValue({...row(),expiresAt:new Date()});expect(await getAdminUser()).toBeNull();expect(m.sessionDelete).toHaveBeenCalled();m.session.mockResolvedValue(null);expect(await getAdminUser()).toBeNull();}finally{vi.useRealTimers();}
 });
 it("caps legacy sliding sessions at the remembered cookie's 30-day absolute lifetime",async()=>{
  m.session.mockResolvedValue({...row(),createdAt:new Date(Date.now()-31*86400000)});const {getAdminUser}=await import("@/lib/auth");expect(await getAdminUser()).toBeNull();expect(m.sessionUpdate).not.toHaveBeenCalled();
 });
 it("returns only a public session DTO and queries no password hash",async()=>{m.session.mockResolvedValue(row());const {getAdminUser}=await import("@/lib/auth");expect(await getAdminUser()).toEqual({id:user.id,email:user.email,name:user.name,role:user.role,permissions:[]});expect(JSON.stringify(m.session.mock.calls[0])).not.toContain("passwordHash");});
});
describe("client lifecycle",()=>{
 it.each([null,{id:"client",active:false,passwordHash:"real"}])("unknown/inactive account does async work and creates no session",async client=>{
  m.client.mockResolvedValue(client);const {loginClient}=await import("@/lib/client-auth");expect((await loginClient("person@example.test","password")).ok).toBe(false);expect(m.verify).toHaveBeenCalledWith("password",client?.passwordHash??"dummy");expect(m.clientCreate).not.toHaveBeenCalled();expect(JSON.stringify(m.log.mock.calls)).not.toContain("person@example.test");
 });
 it("allows active login and uses an email hash in rate keys",async()=>{m.client.mockResolvedValue({id:"client",active:true,passwordHash:"real"});const {loginClient}=await import("@/lib/client-auth");expect(await loginClient("person@example.test","password")).toEqual({ok:true});expect(m.clientCreate).toHaveBeenCalled();expect(m.rate.mock.calls[1][0]).not.toContain("person@example.test");});
 it("denies inactive session",async()=>{m.clientSession.mockResolvedValue({expiresAt:new Date(Date.now()+10000),client:{active:false}});const {getClientUser}=await import("@/lib/client-auth");expect(await getClientUser()).toBeNull();});
 it("fails closed on session storage failure",async()=>{m.clientSession.mockRejectedValue(new Error("DB private"));const {getClientUser}=await import("@/lib/client-auth");expect(await getClientUser()).toBeNull();});
});
describe("employee lifecycle",()=>{
 const employee=(status="active",linked=true)=>({id:"emp",name:"Employee",employeeCode:"STPL0301IN",status,joiningDate:new Date("2025-01-01"),lastWorkingDay:null,leaves:[],panelUsers:linked?[{id:"panel",passwordHash:"real"}]:[]});
 function credentials(){const f=new FormData();f.set("email","employee@example.test");f.set("password","password");return f;}
 it.each([null,employee("exited"),employee("active",false)])("denies unavailable/exited/unlinked logins with the same message",async e=>{
  m.employee.mockResolvedValue(e);const {employeeLoginAction}=await import("@/app/(site)/employee-portal/actions");await expect(employeeLoginAction(credentials())).rejects.toThrow("Email or password is incorrect.");expect(m.verify).toHaveBeenCalled();expect(m.employeeCreate).not.toHaveBeenCalled();expect(JSON.stringify(m.log.mock.calls)).not.toContain("employee@example.test");
 });
 it("preserves valid employee login",async()=>{m.employee.mockResolvedValue(employee());const {employeeLoginAction}=await import("@/app/(site)/employee-portal/actions");await expect(employeeLoginAction(credentials())).rejects.toThrow("REDIRECT:/employee-portal/dashboard");expect(m.employeeCreate).toHaveBeenCalled();expect(m.set).toHaveBeenCalled();});
 it.each([employee("exited"),employee("active",false),employee("unknown")])("denies existing revoked dashboard before authored queries",async e=>{
  m.employeeSession.mockResolvedValue({expiresAt:new Date(Date.now()+10000),employee:e});const {default:Dashboard}=await import("@/app/(site)/employee-portal/dashboard/page");await expect(Dashboard()).rejects.toThrow("REDIRECT:/employee-portal");expect(m.content).not.toHaveBeenCalled();
 });
 it("preserves valid employee dashboard",async()=>{m.employeeSession.mockResolvedValue({expiresAt:new Date(Date.now()+10000),employee:employee()});const {default:Dashboard}=await import("@/app/(site)/employee-portal/dashboard/page");expect((await Dashboard()).type).toBe("main");expect(m.content).toHaveBeenCalled();});
});
