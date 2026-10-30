import { existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
for (const file of [".dev.vars", ".env"])
  if (existsSync(file)) process.loadEnvFile(file);
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL before migrating.");
const sql = neon(process.env.DATABASE_URL);
await sql`DO $$ DECLARE item record;
BEGIN
  CREATE TABLE IF NOT EXISTS id_uuid_migration (
    table_name text NOT NULL, old_id text NOT NULL, new_id uuid NOT NULL,
    PRIMARY KEY (table_name, old_id), UNIQUE (table_name, new_id)
  );
  CREATE TEMP TABLE uuid_primary_targets ON COMMIT DROP AS
    SELECT c.table_name FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.column_name = 'id' AND c.udt_name IN ('int4','int8')
      AND left(c.table_name,2) <> '__'
      AND EXISTS (SELECT 1 FROM pg_constraint p JOIN pg_class t ON t.oid=p.conrelid
        JOIN pg_namespace n ON n.oid=t.relnamespace JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=p.conkey[1]
        WHERE n.nspname='public' AND t.relname=c.table_name AND p.contype='p' AND array_length(p.conkey,1)=1 AND a.attname='id');
  FOR item IN SELECT table_name FROM uuid_primary_targets LOOP
    EXECUTE format('INSERT INTO id_uuid_migration SELECT %L, id::text, gen_random_uuid() FROM public.%I ON CONFLICT DO NOTHING', item.table_name,item.table_name);
  END LOOP;
  CREATE TEMP TABLE uuid_foreign_keys ON COMMIT DROP AS
    SELECT c.conname, c.conrelid::regclass::text AS child_table, pg_get_constraintdef(c.oid) AS definition,
      child.relname AS child_name, a.attname AS child_column, parent.relname AS parent_name
    FROM pg_constraint c JOIN pg_class parent ON parent.oid=c.confrelid
    JOIN pg_namespace pn ON pn.oid=parent.relnamespace
    JOIN pg_class child ON child.oid=c.conrelid
    JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
    JOIN pg_attribute pa ON pa.attrelid=c.confrelid AND pa.attnum=c.confkey[1]
    WHERE c.contype='f' AND pn.nspname='public' AND pa.attname='id'
      AND parent.relname IN (SELECT table_name FROM uuid_primary_targets)
      AND array_length(c.conkey,1)=1;
  CREATE TEMP TABLE uuid_column_targets ON COMMIT DROP AS
    SELECT table_name, 'id'::text AS column_name, table_name AS parent_name, true AS is_primary FROM uuid_primary_targets
    UNION SELECT child_name, child_column::text, parent_name, false FROM uuid_foreign_keys;
  FOR item IN SELECT * FROM uuid_foreign_keys LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',item.child_table,item.conname);
  END LOOP;
  CREATE OR REPLACE FUNCTION pg_temp.mapped_uuid(p_table text,p_old text) RETURNS uuid
    LANGUAGE sql STABLE STRICT AS 'SELECT new_id FROM public.id_uuid_migration WHERE table_name=p_table AND old_id=p_old';
  FOR item IN SELECT * FROM uuid_column_targets LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT',item.table_name,item.column_name);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE uuid USING pg_temp.mapped_uuid(%L,%I::text)',item.table_name,item.column_name,item.parent_name,item.column_name);
    IF item.is_primary THEN EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()',item.table_name); END IF;
  END LOOP;
  FOR item IN SELECT * FROM uuid_foreign_keys LOOP
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s',item.child_table,item.conname,item.definition);
  END LOOP;
END $$`;
await sql.transaction([
  sql`CREATE TABLE IF NOT EXISTS auth_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), token_hash text NOT NULL UNIQUE,
    account_id uuid NOT NULL, role text NOT NULL CHECK (role IN ('Admin','User')),
    created_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
  )`,
  sql`CREATE INDEX IF NOT EXISTS auth_sessions_account ON auth_sessions(account_id,role)`,
  sql`CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires_at)`,
  sql`CREATE TABLE IF NOT EXISTS auth_rate_limits (bucket_hash text PRIMARY KEY, attempts integer NOT NULL, window_start timestamptz NOT NULL)`,
  sql`CREATE TABLE IF NOT EXISTS auth_controls (key text PRIMARY KEY)`,
  sql`INSERT INTO auth_controls(key) SELECT 'admin-bootstrap' WHERE EXISTS (SELECT 1 FROM admin_accounts) ON CONFLICT DO NOTHING`,
]);
const ids =
  await sql`SELECT table_name, udt_name FROM information_schema.columns WHERE table_schema='public' AND column_name='id' ORDER BY table_name`;
console.log(
  "UUID migration and session storage ready. Existing records and foreign keys preserved.",
);
console.log(JSON.stringify(ids));
