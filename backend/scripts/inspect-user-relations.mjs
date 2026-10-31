import { existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
for (const file of [".dev.vars", ".env"])
  if (existsSync(file)) process.loadEnvFile(file);
const sql = neon(process.env.DATABASE_URL);
const relations =
  await sql`SELECT c.conname AS constraint, child.relname AS child_table,
  array_agg(a.attname ORDER BY keys.ordinality) AS child_columns,
  parent.relname AS parent_table,c.confdeltype AS on_delete
  FROM pg_constraint c JOIN pg_class child ON child.oid=c.conrelid
  JOIN pg_class parent ON parent.oid=c.confrelid
  JOIN pg_namespace n ON n.oid=child.relnamespace
  JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS keys(attnum,ordinality) ON true
  JOIN pg_attribute a ON a.attrelid=child.oid AND a.attnum=keys.attnum
  WHERE c.contype='f' AND n.nspname='public'
  GROUP BY c.conname,child.relname,parent.relname,c.confdeltype ORDER BY parent.relname,child.relname`;
const columns =
  await sql`SELECT table_name,column_name,data_type FROM information_schema.columns
  WHERE table_schema='public' AND (table_name IN ('notifications','activities','comments','task_assignees','organization_members')
  OR column_name LIKE '%user%' OR column_name LIKE '%author%' OR column_name LIKE '%actor%' OR column_name LIKE '%recipient%') ORDER BY table_name,ordinal_position`;
console.log(JSON.stringify({ relations, columns }, null, 2));
