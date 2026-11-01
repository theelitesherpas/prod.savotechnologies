-- Additive only: no existing provider/secret/invoice rows are changed.
-- Absent rows default to enabled for compatibility; readiness gates still apply.
CREATE TABLE IF NOT EXISTS payment_gateway_availability (
 provider TEXT PRIMARY KEY,
 enabled BOOLEAN NOT NULL DEFAULT TRUE,
 revision INTEGER NOT NULL DEFAULT 1,
 updated_by TEXT,
 updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Also install guards when Prisma has already created the table in a fresh DB.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_gateway_availability_provider' AND conrelid = 'payment_gateway_availability'::regclass) THEN
  ALTER TABLE payment_gateway_availability ADD CONSTRAINT payment_gateway_availability_provider CHECK (provider IN ('razorpay','paypal'));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_gateway_availability_revision' AND conrelid = 'payment_gateway_availability'::regclass) THEN
  ALTER TABLE payment_gateway_availability ADD CONSTRAINT payment_gateway_availability_revision CHECK (revision > 0);
 END IF;
END $$;
