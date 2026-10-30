import { Context, Next } from "hono";
import { getDb } from "../db";
import { memberships } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { getUserId } from "./auth";

export const tenantMiddleware = async (c: Context, next: Next) => {
  const orgId = c.req.header("X-Org-ID") || c.req.param("orgId");
  if (!orgId) {
    return c.json({ error: "Missing Organization ID" }, 400);
  }

  const userId = getUserId(c);
  const db = getDb(c.env.DATABASE_URL);

  const membership = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, userId),
      eq(memberships.orgId, orgId)
    ),
  });

  if (!membership) {
    return c.json({ error: "Forbidden: Not a member of this organization" }, 403);
  }

  c.set("orgId", orgId);
  c.set("role", membership.role);
  await next();
};
