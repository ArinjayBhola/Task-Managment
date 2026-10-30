import { Hono } from "hono";
import { getDb } from "../db";
import { loadDashboardUsers } from "../db/dashboard";
import { authMiddleware } from "../middleware/auth";
import { login } from "../auth/accounts";
import { Bindings, Variables } from "../types";
export function createUserAuthRouter(databaseFactory = getDb) {
  const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
  router.post("/signin", (c) => login(c, "User"));
  router.use("*", authMiddleware);
  for (const path of ["/bulk", "/bulktask"] as const) {
    router.get(path, async (c) => {
      const payload = c.get("jwtPayload");
      if (payload.role !== "User")
        return c.json({ message: "User access required." }, 403);
      const db = databaseFactory(c.env.DATABASE_URL);
      const allUsers = await loadDashboardUsers(db);
      return c.json(
        allUsers.filter(
          (user) =>
            path === "/bulktask" || String(user.id) === String(payload.id),
        ),
      );
    });
  }
  return router;
}
