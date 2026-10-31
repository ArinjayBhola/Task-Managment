import { sql } from "drizzle-orm";
import { getDb } from "../db";
export async function reconcileWorkflows(
  db: ReturnType<typeof getDb>,
  options: { runId?: string } = {},
) {
  const { rows } = await db.execute(
    sql`SELECT id FROM workflow_runs WHERE state='running' AND ${options.runId ? sql`id=${options.runId}::uuid` : sql`TRUE`} ORDER BY checked_at LIMIT 100`,
  );
  for (const run of rows) {
    try {
      await db.execute(sql`SELECT workflow_advance(${run.id}::uuid)`);
    } catch {
      // A failed transaction has no partial side effects; the next sweep retries it.
      await db.execute(
        sql`UPDATE workflow_runs SET last_error='Automatic advance failed. Retry or check the assigned members.',checked_at=now() WHERE id=${run.id}::uuid AND state='running'`,
      );
    }
  }
}
