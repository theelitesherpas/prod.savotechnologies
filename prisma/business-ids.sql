-- Reviewed additive preparation for existing populated databases.
-- Run through scripts/prepare-business-id-schema.mjs for the transaction/lock.
-- No UPDATE, DELETE, DROP, counter seed/reset, or historical renumbering.
CREATE TABLE IF NOT EXISTS "business_id_counters" (
  "type" TEXT NOT NULL,
  "range_start" INTEGER NOT NULL,
  "range_end" INTEGER NOT NULL,
  "initial_current" INTEGER NOT NULL,
  "current" INTEGER NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "business_id_counters_pkey" PRIMARY KEY ("type")
);
CREATE TABLE IF NOT EXISTS "business_ids" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "reference_number" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "business_ids_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "business_ids_reference_number_key" ON "business_ids"("reference_number");
CREATE INDEX IF NOT EXISTS "business_ids_type_created_at_idx" ON "business_ids"("type", "created_at");

CREATE TABLE IF NOT EXISTS "business_id_drafts" (
  "business_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "request_key" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consumed_at" TIMESTAMP(3),
  CONSTRAINT "business_id_drafts_pkey" PRIMARY KEY ("business_id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "business_id_drafts_owner_id_type_request_key_key" ON "business_id_drafts"("owner_id", "type", "request_key");
CREATE INDEX IF NOT EXISTS "business_id_drafts_owner_id_type_consumed_at_idx" ON "business_id_drafts"("owner_id", "type", "consumed_at");

-- IF EXISTS permits a fresh installation too: Prisma subsequently creates any
-- absent domain tables with the same fields/unique keys/FKs from schema.prisma.
ALTER TABLE IF EXISTS "bug_reports" ADD COLUMN IF NOT EXISTS "business_id" TEXT;
ALTER TABLE IF EXISTS "client_projects" ADD COLUMN IF NOT EXISTS "business_id" TEXT;
ALTER TABLE IF EXISTS "client_users" ADD COLUMN IF NOT EXISTS "business_id" TEXT;
ALTER TABLE IF EXISTS "invoices" ADD COLUMN IF NOT EXISTS "business_id" TEXT;
ALTER TABLE IF EXISTS "project_enquiries" ADD COLUMN IF NOT EXISTS "business_id" TEXT;

DO $$
DECLARE target text; key_name text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='business_ids'::regclass AND conname='business_ids_type_fkey') THEN
    ALTER TABLE "business_ids" ADD CONSTRAINT "business_ids_type_fkey" FOREIGN KEY ("type") REFERENCES "business_id_counters"("type") ON DELETE RESTRICT ON UPDATE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='business_id_drafts'::regclass AND conname='business_id_drafts_business_id_fkey') THEN
    ALTER TABLE "business_id_drafts" ADD CONSTRAINT "business_id_drafts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_ids"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
  END IF;
  FOREACH target IN ARRAY ARRAY['bug_reports','client_projects','client_users','invoices','project_enquiries'] LOOP
    IF to_regclass(target) IS NOT NULL THEN
      EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I (business_id)',target || '_business_id_key',target);
      key_name := target || '_business_id_fkey';
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=to_regclass(target) AND conname=key_name) THEN
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (business_id) REFERENCES business_ids(id) ON DELETE RESTRICT ON UPDATE RESTRICT',target,key_name);
      END IF;
    END IF;
  END LOOP;
END $$;
