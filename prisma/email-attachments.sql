-- Additive email-only change. No payment models, client identities or old
-- message bodies are modified. Legacy outgoing rows retain status 'sent'.
ALTER TABLE sent_emails ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'sent';
ALTER TABLE sent_emails ADD COLUMN IF NOT EXISTS message_id TEXT;
ALTER TABLE email_replies ADD COLUMN IF NOT EXISTS delivery_key TEXT;
ALTER TABLE email_replies ADD COLUMN IF NOT EXISTS attachment_notice TEXT;
ALTER TABLE email_replies ADD COLUMN IF NOT EXISTS body_format_version INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS email_replies_delivery_key_key ON email_replies(delivery_key);
CREATE TABLE IF NOT EXISTS email_attachments (
 id TEXT PRIMARY KEY,
 reply_id TEXT REFERENCES email_replies(id) ON DELETE CASCADE,
 sent_id TEXT REFERENCES sent_emails(id) ON DELETE CASCADE,
 filename VARCHAR(180) NOT NULL,
 content_type VARCHAR(120) NOT NULL,
 content_id VARCHAR(255),
 size INTEGER NOT NULL,
 data BYTEA NOT NULL,
 sha256 VARCHAR(64) NOT NULL,
 created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE email_attachments ADD COLUMN IF NOT EXISTS content_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS email_attachments_reply_id_idx ON email_attachments(reply_id);
CREATE INDEX IF NOT EXISTS email_attachments_sent_id_idx ON email_attachments(sent_id);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='email_attachments_limits' AND conrelid='email_attachments'::regclass) THEN
  ALTER TABLE email_attachments ADD CONSTRAINT email_attachments_limits CHECK (size > 0 AND size <= 10000000 AND octet_length(data)=size AND num_nonnulls(reply_id,sent_id)=1 AND sha256 ~ '^[a-f0-9]{64}$');
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sent_email_delivery_status' AND conrelid='sent_emails'::regclass) THEN
  ALTER TABLE sent_emails ADD CONSTRAINT sent_email_delivery_status CHECK (delivery_status IN ('sent','pending','not_sent','uncertain'));
 END IF;
END $$;
CREATE OR REPLACE FUNCTION enforce_email_attachment_budget() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE total_bytes BIGINT; total_count BIGINT;
BEGIN
 IF TG_OP='UPDATE' THEN RAISE EXCEPTION 'Archived attachments are immutable'; END IF;
 IF NEW.reply_id IS NOT NULL THEN
  PERFORM id FROM email_replies WHERE id=NEW.reply_id FOR UPDATE;
  SELECT COALESCE(SUM(size),0),COUNT(*) INTO total_bytes,total_count FROM email_attachments WHERE reply_id=NEW.reply_id;
 ELSE
  PERFORM id FROM sent_emails WHERE id=NEW.sent_id FOR UPDATE;
  SELECT COALESCE(SUM(size),0),COUNT(*) INTO total_bytes,total_count FROM email_attachments WHERE sent_id=NEW.sent_id;
 END IF;
 IF total_count >= 10 OR total_bytes + NEW.size > 10000000 THEN RAISE EXCEPTION 'Attachments exceed 10 MB per email or 10 file limit'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS email_attachment_budget ON email_attachments;
CREATE TRIGGER email_attachment_budget BEFORE INSERT OR UPDATE ON email_attachments FOR EACH ROW EXECUTE FUNCTION enforce_email_attachment_budget();
