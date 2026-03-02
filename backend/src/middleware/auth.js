import { verify } from "hono/jwt";
import { getDb } from "../db";
import { organizationMembers } from "../db/schema";
import { and, eq } from "drizzle-orm";

export const authentication = async (c, next) => {
  const jwt_token = c.req.header("Authorization");
  const orgId = c.req.header("x-organization-id"); // The current workspace

  if (!jwt_token) {
    return c.json({ message: "Unauthorized: Missing Token" }, 403);
  }

  try {
    const payload = await verify(jwt_token, c.env.JWT_SECRET);
    
    if (!payload.id) {
       return c.json({ message: "Unauthorized: Invalid Token Payload" }, 403);
    }

    c.set("jwtPayload", payload);

    // If an organization ID is provided, verify they are a member
    if (orgId) {
      const db = getDb(c.env.DATABASE_URL);
      const membership = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, payload.id),
          eq(organizationMembers.organizationId, parseInt(orgId))
        )
      });

      if (!membership) {
         return c.json({ message: "Forbidden: You don't have access to this organization" }, 403);
      }

      c.set("orgId", parseInt(orgId));
      c.set("orgRole", membership.role);
    }

    await next();
  } catch (error) {
     return c.json({ message: "Unauthorized: Token verification failed" }, 403);
  }
};
