/** Additive/idempotent schema preparation, before Prisma db push. Never accepts
 * generic data-loss flags. Uses the explicitly loaded DATABASE_URL. */
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { BUSINESS_ID_LOCK_KEY } from "../src/lib/business-id-config.ts";
if(!process.env.DATABASE_URL)throw Error("Load the intended DATABASE_URL explicitly before preparing business ID schema.");
const schema=new URL(process.env.DATABASE_URL).searchParams.get("schema")||"public";
if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema))throw Error("Unsupported schema name; use an explicitly reviewed SQL migration.");
const sql=await readFile(new URL("../prisma/business-ids.sql",import.meta.url),"utf8");
const script=`BEGIN;\nSET LOCAL search_path TO "${schema}";\nSELECT pg_advisory_xact_lock(${BUSINESS_ID_LOCK_KEY}::bigint);\n${sql}\nCOMMIT;`;
const result=spawnSync(process.execPath,["node_modules/prisma/build/index.js","db","execute","--schema","prisma/schema.prisma","--stdin"],{env:process.env,input:script,stdio:["pipe","inherit","inherit"]});
if(result.error)throw result.error;
if(result.status!==0)process.exitCode=result.status||1;
else console.log("Business ID additive schema prepared. No references/counters were initialized, reset or renumbered.");
