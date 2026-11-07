/** Isolated PostgreSQL role/ownership proof, never a live database. */
import assert from'node:assert/strict';import{randomBytes}from'node:crypto';import{spawnSync}from'node:child_process';import{PrismaClient}from'@prisma/client';
const source=new URL(process.env.REMINDER_TEST_ADMIN_DATABASE_URL||process.env.DATABASE_URL||`postgresql://${process.env.USER}@127.0.0.1:5432/postgres`);assert(['127.0.0.1','localhost','[::1]'].includes(source.hostname),'Loopback administrator only');
const hex=randomBytes(6).toString('hex'),name='savo_paypal_verify_'+hex,app='savo_harden_app_'+hex,owner='savo_harden_owner_'+hex,password=randomBytes(24).toString('hex'),url=new URL(source);url.pathname='/'+name;url.username=app;url.password=password;
const admin=new PrismaClient({datasources:{db:{url:source.href}}});let created=false,role=false,client;
const env={...process.env,DATABASE_URL:url.href,MAIL_DELIVERY_MODE:'off',PAYPAL_LIVE_PAYMENTS_ENABLED:'false',PAYPAL_DB_TESTS:'1'};
function run(bin,args,options={}){const r=spawnSync(bin,args,{env,stdio:'inherit',...options});assert.equal(r.status,0,'Isolated privilege verification failed');}
try{
 await admin.$executeRawUnsafe(`CREATE ROLE "${app}" LOGIN PASSWORD '${password}'`);role=true;
 await admin.$executeRawUnsafe(`CREATE DATABASE "${name}" OWNER "${app}"`);created=true;
 run(process.execPath,['node_modules/prisma/build/index.js','db','push','--skip-generate']);
 for(const file of['paypal','payment-availability','email-attachments'])run(process.execPath,['node_modules/prisma/build/index.js','db','execute','--file',`prisma/${file}.sql`,'--schema','prisma/schema.prisma']);
 const pg={...env,PGHOST:source.hostname,PGPORT:source.port||'5432',PGUSER:decodeURIComponent(source.username),PGPASSWORD:decodeURIComponent(source.password),PGDATABASE:name};
 run('psql',['-X','-v','ON_ERROR_STOP=1','-v','expected_db='+name,'-v','app_role='+app,'-v','owner_role='+owner,'-f','ops/harden-database.sql'],{env:pg});
 client=new PrismaClient({datasources:{db:{url:url.href}}});
 const [permissions]=await client.$queryRawUnsafe(`SELECT current_user AS role,has_schema_privilege(current_user,'public','CREATE') AS schema_create,has_database_privilege(current_user,current_database(),'CREATE') AS database_create,has_database_privilege(current_user,current_database(),'TEMP') AS temporary,pg_has_role(current_user,'${owner}','MEMBER') AS owner_membership`);
 assert.equal(permissions.role,app);for(const k of['schema_create','database_create','temporary','owner_membership'])assert.equal(permissions[k],false,k+' privilege leaked');
 for(const sql of['CREATE TABLE public.security_probe(id int)','ALTER TABLE paypal_checkouts DISABLE TRIGGER paypal_checkout_snapshot_immutable','CREATE SCHEMA security_probe',`SET ROLE "${owner}"`])await assert.rejects(()=>client.$executeRawUnsafe(sql));
 await client.$disconnect();client=null;
 run(process.execPath,['node_modules/vitest/vitest.mjs','run','tests/paypal-db.test.ts']);
 console.log('Passed isolated non-owner runtime role, forbidden-DDL/trigger bypass checks and all PayPal settlement tests.');
}finally{
 if(client)await client.$disconnect();
 if(created){assert(/^savo_paypal_verify_[a-f0-9]{12}$/.test(name));await admin.$executeRawUnsafe(`DROP DATABASE "${name}" WITH(FORCE)`);}
 if(role)await admin.$executeRawUnsafe(`DROP ROLE "${app}"`);
 const exists=await admin.$queryRawUnsafe(`SELECT 1 FROM pg_roles WHERE rolname='${owner}'`);if(exists.length)await admin.$executeRawUnsafe(`DROP ROLE "${owner}"`);
 await admin.$disconnect();
}
