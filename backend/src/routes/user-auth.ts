import { Hono } from "hono";
import { sign } from "hono/jwt";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../db/schema";
import { userOrganizations, workspaceMemberIds } from "../db/managed-users";
import { loadDashboardUsers } from "../db/dashboard";
import { authMiddleware } from "../middleware/auth";
import { verifyPassword } from "../utils/password";
import { Bindings, Variables } from "../types";

const credentials = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(6).max(256),
});

export function createUserAuthRouter(databaseFactory = getDb) {
  const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
  router.post("/signin", async (c) => {
    if (!c.env.DATABASE_URL || !c.env.JWT_SECRET) return c.json({ message: "Backend authentication is not configured." }, 503);
    const parsed = credentials.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ message: "Enter a valid email and password." }, 400);
    try {
      const db = databaseFactory(c.env.DATABASE_URL);
      const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
      if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
        return c.json({ message: "Email or password is incorrect." }, 401);
      }
      const token = await sign({ id: user.id, email: user.email, role: "User", exp: Math.floor(Date.now() / 1000) + 86400 }, c.env.JWT_SECRET, "HS256");
      return c.json({ token });
    } catch {
      return c.json({ message: "Unable to sign in. Check the backend database configuration." }, 503);
    }
  });

  router.use("*", authMiddleware);
  router.get("/organizations", async (c) => {
    const payload = c.get("jwtPayload");
    if (payload.role === "Admin") return c.json([]);
    if (payload.role !== "User") return c.json({ message: "User access required." }, 403);
    return c.json(await userOrganizations(databaseFactory(c.env.DATABASE_URL), payload.id));
  });

  for (const path of ["/bulk", "/bulktask"] as const) {
    router.get(path, async (c) => {
      const payload = c.get("jwtPayload");
      if (payload.role !== "User") return c.json({ message: "User access required." }, 403);
      const db = databaseFactory(c.env.DATABASE_URL);
      const organizations = await userOrganizations(db, payload.id);
      const requested = c.req.header("x-organization-id") || c.req.header("X-Org-ID");
      const active = requested ? organizations.find(org => String(org.id) === requested) : organizations[0];
      if (!active) return requested ? c.json({ message: "Workspace access denied." }, 403) : c.json([]);
      const memberIds = await workspaceMemberIds(db, active.id as string | number);
      const allUsers = await loadDashboardUsers(db);
      return c.json(allUsers.filter(user => memberIds.includes(String(user.id)) && (path === "/bulktask" || String(user.id) === String(payload.id))).map(user => {
        const tasks = user.tasks.filter(task => String(task.orgId) === String(active.id));
        return { ...user, tasks, tasksAssigned: tasks };
      }));
    });
  }
  return router;
}
