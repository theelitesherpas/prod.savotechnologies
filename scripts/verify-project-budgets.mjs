/** LOCAL ONLY. Start the local server with MAIL_DELIVERY_MODE=off.
 * MAIL_DELIVERY_MODE=off node --env-file=.env --env-file=.env.local scripts/verify-project-budgets.mjs
 * Creates synthetic admin/client sessions and billing records; cleans up in finally.
 */
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright-core";
const base=process.env.BASE_URL||"http://localhost:3000";
const local=new Set(["localhost","127.0.0.1","[::1]"]);
assert(local.has(new URL(base).hostname)&&local.has(new URL(process.env.DATABASE_URL).hostname),"Refusing non-local fixtures");
assert(process.env.MAIL_DELIVERY_MODE==="off","Mail must be disabled in both this script AND the local server");
const p=new PrismaClient(); const browser=await chromium.launch(); const owners=[]; let operator;
const key=`QA-${randomBytes(4).toString("hex").toUpperCase()}`; const checks=[]; const errors=[]; const dir="tmp/project-budget-review";
const ok=(condition,label)=>{assert(condition,label);checks.push(label);};
await mkdir(dir,{recursive:true});
async function context(cookie,owner){const c=await browser.newContext({viewport:{width:1440,height:1000}});const token=randomBytes(32).toString("hex");
 if(cookie==="savo_admin")await p.adminSession.create({data:{userId:owner,tokenHash:createHash("sha256").update(token).digest("hex"),expiresAt:new Date(Date.now()+3600000)}});
 else await p.clientSession.create({data:{clientId:owner,tokenHash:createHash("sha256").update(token).digest("hex"),expiresAt:new Date(Date.now()+3600000)}});
 await c.addCookies([{name:cookie,value:token,url:base,httpOnly:true,sameSite:"Lax"}]);await c.route("**/api/analytics/collect",r=>r.fulfill({status:204}));
 c.on("page",page=>page.on("pageerror",e=>errors.push(e.message)));return c;}
async function visit(page,path){await page.goto(`${base}${path}`,{waitUntil:"domcontentloaded",timeout:60000});await page.locator("main h1").waitFor({state:"visible"});await page.waitForFunction(()=>[...document.querySelectorAll("main form")].every(form=>Object.keys(form).some(k=>k.startsWith("__reactProps"))));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function snapshot(page,name){await page.evaluate(()=>document.fonts.ready);ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}: no horizontal overflow`);await page.screenshot({path:`${dir}/${name}.png`,fullPage:true,style:"[inert],[inert] *{visibility:hidden!important}"});}
async function submit(page,button,url){const path=new URL(page.url()).pathname;const response=page.waitForResponse(r=>r.request().method()==="POST"&&new URL(r.url()).pathname===path,{timeout:30000});await button.click();await (await response).finished();await page.waitForURL(url,{timeout:30000});}
try{
 operator=await p.adminUser.create({data:{email:`${key}-admin@example.invalid`,name:"Synthetic Project Review Admin",role:"admin",passwordHash:"local-session-fixture-no-password"}});
 for(const name of ["Synthetic Budget Client","Synthetic Other Client"]){const c=await p.clientUser.create({data:{name,email:`${key}-${owners.length}@example.invalid`,company:"Synthetic review only — not a real customer",passwordHash:"local-session-fixture-no-password"}});owners.push(c.id);}
 const admin=await context("savo_admin",operator.id);const client=await context("savo_client",owners[0]);const a=await admin.newPage();const c=await client.newPage();
 const foreign=await p.clientProject.create({data:{clientId:owners[1],title:"FOREIGN-DO-NOT-EXPOSE",code:`${key}-FOREIGN`,currency:"EUR"}});
 await visit(a,"/admin/projects");
 await a.getByLabel("Client",{exact:true}).selectOption(owners[0]);await a.getByLabel("Project title",{exact:true}).fill("Synthetic connected project");await a.getByLabel("Reference code",{exact:false}).fill(`${key}-PROJECT`);
 await a.getByLabel("Project description",{exact:true}).fill("Synthetic agreed scope for budget and delivery verification. Not a real project.");
 await a.getByLabel("Fixed base budget",{exact:true}).fill("1000.00");await a.getByLabel("Currency",{exact:true}).selectOption("USD");await a.getByLabel("Estimated delivery date",{exact:true}).fill("2027-01-30");
 await a.locator('[id^="ms-title-"]').first().fill("Discovery and design");await a.locator('[id^="ms-cost-"]').first().fill("400.00");
 await a.getByRole("button",{name:"Add milestone",exact:true}).click();await a.locator('[id^="ms-title-"]').nth(1).fill("Implementation and launch");await a.locator('[id^="ms-cost-"]').nth(1).fill("599.99");
 ok(await a.getByRole("button",{name:"Create project",exact:true}).isDisabled(),"under-budget allocation cannot be submitted by ordinary UI");
 await a.locator('[id^="ms-cost-"]').nth(1).fill("600.01");ok(await a.getByRole("button",{name:"Create project",exact:true}).isDisabled(),"over-budget allocation cannot be submitted by ordinary UI");
 // Bypass only the disabled submit button, not authentication or server checks.
 await a.evaluate(()=>document.querySelector('input[name="milestones"]').closest("form").requestSubmit());
 await a.getByText("Milestone costs must add up exactly",{exact:false}).waitFor();ok(await p.clientProject.count({where:{code:`${key}-PROJECT`}})===0,"server rejects forged over-budget plan atomically");
 await a.getByLabel("Client",{exact:true}).selectOption(owners[0]);await a.getByLabel("Project title",{exact:true}).fill("Synthetic connected project");await a.getByLabel("Reference code",{exact:false}).fill(`${key}-PROJECT`);
 await a.getByLabel("Project description",{exact:true}).fill("Synthetic agreed scope for budget and delivery verification. Not a real project.");await a.getByLabel("Fixed base budget",{exact:true}).fill("1000.00");await a.getByLabel("Currency",{exact:true}).selectOption("USD");await a.getByLabel("Estimated delivery date",{exact:true}).fill("2027-01-30");
 await a.locator('[id^="ms-title-"]').first().fill("Discovery and design");await a.locator('[id^="ms-cost-"]').first().fill("400.00");if(await a.locator('[id^="ms-cost-"]').count()<2)await a.getByRole("button",{name:"Add milestone",exact:true}).click();await a.locator('[id^="ms-title-"]').nth(1).fill("Implementation and launch");await a.locator('[id^="ms-cost-"]').nth(1).fill("600.00");
 await submit(a,a.getByRole("button",{name:"Create project",exact:true}),/\/admin\/projects\/[^/?]+\?saved=1/);
 let project=await p.clientProject.findUnique({where:{code:`${key}-PROJECT`},include:{milestones:true}});assert(project);const id=project.id;
 ok(project.budget===100000&&project.currency==="USD"&&project.milestones.reduce((n,m)=>n+m.amount,0)===100000,"project and all budgeted milestones committed together");
 await a.locator('[id^="ms-status-"]').first().selectOption("done");await submit(a,a.getByRole("button",{name:"Save project and plan",exact:true}),new RegExp(`/admin/projects/${id}\\?saved=1`));
 project=await p.clientProject.findUnique({where:{id},include:{milestones:true}});ok(project.progress===40,"done module updates delivery progress by allocated cost");
 // Fresh navigation prevents same-URL waitForURL resolving before the save.
 await visit(a,`/admin/projects/${id}`);await a.getByLabel("Project description",{exact:true}).fill("Synthetic scope edited after creation, visible to the client.");await a.getByLabel("Estimated delivery date",{exact:true}).fill("2027-02-15");
 await submit(a,a.getByRole("button",{name:"Save project and plan",exact:true}),new RegExp(`/admin/projects/${id}\\?saved=1`));
 project=await p.clientProject.findUnique({where:{id},include:{milestones:true}});ok(project.summary.includes("scope edited after creation"),`edited project description persisted: ${project.summary}`);
 await visit(c,`/portal/projects/${id}`);ok((await c.locator("main").innerText()).includes("scope edited after creation"),"client receives edited description");ok((await c.locator("main").innerText()).includes("15 Feb 2027"),"client receives edited estimated delivery date");
 await visit(a,`/admin/projects/${id}`);
 const stalePage=await admin.newPage();await visit(stalePage,`/admin/projects/${id}`);const statusForm=a.locator("form").filter({has:a.locator(`select[id="delivery-${project.milestones[1].id}"]`)});
 await statusForm.locator('select[name="status"]').selectOption("in_progress");await submit(a,statusForm.getByRole("button",{name:"Update status",exact:true}),new RegExp(`/admin/projects/${id}\\?saved=milestone`));
 await submit(stalePage,stalePage.getByRole("button",{name:"Save project and plan",exact:true}),/\?e=/);await stalePage.getByText("changed while you were editing",{exact:false}).waitFor();await stalePage.close();checks.push("stale plan cannot overwrite a concurrent module status change");
 await visit(a,`/admin/projects/${id}`);await a.getByLabel("Work title",{exact:true}).fill("Additional CRM integration");await a.getByLabel("Additional cost (project currency)",{exact:true}).fill("200.00");await a.getByLabel("Scope description",{exact:true}).fill("Synthetic additional work item, visible to the client.");
 await submit(a,a.getByRole("button",{name:"Add additional work",exact:true}),new RegExp(`/admin/projects/${id}\\?saved=additional`));
 project=await p.clientProject.findUnique({where:{id},include:{milestones:true}});ok(project.progress===33&&project.milestones.some(m=>m.scope==="additional"&&m.amount===20000),"additional work increases agreed total and recomputes progress");
 await visit(c,`/portal/projects/${id}`);ok((await c.locator("main").innerText()).includes("Additional CRM integration"),"client receives itemised additional work");ok((await c.locator("main").innerText()).includes("1,200"),"client sees base plus additional agreed cost");
 for(const width of [1440,390,320]){await a.setViewportSize({width,height:1000});await c.setViewportSize({width,height:1000});await visit(a,`/admin/projects/${id}`);await visit(c,`/portal/projects/${id}`);await snapshot(a,`admin-${width}`);await snapshot(c,`client-${width}`);}
 async function invoice(amount,status,suffix){await visit(a,`/admin/invoices?client=${owners[0]}`);await a.locator('select[name="clientId"]').selectOption(owners[0]);ok(!(await a.locator('select[name="projectId"]').innerText()).includes("FOREIGN-DO-NOT-EXPOSE"),"invoice project dropdown excludes other clients");await a.locator('select[name="projectId"]').selectOption(id);ok(await a.locator('input[name="currency"]').inputValue()==="USD","invoice currency follows project");await a.locator('input[name="number"]').fill(`${key}-${suffix}`);await a.locator('input[name="amountMajor"]').fill(amount);await a.locator('select[name="status"]').selectOption(status);await submit(a,a.getByRole("button",{name:"Create invoice",exact:true}),/\/admin\/invoices\?saved=created/);return p.invoice.findUnique({where:{number:`${key}-${suffix}`}});}
 await invoice("400.00","paid","FIRST");project=await p.clientProject.findUnique({where:{id}});ok(project.status!=="delivered","first paid partial invoice does not prematurely complete full project");
 const second=await invoice("800.00","sent","SECOND");assert(second);
 async function markPaid(number){await visit(a,"/admin/invoices");const row=a.getByRole("listitem").filter({hasText:number});await row.getByRole("button",{name:"Mark paid",exact:true}).click();await submit(a,a.getByRole("button",{name:"Yes, mark paid",exact:true}),/\/admin\/invoices\?saved=paid/);}
 await markPaid(second.number);project=await p.clientProject.findUnique({where:{id}});ok(project.status==="delivered"&&project.completedByPayment&&project.progress===33,"full agreed payment completes project without falsifying delivery progress");
 await visit(a,`/admin/invoices/${second.id}`);await a.locator('select[name="status"]').selectOption("sent");await submit(a,a.getByRole("button",{name:"Save invoice",exact:true}),/\/admin\/invoices\?saved=1/);
 project=await p.clientProject.findUnique({where:{id}});ok(project.status==="in_progress"&&!project.completedByPayment,"reversing payment reopens auto-completed project");
 await markPaid(second.number);await visit(a,`/admin/projects/${id}`);
 const extraEditor=a.locator("details").filter({has:a.locator("summary").filter({hasText:"Additional CRM integration"})});await extraEditor.locator("summary").click();await extraEditor.getByLabel("Additional cost (project currency)",{exact:true}).fill("250.00");await submit(a,extraEditor.getByRole("button",{name:"Save additional work",exact:true}),new RegExp(`/admin/projects/${id}\\?saved=additional`));
 project=await p.clientProject.findUnique({where:{id},include:{milestones:true}});ok(project.status==="in_progress"&&project.budget===100000&&project.milestones.find(m=>m.scope==="additional").amount===25000,"editing additional work reopens payment-completed project without changing its fixed base budget");
 await visit(a,`/admin/projects/${id}`);await a.getByRole("button",{name:"Cancel project",exact:true}).click();await submit(a,a.getByRole("button",{name:"Confirm cancellation",exact:true}),new RegExp(`/admin/projects/${id}\\?saved=1`));
 await invoice("50.00","paid","EXCESS");project=await p.clientProject.findUnique({where:{id}});ok(project.status==="cancelled","cancelled project cannot be reactivated by payments");
 await visit(a,`/admin/projects/${id}`);await a.getByRole("button",{name:"Complete project",exact:true}).click();await submit(a,a.getByRole("button",{name:"Confirm completion",exact:true}),new RegExp(`/admin/projects/${id}\\?saved=1`));
 project=await p.clientProject.findUnique({where:{id}});ok(project.status==="delivered"&&!project.completedByPayment,"admin can explicitly complete a project");
 ok(await p.sentEmail.count({where:{toEmail:{contains:key}}})===0,"no real emails sent during local integration checks");ok(errors.length===0,`no browser errors: ${errors.join("; ")}`);
 await writeFile(`${dir}/report.json`,JSON.stringify({localOnly:true,synthetic:true,checks,errors},null,2));console.log(`PASS: ${checks.length} project workflow assertions, including actual admin actions, client views, full/partial payment and cancellation. No live data or emails.`);
}finally{await browser.close();await p.clientUser.deleteMany({where:{id:{in:owners}}});if(operator){await p.auditLog.deleteMany({where:{userId:operator.id}});await p.adminUser.delete({where:{id:operator.id}});}await p.$disconnect();}
