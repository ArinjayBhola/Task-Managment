import { Context } from "hono";
import { sql } from "drizzle-orm";
import { z } from "zod";
import {
  database,
  digest,
  issueSession,
  readSession,
  throttle,
} from "./sessions";
import { hashPassword, verifyPassword } from "../utils/password";

export const credentials = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(256),
});
export const registration = credentials.extend({
  name: z.string().trim().min(1).max(200),
  password: z.string().min(15).max(128),
});
const dummyHash =
  "pbkdf2-sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
export async function login(c: Context, role: "Admin" | "User") {
  const parsed = credentials.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return c.json({ message: "Enter a valid email and password." }, 400);
  if (!(await throttle(c, parsed.data.email))) {
    c.header("Retry-After", "900");
    return c.json(
      { message: "Too many sign-in attempts. Try again in 15 minutes." },
      429,
    );
  }
  const table = sql.identifier(role === "Admin" ? "admin_accounts" : "users");
  const db = database(c);
  const {
    rows: [account],
  } = await db.execute(
    sql`SELECT id,name,email,password_hash FROM ${table} WHERE lower(email)=${parsed.data.email} LIMIT 1`,
  );
  const valid = await verifyPassword(
    parsed.data.password,
    String(account?.password_hash || dummyHash),
  );
  if (!account || !valid)
    return c.json({ message: "Email or password is incorrect." }, 401);
  await db.execute(
    sql`DELETE FROM auth_rate_limits WHERE bucket_hash=${await digest(`account:${parsed.data.email}`)}`,
  );
  return c.json(
    await issueSession(c, {
      id: String(account.id),
      name: String(account.name || ""),
      email: String(account.email),
      role,
    }),
  );
}
export async function registerAdmin(c: Context) {
  const parsed = registration.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return c.json(
      {
        message:
          "Enter your name, a valid email, and a password of 15–128 characters.",
      },
      400,
    );
  if (!(await throttle(c, parsed.data.email)))
    return c.json({ message: "Too many attempts. Try again later." }, 429);
  const current = await readSession(c);
  const db = database(c);
  const { name, email, password } = parsed.data;
  const hash = await hashPassword(password);
  try {
    const result =
      current?.role === "Admin"
        ? await db.execute(
            sql`INSERT INTO admin_accounts(name,email,password_hash) VALUES (${name},${email},${hash}) RETURNING id,name,email`,
          )
        : await db.execute(sql`WITH gate AS (
          INSERT INTO auth_controls(key) SELECT 'admin-bootstrap' WHERE NOT EXISTS (SELECT 1 FROM admin_accounts)
          ON CONFLICT DO NOTHING RETURNING key
        ) INSERT INTO admin_accounts(name,email,password_hash) SELECT ${name},${email},${hash} FROM gate RETURNING id,name,email`);
    const account = result.rows[0];
    if (!account)
      return c.json(
        {
          message:
            "Admin registration is restricted. Sign in or contact an administrator.",
        },
        403,
      );
    const user = {
      id: String(account.id),
      name: String(account.name),
      email: String(account.email),
      role: "Admin" as const,
    };
    return current?.role === "Admin"
      ? c.json({ account: user }, 201)
      : c.json(await issueSession(c, user), 201);
  } catch (error) {
    const code =
      (error as { cause?: { code?: string }; code?: string }).cause?.code ||
      (error as { code?: string }).code;
    if (code === "23505")
      return c.json(
        {
          message:
            "Unable to create this account. Check the details or sign in.",
        },
        409,
      );
    throw error;
  }
}
