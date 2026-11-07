-- Run explicitly as a PostgreSQL administrator, never by the web runtime.
-- Metadata/privileges only; no business rows, amounts, credentials or counters rewritten.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '5s';
SELECT set_config('savo.expected_db', :'expected_db', true),
       set_config('savo.app_role', :'app_role', true),
       set_config('savo.owner_role', :'owner_role', true);
DO $security$
DECLARE
 db_name text := current_database();
 app_name text := current_setting('savo.app_role');
 owner_name text := current_setting('savo.owner_role');
BEGIN
 IF db_name <> current_setting('savo.expected_db') OR
    NOT (db_name='savo_prod' AND app_name='savo' AND owner_name='savo_schema_owner' OR
         db_name ~ '^savo_paypal_verify_[a-f0-9]{12}$' AND app_name ~ '^savo_harden_app_[a-f0-9]{12}$' AND owner_name ~ '^savo_harden_owner_[a-f0-9]{12}$')
 THEN RAISE EXCEPTION 'Unexpected database/role scope'; END IF;
 IF NOT (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) THEN RAISE EXCEPTION 'Administrator required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=app_name AND rolcanlogin AND NOT rolsuper AND NOT rolcreaterole AND NOT rolreplication)
 THEN RAISE EXCEPTION 'Unexpected application role privileges'; END IF;
 IF EXISTS(SELECT 1 FROM pg_database WHERE datdba=(SELECT oid FROM pg_roles WHERE rolname=app_name) AND datname<>db_name)
    OR EXISTS(SELECT 1 FROM pg_tablespace WHERE spcowner=(SELECT oid FROM pg_roles WHERE rolname=app_name))
 THEN RAISE EXCEPTION 'Application owns unrelated shared objects'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relrowsecurity)
 THEN RAISE EXCEPTION 'Existing row-security policy needs separate review'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=owner_name) THEN
  EXECUTE format('CREATE ROLE %I NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',owner_name);
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=owner_name AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls))
 THEN RAISE EXCEPTION 'Unexpected schema-owner role'; END IF;
 EXECUTE format('REVOKE %I FROM %I',owner_name,app_name);
 IF EXISTS(SELECT 1 FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname=app_name))
 THEN RAISE EXCEPTION 'Application role has unreviewed memberships'; END IF;
 EXECUTE format('REASSIGN OWNED BY %I TO %I',app_name,owner_name);
 EXECUTE format('ALTER DATABASE %I OWNER TO %I',db_name,owner_name);
 EXECUTE format('ALTER SCHEMA public OWNER TO %I',owner_name);
 EXECUTE format('REVOKE ALL ON DATABASE %I FROM PUBLIC',db_name);
 EXECUTE format('REVOKE ALL ON DATABASE %I FROM %I',db_name,app_name);
 EXECUTE format('GRANT CONNECT ON DATABASE %I TO %I',db_name,app_name);
 EXECUTE format('REVOKE ALL ON SCHEMA public FROM PUBLIC');
 EXECUTE format('REVOKE CREATE ON SCHEMA public FROM %I',app_name);
 EXECUTE format('GRANT USAGE ON SCHEMA public TO %I',app_name);
 EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO %I',app_name);
 EXECUTE format('GRANT USAGE,SELECT,UPDATE ON ALL SEQUENCES IN SCHEMA public TO %I',app_name);
 EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO %I',app_name);
 EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO %I',owner_name,app_name);
 EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT USAGE,SELECT,UPDATE ON SEQUENCES TO %I',owner_name,app_name);
 EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO %I',owner_name,app_name);
 EXECUTE format('ALTER ROLE %I NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT CONNECTION LIMIT 20',app_name);
 EXECUTE format('ALTER ROLE %I IN DATABASE %I SET search_path TO pg_catalog,public',app_name,db_name);
 EXECUTE format('ALTER ROLE %I IN DATABASE %I SET statement_timeout TO %L',app_name,db_name,'30s');
 EXECUTE format('ALTER ROLE %I IN DATABASE %I SET lock_timeout TO %L',app_name,db_name,'5s');
 EXECUTE format('ALTER ROLE %I IN DATABASE %I SET idle_in_transaction_session_timeout TO %L',app_name,db_name,'60s');
END
$security$;
COMMIT;
