import { sql } from "drizzle-orm";
import { getDb } from "./index";

type Database = ReturnType<typeof getDb>;

export async function createManagedUser(
  db: Database,
  user: { name: string; email: string; passwordHash: string },
) {
  const {
    rows: [created],
  } = await db.execute(sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${user.name}, ${user.email}, ${user.passwordHash})
    RETURNING id, name, email
  `);
  return created;
}
