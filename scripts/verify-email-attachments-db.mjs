/** CI/local PostgreSQL-only attachment proof. Disposable generated DB only. */
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {PrismaClient} from '@prisma/client';
const source=new URL(process.env.EMAIL_ATTACHMENT_TEST_ADMIN_DATABASE_URL||process.env.DATABASE_URL||`postgresql://${process.env.USER}@127.0.0.1:5432/postgres`);
assert(['localhost','127.0.0.1','[::1]'].includes(source.hostname),'Loopback only');const owner=decodeURIComponent(source.username);assert(/^[A-Za-z0-9_]{1,63}$/.test(owner));
const name=`savo_email_attachments_verify_${randomBytes(6).toString('hex')}`,target=new URL(source);target.pathname='/'+name;
const db=new PrismaClient({datasources:{db:{url:source.href}}});let created=false;
const env={...process.env,DATABASE_URL:target.href,MAIL_DELIVERY_MODE:'off',EMAIL_ATTACHMENT_DB_TESTS:'1'};
function run(args){const r=spawnSync(process.execPath,args,{env,stdio:'inherit'});if(r.status!==0)throw Error('Isolated attachment DB check failed');}
try{await db.$executeRawUnsafe(`CREATE DATABASE "${name}" OWNER "${owner}"`);created=true;run(['node_modules/prisma/build/index.js','db','push','--skip-generate']);run(['node_modules/prisma/build/index.js','db','execute','--file','prisma/email-attachments.sql','--schema','prisma/schema.prisma']);run(['node_modules/vitest/vitest.mjs','run','tests/email-attachments-db.test.ts']);}
finally{if(created){assert(/^savo_email_attachments_verify_[a-f0-9]{12}$/.test(name));await db.$executeRawUnsafe(`DROP DATABASE "${name}" WITH(FORCE)`);}await db.$disconnect();}
