-- Additive portal authentication migration. Back up and apply before deployment.
BEGIN;
CREATE TABLE IF NOT EXISTS "portal_login_challenges" (
  "id" TEXT PRIMARY KEY,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('client', 'employee')),
  "account_id" TEXT NOT NULL,
  "email_hash" TEXT NOT NULL,
  "binding_hash" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "remember" BOOLEAN NOT NULL DEFAULT false,
  "attempts" INTEGER NOT NULL DEFAULT 0 CHECK ("attempts" >= 0 AND "attempts" <= 5),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "portal_login_challenges_kind_account_id_created_at_idx"
  ON "portal_login_challenges" ("kind", "account_id", "created_at");
CREATE INDEX IF NOT EXISTS "portal_login_challenges_expires_at_idx"
  ON "portal_login_challenges" ("expires_at");
CREATE TABLE IF NOT EXISTS "portal_auth_throttles" (
  "key" TEXT PRIMARY KEY,
  "hits" INTEGER NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "portal_auth_throttles_expires_at_idx"
  ON "portal_auth_throttles" ("expires_at");
COMMIT;
-- Schedule daily (not during request processing):
-- DELETE FROM portal_login_challenges WHERE expires_at < NOW() - INTERVAL '1 day';
-- DELETE FROM portal_auth_throttles WHERE expires_at < NOW() - INTERVAL '1 day';
