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
      'export {createApp} from "./src/index"; export {hashPassword} from "./src/utils/password"; export {reconcileWorkflows} from "./src/workflows/engine"; export {getDb} from "./src/db";',
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
const { createApp, hashPassword, reconcileWorkflows, getDb } = compiled.exports;
const app = createApp(),
  sql = neon(process.env.DATABASE_URL),
  suffix = crypto.randomUUID();
const password = crypto.randomUUID(),
  adminEmail = `workflow-admin-${suffix}@example.test`,
  otherAdminEmail = `workflow-other-${suffix}@example.test`;
const emails = [
  `workflow-a-${suffix}@example.test`,
  `workflow-b-${suffix}@example.test`,
  `workflow-c-${suffix}@example.test`,
];
let adminId, templateId;
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
  const json = await response.json();
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: ${json.message || "Unexpected status"}`,
  );
  return {
    ...json,
    data: json,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}
try {
  const hash = await hashPassword(password);
  [{ id: adminId }] =
    await sql`INSERT INTO admin_accounts(name,email,password_hash) VALUES('Workflow test admin',${adminEmail},${hash}) RETURNING id`;
  await sql`INSERT INTO admin_accounts(name,email,password_hash) VALUES('Other workflow admin',${otherAdminEmail},${hash})`;
  const admin = (
    await request("admin/signin", "POST", { email: adminEmail, password })
  ).cookie;
  const outsider = (
    await request("admin/signin", "POST", { email: otherAdminEmail, password })
  ).cookie;
  const a = await request(
    "admin/usersignup",
    "POST",
    { name: "Workflow test A", email: emails[0], password },
    admin,
    201,
  );
  const b = await request(
    "admin/usersignup",
    "POST",
    { name: "Workflow test B", email: emails[1], password },
    admin,
    201,
  );
  const member = (
    await request("user/signin", "POST", { email: emails[0], password })
  ).cookie;
  const second = (
    await request("user/signin", "POST", { email: emails[1], password })
  ).cookie;
  const task = (key, assigneeId, dependencies, requiresApproval = true) => ({
    key,
    type: "task",
    title: `Original ${key}`,
    description: `${key} instructions`,
    assigneeId,
    dependencies,
    dueDays: 2,
    requiresApproval,
  });
  const definition = {
    nodes: [
      task("design", a.id, []),
      task("docs", b.id, [], false),
      {
        key: "wait",
        type: "delay",
        title: "Cooling off",
        waitHours: 0.01,
        dependencies: ["design"],
      },
      task("ship", a.id, ["wait", "docs"]),
    ],
  };
  const template = await request(
    "workflows/templates",
    "POST",
    { name: "Workflow test", definition },
    admin,
    201,
  );
  templateId = template.id;
  await request("workflows/templates", "GET", null, member, 403);
  const input = {
    templateId,
    version: 1,
    name: "Parallel delivery test",
    requestKey: crypto.randomUUID(),
  };
  const starts = await Promise.all([
    request("workflows/runs", "POST", input, admin, 201),
    request("workflows/runs", "POST", input, admin, 201),
  ]);
  assert.equal(
    starts[0].id,
    starts[1].id,
    "Repeated start must return the same run",
  );
  const runId = starts[0].id;
  const detail = async () =>
    (await request(`workflows/runs/${runId}`, "GET", null, admin)).data;
  const act = (nodeKey, action, message = "", cookie = admin, expected = 200) =>
    request(
      `workflows/runs/${runId}/actions`,
      "POST",
      { nodeKey, action, message },
      cookie,
      expected,
    );
  let run = await detail();
  assert.equal(run.steps.filter((step) => step.task_id).length, 2);
  const design = run.steps.find((step) => step.node_key === "design"),
    docs = run.steps.find((step) => step.node_key === "docs");
  assert.equal(
    run.steps.find((step) => step.node_key === "ship").state,
    "blocked",
  );
  await request(`workflows/runs/${runId}`, "GET", null, member, 403);
  await request(`user/bulktask/${docs.task_id}`, "GET", null, member, 404);
  for (const path of ["user/bulk", "user/bulktask"]) {
    const own = (await request(path, "GET", null, member)).data;
    assert.equal(own.length, 1);
    assert.equal(own[0].id, a.id);
    assert.equal(own[0].tasks.length, 1);
    assert.equal(own[0].tasks[0].id, design.task_id);
  }
  await request(
    "user/taskupdate",
    "PUT",
    { taskId: design.task_id, status: "Completed" },
    member,
    409,
  );
  await request(
    "admin/delete",
    "DELETE",
    { taskId: design.task_id },
    admin,
    409,
  );
  await act("design", "approve", "", admin, 409);
  await request(
    `workflow-tasks/${design.task_id}/actions`,
    "POST",
    { action: "submit", message: "Draft ready" },
    second,
    404,
  );
  await request(
    `workflow-tasks/${design.task_id}/actions`,
    "POST",
    { action: "start", message: "Working" },
    member,
  );
  await request(
    `workflow-tasks/${design.task_id}/actions`,
    "POST",
    { action: "submit", message: "Draft ready" },
    member,
  );
  await request(
    `workflow-tasks/${design.task_id}/actions`,
    "POST",
    { action: "submit" },
    member,
    409,
  );
  await act("design", "approve", "", outsider, 403);
  await act("design", "reject", "", admin, 409);
  await act("design", "reject", "Please revise the introduction");
  const returned = await request(
    `user/bulktask/${design.task_id}`,
    "GET",
    null,
    member,
  );
  assert.equal(returned.reviewFeedback, "Please revise the introduction");
  assert.equal(returned.workflowState, "in_progress");
  await request(
    `workflow-tasks/${design.task_id}/actions`,
    "POST",
    { action: "submit", message: "Revised draft ready" },
    member,
  );
  const concurrent = await Promise.all(
    [200, 409].map(async () => {
      const response = await app.request(
        `/api/v1/workflows/runs/${runId}/actions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: admin,
            Origin: "http://localhost:5173",
          },
          body: JSON.stringify({
            nodeKey: "design",
            action: "approve",
            message: "Approved",
          }),
        },
        process.env,
      );
      return response.status;
    }),
  );
  assert.deepEqual(concurrent.sort(), [200, 409]);
  run = await detail();
  assert.equal(
    run.steps.find((step) => step.node_key === "wait").state,
    "in_progress",
  );
  assert.equal(
    run.steps.find((step) => step.node_key === "ship").task_id,
    null,
  );
  assert.equal(
    run.events.filter(
      (event) => event.node_key === "design" && event.action === "approve",
    ).length,
    1,
  );
  await request(
    "workflows/templates/" + templateId,
    "PUT",
    {
      name: "Updated workflow",
      definition: {
        nodes: definition.nodes.map((node) => ({
          ...node,
          title: `Changed ${node.key}`,
        })),
      },
    },
    admin,
  );
  assert.equal(
    (await detail()).steps.find((step) => step.node_key === "design").spec
      .title,
    "Original design",
  );
  assert.equal(
    (
      await request(
        `workflows/templates/${templateId}/versions`,
        "GET",
        null,
        admin,
      )
    ).data.length,
    2,
  );
  await request(
    `workflow-tasks/${docs.task_id}/actions`,
    "POST",
    { action: "submit", message: "Docs complete" },
    second,
  );
  await sql`UPDATE workflow_steps SET due_at=now()-interval '1 minute' WHERE run_id=${runId}::uuid AND node_key='wait'`;
  await Promise.all([act("", "retry"), act("", "retry")]);
  run = await detail();
  const ship = run.steps.find((step) => step.node_key === "ship");
  assert.equal(ship.state, "ready");
  assert.ok(ship.task_id);
  assert.equal(
    run.events.filter(
      (event) => event.node_key === "ship" && event.action === "activated",
    ).length,
    1,
  );
  await sql`UPDATE workflow_steps SET due_at=now()-interval '1 minute' WHERE id=${ship.id}::uuid`;
  await reconcileWorkflows(getDb(process.env.DATABASE_URL), { runId });
  await reconcileWorkflows(getDb(process.env.DATABASE_URL), { runId });
  assert.equal(
    (await detail()).events.filter(
      (event) => event.action === "deadline_escalated",
    ).length,
    1,
  );
  const inbox = (await request("workflow-notifications", "GET", null, member))
    .data;
  assert.ok(inbox.some((item) => item.message.includes("Overdue")));
  assert.ok(inbox.every((item) => !item.run_id));
  assert.ok(inbox.every((item) => item.task_id !== docs.task_id));
  await request("workflow-notifications/read", "POST", {}, member);
  assert.ok(
    (await request("workflow-notifications", "GET", null, member)).data.every(
      (item) => item.read_at,
    ),
  );
  await request(
    `workflow-tasks/${ship.task_id}/actions`,
    "POST",
    { action: "submit", message: "Shipped" },
    member,
  );
  await act("ship", "approve");
  assert.equal((await detail()).state, "completed");
  // A missing downstream assignee forces a mid-transition FK failure. The timer,
  // task insert, and events must all roll back, then recover without duplication.
  const c = await request(
    "admin/usersignup",
    "POST",
    { name: "Workflow test C", email: emails[2], password },
    admin,
    201,
  );
  await request(
    `workflows/templates/${templateId}`,
    "PUT",
    {
      name: "Recovery test",
      definition: {
        nodes: [
          {
            key: "hold",
            type: "delay",
            title: "Wait to assign",
            waitHours: 0.01,
            dependencies: [],
          },
          task("recover", c.id, ["hold"], false),
        ],
      },
    },
    admin,
  );
  const recovery = await request(
    "workflows/runs",
    "POST",
    {
      ...input,
      version: 3,
      name: "Recovery run",
      requestKey: crypto.randomUUID(),
    },
    admin,
    201,
  );
  await sql`DELETE FROM users WHERE id=${c.id}::uuid`;
  await sql`UPDATE workflow_steps SET due_at=now()-interval '1 minute' WHERE run_id=${recovery.id}::uuid AND node_key='hold'`;
  await reconcileWorkflows(getDb(process.env.DATABASE_URL), {
    runId: recovery.id,
  });
  const failed = await request(
    `workflows/runs/${recovery.id}`,
    "GET",
    null,
    admin,
  );
  assert.ok(failed.last_error);
  assert.equal(
    failed.steps.find((step) => step.node_key === "hold").state,
    "in_progress",
  );
  assert.equal(
    failed.steps.find((step) => step.node_key === "recover").task_id,
    null,
  );
  assert.equal(
    failed.events.filter((event) => event.action === "timer_completed").length,
    0,
  );
  await sql`INSERT INTO users(id,name,email,password_hash) VALUES(${c.id}::uuid,'Workflow test C',${emails[2]},${hash})`;
  await request(
    `workflows/runs/${recovery.id}/actions`,
    "POST",
    { action: "retry" },
    admin,
  );
  const recovered = await request(
    `workflows/runs/${recovery.id}`,
    "GET",
    null,
    admin,
  );
  assert.equal(recovered.last_error, null);
  assert.equal(
    recovered.steps.find((step) => step.node_key === "recover").state,
    "ready",
  );
  assert.equal(
    recovered.events.filter((event) => event.action === "timer_completed")
      .length,
    1,
  );
  await request(
    `workflows/runs/${recovery.id}/actions`,
    "POST",
    { action: "cancel" },
    admin,
  );
  await request(
    `workflows/templates/${templateId}`,
    "PUT",
    {
      name: "Conditional routing",
      definition: {
        nodes: [
          task("source", a.id, [], false),
          {
            key: "route",
            type: "condition",
            title: "Urgent?",
            dependencies: ["source"],
            sourceKey: "source",
            operator: "contains",
            keyword: "URGENT",
          },
          {
            ...task("fast", a.id, ["route"], false),
            when: { nodeKey: "route", outcome: true },
          },
          {
            ...task("normal", b.id, ["route"], false),
            when: { nodeKey: "route", outcome: false },
          },
          { ...task("merge", a.id, ["fast", "normal"], false), join: "any" },
        ],
      },
    },
    admin,
  );
  for (const urgent of [true, false]) {
    const routed = await request(
      "workflows/runs",
      "POST",
      {
        ...input,
        version: 4,
        name: `Route ${urgent}`,
        requestKey: crypto.randomUUID(),
      },
      admin,
      201,
    );
    const getRoute = async () =>
      (await request(`workflows/runs/${routed.id}`, "GET", null, admin)).data;
    let execution = await getRoute();
    const source = execution.steps.find((step) => step.node_key === "source");
    await request(
      `workflow-tasks/${source.task_id}/actions`,
      "POST",
      {
        action: "submit",
        message: urgent
          ? "Please handle this Urgent delivery"
          : "Normal delivery",
      },
      member,
    );
    execution = await getRoute();
    assert.equal(
      execution.steps.find((step) => step.node_key === "route").outcome,
      urgent,
    );
    const chosen = execution.steps.find(
      (step) => step.node_key === (urgent ? "fast" : "normal"),
    );
    const skipped = execution.steps.find(
      (step) => step.node_key === (urgent ? "normal" : "fast"),
    );
    assert.equal(chosen.state, "ready");
    assert.equal(skipped.state, "skipped");
    assert.equal(skipped.task_id, null);
    assert.equal(
      execution.steps.find((step) => step.node_key === "merge").state,
      "blocked",
    );
    await request(
      `workflow-tasks/${chosen.task_id}/actions`,
      "POST",
      { action: "submit", message: "Branch finished" },
      urgent ? member : second,
    );
    execution = await getRoute();
    const merge = execution.steps.find((step) => step.node_key === "merge");
    assert.equal(merge.state, "ready");
    await request(
      `workflow-tasks/${merge.task_id}/actions`,
      "POST",
      { action: "submit", message: "Merged" },
      member,
    );
    assert.equal((await getRoute()).state, "completed");
  }
  const canceled = await request(
    "workflows/runs",
    "POST",
    { ...input, requestKey: crypto.randomUUID(), name: "Cancel test" },
    admin,
    201,
  );
  await request(
    `workflows/runs/${canceled.id}/actions`,
    "POST",
    { action: "cancel", message: "No longer needed" },
    admin,
  );
  assert.equal(
    (await request(`workflows/runs/${canceled.id}`, "GET", null, admin)).state,
    "canceled",
  );
  console.log(
    "Live workflow checks passed: parallel dependencies, conditional branches/joins, approval/rejection, privacy, bypass prevention, concurrent retries, immutable versions, timers, escalation, inbox, rollback/recovery, completion, cancellation.",
  );
} finally {
  if (templateId) {
    await sql`DELETE FROM workflow_runs WHERE template_id=${templateId}::uuid`;
    await sql`DELETE FROM workflow_versions WHERE template_id=${templateId}::uuid`;
    await sql`DELETE FROM workflow_templates WHERE id=${templateId}::uuid`;
  }
  if (adminId)
    await sql`DELETE FROM tasks WHERE assigned_admin_id=${adminId}::uuid`;
  await sql`DELETE FROM auth_sessions WHERE account_id IN (SELECT id FROM users WHERE email IN (${emails[0]},${emails[1]},${emails[2]}) UNION SELECT id FROM admin_accounts WHERE email IN (${adminEmail},${otherAdminEmail}))`;
  await sql`DELETE FROM users WHERE email IN (${emails[0]},${emails[1]},${emails[2]})`;
  await sql`DELETE FROM admin_accounts WHERE email IN (${adminEmail},${otherAdminEmail})`;
  console.log(
    "Temporary workflow fixtures removed; existing records preserved.",
  );
}
