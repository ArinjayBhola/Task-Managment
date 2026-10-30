import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { database, endSession, issueSession, throttle } from "../auth/sessions";
import { hashPassword, verifyPassword } from "../utils/password";
import { Bindings, Variables } from "../types";

export const newPassword = z.string().min(15).max(128);
export function createSessionApi() {
  const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
  router.get("/api/v1/auth/session", authMiddleware, (c) =>
    c.json({ user: c.get("currentUser") }),
  );
  router.post("/api/v1/auth/logout", async (c) => {
    await endSession(c);
    return c.json({ message: "Signed out." });
  });
  router.post("/api/v1/auth/password", authMiddleware, async (c) => {
    const parsed = z
      .object({ currentPassword: z.string().min(1).max(256), newPassword })
      .safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
      return c.json(
        { message: "Use a new password of 15–128 characters." },
        400,
      );
    const user = c.get("currentUser");
    if (!(await throttle(c, `password:${user.id}`))) {
      c.header("Retry-After", "900");
      return c.json(
        { message: "Too many attempts. Try again in 15 minutes." },
        429,
      );
    }
    const table = sql.identifier(
      user.role === "Admin" ? "admin_accounts" : "users",
    );
    const db = database(c);
    const {
      rows: [account],
    } = await db.execute(
      sql`SELECT password_hash FROM ${table} WHERE id=${user.id}::uuid`,
    );
    if (
      !account ||
      !(await verifyPassword(
        parsed.data.currentPassword,
        String(account.password_hash),
      ))
    )
      return c.json({ message: "Current password is incorrect." }, 401);
    if (parsed.data.currentPassword === parsed.data.newPassword)
      return c.json({ message: "Choose a different new password." }, 400);
    const hash = await hashPassword(parsed.data.newPassword);
    const { rows } = await db.execute(sql`
      WITH changed AS (UPDATE ${table} SET password_hash=${hash} WHERE id=${user.id}::uuid AND password_hash=${String(account.password_hash)} RETURNING id)
      DELETE FROM auth_sessions WHERE account_id IN (SELECT id FROM changed) AND role=${user.role} RETURNING id
    `);
    if (!rows.length)
      return c.json({ message: "Account changed. Please sign in again." }, 409);
    return c.json(await issueSession(c, user));
  });
  return router;
}
