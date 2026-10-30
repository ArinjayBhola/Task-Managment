import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { neon } from "@neondatabase/serverless";

for (const file of [".dev.vars", ".env"])
  if (existsSync(file)) process.loadEnvFile(file);
const { outputFiles } = await build({
  stdin: {
    contents:
      'export {default} from "./src/index"; export {hashPassword} from "./src/utils/password";',
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
const app = compiled.exports.default;
const sql = neon(process.env.DATABASE_URL);
const suffix = crypto.randomUUID();
const admin = {
  name: "Task flow test admin",
  email: `task-admin-${suffix}@example.test`,
  password: crypto.randomUUID(),
};
const first = {
  name: "Task flow test member",
  email: `task-user-${suffix}@example.test`,
  password: crypto.randomUUID(),
};
const second = {
  name: "Other task flow test member",
  email: `other-user-${suffix}@example.test`,
  password: crypto.randomUUID(),
};
const request = (path, { method = "GET", body, token } = {}) => {
  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Cookie: token } : {}),
      Origin: "http://localhost:5173",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  return process.env.BACKEND_TEST_URL
    ? fetch(new URL(`/api/v1/${path}`, process.env.BACKEND_TEST_URL), init)
    : app.request(`/api/v1/${path}`, init, process.env);
};
async function json(response, expected) {
  const data = await response.json();
  assert.equal(
    response.status,
    expected,
    data.message || "Unexpected response status",
  );
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  return cookie ? { ...data, token: cookie } : data;
}
try {
  await sql`INSERT INTO admin_accounts(name,email,password_hash) VALUES (${admin.name},${admin.email},${await compiled.exports.hashPassword(admin.password)})`;
  const { token } = await json(
    await request("admin/signin", { method: "POST", body: admin }),
    200,
  );
  await json(
    await request("admin/signup", { method: "POST", body: admin }),
    403,
  );
  const createdUser = await json(
    await request("admin/usersignup", { method: "POST", body: first, token }),
    201,
  );
  const otherUser = await json(
    await request("admin/usersignup", { method: "POST", body: second, token }),
    201,
  );
  assert.equal("defaultOrgId" in createdUser, false);
  await json(
    await request("admin/usersignup", { method: "POST", body: first, token }),
    409,
  );
  const [layout] =
    await sql`SELECT to_regclass('public.organization_members') IS NOT NULL AS legacy`;
  const memberships = layout.legacy
    ? await sql`SELECT COUNT(*)::int AS total FROM organization_members WHERE user_id IN (${createdUser.id}, ${otherUser.id})`
    : await sql`SELECT COUNT(*)::int AS total FROM memberships WHERE user_id IN (${createdUser.id}, ${otherUser.id})`;
  assert.equal(
    memberships[0].total,
    0,
    "New members must not create workspace memberships",
  );
  const { token: userToken } = await json(
    await request("user/signin", { method: "POST", body: first }),
    200,
  );
  const { token: otherToken } = await json(
    await request("user/signin", { method: "POST", body: second }),
    200,
  );
  const payload = {
    id: createdUser.id,
    description: "Prepare",
    dueDate: "2026-10-31",
    status: "Not Started",
    comments: "Original assignment context",
  };
  const task = await json(
    await request("admin/task", { method: "POST", body: payload, token }),
    201,
  );
  const detail = await json(
    await request(`admin/task/${task.id}`, { token }),
    200,
  );
  assert.equal(detail.description, "Prepare");
  assert.equal(detail.dueDate.slice(0, 10), "2026-10-31");
  assert.equal(detail.comments, payload.comments);
  const personal = await json(
    await request("user/bulk", { token: userToken }),
    200,
  );
  assert.equal(personal.length, 1);
  assert.equal(personal[0].id, createdUser.id);
  assert.ok(personal[0].tasks.some((entry) => entry.id === task.id));
  assert.equal("passwordHash" in personal[0], false);
  const team = await json(
    await request("user/bulktask", { token: userToken }),
    200,
  );
  assert.ok(team.some((entry) => entry.id === otherUser.id));
  await json(
    await request(`user/bulktask/${task.id}`, { token: otherToken }),
    404,
  );
  await json(
    await request("user/taskupdate", {
      method: "PUT",
      body: { taskId: task.id, status: "Completed" },
      token: otherToken,
    }),
    404,
  );
  await json(
    await request("admin/task", {
      method: "POST",
      body: payload,
      token: userToken,
    }),
    403,
  );
  await json(
    await request("admin/delete", {
      method: "DELETE",
      body: { taskId: task.id },
      token: userToken,
    }),
    403,
  );
  await json(
    await request("user/taskupdate", {
      method: "PUT",
      body: { taskId: task.id, description: "Not allowed" },
      token: userToken,
    }),
    400,
  );
  await json(
    await request("user/taskupdate", {
      method: "PUT",
      body: {
        taskId: task.id,
        status: "Completed",
        comments: "Finished the work",
      },
      token: userToken,
    }),
    200,
  );
  const afterMember = await json(
    await request(`admin/task/${task.id}`, { token }),
    200,
  );
  assert.equal(afterMember.status, "Completed");
  assert.equal(afterMember.adminComments, payload.comments);
  assert.equal(afterMember.memberComments, "Finished the work");
  await json(
    await request(`admin/task/${task.id}`, {
      method: "PUT",
      body: {
        description: "Prepare the revised report",
        dueDate: "2026-11-02",
        status: "In Progress",
        comments: "Revised admin context",
      },
      token,
    }),
    200,
  );
  const afterAdmin = await json(
    await request(`user/bulktask/${task.id}`, { token: userToken }),
    200,
  );
  assert.equal(afterAdmin.description, "Prepare the revised report");
  assert.equal(afterAdmin.dueDate.slice(0, 10), "2026-11-02");
  assert.equal(afterAdmin.status, "In Progress");
  assert.equal(afterAdmin.comments, "Finished the work");
  assert.equal(afterAdmin.adminComments, "Revised admin context");
  await json(
    await request("admin/task", {
      method: "POST",
      body: { ...payload, dueDate: "2026-02-31" },
      token,
    }),
    400,
  );
  await json(
    await request("admin/delete", {
      method: "DELETE",
      body: { taskId: task.id },
      token,
    }),
    200,
  );
  await json(await request(`admin/task/${task.id}`, { token }), 404);
  const afterDelete = await json(
    await request("user/bulk", { token: userToken }),
    200,
  );
  assert.equal(afterDelete[0].tasks.length, 0);
  assert.match(createdUser.id, /^[a-f0-9-]{36}$/);
  assert.match(String(task.id), /^[a-f0-9-]{36}$/);
  const secondLogin = await json(
    await request("user/signin", { method: "POST", body: first }),
    200,
  );
  const changed = await json(
    await request("auth/password", {
      method: "POST",
      body: {
        currentPassword: first.password,
        newPassword: "A replacement secure passphrase 2026",
      },
      token: userToken,
    }),
    200,
  );
  await json(await request("auth/session", { token: secondLogin.token }), 401);
  await json(await request("auth/session", { token: userToken }), 401);
  await json(await request("auth/session", { token: changed.token }), 200);
  await json(
    await request("auth/logout", { method: "POST", token: changed.token }),
    200,
  );
  await json(await request("auth/session", { token: changed.token }), 401);
  console.log(
    "Live database checks passed: standalone accounts; task create, reload, admin edit, member progress, notes, deletion, date persistence, and assignment permissions.",
  );
} finally {
  await sql`DELETE FROM tasks WHERE assigned_admin_id IN (SELECT id FROM admin_accounts WHERE email = ${admin.email})`;
  await sql`DELETE FROM auth_sessions WHERE account_id IN (SELECT id FROM users WHERE email IN (${first.email},${second.email}) UNION SELECT id FROM admin_accounts WHERE email=${admin.email})`;
  await sql`DELETE FROM users WHERE email IN (${first.email}, ${second.email})`;
  await sql`DELETE FROM admin_accounts WHERE email = ${admin.email}`;
  console.log(
    "Temporary test tasks and accounts removed. Existing records were preserved.",
  );
}
