import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import { neon } from "@neondatabase/serverless";
for (const file of [".dev.vars", ".env"])
  if (existsSync(file)) process.loadEnvFile(file);
const { outputFiles } = await build({
  stdin: {
    contents:
      'export {createApp} from "./src/index"; export {hashPassword} from "./src/utils/password";',
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
const { createApp, hashPassword } = compiled.exports,
  app = createApp(),
  sql = neon(process.env.DATABASE_URL);
const suffix = crypto.randomUUID(),
  password = crypto.randomUUID(),
  adminEmail = `delete-admin-${suffix}@example.test`;
const removedEmail = `delete-user-${suffix}@example.test`,
  keptEmail = `keep-user-${suffix}@example.test`;
let adminId, templateId, orgId, removedId;
async function request(path, method = "GET", body, cookie, expected = 200) {
  const response = await app.request(
    `/api/v1/${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:5173",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
    process.env,
  );
  const data = await response.json();
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: ${data.message || "Unexpected status"}`,
  );
  return {
    ...data,
    data,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}
try {
  [{ id: adminId }] =
    await sql`INSERT INTO admin_accounts(name,email,password_hash) VALUES('Deletion test admin',${adminEmail},${await hashPassword(password)}) RETURNING id`;
  const admin = (
    await request("admin/signin", "POST", { email: adminEmail, password })
  ).cookie;
  const removed = await request(
    "admin/usersignup",
    "POST",
    { name: "Delete test user", email: removedEmail, password },
    admin,
    201,
  );
  removedId = removed.id;
  const kept = await request(
    "admin/usersignup",
    "POST",
    { name: "Keep test user", email: keptEmail, password },
    admin,
    201,
  );
  const member = (
    await request("user/signin", "POST", { email: removedEmail, password })
  ).cookie;
  const other = (
    await request("user/signin", "POST", { email: keptEmail, password })
  ).cookie;
  const createTask = (id, description) =>
    request(
      "admin/task",
      "POST",
      { id, description, dueDate: "2027-01-20", comments: "Assignment notes" },
      admin,
      201,
    );
  const own = await createTask(removed.id, "Remove this private assignment");
  const otherTask = await createTask(kept.id, "Keep this assignment");
  const [layout] =
    await sql`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='organization_id') AS legacy`;
  let shared;
  if (layout.legacy) {
    shared = await createTask(kept.id, "Keep shared assignment");
    await sql`INSERT INTO task_assignees(task_id,user_id) VALUES(${shared.id}::uuid,${removed.id}::uuid)`;
    await sql`UPDATE tasks SET member_notes='Removed member private shared notes' WHERE id=${shared.id}::uuid`;
    [{ id: orgId }] =
      await sql`INSERT INTO organizations(name,slug) VALUES('Deletion test organization',${suffix}) RETURNING id`;
    await sql`INSERT INTO organization_members(organization_id,user_id,role) VALUES(${orgId}::uuid,${removed.id}::uuid,'member')`;
    await sql`INSERT INTO comments(task_id,user_id,content) VALUES(${otherTask.id}::uuid,${removed.id}::uuid,'Remove this authored comment')`;
    await sql`INSERT INTO activities(task_id,user_id,action) VALUES(${otherTask.id}::uuid,${removed.id}::uuid,'Remove authored activity')`;
    await sql`INSERT INTO notifications(user_id,organization_id,type,task_id,actor_id,message) VALUES(${kept.id}::uuid,${orgId}::uuid,'mention',${otherTask.id}::uuid,${removed.id}::uuid,'Remove actor notification')`;
    await sql`UPDATE tasks SET creator_id=${removed.id}::uuid WHERE id=${otherTask.id}::uuid`;
  } else {
    await sql`INSERT INTO comments(task_id,author_id,content) VALUES(${otherTask.id}::uuid,${removed.id}::uuid,'Remove this authored comment')`;
    await sql`INSERT INTO activity_logs(task_id,user_id,action) VALUES(${otherTask.id}::uuid,${removed.id}::uuid,'Remove authored activity')`;
  }
  const nodes = [
    {
      key: "remove",
      type: "task",
      title: "Removed workflow task",
      description: "Private instructions",
      assigneeId: removed.id,
      dueDays: 3,
      requiresApproval: true,
      dependencies: [],
    },
    {
      key: "keep",
      type: "task",
      title: "Kept workflow task",
      description: "Kept instructions",
      assigneeId: kept.id,
      dueDays: 3,
      requiresApproval: true,
      dependencies: [],
    },
  ];
  const template = await request(
    "workflows/templates",
    "POST",
    { name: "Deletion test shared workflow", definition: { nodes } },
    admin,
    201,
  );
  templateId = template.id;
  const runInput = {
    templateId,
    version: 1,
    name: "Shared deletion test",
    requestKey: crypto.randomUUID(),
  };
  const run = await request("workflows/runs", "POST", runInput, admin, 201);
  const before = await request(`workflows/runs/${run.id}`, "GET", null, admin);
  const removedStep = before.steps.find((step) => step.node_key === "remove"),
    keptStep = before.steps.find((step) => step.node_key === "keep");
  await request(
    `workflow-tasks/${keptStep.task_id}/actions`,
    "POST",
    { action: "start", message: "Keep my own progress notes" },
    other,
  );
  await request(
    `workflow-tasks/${removedStep.task_id}/actions`,
    "POST",
    { action: "submit", message: "Remove my submission" },
    member,
  );
  const bucket = createHash("sha256")
    .update(`account:${removedEmail}`)
    .digest("hex");
  await sql`INSERT INTO auth_rate_limits(bucket_hash,attempts,window_start) VALUES(${bucket},1,now()) ON CONFLICT(bucket_hash) DO UPDATE SET attempts=1`;
  await request(
    `admin/user/${removed.id}`,
    "DELETE",
    { confirmEmail: removedEmail },
    member,
    403,
  );
  await request(
    `admin/user/${removed.id}`,
    "DELETE",
    { confirmEmail: keptEmail },
    admin,
    409,
  );
  assert.equal(
    (await request(`workflows/runs/${run.id}`, "GET", null, admin)).state,
    "running",
  );
  await request(`user/bulktask/${own.id}`, "GET", null, member);
  const deleted = await request(
    `admin/user/${removed.id}`,
    "DELETE",
    { confirmEmail: removedEmail },
    admin,
  );
  assert.equal(deleted.tasksDeleted, 2);
  assert.equal(deleted.workflowsCanceled, 1);
  await request("auth/session", "GET", null, member, 401);
  await request(
    `admin/user/${removed.id}`,
    "DELETE",
    { confirmEmail: removedEmail },
    admin,
    404,
  );
  const [remaining] =
    await sql`SELECT (SELECT count(*)::int FROM users WHERE id=${removed.id}::uuid) AS accounts,
    (SELECT count(*)::int FROM auth_sessions WHERE account_id=${removed.id}::uuid) AS sessions,
    (SELECT count(*)::int FROM tasks WHERE id IN (${own.id}::uuid,${removedStep.task_id}::uuid)) AS tasks,
    (SELECT count(*)::int FROM workflow_notices WHERE account_id=${removed.id}::uuid) AS notices,
    (SELECT count(*)::int FROM workflow_events WHERE actor_id=${removed.id}::uuid) AS events,
    (SELECT count(*)::int FROM auth_rate_limits WHERE bucket_hash=${bucket}) AS rate_limits,
    (SELECT count(*)::int FROM workflow_steps WHERE spec->>'assigneeId'=${removed.id}) AS assignments,
    (SELECT count(*)::int FROM workflow_versions WHERE definition::text LIKE ${"%" + removed.id + "%"}) AS versions`;
  assert.ok(
    Object.values(remaining).every((value) => value === 0),
    JSON.stringify(remaining),
  );
  await request(
    "user/signin",
    "POST",
    { email: removedEmail, password },
    null,
    401,
  );
  await assert.rejects(
    sql`INSERT INTO auth_sessions(token_hash,account_id,role,expires_at) VALUES(${crypto.randomUUID()},${removed.id}::uuid,'User',now()+interval '1 day')`,
    (error) => error.code === "23503",
  );
  const after = await request(`workflows/runs/${run.id}`, "GET", null, admin);
  assert.equal(after.state, "canceled");
  assert.equal(
    after.steps.find((step) => step.node_key === "remove").spec.title,
    "Deleted member assignment",
  );
  assert.ok(!JSON.stringify(after).includes(removed.id));
  assert.ok(!JSON.stringify(after).includes("Remove my submission"));
  const keepProfile = await request(
    `admin/user/${kept.id}`,
    "GET",
    null,
    admin,
  );
  assert.ok(keepProfile.tasks.some((task) => task.id === otherTask.id));
  const keptWorkflow = await request(
    `user/bulktask/${keptStep.task_id}`,
    "GET",
    null,
    other,
  );
  assert.equal(keptWorkflow.memberComments, "Keep my own progress notes");
  assert.equal(keptWorkflow.status, "Canceled");
  const templates = (await request("workflows/templates", "GET", null, admin))
    .data;
  assert.equal(
    templates.find((item) => item.id === templateId).needs_reassignment,
    true,
  );
  await request(
    "workflows/runs",
    "POST",
    { ...runInput, requestKey: crypto.randomUUID() },
    admin,
    409,
  );
  if (layout.legacy) {
    assert.ok(keepProfile.tasks.some((task) => task.id === shared.id));
    const [refs] =
      await sql`SELECT (SELECT count(*)::int FROM comments WHERE user_id=${removed.id}::uuid) AS comments,
      (SELECT count(*)::int FROM activities WHERE user_id=${removed.id}::uuid) AS activities,
      (SELECT count(*)::int FROM notifications WHERE user_id=${removed.id}::uuid OR actor_id=${removed.id}::uuid) AS notifications,
      (SELECT count(*)::int FROM organization_members WHERE user_id=${removed.id}::uuid) AS memberships,
      (SELECT count(*)::int FROM task_assignees WHERE user_id=${removed.id}::uuid) AS assignments`;
    assert.ok(Object.values(refs).every((value) => value === 0));
    const [keptTask] =
      await sql`SELECT creator_id FROM tasks WHERE id=${otherTask.id}::uuid`;
    assert.equal(keptTask.creator_id, null);
  }
  console.log(
    "Live member deletion passed: admin/email checks, atomic cleanup, session revocation, orphan-session prevention, workflow cancellation/redaction, template reassignment, and preservation of other members/shared tasks.",
  );
} finally {
  if (templateId) {
    await sql`DELETE FROM workflow_runs WHERE template_id=${templateId}::uuid`;
    await sql`DELETE FROM workflow_versions WHERE template_id=${templateId}::uuid`;
    await sql`DELETE FROM workflow_templates WHERE id=${templateId}::uuid`;
  }
  if (adminId)
    await sql`DELETE FROM tasks WHERE assigned_admin_id=${adminId}::uuid`;
  await sql`DELETE FROM auth_sessions WHERE account_id IN(SELECT id FROM users WHERE email IN(${removedEmail},${keptEmail}) UNION SELECT id FROM admin_accounts WHERE email=${adminEmail})`;
  if (orgId) await sql`DELETE FROM organizations WHERE id=${orgId}::uuid`;
  if (removedId)
    await sql`SELECT delete_managed_user(${removedId}::uuid,${adminId}::uuid,${removedEmail})`;
  await sql`DELETE FROM users WHERE email IN(${removedEmail},${keptEmail})`;
  await sql`DELETE FROM admin_accounts WHERE email=${adminEmail}`;
  for (const email of [removedEmail, keptEmail, adminEmail])
    await sql`DELETE FROM auth_rate_limits WHERE bucket_hash=${createHash("sha256").update(`account:${email}`).digest("hex")}`;
  console.log(
    "Temporary deletion fixtures removed. Existing user accounts were not changed.",
  );
}
