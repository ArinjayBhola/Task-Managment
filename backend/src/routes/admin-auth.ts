import { Hono } from "hono";
import { sign } from "hono/jwt";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { adminAccounts } from "../db/schema";
import { loadDashboardUsers } from "../db/dashboard";
import { createManagedUser } from "../db/managed-users";
import { authMiddleware } from "../middleware/auth";
import { hashPassword, verifyPassword } from "../utils/password";
import { Bindings, Variables } from "../types";
import { z } from "zod";

const credentials = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(6).max(256),
});
const registration = credentials.extend({ name: z.string().trim().min(1).max(200) });

export function createAdminAuthRouter(databaseFactory = getDb) {
  const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  // These endpoints must be registered before the authentication middleware.
  for (const action of ["signup", "signin"] as const) {
    router.post(`/${action}`, async (c) => {
      if (!c.env.DATABASE_URL || !c.env.JWT_SECRET) {
        return c.json({ message: "Backend database or JWT secret is not configured." }, 503);
      }
      const body = await c.req.json().catch(() => null);
      const parsed = (action === "signup" ? registration : credentials).safeParse(body);
      if (!parsed.success) {
        return c.json({ message: "Enter a valid email, a password of 6–256 characters, and your name for signup." }, 400);
      }

      try {
        const db = databaseFactory(c.env.DATABASE_URL);
        const { email, password } = parsed.data;
        const [existing] = await db.select().from(adminAccounts).where(eq(adminAccounts.email, email)).limit(1);
        let account = existing;
        if (action === "signup") {
          if (existing) return c.json({ message: "An admin with this email already exists. Please sign in." }, 409);
          [account] = await db.insert(adminAccounts).values({
            name: (parsed.data as z.infer<typeof registration>).name,
            email,
            passwordHash: await hashPassword(password),
          }).returning();
        } else if (!existing || !(await verifyPassword(password, existing.passwordHash))) {
          return c.json({ message: "Email or password is incorrect." }, 401);
        }

        const token = await sign({
          id: account.id, email: account.email, role: "Admin",
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        }, c.env.JWT_SECRET, "HS256");
        return c.json({ token }, action === "signup" ? 201 : 200);
      } catch (error) {
        const code = (error as { code?: string; cause?: { code?: string } }).code
          || (error as { cause?: { code?: string } }).cause?.code;
        if (code === "23505") return c.json({ message: "An admin with this email already exists. Please sign in." }, 409);
        if (code === "42P01") return c.json({ message: "Admin database setup is missing. Run npm run db:auth in backend." }, 503);
        return c.json({ message: "Unable to access the admin database. Check the backend database configuration." }, 503);
      }
    });
  }

  router.use("*", authMiddleware);
  router.use("*", async (c, next) => {
    if (c.get("jwtPayload").role !== "Admin") return c.json({ message: "Admin access required." }, 403);
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
      return c.json({ message: "Enter a name, valid email, and password of at least 6 characters." }, 400);
    }
    try {
      const { name, email, password } = parsed.data;
      const created = await createManagedUser(databaseFactory(c.env.DATABASE_URL), {
        name, email, passwordHash: await hashPassword(password),
      });
      return c.json(created, 201);
    } catch (error) {
      const code = (error as { code?: string; cause?: { code?: string } }).code
        || (error as { cause?: { code?: string } }).cause?.code;
      if (code === "23505") return c.json({ message: "A user with this email already exists." }, 409);
      if (code === "42703") return c.json({ message: "User database setup is missing. Run npm run db:auth in backend." }, 503);
      return c.json({ message: "Unable to create user. Check the backend database configuration." }, 503);
    }
  });

  router.get("/user/:userId", async (c) => {
    const allUsers = await loadDashboardUsers(databaseFactory(c.env.DATABASE_URL));
    const user = allUsers.find((entry) => String(entry.id) === c.req.param("userId"));
    return user ? c.json(user) : c.json({ message: "User not found." }, 404);
  });

  return router;
}
