import { existsSync, readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
for (const file of [".dev.vars", ".env"])
  if (existsSync(file)) process.loadEnvFile(file);
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL in backend/.dev.vars.");
const sql = neon(process.env.DATABASE_URL);
const statements = readFileSync(
  new URL("../migrations/workflows.sql", import.meta.url),
  "utf8",
)
  .split(/(?=^(?:CREATE |ALTER TABLE ))/m)
  .filter((statement) => statement.trim());
await sql.transaction(statements.map((statement) => sql.query(statement)));
console.log(
  "Workflow tables and transactional engine installed. Existing tasks are preserved.",
);
