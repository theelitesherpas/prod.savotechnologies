-- Additive admin-only operational registers. Back up the database first.
-- Run once before the updated application starts; never reset existing data.
BEGIN;

-- CreateTable
CREATE TABLE "admin_operational_records" (
    "id" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "owner" TEXT NOT NULL DEFAULT '',
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "data" JSONB NOT NULL,
    "client_id" TEXT,
    "employee_id" TEXT,
    "candidate_id" TEXT,
    "subject_label" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "admin_operational_records_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "admin_operations_portal_check" CHECK ("portal" IN ('hr', 'client', 'employee')),
    CONSTRAINT "admin_operations_subject_check" CHECK (
      ("portal" = 'hr' AND "client_id" IS NULL AND "employee_id" IS NULL) OR
      ("portal" = 'client' AND "candidate_id" IS NULL AND "employee_id" IS NULL) OR
      ("portal" = 'employee' AND "candidate_id" IS NULL AND "client_id" IS NULL)
    ),
    CONSTRAINT "admin_operations_version_check" CHECK ("version" > 0),
    CONSTRAINT "admin_operations_dates_check" CHECK ("due_date" IS NULL OR "start_date" IS NULL OR "due_date" >= "start_date")
);

-- CreateIndex
CREATE INDEX "admin_operational_records_portal_module_updated_at_idx" ON "admin_operational_records"("portal", "module", "updated_at");

-- CreateIndex
CREATE INDEX "admin_operational_records_client_id_idx" ON "admin_operational_records"("client_id");

-- CreateIndex
CREATE INDEX "admin_operational_records_employee_id_idx" ON "admin_operational_records"("employee_id");

-- CreateIndex
CREATE INDEX "admin_operational_records_candidate_id_idx" ON "admin_operational_records"("candidate_id");

-- AddForeignKey
ALTER TABLE "admin_operational_records" ADD CONSTRAINT "admin_operational_records_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_operational_records" ADD CONSTRAINT "admin_operational_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_operational_records" ADD CONSTRAINT "admin_operational_records_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "project_enquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
