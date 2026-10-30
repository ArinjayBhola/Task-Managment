import { existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
for (const file of [".dev.vars", ".env"])
  if (existsSync(file)) process.loadEnvFile(file);
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL in backend/.dev.vars.");
const sql = neon(process.env.DATABASE_URL);
await sql.transaction([
  sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT ''`,
  sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS member_notes text NOT NULL DEFAULT ''`,
  sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_admin_id uuid REFERENCES admin_accounts(id)`,
  sql`DO $$ DECLARE column_name_to_change text;
    BEGIN
      FOR column_name_to_change IN SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tasks'
        AND column_name IN ('organization_id', 'org_id', 'project_id', 'creator_id')
      LOOP EXECUTE format('ALTER TABLE tasks ALTER COLUMN %I DROP NOT NULL', column_name_to_change); END LOOP;
    END $$`,
]);
console.log(
  "Task saving is ready. Existing tasks and relationships were preserved; new tasks do not require a workspace or project.",
);
