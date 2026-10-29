/** Disposable loopback DB + .invalid-only in-memory SMTP. No real recipients.
 * Build first, then run with local .env files. Supply a loopback
 * REMINDER_TEST_ADMIN_DATABASE_URL if the app role has no CREATEDB privilege.
 */
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright-core";
import { localReminderSmtp } from "./local-reminder-smtp.mjs";
const source=new URL(process.env.DATABASE_URL), adminUrl=new URL(process.env.REMINDER_TEST_ADMIN_DATABASE_URL||source);
for(const u of [source,adminUrl]) assert(["localhost","127.0.0.1","[::1]"].includes(u.hostname),"Loopback database only");
const name=`savo_hr_compose_${randomBytes(6).toString("hex")}`, owner=decodeURIComponent(source.username);
assert(/^[A-Za-z0-9_]{1,63}$/.test(owner));
const target=new URL(source);target.pathname=`/${name}`;
const admin=new PrismaClient({datasources:{db:{url:adminUrl.toString()}}}), p=new PrismaClient({datasources:{db:{url:target.toString()}}});
const env={...process.env,DATABASE_URL:target.toString(),MAIL_DELIVERY_MODE:"off",INVOICE_REMINDERS_ENABLED:"false"};
const dir=".impeccable/review/hr-compose";await mkdir(dir,{recursive:true});
const sink=await localReminderSmtp();const base="http://127.0.0.1:4332",checks=[],errors=[];
let created=false,server,browser;
const sha=v=>createHash("sha256").update(v).digest("hex");
const ok=(value,label)=>{assert(value,label);checks.push(label);};
async function session(role,permissions){const token=randomBytes(32).toString("hex");const user=await p.adminUser.create({data:{name:`Synthetic ${role}`,email:`${randomBytes(8).toString("hex")}@example.invalid`,passwordHash:"synthetic-not-a-real-password",role,permissions}});await p.adminSession.create({data:{userId:user.id,tokenHash:sha(token),expiresAt:new Date(Date.now()+3600000)}});return token;}
try{
 await admin.$executeRawUnsafe(`CREATE DATABASE "${name}" OWNER "${owner}"`);created=true;
 const setup=spawnSync(process.execPath,["node_modules/prisma/build/index.js","db","push","--skip-generate"],{env,encoding:"utf8"});assert.equal(setup.status,0,"Disposable schema setup");
 const tokens=[await session("admin",[]),await session("editor",["employees"]),await session("editor",["clients"])];
 server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","-H","127.0.0.1","-p","4332"],{env:{...env,NODE_ENV:"production",NEXT_PUBLIC_CONTENT_MODE:"production",MAIL_DELIVERY_MODE:"live",MAIL_HOST:"127.0.0.1",MAIL_PORT:String(sink.port),MAIL_SECURE:"false",MAIL_USER:"hello@example.invalid",MAIL_PASS:"synthetic-local-password",MAIL_FROM:"Synthetic Savo <hello@example.invalid>",MAIL_HR_USER:"hr@example.invalid",MAIL_HR_PASS:"synthetic-local-hr-password"},stdio:"ignore"});
 for(let n=0;n<60;n++){assert(server.exitCode===null,"Isolated server remains alive");try{if((await fetch(base+"/portal")).ok)break;}catch{}if(n===59)throw Error("Server not ready");await new Promise(r=>setTimeout(r,500));}
 browser=await chromium.launch();
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
 const use=token=>context.addCookies([{name:"savo_admin",value:token,url:base,httpOnly:true,sameSite:"Lax"}]);
 await use(tokens[0]);const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));
 async function visit(path){await page.goto(base+path,{waitUntil:"networkidle"});await page.evaluate(()=>document.fonts.ready);}
 async function capture(label,width,height){await page.setViewportSize({width,height});await page.evaluate(()=>{document.activeElement?.blur?.();scrollTo(0,0);});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${label}: no overflow`);await page.screenshot({path:`${dir}/${label}.png`,fullPage:true});}
 const blank=()=>page.getByRole("button",{name:"Blank email",exact:true});
 const template=()=>page.getByRole("button",{name:"From template",exact:true});
 const send=dept=>page.getByRole("button",{name:`Send via ${dept}@`,exact:true});
 async function fill(dept){await page.getByLabel("To",{exact:true}).fill(`synthetic-${dept}@example.invalid`);await page.getByLabel("Subject",{exact:true}).fill(`Synthetic ${dept} letter`);await page.getByLabel("Message",{exact:true}).fill("Hello,\n\nThis is a synthetic loopback-only message.");}
 await visit("/admin/email-compose?dept=hr");ok(await blank().isVisible()&&await template().isVisible(),"HR exposes both compose modes");
 await capture("hr-template-1440",1440,1000);await capture("hr-template-390",390,844);
 await blank().click();ok(await page.getByLabel("Subject",{exact:true}).isVisible(),"HR blank mode exposes subject and message");
 await send("hr").click();await page.getByRole("alert").filter({hasText:"the email was not sent"}).waitFor();ok(sink.messages.length===0,"empty HR form fails before SMTP");
 await fill("hr");await template().click();await blank().click();ok(await page.getByLabel("Subject",{exact:true}).inputValue()==="Synthetic hr letter","switching modes retains the draft");
 await page.getByRole("button",{name:"Preview before sending",exact:true}).click();
 ok(await page.frameLocator('iframe[title="Compose preview"]').getByText("People & careers",{exact:true}).isVisible(),"blank HR preview uses HR branding");
 await page.getByRole("button",{name:"Hide preview",exact:true}).click();
 await capture("hr-blank-1440",1440,1000);await capture("hr-blank-390",390,844);
 await page.getByRole("button",{name:"Preview before sending",exact:true}).click();
 for(const [width,height] of [[1440,1000],[390,844]]){await page.setViewportSize({width,height});await page.locator('iframe[title="Compose preview"]').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/hr-preview-${width}.png`,fullPage:false});}
 await send("hr").click();await page.waitForURL(url=>url.searchParams.get("sent")==="1");
 ok(new URL(page.url()).searchParams.get("dept")==="hr"&&new URL(page.url()).searchParams.get("mode")==="blank","successful HR send returns to HR blank mode");
 ok(sink.messages.length===1&&sink.messages[0].sender==="hr@example.invalid","HR blank email really uses HR SMTP sender");
 ok(sink.messages[0].body.replace(/=\n/g,"").includes("People &amp; careers"),"submitted HR message matches HR-branded preview");
 ok((await p.sentEmail.findFirst()).dept==="hr","HR email is archived in HR sent folder");
 await visit("/admin/email-compose?dept=hello");ok(await blank().isVisible()&&await template().isVisible(),"client composer retains both modes");await blank().click();await fill("hello");
 await capture("hello-blank-1440",1440,1000);await capture("hello-blank-390",390,844);
 await send("hello").click();await page.waitForURL(url=>url.searchParams.get("sent")==="1");ok(sink.messages.length===2&&sink.messages[1].sender==="hello@example.invalid","client blank email still uses client SMTP sender");
 await use(tokens[1]);await visit("/admin/email-compose?dept=hr&mode=blank");ok(await send("hr").isVisible(),"HR-granted editor can use HR blank composer");await fill("hr");
 await page.locator('input[name="dept"]').evaluate(e=>{e.value="hello";});await send("hr").click();await page.waitForURL(url=>url.searchParams.has("denied"));ok(sink.messages.length===2,"tampered HR-editor client send rejected server-side");
 await use(tokens[2]);await visit("/admin/email-compose?dept=hr");ok(new URL(page.url()).searchParams.has("denied"),"client-only editor cannot open HR composer");
 ok(errors.length===0,"no browser runtime errors");ok(sink.messages.every(m=>m.recipient.endsWith(".invalid")),"all emails remained in synthetic SMTP sink");
 await writeFile(`${dir}/report.json`,JSON.stringify({checks,errors,note:"Disposable loopback DB dropped; no real records or recipients. SMTP bodies and tokens omitted."},null,2));
 console.log(`Passed ${checks.length} isolated HR composer browser/SMTP checks.`);
}finally{
 if(browser)await browser.close();if(server&&server.exitCode===null){server.kill("SIGTERM");await new Promise(r=>{const t=setTimeout(()=>{server.kill("SIGKILL");r();},5000);server.once("exit",()=>{clearTimeout(t);r();});});}
 await sink.close();await p.$disconnect();if(created){assert(/^savo_hr_compose_[a-f0-9]{12}$/.test(name));await admin.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);}await admin.$disconnect();
}
