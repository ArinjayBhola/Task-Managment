import { Hono } from "hono";
import { getDb } from "../db";
import { loadDashboardUsers } from "../db/dashboard";
import { createManagedUser } from "../db/managed-users";
import { authMiddleware } from "../middleware/auth";
import { hashPassword } from "../utils/password";
import { registration, login, registerAdmin } from "../auth/accounts";
import { Bindings, Variables } from "../types";

export function createAdminAuthRouter(databaseFactory = getDb) {
  const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
  router.post("/signup", registerAdmin);
  router.post("/signin", (c) => login(c, "Admin"));
  router.use("*", authMiddleware);
  router.use("*", async (c, next) => {
    if (c.get("jwtPayload").role !== "Admin")
      return c.json({ message: "Admin access required." }, 403);
    await next();
  });

  // The existing dashboard expects users and their assigned tasks.
  router.get("/bulk", async (c) => {
    const db = databaseFactory(c.env.DATABASE_URL);
    return c.json(await loadDashboardUsers(db));
  });

  router.post("/usersignup", async (c) => {
    const parsed = registration.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(
        {
          message:
            "Enter a name, valid email, and password of at least 15 characters.",
        },
        400,
      );
    }
    try {
      const { name, email, password } = parsed.data;
      const created = await createManagedUser(
        databaseFactory(c.env.DATABASE_URL),
        {
          name,
          email,
          passwordHash: await hashPassword(password),
        },
      );
      return c.json(created, 201);
    } catch (error) {
      const code =
        (error as { code?: string; cause?: { code?: string } }).code ||
        (error as { cause?: { code?: string } }).cause?.code;
      if (code === "23505")
        return c.json(
          { message: "A user with this email already exists." },
          409,
        );
      if (code === "42703")
        return c.json(
          {
            message:
              "User database setup is missing. Run npm run db:auth in backend.",
          },
          503,
        );
      return c.json(
        {
          message:
            "Unable to create user. Check the backend database configuration.",
        },
        503,
      );
    }
  });

  router.get("/user/:userId", async (c) => {
    const allUsers = await loadDashboardUsers(
      databaseFactory(c.env.DATABASE_URL),
    );
    const user = allUsers.find(
      (entry) => String(entry.id) === c.req.param("userId"),
    );
    return user ? c.json(user) : c.json({ message: "User not found." }, 404);
  });

  return router;
}
