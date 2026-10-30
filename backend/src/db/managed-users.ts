import { sql } from "drizzle-orm";
import { getDb } from "./index";

type Database = ReturnType<typeof getDb>;

async function membershipLayout(db: Database) {
  const { rows: [layout] } = await db.execute(sql`SELECT to_regclass('public.organization_members') IS NOT NULL AS legacy`);
  return layout.legacy
    ? { table: sql.identifier("organization_members"), org: sql.identifier("organization_id") }
    : { table: sql.identifier("memberships"), org: sql.identifier("org_id") };
}

export async function createManagedUser(db: Database, user: { name: string; email: string; passwordHash: string }) {
  const layout = await membershipLayout(db);
  const slug = crypto.randomUUID();
  // One statement makes account, workspace, and membership creation atomic.
  const { rows: [created] } = await db.execute(sql`
    WITH new_user AS (
      INSERT INTO users (name, email, password_hash)
      VALUES (${user.name}, ${user.email}, ${user.passwordHash}) RETURNING id
    ), new_org AS (
      INSERT INTO organizations (name, slug)
      VALUES (${`${user.name}'s Workspace`}, ${slug}) RETURNING id
    ), new_membership AS (
      INSERT INTO ${layout.table} (user_id, ${layout.org}, role)
      SELECT new_user.id, new_org.id, 'owner' FROM new_user CROSS JOIN new_org
      RETURNING user_id
    )
    SELECT new_user.id, new_org.id AS "defaultOrgId"
    FROM new_user CROSS JOIN new_org CROSS JOIN new_membership
  `);
  return created;
}

export async function userOrganizations(db: Database, userId: string | number) {
  const layout = await membershipLayout(db);
  const { rows } = await db.execute(sql`
    SELECT o.id, o.name, m.role FROM ${layout.table} m
    JOIN organizations o ON o.id = m.${layout.org}
    WHERE m.user_id = ${userId}
  `);
  return rows;
}

export async function workspaceMemberIds(db: Database, orgId: string | number) {
  const layout = await membershipLayout(db);
  const { rows } = await db.execute(sql`SELECT user_id AS "userId" FROM ${layout.table} WHERE ${layout.org} = ${orgId}`);
  return rows.map(row => String(row.userId));
}
