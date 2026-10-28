-- Additive only. Existing clients remain untitled; never infer/backfill a title.
ALTER TABLE "client_users" ADD COLUMN IF NOT EXISTS "title" VARCHAR(4);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_users_title_allowed' AND conrelid = 'client_users'::regclass) THEN
    ALTER TABLE "client_users" ADD CONSTRAINT "client_users_title_allowed"
      CHECK ("title" IS NULL OR "title" IN ('Mr.', 'Mrs.', 'Ms.', 'Dr.'));
  END IF;
END $$;
