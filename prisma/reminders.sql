-- Additive only: reminder ledger + query indexes. No invoice status changes.
BEGIN;
CREATE TABLE IF NOT EXISTS reminder_deliveries (
  id TEXT PRIMARY KEY,
  dedupe_key TEXT NOT NULL UNIQUE,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE ON UPDATE CASCADE,
  meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE ON UPDATE CASCADE,
  kind TEXT NOT NULL CONSTRAINT reminder_kind_allowed CHECK (kind IN ('invoice_before_due','invoice_due_today','invoice_overdue','invoice_manual','meeting_manual')),
  due_on VARCHAR(10),
  scheduled_on VARCHAR(10),
  status TEXT NOT NULL DEFAULT 'pending' CONSTRAINT reminder_status_allowed CHECK (status IN ('pending','sending','sent','retry','failed','uncertain','skipped')),
  attempts INTEGER NOT NULL DEFAULT 0 CONSTRAINT reminder_attempts_bounded CHECK (attempts BETWEEN 0 AND 3),
  claim_token TEXT,
  claimed_at TIMESTAMP(3),
  next_attempt_at TIMESTAMP(3),
  sent_at TIMESTAMP(3),
  message_id TEXT NOT NULL UNIQUE,
  error_code TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL,
  CONSTRAINT reminder_target_exactly_one CHECK ((invoice_id IS NOT NULL)::int + (meeting_id IS NOT NULL)::int = 1)
);
-- Also install invariants when a local schema was first created by Prisma.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='reminder_kind_allowed' AND conrelid='reminder_deliveries'::regclass) THEN
    ALTER TABLE reminder_deliveries ADD CONSTRAINT reminder_kind_allowed CHECK (kind IN ('invoice_before_due','invoice_due_today','invoice_overdue','invoice_manual','meeting_manual'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='reminder_status_allowed' AND conrelid='reminder_deliveries'::regclass) THEN
    ALTER TABLE reminder_deliveries ADD CONSTRAINT reminder_status_allowed CHECK (status IN ('pending','sending','sent','retry','failed','uncertain','skipped'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='reminder_attempts_bounded' AND conrelid='reminder_deliveries'::regclass) THEN
    ALTER TABLE reminder_deliveries ADD CONSTRAINT reminder_attempts_bounded CHECK (attempts BETWEEN 0 AND 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='reminder_target_exactly_one' AND conrelid='reminder_deliveries'::regclass) THEN
    ALTER TABLE reminder_deliveries ADD CONSTRAINT reminder_target_exactly_one CHECK ((invoice_id IS NOT NULL)::int + (meeting_id IS NOT NULL)::int = 1);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS reminder_deliveries_invoice_id_kind_created_at_idx ON reminder_deliveries(invoice_id,kind,created_at);
CREATE INDEX IF NOT EXISTS reminder_deliveries_meeting_id_kind_created_at_idx ON reminder_deliveries(meeting_id,kind,created_at);
CREATE INDEX IF NOT EXISTS reminder_deliveries_status_next_attempt_at_idx ON reminder_deliveries(status,next_attempt_at);
CREATE INDEX IF NOT EXISTS reminder_deliveries_scheduled_on_idx ON reminder_deliveries(scheduled_on);
CREATE INDEX IF NOT EXISTS invoices_status_due_date_idx ON invoices(status,due_date);
COMMIT;
