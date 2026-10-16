/** Explicit idempotent provisioning, never a counter reset/backfill.
 * Apply Prisma's additive schema first, then node scripts/setup-business-ids.mjs --apply.
 * Without --apply this reports state only. Uses the already-loaded DATABASE_URL.
 */
import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";
import { BUSINESS_ID_CONFIG, BUSINESS_ID_TYPES, BUSINESS_ID_LOCK_KEY, businessIdCapacity, validateBusinessIdConfiguration } from "../src/lib/business-id-config.ts";

export function businessIdGuardSql() {
  validateBusinessIdConfiguration();
  const policies = BUSINESS_ID_TYPES.map(type => { const p=BUSINESS_ID_CONFIG[type]; return `(type = '${type}' AND range_start = ${p.start} AND range_end = ${p.end} AND initial_current = ${p.initialCurrent})`; }).join(" OR ");
  const ranges = BUSINESS_ID_TYPES.map(type => { const p=BUSINESS_ID_CONFIG[type]; return `(type = '${type}' AND reference_number BETWEEN ${p.start} AND ${p.end})`; }).join(" OR ");
  const sql = [
    `ALTER TABLE business_id_counters DROP CONSTRAINT IF EXISTS business_counter_policy`,
    `ALTER TABLE business_id_counters ADD CONSTRAINT business_counter_policy CHECK ((${policies}) AND current BETWEEN initial_current AND range_end)`,
    `ALTER TABLE business_ids DROP CONSTRAINT IF EXISTS business_reference_policy`,
    `ALTER TABLE business_ids ADD CONSTRAINT business_reference_policy CHECK ((${ranges}) AND id = 'STPL' || type || lpad(reference_number::text,5,'0'))`,
    `CREATE OR REPLACE FUNCTION savo_business_counter_guard() RETURNS trigger LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Business counters cannot be deleted or reset' USING ERRCODE='23514'; END IF;
        IF NEW.type IS DISTINCT FROM OLD.type OR NEW.range_start IS DISTINCT FROM OLD.range_start OR NEW.range_end IS DISTINCT FROM OLD.range_end OR NEW.initial_current IS DISTINCT FROM OLD.initial_current OR NEW.current <> OLD.current + 1 THEN
          RAISE EXCEPTION 'Business counter policy is immutable; only the next increment is allowed' USING ERRCODE='23514';
        END IF;
        RETURN NEW;
      END $$`,
    `DROP TRIGGER IF EXISTS business_counter_guard ON business_id_counters`,
    `CREATE TRIGGER business_counter_guard BEFORE UPDATE OR DELETE ON business_id_counters FOR EACH ROW EXECUTE FUNCTION savo_business_counter_guard()`,
    `CREATE OR REPLACE FUNCTION savo_business_counter_reservation() RETURNS trigger LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM business_ids WHERE type=NEW.type AND reference_number=NEW.current) THEN
          RAISE EXCEPTION 'A counter increment must have a permanent reservation in the same transaction' USING ERRCODE='23514';
        END IF;
        RETURN NEW;
      END $$`,
    `DROP TRIGGER IF EXISTS business_counter_reservation ON business_id_counters`,
    `CREATE CONSTRAINT TRIGGER business_counter_reservation AFTER UPDATE ON business_id_counters DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION savo_business_counter_reservation()`,
    `CREATE OR REPLACE FUNCTION savo_business_reference_guard() RETURNS trigger LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
      DECLARE position integer; seed integer;
      BEGIN
        IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION 'Issued business IDs cannot be edited, deleted or reused' USING ERRCODE='23514'; END IF;
        SELECT current,initial_current INTO position,seed FROM business_id_counters WHERE type=NEW.type FOR UPDATE;
        IF NOT FOUND OR (NEW.reference_number > seed AND NEW.reference_number <> position) THEN
          RAISE EXCEPTION 'Reserve the next number through the business ID service' USING ERRCODE='23514';
        END IF;
        RETURN NEW;
      END $$`,
    `DROP TRIGGER IF EXISTS business_reference_guard ON business_ids`,
    `CREATE TRIGGER business_reference_guard BEFORE INSERT OR UPDATE OR DELETE ON business_ids FOR EACH ROW EXECUTE FUNCTION savo_business_reference_guard()`,
    `CREATE OR REPLACE FUNCTION savo_business_draft_guard() RETURNS trigger LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
      BEGIN
        IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Draft ID reservations cannot be deleted or recycled' USING ERRCODE='23514'; END IF;
        IF TG_OP='INSERT' THEN
          IF NEW.consumed_at IS NOT NULL OR NOT EXISTS (SELECT 1 FROM business_ids WHERE id=NEW.business_id AND type=NEW.type) THEN
            RAISE EXCEPTION 'Draft must reference an unconsumed ID of the correct type' USING ERRCODE='23514';
          END IF;
        ELSE
          IF NEW.business_id IS DISTINCT FROM OLD.business_id OR NEW.type IS DISTINCT FROM OLD.type OR NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.request_key IS DISTINCT FROM OLD.request_key OR NEW.created_at IS DISTINCT FROM OLD.created_at OR OLD.consumed_at IS NOT NULL OR NEW.consumed_at IS NULL THEN
            RAISE EXCEPTION 'Draft reservations are immutable and may only be consumed once' USING ERRCODE='23514';
          END IF;
        END IF;
        RETURN NEW;
      END $$`,
    `DROP TRIGGER IF EXISTS business_draft_guard ON business_id_drafts`,
    `CREATE TRIGGER business_draft_guard BEFORE INSERT OR UPDATE OR DELETE ON business_id_drafts FOR EACH ROW EXECUTE FUNCTION savo_business_draft_guard()`,
    `CREATE OR REPLACE FUNCTION savo_business_entity_guard() RETURNS trigger LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
      DECLARE old_row jsonb; new_row jsonb;
      BEGIN
        new_row := to_jsonb(NEW);
        IF NEW.business_id IS NOT NULL AND (TG_OP='INSERT' OR NEW.business_id IS DISTINCT FROM OLD.business_id) AND NOT EXISTS (SELECT 1 FROM business_ids WHERE id=NEW.business_id AND type=TG_ARGV[0]) THEN
          RAISE EXCEPTION 'Business ID has the wrong entity type or has not been reserved' USING ERRCODE='23514';
        END IF;
        IF TG_OP='INSERT' AND NEW.business_id IS NOT NULL AND TG_ARGV[1] <> '' AND (new_row ->> TG_ARGV[1]) IS DISTINCT FROM NEW.business_id THEN
          RAISE EXCEPTION 'New record reference must match its assigned business ID' USING ERRCODE='23514';
        END IF;
        IF TG_OP='UPDATE' THEN
          old_row := to_jsonb(OLD);
          IF OLD.business_id IS NOT NULL AND NEW.business_id IS DISTINCT FROM OLD.business_id THEN
            RAISE EXCEPTION 'Assigned business IDs cannot be changed or cleared' USING ERRCODE='23514';
          END IF;
          IF TG_ARGV[1] <> '' AND (new_row ->> TG_ARGV[1]) IS DISTINCT FROM (old_row ->> TG_ARGV[1]) THEN
            RAISE EXCEPTION 'Issued legacy and business references must be retained' USING ERRCODE='23514';
          END IF;
        END IF;
        RETURN NEW;
      END $$`,
  ];
  for (const [table,type,reference] of [["client_users","CS",""],["client_projects","PR","code"],["invoices","IN","number"],["project_enquiries","LD","reference"],["bug_reports","TK",""]]) {
    sql.push(`DROP TRIGGER IF EXISTS business_entity_guard ON "${table}"`, `CREATE TRIGGER business_entity_guard BEFORE INSERT OR UPDATE ON "${table}" FOR EACH ROW EXECUTE FUNCTION savo_business_entity_guard('${type}','${reference}')`);
  }
  return sql;
}
export async function provisionBusinessIds(p) {
  return p.$transaction(async tx => {
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${BUSINESS_ID_LOCK_KEY}::bigint)`);
    // Never silently adopt/overwrite occupied business namespaces from imports.
    for(const [model,field] of [["clientProject","code"],["invoice","number"],["projectEnquiry","reference"]]) {
      const rows=await tx[model].findMany({where:{businessId:null,[field]:{startsWith:"STPL"}},select:{[field]:true}});
      if(rows.some(row=>/^STPL[A-Z]{2}\d{5}$/.test(row[field]))) throw Error("Unregistered STPL references exist. Reconcile the legacy import before provisioning; no counters were changed.");
    }
    const existing=await tx.$queryRawUnsafe('SELECT type, range_start AS "rangeStart", range_end AS "rangeEnd", initial_current AS "initialCurrent", current FROM business_id_counters ORDER BY range_start FOR UPDATE');
    for(const row of existing) {
      const p=BUSINESS_ID_CONFIG[row.type];
      if(!p||row.rangeStart!==p.start||row.rangeEnd!==p.end||row.initialCurrent!==p.initialCurrent) throw Error("Existing business ID policy differs. An explicit reviewed migration is required; counters were not reset.");
      businessIdCapacity(row.type,row.current);
      const committed=await tx.businessId.count({where:{type:row.type,referenceNumber:{gt:p.initialCurrent,lte:row.current}}});
      const ahead=await tx.businessId.count({where:{type:row.type,referenceNumber:{gt:row.current}}});
      if(ahead||committed!==row.current-p.initialCurrent)throw Error("Business ID ledger and counter disagree. Restore/reconcile the ledger; counters were not reset.");
    }
    for (const sql of businessIdGuardSql()) await tx.$executeRawUnsafe(sql);
    await tx.businessIdCounter.createMany({data:BUSINESS_ID_TYPES.map(type=>({type,rangeStart:BUSINESS_ID_CONFIG[type].start,rangeEnd:BUSINESS_ID_CONFIG[type].end,initialCurrent:BUSINESS_ID_CONFIG[type].initialCurrent,current:BUSINESS_ID_CONFIG[type].initialCurrent})),skipDuplicates:true});
    return tx.businessIdCounter.findMany({orderBy:{rangeStart:"asc"}});
  },{maxWait:10000,timeout:30000});
}
async function main() {
  if(!process.env.DATABASE_URL) throw Error("Load the intended DATABASE_URL explicitly before running this command.");
  const p=new PrismaClient();
  try {
    const rows=process.argv.includes("--apply")?await provisionBusinessIds(p):await p.businessIdCounter.findMany({orderBy:{rangeStart:"asc"}});
    if(rows.length!==BUSINESS_ID_TYPES.length)throw Error("Numbering is not fully provisioned. Run the explicitly approved setup with --apply; no counters were initialized or reset.");
    for(const row of rows){const policy=BUSINESS_ID_CONFIG[row.type];if(!policy||row.rangeStart!==policy.start||row.rangeEnd!==policy.end||row.initialCurrent!==policy.initialCurrent)throw Error("Stored numbering policy differs from configuration; administrator review is required.");}
    console.log(JSON.stringify({applied:process.argv.includes("--apply"),policyTypes:BUSINESS_ID_TYPES.length,counters:rows.map(row=>({type:row.type,label:BUSINESS_ID_CONFIG[row.type]?.label,range:`${String(row.rangeStart).padStart(5,"0")}–${String(row.rangeEnd).padStart(5,"0")}`,...businessIdCapacity(row.type,row.current),current:String(row.current).padStart(5,"0")})),note:"Offsets are not historical record counts. Existing business records are not renumbered; no reserved gaps are allocated."},null,2));
  } finally {await p.$disconnect();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(error=>{console.error("Business ID setup failed:",error.message);process.exitCode=1;});
