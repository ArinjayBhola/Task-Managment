import { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "User";
};
export const database = (c: Context) =>
  (c.get("databaseFactory") || getDb)(c.env.DATABASE_URL) as ReturnType<
    typeof getDb
  >;
export async function digest(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
function cookieOptions(c: Context) {
  const secure = new URL(c.req.url).protocol === "https:";
  const origin = c.req.header("Origin") || c.env.APP_ORIGIN?.split(",")[0];
  const crossSite =
    secure &&
    origin &&
    new URL(origin).hostname !== new URL(c.req.url).hostname;
  return {
    httpOnly: true,
    secure,
    sameSite: crossSite ? ("None" as const) : ("Lax" as const),
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  };
}
export async function issueSession(c: Context, user: SessionUser) {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const old = getCookie(c, "tm_session");
  const db = database(c);
  if (old)
    await db.execute(
      sql`DELETE FROM auth_sessions WHERE token_hash=${await digest(old)}`,
    );
  await db.execute(
    sql`INSERT INTO auth_sessions(token_hash,account_id,role,expires_at) VALUES (${await digest(token)},${user.id}::uuid,${user.role},now()+interval '30 days')`,
  );
  setCookie(c, "tm_session", token, cookieOptions(c));
  c.header("Cache-Control", "no-store");
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}
export async function readSession(c: Context): Promise<SessionUser | null> {
  const token = getCookie(c, "tm_session");
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const {
    rows: [user],
  } = await database(c).execute(sql`
    WITH valid AS (
      SELECT s.id AS session_id,s.account_id AS id,s.role,
        COALESCE(a.name,u.name) AS name,COALESCE(a.email,u.email) AS email
      FROM auth_sessions s
      LEFT JOIN admin_accounts a ON s.role='Admin' AND a.id=s.account_id
      LEFT JOIN users u ON s.role='User' AND u.id=s.account_id
      WHERE s.token_hash=${await digest(token)} AND s.expires_at>now()
        AND (a.id IS NOT NULL OR u.id IS NOT NULL)
    ) UPDATE auth_sessions s SET last_seen_at=now() FROM valid
      WHERE s.id=valid.session_id RETURNING valid.id,valid.role,valid.name,valid.email
  `);
  return user ? (user as SessionUser) : null;
}
export async function endSession(c: Context) {
  const token = getCookie(c, "tm_session");
  if (token)
    await database(c).execute(
      sql`DELETE FROM auth_sessions WHERE token_hash=${await digest(token)}`,
    );
  deleteCookie(c, "tm_session", {
    path: "/",
    secure: new URL(c.req.url).protocol === "https:",
  });
}
export async function throttle(c: Context, email: string) {
  const ip = c.req.header("CF-Connecting-IP") || "local-client";
  for (const [key, limit] of [
    [`ip:${ip}`, 50],
    [`account:${email.toLowerCase()}`, 8],
  ] as const) {
    const {
      rows: [bucket],
    } = await database(c).execute(sql`
      INSERT INTO auth_rate_limits(bucket_hash,attempts,window_start) VALUES (${await digest(key)},1,now())
      ON CONFLICT(bucket_hash) DO UPDATE SET
        attempts=CASE WHEN auth_rate_limits.window_start<now()-interval '15 minutes' THEN 1 ELSE auth_rate_limits.attempts+1 END,
        window_start=CASE WHEN auth_rate_limits.window_start<now()-interval '15 minutes' THEN now() ELSE auth_rate_limits.window_start END
      RETURNING attempts
    `);
    if (Number(bucket.attempts) > limit) return false;
  }
  return true;
}
