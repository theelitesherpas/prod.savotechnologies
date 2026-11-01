-- Additive PayPal-only tables. No existing invoice, Razorpay, bank or payment
-- records are changed. Apply before Prisma synchronization after approved backup;
-- schema installation alone does not enable Live payments or populate credentials.
BEGIN;
CREATE TABLE IF NOT EXISTS paypal_gateway_configs (
 id TEXT PRIMARY KEY DEFAULT 'paypal', mode TEXT NOT NULL DEFAULT 'sandbox',
 client_id_enc TEXT NOT NULL, client_secret_enc TEXT NOT NULL,
 merchant_id_enc TEXT NOT NULL, webhook_id_enc TEXT,
 last_verified_at TIMESTAMP(3), last_verify_ok BOOLEAN, updated_by TEXT,
 created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS paypal_checkouts (
 id TEXT PRIMARY KEY, invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL ON UPDATE CASCADE,
 client_id TEXT NOT NULL, invoice_number TEXT NOT NULL, amount INTEGER NOT NULL, currency TEXT NOT NULL,
 mode TEXT NOT NULL, credential_fingerprint TEXT NOT NULL, merchant_id TEXT NOT NULL,
 state_hash TEXT NOT NULL, state_enc TEXT NOT NULL,
 order_id TEXT UNIQUE, approval_url TEXT, capture_id TEXT UNIQUE, capture_request_id TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL DEFAULT 'creating', capture_started_at TIMESTAMP(3), expires_at TIMESTAMP(3) NOT NULL,
 fee_amount INTEGER, fee_currency TEXT, net_amount INTEGER, net_currency TEXT, error_code TEXT,
 created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS paypal_checkouts_invoice_id_status_idx ON paypal_checkouts(invoice_id,status);
CREATE INDEX IF NOT EXISTS paypal_checkouts_client_id_created_at_idx ON paypal_checkouts(client_id,created_at);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='paypal_config_mode' AND conrelid='paypal_gateway_configs'::regclass) THEN
  ALTER TABLE paypal_gateway_configs ADD CONSTRAINT paypal_config_mode CHECK (id='paypal' AND mode IN ('sandbox','live'));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='paypal_checkout_invariants' AND conrelid='paypal_checkouts'::regclass) THEN
  ALTER TABLE paypal_checkouts ADD CONSTRAINT paypal_checkout_invariants CHECK (
   amount > 0 AND currency ~ '^[A-Z]{3}$' AND mode IN ('sandbox','live') AND
   status IN ('creating','created','capturing','pending','uncertain','cancelled','completed','review') AND
   (fee_amount IS NULL OR fee_amount >= 0) AND (net_amount IS NULL OR net_amount >= 0) AND
   (status <> 'completed' OR (order_id IS NOT NULL AND capture_id IS NOT NULL))
  );
 END IF;
END $$;
CREATE OR REPLACE FUNCTION protect_paypal_checkout_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF ROW(NEW.client_id,NEW.invoice_number,NEW.amount,NEW.currency,NEW.mode,NEW.credential_fingerprint,NEW.merchant_id,NEW.state_hash,NEW.state_enc,NEW.capture_request_id)
    IS DISTINCT FROM ROW(OLD.client_id,OLD.invoice_number,OLD.amount,OLD.currency,OLD.mode,OLD.credential_fingerprint,OLD.merchant_id,OLD.state_hash,OLD.state_enc,OLD.capture_request_id)
 THEN RAISE EXCEPTION 'PayPal checkout financial snapshot is immutable'; END IF;
 IF NEW.invoice_id IS DISTINCT FROM OLD.invoice_id AND NEW.invoice_id IS NOT NULL THEN RAISE EXCEPTION 'PayPal invoice binding cannot be changed'; END IF;
 IF OLD.order_id IS NOT NULL AND NEW.order_id IS DISTINCT FROM OLD.order_id THEN RAISE EXCEPTION 'PayPal order binding is immutable'; END IF;
 IF OLD.approval_url IS NOT NULL AND NEW.approval_url IS DISTINCT FROM OLD.approval_url THEN RAISE EXCEPTION 'PayPal approval link is immutable'; END IF;
 IF OLD.capture_id IS NOT NULL AND NEW.capture_id IS DISTINCT FROM OLD.capture_id THEN RAISE EXCEPTION 'PayPal capture binding is immutable'; END IF;
 IF OLD.fee_amount IS NOT NULL AND ROW(NEW.fee_amount,NEW.fee_currency) IS DISTINCT FROM ROW(OLD.fee_amount,OLD.fee_currency) THEN RAISE EXCEPTION 'PayPal fee evidence is immutable'; END IF;
 IF OLD.net_amount IS NOT NULL AND ROW(NEW.net_amount,NEW.net_currency) IS DISTINCT FROM ROW(OLD.net_amount,OLD.net_currency) THEN RAISE EXCEPTION 'PayPal net evidence is immutable'; END IF;
 IF OLD.status='completed' AND NEW.status <> 'completed' THEN RAISE EXCEPTION 'Completed PayPal captures cannot be replayed'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS paypal_checkout_snapshot_immutable ON paypal_checkouts;
CREATE TRIGGER paypal_checkout_snapshot_immutable BEFORE UPDATE ON paypal_checkouts FOR EACH ROW EXECUTE FUNCTION protect_paypal_checkout_snapshot();
COMMIT;
