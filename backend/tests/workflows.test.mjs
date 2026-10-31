import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture, definitionSchema, userId } from "./helpers.mjs";
const task = (key, dependencies = []) => ({
  key,
  title: key,
  type: "task",
  assigneeId: userId,
  dueDays: 3,
  requiresApproval: true,
  dependencies,
});
test("workflow definitions support parallel branches, joins, and timers", () => {
  assert.equal(
    definitionSchema.safeParse({
      nodes: [
        task("design"),
        task("docs"),
        {
          key: "wait",
          title: "Cooling off",
          type: "delay",
          waitHours: 24,
          dependencies: ["design"],
        },
        task("launch", ["wait", "docs"]),
      ],
    }).success,
    true,
  );
});
test("conditions reference completed task submissions and branch rules reference conditions", () => {
  const condition = {
    key: "route",
    type: "condition",
    title: "Urgent?",
    sourceKey: "source",
    operator: "contains",
    keyword: "urgent",
    dependencies: ["source"],
  };
  const valid = {
    nodes: [
      task("source"),
      condition,
      { ...task("fast", ["route"]), when: { nodeKey: "route", outcome: true } },
    ],
  };
  assert.equal(definitionSchema.safeParse(valid).success, true);
  assert.equal(
    definitionSchema.safeParse({
      nodes: [task("source"), { ...condition, dependencies: [] }],
    }).success,
    false,
  );
  assert.equal(
    definitionSchema.safeParse({
      nodes: [
        task("source"),
        {
          ...task("fast", ["source"]),
          when: { nodeKey: "source", outcome: true },
        },
      ],
    }).success,
    false,
  );
});
test("workflow definitions reject cycles, dangling edges, duplicate keys, and invalid assignments", () => {
  for (const nodes of [
    [],
    [task("a", ["a"])],
    [task("a", ["missing"])],
    [task("a"), task("a")],
    [task("a", ["b"]), task("b", ["a"])],
    [{ ...task("a"), assigneeId: "1" }],
    [{ ...task("a"), dueDays: 0 }],
    [task("a"), { key: "wait", title: "Wait", type: "delay", waitHours: -1 }],
  ])
    assert.equal(definitionSchema.safeParse({ nodes }).success, false);
});
test("members cannot read, publish, start, or review admin workflows", async () => {
  const f = await fixture(),
    member = await f.login("User");
  for (const [path, method, body] of [
    ["workflows/templates", "GET"],
    ["workflows/runs", "GET"],
    [`workflows/runs/${userId}`, "GET"],
    ["workflows/templates", "POST", {}],
    ["workflows/runs", "POST", {}],
    [`workflows/runs/${userId}/actions`, "POST", { action: "approve" }],
  ]) {
    assert.equal((await f.request(path, method, body)).status, 401);
    assert.equal((await f.request(path, method, body, member)).status, 403);
  }
});
test("invalid graphs and actions are rejected before database writes", async () => {
  const f = await fixture(),
    admin = await f.login();
  assert.equal(
    (
      await f.request(
        "workflows/templates",
        "POST",
        { name: "Invalid", definition: { nodes: [task("a", ["a"])] } },
        admin,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.request(
        `workflows/runs/${userId}/actions`,
        "POST",
        { action: "force_complete" },
        admin,
      )
    ).status,
    400,
  );
});
