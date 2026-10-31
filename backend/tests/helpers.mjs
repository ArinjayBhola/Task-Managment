import { build } from "esbuild";
import { createRequire } from "node:module";
import { PgDialect } from "drizzle-orm/pg-core";
import { createHash } from "node:crypto";
const { outputFiles } = await build({
  stdin: {
    contents:
      'export {createApp} from "./src/index"; export {hashPassword} from "./src/utils/password"; export {definitionSchema} from "./src/workflows/definition";',
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  packages: "external",
});
const compiled = { exports: {} };
new Function("require", "module", "exports", outputFiles[0].text)(
  createRequire(import.meta.url),
  compiled,
  compiled.exports,
);
export const { createApp, hashPassword, definitionSchema } = compiled.exports;
export const adminId = "11111111-1111-4111-8111-111111111111";
export const userId = "22222222-2222-4222-8222-222222222222";
export const env = {
  DATABASE_URL: "test-only",
  JWT_SECRET: "unused-by-session-auth",
};
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export async function fixture() {
  const accounts = [
    {
      id: adminId,
      name: "Test admin",
      email: "admin@example.test",
      role: "Admin",
      password_hash: await hashPassword("a long unique test passphrase"),
    },
    {
      id: userId,
      name: "Test member",
      email: "member@example.test",
      role: "User",
      password_hash: await hashPassword("a long unique test passphrase"),
    },
  ];
  const sessions = new Map(),
    attempts = new Map();
  const queries = [];
  const db = {
    execute: async (query) => {
      const { sql, params: p } = new PgDialect().sqlToQuery(query);
      queries.push(sql);
      if (sql.includes("WITH valid")) {
        const s = sessions.get(p[0]);
        return { rows: s && !s.expired ? [s.user] : [] };
      }
      if (sql.includes("INSERT INTO auth_rate_limits")) {
        attempts.set(p[0], (attempts.get(p[0]) || 0) + 1);
        return { rows: [{ attempts: attempts.get(p[0]) }] };
      }
      if (sql.includes("DELETE FROM auth_rate_limits")) {
        attempts.delete(p[0]);
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO auth_controls")) return { rows: [] };
      if (sql.includes("SELECT id,name,email,password_hash"))
        return {
          rows: accounts.filter(
            (a) =>
              a.email === p[0] &&
              a.role === (sql.includes("admin_accounts") ? "Admin" : "User"),
          ),
        };
      if (sql.includes("INSERT INTO auth_sessions")) {
        const account = accounts.find((a) => a.id === p[1]);
        sessions.set(p[0], {
          user: {
            id: account.id,
            name: account.name,
            email: account.email,
            role: p[2],
          },
        });
        return { rows: [] };
      }
      if (sql.includes("DELETE FROM auth_sessions WHERE token_hash")) {
        sessions.delete(p[0]);
        return { rows: [] };
      }
      if (sql.includes("SELECT password_hash"))
        return {
          rows: accounts
            .filter((a) => a.id === p[0])
            .map((a) => ({ password_hash: a.password_hash })),
        };
      if (sql.includes("WITH changed")) {
        const account = accounts.find(
          (a) => a.id === p[1] && a.password_hash === p[2],
        );
        if (!account) return { rows: [] };
        account.password_hash = p[0];
        const removed = [];
        for (const [k, s] of sessions)
          if (s.user.id === account.id) {
            sessions.delete(k);
            removed.push({ id: k });
          }
        return { rows: removed };
      }
      throw Object.assign(new Error("Unconfigured schema"), { code: "42703" });
    },
  };
  const app = createApp(() => db);
  const request = (
    path,
    method = "GET",
    body,
    cookie,
    origin = "http://localhost:5173",
  ) =>
    app.request(
      `/api/v1/${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
          ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
      env,
    );
  const login = async (role = "Admin") => {
    const response = await request(
      `${role === "Admin" ? "admin" : "user"}/signin`,
      "POST",
      {
        email: role === "Admin" ? "admin@example.test" : "member@example.test",
        password: "a long unique test passphrase",
      },
    );
    return response.headers.get("set-cookie").split(";")[0];
  };
  return { app, db, request, login, sessions, accounts, queries };
}
