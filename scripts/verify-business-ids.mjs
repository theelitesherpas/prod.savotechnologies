/** Local/CI only. Always creates/drops isolated QA schemas; never resets a real
 * counter, consumes real references, or sends mail. Optional --browser builds a
 * mail-disabled local preview on 4317, then runs real admin/portal workflows.
 * node --env-file=.env --env-file=.env.local scripts/verify-business-ids.mjs [--browser]
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir,readFile,writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
const local=new Set(["localhost","127.0.0.1","[::1]"]),u=new URL(process.env.DATABASE_URL);
assert(local.has(u.hostname),"Refusing non-local database");assert(process.env.NODE_ENV!=="production","Refusing a production runtime");
if(process.env.NEXT_PUBLIC_SITE_URL)assert(local.has(new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname),"Refusing a live site configuration");
u.searchParams.set("connection_limit","5");u.searchParams.set("pool_timeout","20");
const control=new PrismaClient({datasourceUrl:u.href}),dir="tmp/business-ids";
await mkdir(dir,{recursive:true});
function run(args,env=process.env){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{env,stdio:"inherit"}),timer=setTimeout(()=>child.kill("SIGTERM"),180000);child.once("error",error=>{clearTimeout(timer);reject(error);});child.once("exit",code=>{clearTimeout(timer);code===0?resolve():reject(Error(`QA command failed (${code}): ${args[0]}`));});});}
async function isolated(work,prepare=true){
 const schema=`savo_id_qa_${Date.now()}${process.pid}`;assert(/^savo_id_qa_\d+$/.test(schema));
 await control.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
 const target=new URL(u);target.searchParams.set("schema",schema);
 const env={...process.env,DATABASE_URL:target.href,BUSINESS_ID_TEST_DATABASE_URL:target.href,MAIL_DELIVERY_MODE:"off",NEXT_PUBLIC_SITE_URL:"http://localhost:4317",NEXT_PUBLIC_INDEXABLE:"false",NEXT_PUBLIC_CONTENT_MODE:"demo"};
 try{if(prepare){await run(["scripts/prepare-business-id-schema.mjs"],env);await run(["node_modules/prisma/build/index.js","db","push","--skip-generate"],env);await run(["scripts/setup-business-ids.mjs","--apply"],env);}await work(env);}
 finally{await control.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);console.log("Removed isolated QA schema",schema);}
}
try{
 // Rehearse the existing-populated-database path without touching public data.
 await isolated(async env=>{
  const source=await readFile("prisma/schema.prisma","utf8"),legacy=source.replace(/^model BusinessId(?:Counter|Draft)? \{[\s\S]*?^\}\n/gm,"").replace(/^\s*businessId\s+String\?.*\n/gm,"").replace(/^\s*businessReference\s+BusinessId\?.*\n/gm,"");
  await writeFile(`${dir}/legacy-schema.prisma`,legacy);
  await run(["node_modules/prisma/build/index.js","db","push","--schema",`${dir}/legacy-schema.prisma`,"--skip-generate"],env);
  const p=new PrismaClient({datasourceUrl:env.DATABASE_URL});
  try{
   await p.$executeRaw`INSERT INTO client_users (id,email,password_hash,name,updated_at) VALUES ('legacy-client-fixture','legacy@example.invalid','not-a-password','Legacy migration QA',CURRENT_TIMESTAMP)`;
   await p.$executeRaw`INSERT INTO client_projects (id,client_id,code,title,updated_at) VALUES ('legacy-project-fixture','legacy-client-fixture','SAVO-2026-LEGACY','Legacy migration QA',CURRENT_TIMESTAMP)`;
   await p.$executeRaw`INSERT INTO invoices (id,client_id,project_id,number,amount,status,paid_at,updated_at) VALUES ('legacy-invoice-fixture','legacy-client-fixture','legacy-project-fixture','INV-2026-LEGACY',12345,'paid',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
   const before=await p.invoice.findUniqueOrThrow({where:{id:"legacy-invoice-fixture"},select:{id:true,number:true,amount:true,status:true,paidAt:true,clientId:true,projectId:true}});
   await run(["scripts/prepare-business-id-schema.mjs"],env);await run(["scripts/prepare-business-id-schema.mjs"],env);
   await run(["node_modules/prisma/build/index.js","db","push","--skip-generate"],env);await run(["scripts/setup-business-ids.mjs","--apply"],env);
   const after=await p.invoice.findUniqueOrThrow({where:{id:before.id},select:{id:true,number:true,amount:true,status:true,paidAt:true,clientId:true,projectId:true}});
   assert.deepEqual(after,before);assert.equal((await p.clientProject.findUniqueOrThrow({where:{id:"legacy-project-fixture"}})).code,"SAVO-2026-LEGACY");assert.equal(await p.businessId.count(),0);assert.equal((await p.businessIdCounter.findUniqueOrThrow({where:{type:"CS"}})).current,1436);
   console.log("PASS: populated legacy migration is additive/idempotent; issued references, amounts, status, dates and foreign keys preserved, with no data-loss flags or consumed IDs.");
  }finally{await p.$disconnect();}
 },false);
 await isolated(env=>run(["node_modules/vitest/vitest.mjs","run","tests/business-ids.test.ts","tests/business-ids-database.test.ts"],env));
 if(process.argv.includes("--browser"))await isolated(async env=>{
  try{await fetch("http://localhost:4317",{signal:AbortSignal.timeout(1000)});throw Error("QA port 4317 is already occupied");}catch(error){if(error.message?.includes("occupied"))throw error;}
  const buildUrl=new URL(env.DATABASE_URL);buildUrl.searchParams.set("connection_limit","2");
  await run(["scripts/verify-content.mjs"],env);
  await run(["node_modules/next/dist/bin/next","build"],{...env,DATABASE_URL:buildUrl.href,NODE_ENV:"production"});
  const log=createWriteStream(`${dir}/server.log`);const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--port","4317"],{env:{...env,NODE_ENV:"production"},stdio:["ignore","pipe","pipe"]});server.stdout.pipe(log);server.stderr.pipe(log);
  try{
   let ready=false;for(let i=0;i<60;i++){if(server.exitCode!==null)throw Error("QA server exited; inspect tmp/business-ids/server.log");try{ready=(await fetch("http://localhost:4317/portal")).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,500));}assert(ready,"QA preview did not start");
   for(const script of ["verify-business-id-browser.mjs","verify-project-budgets.mjs","verify-payment-links.mjs","verify-invoice-downloads.mjs"])await run([`scripts/${script}`],{...env,BASE_URL:"http://localhost:4317"});
  }finally{server.kill("SIGTERM");await Promise.race([new Promise(r=>server.once("exit",r)),new Promise(r=>setTimeout(r,5000))]);if(server.exitCode===null)server.kill("SIGKILL");log.end();}
 });
 console.log("PASS: isolated business-ID database verification; real counters were not consumed or reset.");
}finally{await control.$disconnect();}
